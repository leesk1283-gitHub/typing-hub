// 풍선 클래스
class Balloon {
    constructor(data) {
        this.id = data.id;
        this.word = data.word;
        this.x = data.x;
        this.y = data.y;
        this.color = data.color;
        this.speed = data.speed;
        this.points = data.points;
        this.element = null;
    }

    // DOM 요소 생성
    createElement() {
        const balloon = document.createElement('div');
        balloon.className = 'balloon spawning';
        balloon.dataset.id = this.id;

        // 3D 스타일을 위해 메인 요소에 배경 적용
        balloon.style.background = `radial-gradient(circle at 30% 30%, ${this.color}, ${this.adjustColor(this.color, -40)}) border-box`;
        balloon.style.boxShadow = `inset -10px -10px 20px rgba(0,0,0,0.2), inset 10px 10px 20px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.1), 0 15px 15px rgba(0,0,0,0.2)`;

        const word = document.createElement('span');
        word.className = 'balloon-word';
        word.textContent = this.word;

        balloon.appendChild(word);

        // 꼬다리 (CSS ::after, ::before로 처리되지만 추가 장식 필요시)
        // CSS가 처리하므로 추가 요소 불필요

        // 위치 초기화
        this.updateDOMPosition();

        // 스폰 애니메이션 후 클래스 제거
        setTimeout(() => {
            balloon.classList.remove('spawning');
        }, 500);

        this.element = balloon;
        return balloon;
    }

    // 색상 밝기 조절
    adjustColor(hslColor, amount) {
        // hsl(xxx, 70%, 60%) 형태에서 밝기 조절
        const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
            const h = parseInt(match[1]);
            const s = parseInt(match[2]);
            const l = Math.max(0, Math.min(100, parseInt(match[3]) + amount));
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
        return hslColor;
    }

    // 풍선 터짐 효과
    pop(callback) {
        if (!this.element) {
            if (callback) callback();
            return;
        }

        this.element.classList.add('popping');

        // 파티클 생성
        this.createParticles();

        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
            if (callback) callback();
        }, 500); // 애니메이션 시간
    }

    // 파티클 효과
    createParticles() {
        if (!this.element) return;

        const container = document.createElement('div');
        container.className = 'pop-particles';
        this.element.appendChild(container);

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'pop-particle';
            const angle = (i / 8) * Math.PI * 2;
            const dist = 60;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.background = this.color;
            container.appendChild(particle);
        }
    }

    // 위치 업데이트
    updatePosition(deltaTime) {
        // 위로 이동 (speed는 % per second)
        // deltaTime은 ms 단위
        const moveAmount = (this.speed * deltaTime) / 1000;
        this.y -= moveAmount;

        this.updateDOMPosition();

        // 화면 위로 벗어났는지 확인 (-20% 지점)
        if (this.y < -20) {
            return 'missed';
        }
        return 'active';
    }

    updateDOMPosition() {
        if (this.element) {
            this.element.style.left = `${this.x}%`;
            this.element.style.top = `${this.y}%`;
        }
    }
}

// 풍선 관리자
class BalloonManager {
    constructor(container) {
        this.container = container;
        this.balloons = new Map();
    }

    // 풍선 추가
    addBalloon(data) {
        const balloon = new Balloon(data);
        const element = balloon.createElement();
        this.container.appendChild(element);
        this.balloons.set(data.id, balloon);
        return balloon;
    }

    // 게임 시작 (풍선 초기화)
    start(balloons = []) {
        this.clear();
        if (balloons.length > 0) {
            this.setBalloons(balloons);
        }
    }

    // 초기 풍선들 설정
    setBalloons(balloonsData) {
        this.clear();
        balloonsData.forEach(data => {
            this.addBalloon(data);
        });
    }

    // 풍선 터트리기
    popBalloon(id, callback) {
        const balloon = this.balloons.get(id);
        if (balloon) {
            balloon.pop(() => {
                this.balloons.delete(id);
                if (callback) callback();
            });
            return true;
        }
        return false;
    }

    // 새 풍선으로 교체
    replaceBalloon(oldId, newData) {
        this.popBalloon(oldId, () => {
            setTimeout(() => {
                this.addBalloon(newData);
            }, 100);
        });
    }

    // 단어로 풍선 체크 (ID 반환)
    checkWord(word) {
        const balloon = this.findBalloonByWord(word);
        // 화면 밖으로 완전히 나간 풍선은 터트릴 수 없음 (요청사항 반영)
        // -15로 설정: 풍선 본체(12%)+줄(3%) 정도를 고려하여 완전히 나갈 때까지 허용
        if (balloon && balloon.y > -15) {
            return balloon.id;
        }
        return null;
    }

    // 단어로 풍선 찾기
    findBalloonByWord(word) {
        for (const [id, balloon] of this.balloons) {
            if (balloon.word === word) {
                return balloon;
            }
        }
        return null;
    }

    // 모든 풍선 제거
    clear() {
        this.balloons.forEach(balloon => {
            if (balloon.element && balloon.element.parentNode) {
                balloon.element.parentNode.removeChild(balloon.element);
            }
        });
        this.balloons.clear();
    }

    // 위치 업데이트
    update(deltaTime) {
        const missedBalloons = [];
        this.balloons.forEach(balloon => {
            const status = balloon.updatePosition(deltaTime);
            if (status === 'missed') {
                missedBalloons.push(balloon.id);
            }
        });

        // 놓친 풍선 처리 (서버 통보)
        if (missedBalloons.length > 0 && window.socketClient) {
            missedBalloons.forEach(id => {
                this.popBalloon(id); // 로컬에서 제거
                window.socketClient.reportMissedBalloon(id); // 서버에 알림
            });
        }
    }
}
