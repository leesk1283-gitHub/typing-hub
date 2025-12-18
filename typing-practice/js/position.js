// 자리 연습 모듈

class PositionPractice {
    constructor(app) {
        this.app = app;
        this.positionType = 'basic';
        this.currentChar = '';
        this.startTime = null;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.isActive = false;
        this.timerInterval = null;
        this.wrongTimeout = null;
    }

    start(positionType) {
        this.positionType = positionType;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.startTime = null;
        this.isActive = true;

        const position = window.TypingData.POSITION_SETS[positionType];

        // 좌측 상단 업데이트
        const titleEl = document.getElementById('practice-title');
        if (titleEl) {
            titleEl.innerHTML = `
                <span class="practice-main-title">자리연습</span>
                <span class="practice-sub-title">${position.name}</span>
            `;
        }

        // 키보드 하이라이트 설정
        this.app.keyboard.setHighlightedKeys(position.keys);

        // 통계 초기화
        this.updateStats();

        // 첫 글자 표시
        this.showNextChar();

        // 카운트다운 시작
        this.app.showCountdown(() => {
            this.startTime = Date.now();
            this.startTimer();
        });
    }

    stop() {
        this.isActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.wrongTimeout) {
            clearTimeout(this.wrongTimeout);
            this.wrongTimeout = null;
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateStats();
        }, 1000);
    }

    showNextChar() {
        const position = window.TypingData.POSITION_SETS[this.positionType];
        const chars = position[this.app.language];

        // 랜덤 글자 선택
        const randomIndex = Math.floor(Math.random() * chars.length);
        this.currentChar = chars[randomIndex];

        // 화면에 표시
        const charElement = document.getElementById('current-char');
        charElement.textContent = this.currentChar;
        charElement.classList.remove('wrong');

        // 현재 키 하이라이트
        const keyCode = this.app.keyboard.getKeyCodeForChar(this.currentChar);
        this.app.keyboard.setCurrentKey(keyCode);
        this.app.keyboard.clearWrongKey();

        // 손 이미지 업데이트
        this.app.updateHandImage(keyCode);
    }

    handleInput(inputChar) {
        if (!this.isActive) return;

        const expectedChar = this.currentChar;

        // 한글 입력 처리
        let isCorrect = false;
        if (this.app.language === 'korean') {
            const mappedChar = window.TypingData.KOREAN_KEY_MAP[inputChar.toLowerCase()];
            isCorrect = mappedChar === expectedChar || inputChar === expectedChar;
        } else {
            // 영문 모드에서는 대소문자 무시 및 특수문자 처리
            isCorrect = inputChar.toUpperCase() === expectedChar.toUpperCase() || inputChar === expectedChar;
        }

        if (isCorrect) {
            this.correctCount++;
            this.showNextChar();
        } else {
            this.wrongCount++;
            this.showWrongFeedback(inputChar);
        }

        this.updateStats();
    }

    showWrongFeedback(inputChar) {
        // 글자에 틀림 표시
        const charElement = document.getElementById('current-char');
        charElement.classList.add('wrong');

        // 누른 키에 틀림 표시
        const keyCode = this.app.keyboard.getKeyCodeForChar(inputChar);

        if (keyCode) {
            this.app.keyboard.setWrongKey(keyCode);
        }

        // 일정 시간 후 틀림 표시 제거
        if (this.wrongTimeout) {
            clearTimeout(this.wrongTimeout);
        }
        this.wrongTimeout = setTimeout(() => {
            charElement.classList.remove('wrong');
            this.app.keyboard.clearWrongKey();
        }, 300);
    }

    updateStats() {
        // 시간 업데이트
        let elapsed = 0;
        if (this.startTime) {
            elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        }
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('time-display').textContent = `${minutes}:${seconds}`;

        // 정확도 업데이트
        const total = this.correctCount + this.wrongCount;
        const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 100;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('error-count').textContent = `오타: ${this.wrongCount}`;
    }
}

window.PositionPractice = PositionPractice;
