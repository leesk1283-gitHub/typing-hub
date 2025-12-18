// Socket.IO 클라이언트 및 앱 메인 로직
class SocketClient {
    constructor() {
        // 서브 경로에 맞게 path 설정
        // Render에 배포된 백엔드 URL로 연결
        this.socket = io('https://typing-hub-multiplayer.onrender.com', {
            path: '/balloon-typing-game/socket.io'
        });
        this.userName = '';
        this.roomId = null;
        this.isHost = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 로그인 성공
        this.socket.on('login-success', (data) => {
            this.userName = data.name;
            document.getElementById('user-name-display').textContent = `👤 ${data.name}`;
            App.showScreen('lobby');
        });

        // 유저 정보 수신 (구버전 호환)
        this.socket.on('user-info', (data) => {
            // 이미 로그인 처리됨
        });

        // 방 목록 수신
        this.socket.on('room-list', (rooms) => {
            this.updateRoomList(rooms);
        });

        // 방 생성됨
        this.socket.on('room-created', (data) => {
            this.roomId = data.roomId;
            this.isHost = data.isHost;
            App.showScreen('waiting');
            this.updateWaitingUI();
        });

        // 방 입장됨
        this.socket.on('room-joined', (data) => {
            this.roomId = data.roomId;
            this.isHost = data.isHost;
            App.showScreen('waiting');
            this.updateWaitingUI();
        });

        // 빠른 입장 결과
        this.socket.on('quick-join-result', (data) => {
            this.joinRoom(data.roomId);
        });

        // 방 상태 업데이트
        this.socket.on('room-update', (room) => {
            this.updateRoomState(room);
        });

        // 에러 처리
        this.socket.on('error', (message) => {
            alert(message);
        });

        // 강퇴당함
        this.socket.on('kicked', () => {
            alert('방장에 의해 퇴장되었습니다.');
            this.roomId = null;
            this.isHost = false;
            App.showScreen('lobby');
        });

        // 방 닫힘
        this.socket.on('room-closed', () => {
            alert('방장이 방을 나갔습니다.');
            this.roomId = null;
            this.isHost = false;
            App.showScreen('lobby');
        });

        // 게임 시작
        this.socket.on('game-start', (data) => {
            App.showScreen('game');
            App.game.start(data);
        });

        // 풍선 터짐
        this.socket.on('balloon-popped', (data) => {
            App.game.handleBalloonPopped(data);
        });

        // 게임 종료
        this.socket.on('game-end', (data) => {
            App.game.end(data);
        });

        // 대기실로 복귀
        this.socket.on('back-to-waiting', () => {
            App.game.reset();
            App.showScreen('waiting');
        });
    }

    // 방 목록 업데이트
    updateRoomList(rooms) {
        const roomList = document.getElementById('room-list');

        if (rooms.length === 0) {
            roomList.innerHTML = '<div class="no-rooms">방이 없습니다. 새 방을 만들어보세요!</div>';
            return;
        }

        roomList.innerHTML = rooms.map(room => `
      <div class="room-item" data-room-id="${room.id}">
        <div class="room-info">
          <span class="room-host">
            👑 ${room.hostName}의 방 
            <span class="lang-badge ${room.language === 'en' ? 'en' : 'ko'}">${room.language === 'en' ? 'ENG' : '한글'}</span>
          </span>
          <span class="room-status ${room.isPlaying ? 'playing' : 'waiting'}">
            ${room.isPlaying ? '🎮 게임 중' : (room.playerCount > 1 ? '👥 대기 중' : '🟢 입장 가능')}
          </span>
        </div>
        ${!room.isPlaying && room.playerCount < 8 ?
                `<button class="btn btn-primary btn-small join-room-btn">입장</button>` :
                ''}
      </div>
    `).join('');

        // 입장 버튼 이벤트
        roomList.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.closest('.room-item').dataset.roomId;
                this.joinRoom(roomId);
            });
        });
    }

    // 방 만들기
    createRoom() {
        this.socket.emit('create-room');
    }

    // 방 입장
    joinRoom(roomId) {
        this.socket.emit('join-room', roomId);
    }

    // 빠른 입장
    quickJoin() {
        this.socket.emit('quick-join');
    }

    // 준비하기
    toggleReady() {
        this.socket.emit('ready');
    }

    // 게임 시작
    startGame() {
        this.socket.emit('start-game');
    }

    // 강퇴
    kickPlayer() {
        this.socket.emit('kick-player');
    }

    // 방 나가기
    leaveRoom() {
        this.socket.emit('leave-room');
        this.roomId = null;
        this.isHost = false;
        App.showScreen('lobby');
    }

    // 풍선 터트리기
    popBalloon(balloonId, word) {
        this.socket.emit('pop-balloon', { balloonId, word });
    }

    // 로그인 요청
    login(nickname) {
        this.socket.emit('login', { name: nickname });
    }

    // 놓친 풍선 알림
    reportMissedBalloon(balloonId) {
        this.socket.emit('balloon-missed', { balloonId });
    }

    // 다시하기
    playAgain() {
        this.socket.emit('play-again');
    }

    // 언어 변경
    changeLanguage(lang) {
        this.socket.emit('change-language', lang);
    }

    // 대기방 UI 업데이트
    updateWaitingUI() {
        const readyBtn = document.getElementById('ready-btn');
        const startBtn = document.getElementById('start-btn');
        const kickBtn = document.getElementById('kick-btn');
        const langSettings = document.getElementById('language-settings'); // 언어 설정

        if (this.isHost) {
            readyBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
            if (langSettings) {
                langSettings.classList.remove('hidden');
                // 방장은 조작 가능
                const input = langSettings.querySelector('input');
                if (input) input.disabled = false;
            }
        } else {
            readyBtn.classList.remove('hidden');
            startBtn.classList.add('hidden');
            if (langSettings) {
                langSettings.classList.remove('hidden'); // 게스트도 보임
                // 게스트는 조작 불가
                const input = langSettings.querySelector('input');
                if (input) input.disabled = true;
            }
        }
    }

    // 방 상태 업데이트
    updateRoomState(room) {
        // 언어 설정 업데이트 (UI 반영)
        const langCheckbox = document.getElementById('lang-checkbox');
        if (langCheckbox) {
            const isEnglish = room.language === 'en';
            if (langCheckbox.checked !== isEnglish) {
                langCheckbox.checked = isEnglish;
            }
            // 게스트인 경우 조작 불가 (CSS pointer-events 등은 여기서 처리 안해도 되지만, 보이지 않음)
        }

        // 플레이어 그리드 렌더링 (대기방)
        const grid = document.getElementById('players-grid');
        if (grid) {
            grid.innerHTML = '';

            let amIHost = false;
            let myReadyState = false;

            // 최대 8명 슬롯 생성
            for (let i = 0; i < 8; i++) {
                const player = room.players[i];
                const card = document.createElement('div');
                card.className = 'user-card';

                if (player) {
                    card.classList.add('filled');
                    if (player.ready) card.classList.add('ready');

                    // 내 정보 확인
                    if (player.id === this.socket.id) {
                        amIHost = player.isHost;
                        myReadyState = player.ready;
                        card.style.borderColor = '#4a90e2';
                    }

                    let statusBadge = '';
                    if (player.isHost) {
                        statusBadge = '<div class="player-status ready">방장</div>';
                    } else {
                        statusBadge = player.ready ? '<div class="player-status ready">준비 완료</div>' : '<div class="player-status">대기 중</div>';
                    }

                    card.innerHTML = `
                        <div style="font-size: 2rem; margin-bottom: 5px;">${player.isHost ? '👑' : '😎'}</div>
                        <div class="player-name">${player.name}</div>
                        ${statusBadge}
                        ${amIHost && !player.isHost ? `<button class="btn btn-danger btn-xs kick-btn" data-id="${player.id}" style="margin-top:5px;">강퇴</button>` : ''}
                    `;
                } else {
                    card.innerHTML = `
                        <div style="font-size: 2rem; opacity: 0.3;">👤</div>
                        <div style="color: #aaa;">빈 자리</div>
                    `;
                }
                grid.appendChild(card);
            }

            // 강퇴 버튼 이벤트
            if (amIHost) {
                grid.querySelectorAll('.kick-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetId = e.target.dataset.id;
                        if (confirm('강퇴하시겠습니까?')) {
                            this.socket.emit('kick-player', targetId);
                        }
                    });
                });
            }

            // 준비/시작 버튼 상태 관리
            const readyBtn = document.getElementById('ready-btn');
            const startBtn = document.getElementById('start-btn');

            if (amIHost) {
                readyBtn.classList.add('hidden');
                startBtn.classList.remove('hidden');

                const otherPlayers = room.players.filter(p => !p.isHost);
                // 혼자일 때도 가능하도록 length 체크 제거 (others가 비어있으면 every는 true)
                const allReady = otherPlayers.every(p => p.ready);

                startBtn.disabled = !allReady;
                startBtn.style.opacity = allReady ? '1' : '0.5';
            } else {
                readyBtn.classList.remove('hidden');
                startBtn.classList.add('hidden');

                readyBtn.textContent = myReadyState ? '준비 취소' : '준비하기';
                readyBtn.classList.toggle('btn-primary', myReadyState);
                readyBtn.classList.toggle('btn-secondary', !myReadyState);
            }
        }

        // 게임 화면 플레이어 이름 설정 (scores 정보 포함)
        if (App.game) {
            App.game.updatePlayerList(room.players);
        }
    }
}

// 앱 메인 객체
const App = {
    game: null,

    init() {
        window.socketClient = new SocketClient();
        this.game = new Game();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // 로그인 (입장)
        const loginBtn = document.getElementById('login-btn');
        const nicknameInput = document.getElementById('nickname-input');

        const handleLogin = () => {
            const nickname = nicknameInput.value.trim();
            if (nickname) {
                window.socketClient.login(nickname);
            } else {
                alert('닉네임을 입력해주세요.');
            }
        };

        loginBtn.addEventListener('click', handleLogin);
        nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });

        // 닉네임 입력 placeholder 제어
        nicknameInput.addEventListener('focus', () => {
            nicknameInput.dataset.placeholder = nicknameInput.placeholder;
            nicknameInput.placeholder = '';
        });
        nicknameInput.addEventListener('blur', () => {
            nicknameInput.placeholder = nicknameInput.dataset.placeholder;
        });

        // 사운드 토글
        const soundToggleBtn = document.getElementById('sound-toggle');
        soundToggleBtn.title = "소리 켜기/끄기"; // 툴팁 추가
        soundToggleBtn.addEventListener('click', (e) => {
            console.log('Sound toggle clicked');
            if (this.game && this.game.soundManager) {
                const isMuted = this.game.soundManager.toggleMute();
                e.target.textContent = isMuted ? '🔇' : '🔊';
                console.log('Mute status:', isMuted);

                // 소리 켤 때 테스트 사운드 재생
                if (!isMuted) {
                    this.game.soundManager.playPopSound();
                }
            } else {
                console.error('SoundManager not available');
            }
        });

        // 방 만들기
        document.getElementById('create-room-btn').addEventListener('click', () => {
            window.socketClient.createRoom();
        });

        // 빠른 입장
        document.getElementById('quick-join-btn').addEventListener('click', () => {
            window.socketClient.quickJoin();
        });

        // 방 나가기
        document.getElementById('leave-room-btn').addEventListener('click', () => {
            window.socketClient.leaveRoom();
        });

        // 준비하기
        document.getElementById('ready-btn').addEventListener('click', () => {
            window.socketClient.toggleReady();
        });

        // 게임 시작
        document.getElementById('start-btn').addEventListener('click', () => {
            window.socketClient.startGame();
        });

        // 강퇴 (동적 생성 버튼에서 처리하므로 여기서 제거)

        // 다시하기
        document.getElementById('play-again-btn').addEventListener('click', () => {
            window.socketClient.playAgain();
        });

        // 퇴장
        document.getElementById('exit-btn').addEventListener('click', () => {
            this.game.hideResults();
            window.socketClient.leaveRoom();
        });

        // 언어 설정 토글 (체크되면 en, 해제되면 ko)
        const langCheckbox = document.getElementById('lang-checkbox');
        if (langCheckbox) {
            langCheckbox.addEventListener('change', (e) => {
                const lang = e.target.checked ? 'en' : 'ko';
                window.socketClient.changeLanguage(lang);
            });
        }
    },

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');

        // 게임 화면으로 전환 시 입력창 포커스
        if (screenName === 'game') {
            setTimeout(() => {
                document.getElementById('word-input').focus();
            }, 100);
        }
    }
};

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
