// 메인 애플리케이션 모듈

class TypingApp {
    constructor() {
        this.language = 'korean';
        this.currentMode = null;
        this.keyboard = null;
        this.positionPractice = null;
        this.wordPractice = null;
        this.sentencePractice = null;
        this.hiddenInput = null;
        this.isComposing = false;
        this.isComposing = false;
        this.composingText = '';
        this.countdownInterval = null;

        this.init();
    }

    init() {
        // 키보드 초기화
        this.keyboard = new Keyboard('keyboard-container');

        // 연습 모듈 초기화
        this.positionPractice = new PositionPractice(this);
        this.wordPractice = new WordPractice(this);
        this.sentencePractice = new SentencePractice(this);

        // 숨겨진 입력 필드 생성 (한글 입력용)
        this.createHiddenInput();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 기본 손 이미지 초기화
        this.updateHandImage(null, null);

        // 기본 모드로 시작 (자리 연습 - 기본자리)
        this.startPositionPractice('basic');
    }

    createHiddenInput() {
        this.hiddenInput = document.createElement('input');
        this.hiddenInput.type = 'text';
        this.hiddenInput.id = 'hidden-input';
        this.hiddenInput.style.cssText = 'position: absolute; left: -9999px; top: 0; opacity: 0;';
        this.hiddenInput.autocomplete = 'off';
        this.hiddenInput.autocapitalize = 'off';
        this.hiddenInput.spellcheck = false;
        // 한글/영문 입력 모드 설정
        this.updateInputLanguage();
        document.body.appendChild(this.hiddenInput);
    }

    updateInputLanguage() {
        if (this.hiddenInput) {
            // 브라우저에 힌트 제공 (완전한 제어는 불가능하지만 도움이 됨)
            this.hiddenInput.lang = this.language === 'korean' ? 'ko' : 'en';
            this.hiddenInput.setAttribute('inputmode', 'text');
        }
    }

    focusHiddenInput() {
        if (this.hiddenInput) {
            this.hiddenInput.focus();
        }
    }

    setupEventListeners() {
        // 언어 전환 버튼
        document.getElementById('lang-toggle').addEventListener('click', () => {
            this.toggleLanguage();
        });

        // 메뉴 버튼들
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // 기본 동작 방지
                e.stopPropagation(); // 중복 클릭 방지
                const mode = e.currentTarget.dataset.mode;

                // 이미 같은 모드이고 타이머가 돌고 있다면 무시? 아니면 재시작?
                // 사용자 요청: "타이머가 오동작... 다른 탭 누르면 초기화"
                // 따라서 무조건 재시작이 맞음.

                this.handleMenuClick(mode);
            });
        });

        // 서브메뉴 아이템들
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const position = e.currentTarget.dataset.position;
                this.startPositionPractice(position);
            });
        });

        // 페이지 클릭 시 숨겨진 입력창에 포커스
        document.addEventListener('click', () => {
            this.focusHiddenInput();
        });

        // 키보드 입력 처리 (자리 연습용 - 영문 키만)
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // 한글 조합 시작
        this.hiddenInput.addEventListener('compositionstart', () => {
            this.isComposing = true;
            this.composingText = '';
        });

        // 한글 조합 중 (실시간 표시)
        this.hiddenInput.addEventListener('compositionupdate', (e) => {
            this.composingText = e.data || '';
            this.handleComposingUpdate(this.composingText);
        });

        // 한글 조합 완료
        this.hiddenInput.addEventListener('compositionend', (e) => {
            const text = e.data || this.composingText;
            this.isComposing = false;
            this.composingText = '';
            this.handleCompositionInput(text);
            this.hiddenInput.value = '';
        });

        // 영문 입력 처리 (input 이벤트)
        this.hiddenInput.addEventListener('input', (e) => {
            if (!this.isComposing && e.data) {
                this.handleTextInput(e.data);
                this.hiddenInput.value = '';
            }
        });

        // 서브메뉴 토글
        const positionMenu = document.querySelector('[data-mode="position"]');
        positionMenu.addEventListener('mouseenter', () => {
            positionMenu.querySelector('.submenu').style.display = 'block';
        });
        positionMenu.addEventListener('mouseleave', () => {
            positionMenu.querySelector('.submenu').style.display = 'none';
        });
    }

    handleMenuClick(mode) {
        // 활성 메뉴 표시
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // 현재 모드 중지
        this.stopCurrentMode();

        switch (mode) {
            case 'position':
                this.startPositionPractice('basic');
                break;
            case 'word':
                this.startWordPractice();
                break;
            case 'sentence':
                this.startSentencePractice();
                break;
        }
    }

    stopCurrentMode() {
        this.stopCountdown();
        if (this.positionPractice) this.positionPractice.stop();
        if (this.wordPractice) this.wordPractice.stop();
        if (this.sentencePractice) this.sentencePractice.stop();
    }

    stopCountdown() {
        if (this.countdownInterval !== null) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        const overlay = document.getElementById('countdown-overlay');
        const countdownNumber = document.getElementById('countdown-number');
        if (overlay) overlay.style.display = 'none';
        if (countdownNumber) {
            countdownNumber.classList.remove('pulse');
            countdownNumber.textContent = ''; // 내용 비우기
        }
    }

    startPositionPractice(positionType) {
        this.stopCurrentMode();
        this.currentMode = 'position';

        // UI 레이아웃 변경 (자리 연습용)
        this.setupPositionUI();

        // 자리 연습 시작
        this.positionPractice.start(positionType);

        // 메뉴 활성화 표시
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('[data-mode="position"]').classList.add('active');

        // 포커스
        setTimeout(() => this.focusHiddenInput(), 100);
    }

    startWordPractice() {
        this.stopCurrentMode();
        this.currentMode = 'word';

        // UI 레이아웃 변경 (낱말 연습용)
        this.setupWordSentenceUI();

        // 낱말 연습 시작
        this.wordPractice.start();

        // 포커스
        setTimeout(() => this.focusHiddenInput(), 100);
    }

    startSentencePractice() {
        this.stopCurrentMode();
        this.currentMode = 'sentence';

        // UI 레이아웃 변경 (단문 연습용)
        this.setupWordSentenceUI();

        // 단문 연습 시작
        this.sentencePractice.start();

        // 포커스
        setTimeout(() => this.focusHiddenInput(), 100);
    }

    setupPositionUI() {
        const rightTop = document.getElementById('right-top');
        rightTop.innerHTML = `
            <div class="current-char-container">
                <div class="current-char" id="current-char">ㅁ</div>
            </div>
        `;

        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">시간</div>
                <div class="stat-value" id="time-display">00:00</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">정확도</div>
                <div class="stat-value" id="accuracy-display">100%</div>
                <div class="stat-sub" id="error-count">오타: 0</div>
            </div>
        `;
    }

    setupWordSentenceUI() {
        const rightTop = document.getElementById('right-top');
        rightTop.innerHTML = `
            <div class="text-practice-container">
                <div class="target-text" id="target-text"></div>
                <div class="input-text" id="input-text">&nbsp;</div>
                <div class="composing-indicator" id="composing-indicator"></div>
                <div class="next-text" id="next-text"></div>
            </div>
        `;
    }

    toggleLanguage() {
        this.language = this.language === 'korean' ? 'english' : 'korean';

        // 버튼 텍스트 업데이트
        const langBtn = document.getElementById('lang-toggle');
        langBtn.textContent = this.language === 'korean' ? '한글' : 'English';

        // 키보드 언어 변경
        this.keyboard.setLanguage(this.language);

        // 입력 언어 힌트 업데이트
        this.updateInputLanguage();

        // 현재 모드 재시작
        switch (this.currentMode) {
            case 'position':
                this.startPositionPractice(this.positionPractice.positionType);
                break;
            case 'word':
                this.startWordPractice();
                break;
            case 'sentence':
                this.startSentencePractice();
                break;
        }
    }

    handleKeyDown(e) {
        // 카운트다운 중이면 무시
        if (document.getElementById('countdown-overlay').style.display !== 'none') {
            return;
        }

        // 특수 키 처리
        if (e.key === 'Tab' || e.key === 'Escape') {
            return;
        }

        // Enter, Backspace, Space 키 처리
        if (e.key === 'Enter' || e.key === 'Backspace' || e.key === ' ') {
            e.preventDefault();

            switch (this.currentMode) {
                case 'word':
                    this.wordPractice.handleSpecialKey(e.key);
                    break;
                case 'sentence':
                    this.sentencePractice.handleSpecialKey(e.key);
                    break;
            }
        }

        // 자리 연습은 keydown으로 직접 처리 (영문 키 + 특수문자 + 콤마/마침표/슬래시)
        if (this.currentMode === 'position') {
            if (e.key.length === 1 && (e.key.match(/[a-zA-Z;,. /]/) || e.key === ';')) {
                e.preventDefault();
                this.positionPractice.handleInput(e.key);
            }
        }
    }

    // 한글 조합 중 실시간 업데이트
    handleComposingUpdate(composingText) {
        switch (this.currentMode) {
            case 'word':
                this.wordPractice.updateComposing(composingText);
                break;
            case 'sentence':
                this.sentencePractice.updateComposing(composingText);
                break;
        }
    }

    // 한글 조합 완료 시
    handleCompositionInput(data) {
        if (!data) return;

        // 카운트다운 중이면 무시
        if (document.getElementById('countdown-overlay').style.display !== 'none') {
            return;
        }

        // 각 글자를 개별 처리
        for (const char of data) {
            switch (this.currentMode) {
                case 'word':
                    this.wordPractice.handleCharInput(char);
                    break;
                case 'sentence':
                    this.sentencePractice.handleCharInput(char);
                    break;
            }
        }
    }

    // 영문 텍스트 입력 시
    handleTextInput(data) {
        if (!data) return;

        // 카운트다운 중이면 무시
        if (document.getElementById('countdown-overlay').style.display !== 'none') {
            return;
        }

        for (const char of data) {
            switch (this.currentMode) {
                case 'word':
                    this.wordPractice.handleCharInput(char);
                    break;
                case 'sentence':
                    this.sentencePractice.handleCharInput(char);
                    break;
            }
        }
    }

    stopCountdown() {
        // 전역 변수 해제
        if (window.__COUNTDOWN_INTERVAL) {
            clearInterval(window.__COUNTDOWN_INTERVAL);
            window.__COUNTDOWN_INTERVAL = null;
        }
        // 인스턴스 변수 해제
        if (this.countdownInterval !== null) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        const overlay = document.getElementById('countdown-overlay');
        // DOM에 저장된 ID 해제 (최후의 보루)
        if (overlay && overlay.dataset.timerId) {
            clearInterval(parseInt(overlay.dataset.timerId));
            overlay.dataset.timerId = '';
        }

        const countdownNumber = document.getElementById('countdown-number');
        if (overlay) overlay.style.display = 'none';
        if (countdownNumber) {
            countdownNumber.classList.remove('pulse');
            countdownNumber.textContent = '';
        }
    }

    showCountdown(callback) {
        // 기존 타이머 제거
        this.stopCountdown();

        const overlay = document.getElementById('countdown-overlay');
        const countdownNumber = document.getElementById('countdown-number');

        overlay.style.display = 'flex';
        let count = 3;
        countdownNumber.textContent = count;

        // [수정] 애니메이션 강제 재시작 (리플로우)
        // 이전 타이머의 애니메이션 상태가 남아있어 '3'이 안 보이는 현상 방지
        countdownNumber.classList.remove('pulse');
        void countdownNumber.offsetWidth;
        countdownNumber.classList.add('pulse');

        // 새 타이머 시작
        const timerId = setInterval(() => {
            count--;
            if (count > 0) {
                // 애니메이션 리셋 (글리치 방지)
                countdownNumber.classList.remove('pulse');
                void countdownNumber.offsetWidth; // 리플로우 강제
                countdownNumber.textContent = count;
                countdownNumber.classList.add('pulse');
            } else if (count === 0) {
                // '시작!' 표시 시에도 애니메이션 적용
                countdownNumber.classList.remove('pulse');
                void countdownNumber.offsetWidth;
                countdownNumber.textContent = '시작!';
                countdownNumber.classList.add('pulse');
            } else {
                this.stopCountdown();
                this.focusHiddenInput();
                if (callback) callback();
            }
        }, 1000);

        // ID를 전역/인스턴스/DOM 세 곳에 모두 저장하여 놓치지 않음
        this.countdownInterval = timerId;
        window.__COUNTDOWN_INTERVAL = timerId;
        overlay.dataset.timerId = timerId;
    }

    // 항상 양손 표시, 활성 손가락만 강조
    updateHandImage(keyCode, finger) {
        const handContainer = document.getElementById('hand-container');

        if (finger === undefined && keyCode) {
            finger = this.keyboard.getFingerForKey(keyCode);
        }

        handContainer.innerHTML = this.generateBothHandsSVG(finger, keyCode === 'Space');
    }

    generateBothHandsSVG(activeFinger, isSpace) {
        return `
            <div class="hands-container">
                ${this.generateSingleHandSVG(true, activeFinger, isSpace)}
                ${this.generateSingleHandSVG(false, activeFinger, isSpace)}
            </div>
        `;
    }

    generateSingleHandSVG(isLeftHand, activeFinger, isSpace) {
        const handId = isLeftHand ? 'left' : 'right';

        // 손가락 위치와 매핑
        // 왼손: finger 0=새끼, 1=약지, 2=중지, 3=검지, 4=엄지
        // 오른손: finger 5=엄지, 6=검지, 7=중지, 8=약지, 9=새끼
        const fingerPositions = isLeftHand
            ? [
                { x: 25, y: 50, finger: 0 },   // 새끼
                { x: 50, y: 25, finger: 1 },   // 약지
                { x: 75, y: 15, finger: 2 },   // 중지
                { x: 100, y: 25, finger: 3 },  // 검지
                { x: 125, y: 75, finger: 4 }   // 엄지
            ]
            : [
                { x: 75, y: 75, finger: 5 },   // 엄지
                { x: 100, y: 25, finger: 6 },  // 검지
                { x: 125, y: 15, finger: 7 },  // 중지
                { x: 150, y: 25, finger: 8 },  // 약지
                { x: 175, y: 50, finger: 9 }   // 새끼
            ];

        let fingersHTML = '';
        fingerPositions.forEach((pos) => {
            const isActive = pos.finger === activeFinger || (isSpace && (pos.finger === 4 || pos.finger === 5));
            const baseColor = isActive ? '#22c55e' : '#d4a574';
            const pressedOffset = isActive ? 8 : 0;
            const glowFilter = isActive ? 'filter="url(#fingerGlow)"' : '';

            // 손가락 본체
            fingersHTML += `
                <ellipse cx="${pos.x}" cy="${pos.y + pressedOffset}" rx="14" ry="24" 
                    fill="${baseColor}" 
                    stroke="${isActive ? '#16a34a' : '#b8956e'}" 
                    stroke-width="1.5"
                    opacity="${isActive ? '1' : '0.8'}"
                    ${glowFilter} />
            `;

            // 손톱
            fingersHTML += `
                <ellipse cx="${pos.x}" cy="${pos.y + pressedOffset - 18}" rx="7" ry="5" 
                    fill="${isActive ? '#bbf7d0' : '#ffe4c9'}" 
                    opacity="0.9" />
            `;
        });

        // 손바닥
        const palmX = isLeftHand ? 70 : 130;
        const palmHTML = `
            <ellipse cx="${palmX}" cy="100" rx="60" ry="40" 
                fill="#d4a574" stroke="#b8956e" stroke-width="1" opacity="0.85" />
        `;

        return `
            <svg class="hand-svg ${handId}-hand" viewBox="0 -30 200 180" style="width: 160px; height: 144px;">
                <defs>
                    <filter id="fingerGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                ${palmHTML}
                ${fingersHTML}
            </svg>
        `;
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.typingApp = new TypingApp();
});
