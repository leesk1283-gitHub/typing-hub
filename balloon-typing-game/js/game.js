const MAX_TIME = 60;

// 게임 로직 클래스
class Game {
    constructor() {
        this.balloonManager = null;
        this.isPlaying = false;
        this.timeRemaining = MAX_TIME;
        this.timerInterval = null;
        this.lastUpdate = 0;
        this.animationFrame = null;

        // DOM 요소
        this.gameArea = document.getElementById('game-area');
        this.wordInput = document.getElementById('word-input');
        this.timerDisplay = document.getElementById('timer-display');
        this.hostScoreDisplay = document.getElementById('host-score');
        this.guestScoreDisplay = document.getElementById('guest-score');
        this.hostNameDisplay = document.getElementById('game-host-name');
        this.guestNameDisplay = document.getElementById('game-guest-name');

        // 결과 오버레이
        this.resultOverlay = document.getElementById('result-overlay');

        this.init();
    }

    init() {
        this.balloonManager = new BalloonManager(this.gameArea);
        this.setupInputHandler();

        // 사운드 매니저 초기화
        if (window.SoundManager) {
            this.soundManager = new SoundManager();
            this.soundManager.init();
        }
    }

    setupInputHandler() {
        this.wordInput.addEventListener('keydown', (e) => {
            // 사운드 컨텍스트 재개 (브라우저 정책)
            if (this.soundManager && !this.soundManager.initialized) {
                this.soundManager.init();
            }

            if (!this.isPlaying) return;

            // 엔터 키 또는 스페이스 키로 입력 완료
            if (e.key === 'Enter' || (e.key === ' ' && this.wordInput.value.trim().length > 0)) {
                e.preventDefault();
                this.submitWord();
            }
        });
    }

    // 단어 제출
    submitWord() {
        // 한글 자소 분리 방지 (NFC 정규화)
        const word = this.wordInput.value.trim().normalize('NFC');
        if (!word) return;

        // 풍선 매니저에게 단어 확인 요청
        const balloonId = this.balloonManager.checkWord(word);
        if (balloonId) {
            // 서버에 터짐 알림
            window.socketClient.popBalloon(balloonId, word);

            // 효과음 (로컬 예측 실행 - 서버 응답 전 즉시 재생)
            if (this.soundManager) this.soundManager.playPopSound();

            this.wordInput.value = '';
        } else {
            // 틀림 효과 (옵션)
            this.gameArea.classList.add('shake');
            setTimeout(() => this.gameArea.classList.remove('shake'), 200);
            this.wordInput.value = '';
        }
    }

    // 게임 시작
    start(data) {
        // 카운트다운 시작 (3초 후 게임 로직 실행)
        this.showCountdown(() => {
            this.isPlaying = true;
            this.timeRemaining = MAX_TIME;
            this.updateScores({ host: 0, guest: 0 }); // 초기화
            this.hideResults();

            // BGM 시작
            if (this.soundManager) {
                this.soundManager.playBGM();
            }

            // 풍선 초기화
            if (data && data.balloons) {
                this.balloonManager.start(data.balloons);
            } else {
                this.balloonManager.start();
            }

            this.startTimer();
            this.startGameLoop();

            // 입력창 포커스
            setTimeout(() => this.wordInput.focus(), 100);
        });
    }

    // 카운트다운 표시
    showCountdown(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'countdown-overlay';
        this.gameArea.appendChild(overlay);

        let count = 3;
        overlay.textContent = count;

        // 카운트다운 효과음 (삑, 삑, 삑) - 있으면 좋음

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                overlay.textContent = count;
                overlay.style.animation = 'none';
                overlay.offsetHeight; /* trigger reflow */
                overlay.style.animation = 'countdownPop 0.5s ease-out';
            } else {
                clearInterval(interval);
                overlay.textContent = 'START!';
                overlay.classList.add('fade-out');

                // START 효과음
                if (this.soundManager && this.soundManager.playPopSound) {
                    // 시작음은 popSound보다 좀 더 긴 것이 좋으나 일단 있는 걸로
                    // this.soundManager.playSound('start'); 
                }

                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    if (callback) callback();
                }, 500);
            }
        }, 1000);
    }

    startTimer() {
        this.stopTimer();
        this.timerDisplay.textContent = this.timeRemaining;

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.timerDisplay.textContent = this.timeRemaining;

            if (this.timeRemaining <= 10) {
                this.timerDisplay.style.color = '#ef4444'; // 빨간색 경고
            }

            if (this.timeRemaining <= 0) {
                this.stopTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerDisplay.style.color = 'white';
    }

    startGameLoop() {
        let lastTime = 0;
        const loop = (timestamp) => {
            if (!this.isPlaying) return;

            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            // 프레임 제한 없이 부드럽게
            if (this.balloonManager) {
                this.balloonManager.update(deltaTime);
            }
            this.animationFrame = requestAnimationFrame(loop);
        };
        this.animationFrame = requestAnimationFrame(loop);
    }

    // 풍선 터트리기 처리
    handleBalloonPopped(data) {
        const { balloonId, newBalloon, scores } = data;

        // 효과음 재생 로직 제거:
        // 1. 내가 터트린 건 submitWord에서 즉시 재생됨 (반응성)
        // 2. 남이 터트린 건 소리 안 나게 (요청사항)
        // 3. 놓친 풍선(missed)도 여기서 처리되는데 소리 안 나게 (요청사항)

        // 풍선 교체
        this.balloonManager.replaceBalloon(balloonId, newBalloon);

        // 점수 업데이트
        this.updateScores(scores);
    }

    // 플레이어 목록 업데이트 (Game Class 내)
    updatePlayerList(players) {
        this.players = players; // 데이터 저장
        this.renderScoreBoard();
    }

    // 점수 업데이트 (Socket 이벤트)
    updateScores(scores) {
        // scores: { socketId: score, ... }
        if (!this.players) return;

        this.players.forEach(p => {
            if (scores[p.id] !== undefined && scores[p.id] !== p.score) {
                p.score = scores[p.id];

                // 점수 상승 시 애니메이션 효과 (단순화: 렌더링 후 클래스 추가)
                const scoreVal = document.getElementById(`score-val-${p.id}`);
                if (scoreVal) {
                    scoreVal.innerText = p.score;
                    scoreVal.classList.remove('score-up');
                    void scoreVal.offsetWidth; // Reflow 트리거
                    scoreVal.classList.add('score-up');
                }
            }
        });

        // 애니메이션 효과 후 순위 반영을 위해 0.5초 후 재렌더링 (순위가 바뀔 수 있으므로)
        // 또는 그냥 매번 renderScoreBoard() 호출
        this.renderScoreBoard();
    }

    // 점수판 렌더링
    renderScoreBoard() {
        const board = document.getElementById('score-board');
        if (!board || !this.players) return;

        // 본인 ID 확인
        const myId = window.socketClient ? window.socketClient.socket.id : null;

        // 등수 계산을 위한 정렬 사본 (고정 위치를 유지하되 등수 뱃지 표시용)
        const sortedForRank = [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));

        board.innerHTML = this.players.map(p => {
            const isMe = p.id === myId;
            const rankIndex = sortedForRank.findIndex(rp => rp.id === p.id);
            const rank = rankIndex + 1;
            const hasScore = (p.score || 0) > 0;

            const displayName = p.name;
            const nameHtml = `<span class="player-nickname">${displayName}</span>`;

            // 순위 뱃지 설정 (1-3등)
            let rankBadge = '';
            if (hasScore) {
                if (rank === 1) rankBadge = '<span class="rank-badge">🥇</span>';
                else if (rank === 2) rankBadge = '<span class="rank-badge">🥈</span>';
                else if (rank === 3) rankBadge = '<span class="rank-badge">🥉</span>';
            }

            // 등수별 클래스 추가 (1등은 rank-1 클래스 등)
            const rankClass = hasScore && rank <= 3 ? `rank-${rank}` : '';

            return `
            <div class="score-item ${isMe ? 'current-user' : ''} ${rankClass}" id="score-item-${p.id}">
                ${rankBadge}
                <div class="name-tag">
                    ${nameHtml}
                </div>
                <span class="player-score" id="score-val-${p.id}">${p.score || 0}</span>
            </div>
        `}).join('');
    }

    // 게임 종료
    end(data) {
        this.isPlaying = false;
        this.stopTimer();

        // BGM 정지
        if (this.soundManager) {
            this.soundManager.stopBGM();
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // 결과 표시 logic update needed for 8 players
        // data.scores, data.players
        this.showResults(data);
    }

    // 결과 화면 표시
    showResults(data) {
        const { players, scores } = data;

        // players 배열에 점수 병합
        players.forEach(p => {
            if (scores[p.id]) p.score = scores[p.id];
        });

        const sorted = [...players].sort((a, b) => b.score - a.score);
        const winner = sorted[0];

        const winnerDisplay = document.getElementById('winner-display');
        const winnerName = document.getElementById('winner-name');

        winnerDisplay.style.display = 'block';
        winnerName.textContent = winner.name;

        // 상세 순위 표시는 복잡하니 일단 1등만 크게 보여주고, 
        // 텍스트로 순위 나열
        const resultTitle = document.getElementById('result-title');
        resultTitle.innerHTML = sorted.map((p, i) =>
            `<div style="font-size:${i === 0 ? 1.5 : 1}rem; margin:5px;">${i + 1}위: ${p.name} (${p.score}점)</div>`
        ).join('');

        // 기존 UI 숨김
        document.getElementById('result-host').style.display = 'none';
        document.getElementById('result-guest').style.display = 'none';

        // 오버레이 표시
        this.resultOverlay.classList.remove('hidden');
    }

    // 결과 화면 숨기기
    hideResults() {
        this.resultOverlay.classList.add('hidden');
    }

    // 게임 초기화
    reset() {
        this.isPlaying = false;
        this.timeRemaining = MAX_TIME;
        this.stopTimer();

        // BGM 정지
        if (this.soundManager) {
            this.soundManager.stopBGM();
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.balloonManager.clear();
        this.wordInput.value = '';
        this.updateScores({ host: 0, guest: 0 });
        this.timerDisplay.textContent = `${MAX_TIME}`;
        this.hideResults();
    }
}
