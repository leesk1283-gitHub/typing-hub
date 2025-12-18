// 단문 연습 모듈

class SentencePractice {
    constructor(app) {
        this.app = app;
        this.sentences = [];
        this.currentSentenceIndex = 0;
        this.currentSentence = '';
        this.nextSentence = '';
        this.currentInput = '';
        this.composingText = '';
        this.startTime = null;

        // 타수 및 통계 변수
        this.currentSentenceKeystrokes = 0;
        this.totalKeystrokes = 0;
        this.accumulatedTime = 0;
        this.lastSentenceSpeed = 0;

        this.totalCharsTyped = 0;
        this.correctChars = 0;
        this.wrongCount = 0;
        this.maxSpeed = 0;
        this.isActive = false;
        this.timerInterval = null;
        this.maxJamoCount = 0;
        this.wrongTimeout = null;
        this.lastManualCommit = null;
    }

    start() {
        console.log('SentencePractice start called');

        if (!window.TypingData || !window.TypingData.SENTENCES) {
            console.error('TypingData.SENTENCES not found');
            this.sentences = ['데이터 로딩 오류입니다.'];
        } else {
            this.sentences = [...window.TypingData.SENTENCES[this.app.language]];
        }

        if (this.sentences.length === 0) {
            this.sentences = ['표시할 문장이 없습니다.'];
        }

        this.shuffleSentences();

        this.currentSentenceIndex = 0;
        this.currentInput = '';
        this.composingText = '';

        this.currentSentenceKeystrokes = 0;
        this.totalKeystrokes = 0;
        this.accumulatedTime = 0;
        this.lastSentenceSpeed = 0;

        this.totalCharsTyped = 0;
        this.correctChars = 0;
        this.wrongCount = 0;
        this.maxSpeed = 0;
        this.startTime = null;
        this.isActive = true;

        const titleEl = document.getElementById('practice-title');
        if (titleEl) {
            titleEl.innerHTML = `
                <span class="practice-main-title">단문 연습</span>
            `;
        }

        this.app.keyboard.setHighlightedKeys([]);
        this.setupStatsUI();

        this.currentSentence = this.sentences[0];
        if (!this.currentSentence) {
            this.currentSentence = '오류: 문장이 없습니다.';
        }
        this.nextSentence = this.sentences[1] || '';

        const targetEl = document.getElementById('target-text');
        if (!targetEl) {
            console.error('target-text element missing!');
        } else {
            this.updateDisplay();
        }

        this.app.showCountdown(() => {
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

    shuffleSentences() {
        for (let i = this.sentences.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.sentences[i], this.sentences[j]] = [this.sentences[j], this.sentences[i]];
        }
    }

    setupStatsUI() {
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">시간</div>
                <div class="stat-value" id="time-display">00:00</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">타수</div>
                <div class="stat-value" id="speed-display">0</div>
                <div class="stat-sub" id="max-speed">최고: 0</div>
                <div class="stat-sub" id="avg-speed" style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">평균: 0</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">정확도</div>
                <div class="stat-value" id="accuracy-display">100%</div>
                <div class="stat-sub" id="error-count">오타: 0</div>
            </div>
        `;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateStats();
        }, 100);
    }

    decomposeHangul(char) {
        if (!char) return null;
        const code = char.charCodeAt(0);
        if (code < 0xAC00 || code > 0xD7A3) return null;

        const offset = code - 0xAC00;
        const jong = offset % 28;
        const jung = Math.floor(offset / 28) % 21;
        const cho = Math.floor(offset / 588);
        return { cho, jung, jong };
    }

    getJamoList(char) {
        if (!char) return [];
        const code = char.charCodeAt(0);

        // 한글 호환 자모 (ㄱ-ㅎ, ㅏ-ㅣ)
        if (code >= 0x3131 && code <= 0x318E) {
            const complexJamos = {
                'ㄲ': ['ㄱ', 'ㄱ'], 'ㄸ': ['ㄷ', 'ㄷ'], 'ㅃ': ['ㅂ', 'ㅂ'], 'ㅆ': ['ㅅ', 'ㅅ'], 'ㅉ': ['ㅈ', 'ㅈ'],
                'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
                'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'],
                'ㅢ': ['ㅡ', 'ㅣ'],
                'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
                'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
                'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
                'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
            };
            return complexJamos[char] || [char];
        }

        if (code < 0xAC00 || code > 0xD7A3) return [char];

        const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        const jungsungList = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
        const jongsungList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        const comp = this.decomposeHangul(char);
        const result = [];

        // 초성
        result.push(...this.getJamoList(chosungList[comp.cho]));
        // 중성
        result.push(...this.getJamoList(jungsungList[comp.jung]));
        // 종성
        if (comp.jong !== 0) {
            result.push(...this.getJamoList(jongsungList[comp.jong]));
        }

        return result;
    }

    getSentenceJamoList(str) {
        if (!str) return [];
        const result = [];
        for (const char of str) {
            result.push(...this.getJamoList(char));
        }
        return result;
    }

    getNextJamo(targetChar, currentComposing) {
        const targetNormalized = targetChar.normalize('NFC');
        const composingNormalized = currentComposing ? currentComposing.normalize('NFC') : '';

        const targetCode = targetNormalized.charCodeAt(0);
        if (targetCode < 0xAC00 || targetCode > 0xD7A3) return targetNormalized;

        const target = this.decomposeHangul(targetNormalized);
        if (!target) return targetNormalized;

        const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        const jungsungList = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
        const jongsungList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        if (!composingNormalized || composingNormalized.length === 0) {
            return chosungList[target.cho];
        }

        if (!this.decomposeHangul(composingNormalized)) {
            if (composingNormalized === chosungList[target.cho]) {
                return jungsungList[target.jung];
            }
            return chosungList[target.cho];
        }

        const comp = this.decomposeHangul(composingNormalized);
        if (comp) {
            if (comp.cho === target.cho) {
                if (comp.jung !== target.jung) {
                    const complexVowels = {
                        'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
                        'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'],
                        'ㅢ': ['ㅡ', 'ㅣ']
                    };
                    const targetJungChar = jungsungList[target.jung];
                    const compJungChar = jungsungList[comp.jung];

                    if (complexVowels[targetJungChar] && complexVowels[targetJungChar][0] === compJungChar) {
                        return complexVowels[targetJungChar][1];
                    }
                    return jungsungList[target.jung];
                }

                if (comp.jung === target.jung) {
                    if (comp.jong === 0 && target.jong !== 0) {
                        const complexConsonants = {
                            'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
                            'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
                            'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
                            'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
                        };
                        const targetJongChar = jongsungList[target.jong];
                        if (complexConsonants[targetJongChar]) {
                            return complexConsonants[targetJongChar][0];
                        }
                        return targetJongChar;
                    }

                    if (comp.jong !== 0 && comp.jong !== target.jong) {
                        const complexConsonants = {
                            'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
                            'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
                            'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
                            'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
                        };
                        const targetJongChar = jongsungList[target.jong];
                        const compJongChar = jongsungList[comp.jong];

                        if (complexConsonants[targetJongChar] && complexConsonants[targetJongChar][0] === compJongChar) {
                            return complexConsonants[targetJongChar][1];
                        }
                    }
                }
            }
        }

        return chosungList[target.cho];
    }

    checkPrediction(targetChar, composingText, nextChar) {
        const targetNormalized = targetChar ? targetChar.normalize('NFC') : '';
        const composingNormalized = composingText ? composingText.normalize('NFC') : '';
        const nextNormalized = nextChar ? nextChar.normalize('NFC') : '';

        if (!targetNormalized || !composingNormalized || !nextNormalized) return null;

        const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        const jongsungList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        const complexConsonants = {
            'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
            'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
            'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
            'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
        };

        const target = this.decomposeHangul(targetNormalized);
        const comp = this.decomposeHangul(composingNormalized);
        const next = this.decomposeHangul(nextNormalized);

        if (!target || !comp || !next) return null;
        if (target.cho !== comp.cho || target.jung !== comp.jung) return null;

        // Case 1: 타겟 받침 없음 + 입력 받침 있음 -> 다음 글자 초성 예측
        if (target.jong === 0 && comp.jong !== 0) {
            const compJongChar = jongsungList[comp.jong];
            const nextChoChar = chosungList[next.cho];
            if (compJongChar === nextChoChar) {
                return this.getNextJamo(nextNormalized, nextChoChar);
            }
        }

        // Case 2: 타겟 받침 있음 + 입력 겹받침 -> 다음 글자 초성 예측 (발+ㅁ -> 밞)
        if (target.jong !== 0 && comp.jong !== 0 && target.jong !== comp.jong) {
            const targetJongChar = jongsungList[target.jong];
            const compJongChar = jongsungList[comp.jong];

            // 입력 겹받침의 첫 자 == 타겟 받침
            if (complexConsonants[compJongChar] && complexConsonants[compJongChar][0] === targetJongChar) {
                const remainder = complexConsonants[compJongChar][1];
                const nextChoChar = chosungList[next.cho]; // 다음 글자 초성

                // 남은 자음 == 다음 글자 초성 -> 다음 글자의 중성 추천
                if (remainder === nextChoChar) {
                    return this.getNextJamo(nextNormalized, nextChoChar);
                }
            }
        }

        return null;
    }

    checkStartTime() {
        if (!this.startTime && this.isActive) {
            this.startTime = Date.now();
        }
    }

    updateComposing(composingText) {
        this.checkStartTime();

        this.composingText = composingText;
        this.updateInputDisplay();

        const fullInput = this.currentInput + (composingText || "");
        const targetSentenceJamos = this.getSentenceJamoList(this.currentSentence);
        const inputJamos = this.getSentenceJamoList(fullInput);

        // 전체 문장 자모 시퀀스를 기준으로 오타 체크
        let isCorrect = true;
        let wrongJamo = null;
        for (let i = 0; i < inputJamos.length; i++) {
            if (i >= targetSentenceJamos.length || inputJamos[i] !== targetSentenceJamos[i]) {
                isCorrect = false;
                wrongJamo = inputJamos[i];
                break;
            }
        }

        if (isCorrect) {
            if (inputJamos.length > this.maxJamoCount) {
                const addedCount = inputJamos.length - this.maxJamoCount;
                this.currentSentenceKeystrokes += addedCount;
                this.totalKeystrokes += addedCount;
                this.maxJamoCount = inputJamos.length;
            }
        } else {
            // 오타 피드백
            if (wrongJamo) {
                this.showWrongFeedback(wrongJamo);
            } else if (composingText) {
                this.showWrongFeedback(composingText[composingText.length - 1]);
            }
        }

        if (composingText && composingText.length > 0) {
            const currentCharIndex = this.currentInput.length;
            const targetChar = this.currentSentence[currentCharIndex];

            const targetNorm = targetChar ? targetChar.normalize('NFC') : '';
            const compNorm = this.composingText.normalize('NFC');

            // 1. 완성 체크
            if (compNorm === targetNorm) {
                if (currentCharIndex === this.currentSentence.length - 1) {
                    this.app.keyboard.setCurrentKey('Enter', false);
                    this.app.updateHandImage('Enter');
                    return;
                }
                const nextChar = this.currentSentence[currentCharIndex + 1];
                if (nextChar === ' ') {
                    this.app.keyboard.setCurrentKey('Space', false);
                    this.app.updateHandImage('Space');
                } else if ([',', '.', '!', '?'].includes(nextChar)) {
                    this.highlightKey(nextChar);
                } else {
                    const nextJamo = this.getNextJamo(nextChar, '');
                    this.highlightKey(nextJamo);
                }
                return;
            }

            // 2. 예측 체크 (연음)
            if (targetChar && currentCharIndex + 1 < this.currentSentence.length) {
                const nextChar = this.currentSentence[currentCharIndex + 1];
                const predictedJamo = this.checkPrediction(targetChar, this.composingText, nextChar);
                if (predictedJamo) {
                    this.highlightKey(predictedJamo);
                    return;
                }
            }

            if (targetChar && targetChar !== ' ') {
                const nextJamo = this.getNextJamo(targetChar, this.composingText);
                this.highlightKey(nextJamo);
            }
        }

        this.updateStats();
    }

    // ... (기존과 동일)
    highlightKey(jamo) {
        const keyCode = this.app.keyboard.getKeyCodeForChar(jamo);
        if (keyCode) {
            const needsShift = this.app.keyboard.isDoubleConsonant(jamo);
            this.app.keyboard.setCurrentKey(keyCode, needsShift);
            const finger = this.app.keyboard.getFingerForKey(keyCode);
            this.app.updateHandImage(keyCode, finger);
        }
    }

    updateInputDisplay() {
        const inputText = document.getElementById('input-text');
        if (inputText) {
            const displayText = this.currentInput + this.composingText;
            inputText.textContent = displayText || '\u00A0';
        }
    }

    updateDisplay() {
        const targetText = document.getElementById('target-text');
        if (targetText) {
            targetText.innerHTML = this.renderTargetSentence();
        }
        this.updateInputDisplay();
        const nextText = document.getElementById('next-text');
        if (nextText) {
            nextText.textContent = this.nextSentence;
        }
        this.updateCurrentKeyHighlight();
    }

    updateCurrentKeyHighlight() {
        const currentCharIndex = this.currentInput.length;

        if (this.composingText && this.composingText.length > 0) {
            const targetChar = this.currentSentence[currentCharIndex];

            const targetNorm = targetChar ? targetChar.normalize('NFC') : '';
            const compNorm = this.composingText.normalize('NFC');

            // 1. 완성 체크
            if (compNorm === targetNorm) {
                if (currentCharIndex === this.currentSentence.length - 1) {
                    this.app.keyboard.setCurrentKey('Enter', false);
                    this.app.updateHandImage('Enter');
                    return;
                }
                const nextChar = this.currentSentence[currentCharIndex + 1];
                if (nextChar === ' ') {
                    this.app.keyboard.setCurrentKey('Space', false);
                    this.app.updateHandImage('Space');
                } else if ([',', '.', '!', '?'].includes(nextChar)) {
                    this.highlightKey(nextChar);
                } else {
                    const nextJamo = this.getNextJamo(nextChar, '');
                    this.highlightKey(nextJamo);
                }
                return;
            }

            // 2. 예측 체크
            if (targetChar && currentCharIndex + 1 < this.currentSentence.length) {
                const nextChar = this.currentSentence[currentCharIndex + 1];
                const predictedJamo = this.checkPrediction(targetChar, this.composingText, nextChar);
                if (predictedJamo) {
                    this.highlightKey(predictedJamo);
                    return;
                }
            }

            if (targetChar) {
                const nextJamo = this.getNextJamo(targetChar, this.composingText);
                this.highlightKey(nextJamo);
            }
            return;
        }

        if (currentCharIndex < this.currentSentence.length) {
            const nextChar = this.currentSentence[currentCharIndex];
            if (nextChar === ' ') {
                this.app.keyboard.setCurrentKey('Space', false);
                this.app.updateHandImage('Space');
            } else {
                const nextJamo = this.getNextJamo(nextChar, '');
                this.highlightKey(nextJamo);
            }
        } else {
            this.app.keyboard.setCurrentKey('Enter', false);
            this.app.updateHandImage('Enter');
        }
    }

    renderTargetSentence() {
        let html = '';
        for (let i = 0; i < this.currentSentence.length; i++) {
            let className = '';
            if (i < this.currentInput.length) {
                className = this.currentInput[i] === this.currentSentence[i] ? 'correct' : 'incorrect';
            } else if (i === this.currentInput.length) {
                className = 'current';
            }
            const char = this.currentSentence[i] === ' ' ? '\u00A0' : this.currentSentence[i];
            html += `<span class="${className}">${char}</span>`;
        }
        return html;
    }

    handleSpecialKey(key) {
        if (!this.isActive) return;
        this.checkStartTime();

        const currentCharIndex = this.currentInput.length;
        const targetChar = this.currentSentence[currentCharIndex];

        if (key === 'Enter') {
            if (this.currentInput.length >= this.currentSentence.length || this.currentInput.length > 0) {
                this.maxJamoCount = 0;
                this.moveToNextSentence();
            }
        } else if (key === ' ') {
            // 문장 끝에서 공백으로 다음 문장 이동
            if (this.currentInput.length >= this.currentSentence.length) {
                this.maxJamoCount = 0;
                this.moveToNextSentence();
                return;
            }

            // 조합 중인 글자가 있으면 먼저 커밋 시도
            if (this.composingText.length > 0) {
                const targetNorm = targetChar ? targetChar.normalize('NFC') : '';
                const compNorm = this.composingText.normalize('NFC');

                if (compNorm === targetNorm) {
                    // 현재 글자가 완성되었으면 커밋 처리
                    this.lastManualCommit = targetChar;
                    this.handleCharInput(targetChar);
                    // 커밋 후 다음 글자가 공백인지 확인 (이미 이동했으므로 한 번 더 체크)
                    const nextTarget = this.currentSentence[this.currentInput.length];
                    if (nextTarget === ' ') {
                        this.handleCharInput(' ');
                        return;
                    }
                }
            }

            // 일반적인 공백 입력 처리
            if (targetChar === ' ') {
                this.handleCharInput(' ');
            } else {
                // 오타 피드백: 공백이 아닌 자리에서 공백 입력
                this.showWrongFeedback(' ');
            }
        } else if (key === 'Backspace') {
            if (this.currentInput.length > 0 || this.composingText.length > 0) {
                if (this.composingText.length > 0) {
                    // 조합 중인 글자가 있을 때는 updateComposing에서 처리됨.
                } else {
                    this.currentInput = this.currentInput.slice(0, -1);
                    // 삭제 시 현재 입력 상태에 맞춰 maxJamoCount 재설정
                    const currentInputJamos = this.getSentenceJamoList(this.currentInput);
                    this.maxJamoCount = currentInputJamos.length;
                    this.updateDisplay();
                }
            }
        }
    }

    handleCharInput(char) {
        if (!this.isActive) return;
        if (!char || char.length !== 1) return;
        this.checkStartTime();

        const code = char.charCodeAt(0);

        // [중복 방지] 수동 커밋 등으로 이미 입력된 글자라면 무시
        if (this.lastManualCommit === char) {
            this.lastManualCommit = null;
            this.composingText = '';
            return;
        }
        this.lastManualCommit = null;

        this.composingText = '';
        this.currentInput += char;

        const targetSentenceJamos = this.getSentenceJamoList(this.currentSentence);
        const inputJamos = this.getSentenceJamoList(this.currentInput);

        let isCorrect = true;
        let wrongJamo = null;
        for (let i = 0; i < inputJamos.length; i++) {
            if (i >= targetSentenceJamos.length || inputJamos[i] !== targetSentenceJamos[i]) {
                isCorrect = false;
                wrongJamo = inputJamos[i];
                break;
            }
        }

        if (isCorrect) {
            if (inputJamos.length > this.maxJamoCount) {
                const addedCount = inputJamos.length - this.maxJamoCount;
                this.currentSentenceKeystrokes += addedCount;
                this.totalKeystrokes += addedCount;
                this.maxJamoCount = inputJamos.length;
            }
        } else {
            // 오타 피드백
            this.showWrongFeedback(wrongJamo || char);
        }

        this.totalCharsTyped++;

        const currentCharIndex = this.currentInput.length - 1;
        const expectedChar = this.currentSentence[currentCharIndex];
        if (char === expectedChar) {
            this.correctChars++;
        } else {
            this.wrongCount++;
        }

        this.updateDisplay();
        this.updateStats();
    }

    moveToNextSentence() {
        let sentenceElapsed = 0;
        if (this.startTime) {
            sentenceElapsed = (Date.now() - this.startTime) / 1000;
        }

        // [수정] 타수 계산 로직 개선 (물리적 한계 속도 반영)
        // 스트로크당 최소 0.04초(분당 1500타)는 소요된다고 가정
        const minTimePerStroke = 0.04;
        const effectiveElapsed = Math.max(sentenceElapsed, this.currentSentenceKeystrokes * minTimePerStroke);

        if (effectiveElapsed > 0) {
            this.lastSentenceSpeed = Math.round((this.currentSentenceKeystrokes / effectiveElapsed) * 60);
        } else {
            this.lastSentenceSpeed = 0;
        }

        // 문장 완성 시점의 속도로 최고 타수 갱신
        if (this.lastSentenceSpeed > this.maxSpeed) {
            this.maxSpeed = this.lastSentenceSpeed;
        }

        if (this.startTime) {
            this.accumulatedTime += (Date.now() - this.startTime);
            this.startTime = null;
        }

        this.currentSentenceKeystrokes = 0;

        this.currentSentenceIndex++;
        if (this.currentSentenceIndex >= this.sentences.length) {
            this.currentSentenceIndex = 0;
        }

        this.currentSentence = this.sentences[this.currentSentenceIndex];
        this.nextSentence = this.sentences[(this.currentSentenceIndex + 1) % this.sentences.length];
        this.currentInput = '';
        this.composingText = '';

        this.updateDisplay();
        this.updateStats();
    }

    updateStats() {
        const now = Date.now();

        let sentenceElapsed = 0;
        if (this.startTime) {
            sentenceElapsed = (now - this.startTime) / 1000;
        }

        let speed = this.lastSentenceSpeed;
        if (this.startTime && sentenceElapsed > 0) {
            speed = Math.round((this.currentSentenceKeystrokes / sentenceElapsed) * 60);
        }

        let totalElapsedSeconds = this.accumulatedTime / 1000;
        if (this.startTime) {
            totalElapsedSeconds += sentenceElapsed;
        }

        const minutes = Math.floor(totalElapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(totalElapsedSeconds % 60).toString().padStart(2, '0');

        let avgSpeed = 0;
        if (totalElapsedSeconds > 0) {
            avgSpeed = Math.round((this.totalKeystrokes / totalElapsedSeconds) * 60);
        }

        document.getElementById('time-display').textContent = `${minutes}:${seconds}`;
        document.getElementById('speed-display').textContent = speed;

        const avgEl = document.getElementById('avg-speed');
        if (avgEl) avgEl.textContent = `평균: ${avgSpeed}`;

        document.getElementById('max-speed').textContent = `최고: ${this.maxSpeed}`;

        const accuracy = this.totalCharsTyped > 0
            ? Math.round((this.correctChars / this.totalCharsTyped) * 100)
            : 100;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('error-count').textContent = `오타: ${this.wrongCount}`;
    }

    showWrongFeedback(inputChar) {
        // 단어 영역에 흔들림 효과
        const targetText = document.getElementById('target-text');
        if (targetText) {
            targetText.classList.remove('wrong-shake');
            void targetText.offsetWidth; // 리플로우
            targetText.classList.add('wrong-shake');
        }

        // 키보드에 오타 표시
        const keyCode = this.app.keyboard.getKeyCodeForChar(inputChar);
        if (keyCode) {
            this.app.keyboard.setWrongKey(keyCode);
        }

        if (this.wrongTimeout) {
            clearTimeout(this.wrongTimeout);
        }
        this.wrongTimeout = setTimeout(() => {
            if (targetText) targetText.classList.remove('wrong-shake');
            this.app.keyboard.clearWrongKey();
        }, 300);
    }
}

window.SentencePractice = SentencePractice;
