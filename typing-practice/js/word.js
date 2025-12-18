// 낱말 연습 모듈

class WordPractice {
    constructor(app) {
        this.app = app;
        this.words = [];
        this.currentWordIndex = 0;
        this.currentWord = '';
        this.nextWord = '';
        this.currentInput = '';
        this.composingText = '';
        this.startTime = null;

        // 타수 및 통계 변수
        this.currentWordKeystrokes = 0;
        this.totalKeystrokes = 0;
        this.accumulatedTime = 0;
        this.lastWordSpeed = 0;

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
        console.log('WordPractice start called');

        if (!window.TypingData || !window.TypingData.WORDS) {
            console.error('TypingData.WORDS not found');
            this.words = ['데이터', '로딩', '오류'];
        } else {
            // [수정] 1글자 낱말 제외 (최소 2글자 이상)
            this.words = window.TypingData.WORDS[this.app.language].filter(word => word.length >= 2);
        }

        if (this.words.length === 0) {
            this.words = ['단어', '없음'];
        }

        this.shuffleWords();

        this.currentWordIndex = 0;
        this.currentInput = '';
        this.composingText = '';

        this.currentWordKeystrokes = 0;
        this.totalKeystrokes = 0;
        this.accumulatedTime = 0;
        this.lastWordSpeed = 0;

        this.totalCharsTyped = 0;
        this.correctChars = 0;
        this.wrongCount = 0;
        this.maxSpeed = 0;
        this.startTime = null;
        this.isActive = true;

        const titleEl = document.getElementById('practice-title');
        if (titleEl) {
            titleEl.innerHTML = `
                <span class="practice-main-title">낱말 연습</span>
            `;
        }

        this.app.keyboard.setHighlightedKeys([]);
        this.setupStatsUI();

        this.currentWord = this.words[0];
        if (!this.currentWord) {
            this.currentWord = '오류';
        }
        this.nextWord = this.words[1] || '';

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

    shuffleWords() {
        if (this.words.length === 0) return;

        // 글자수별로 그룹화 (2, 3, 4, 5글자)
        const groups = {
            2: [], 3: [], 4: [], 5: []
        };

        this.words.forEach(word => {
            const len = word.length;
            if (len >= 2 && len <= 5) {
                groups[len].push(word);
            } else if (len > 5) {
                // 5글자 초과는 5글자 그룹에 포함하거나 별도 처리
                groups[5].push(word);
            }
        });

        // 각 그룹 내부 셔플
        Object.keys(groups).forEach(len => {
            for (let i = groups[len].length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [groups[len][i], groups[len][j]] = [groups[len][j], groups[len][i]];
            }
        });

        // 그룹들을 순환하며 단어 재배열
        const shuffled = [];
        const lengths = [2, 3, 4, 5];
        let hasMore = true;
        let p = { 2: 0, 3: 0, 4: 0, 5: 0 };

        while (hasMore) {
            hasMore = false;
            // 남아있는 단어가 있는 길이들만 추출
            const availableLengths = lengths.filter(len => p[len] < groups[len].length);

            if (availableLengths.length > 0) {
                // 남은 길이 중 하나를 무작위로 선택
                const randomLen = availableLengths[Math.floor(Math.random() * availableLengths.length)];
                shuffled.push(groups[randomLen][p[randomLen]]);
                p[randomLen]++;
                hasMore = true;
            }
        }

        // 남은 단어들 (필터링에서 제외된 단어들이 있다면)이 있을 수 있으므로 체크
        // 여기서는 위 로직으로 충분함.
        if (shuffled.length > 0) {
            this.words = shuffled;
        } else {
            // fallback (필터링된 결과가 없을 경우)
            for (let i = this.words.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
            }
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

    getWordJamoList(str) {
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

        if (target.jong === 0 && comp.jong !== 0) {
            const compJongChar = jongsungList[comp.jong];
            const nextChoChar = chosungList[next.cho];
            if (compJongChar === nextChoChar) {
                return this.getNextJamo(nextNormalized, nextChoChar);
            }
        }

        if (target.jong !== 0 && comp.jong !== 0 && target.jong !== comp.jong) {
            const targetJongChar = jongsungList[target.jong];
            const compJongChar = jongsungList[comp.jong];

            if (complexConsonants[compJongChar] && complexConsonants[compJongChar][0] === targetJongChar) {
                const remainder = complexConsonants[compJongChar][1];
                const nextChoChar = chosungList[next.cho];
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
        const targetWordJamos = this.getWordJamoList(this.currentWord);
        const inputJamos = this.getWordJamoList(fullInput);

        // 전체 단어 자모 시퀀스를 기준으로 오타 체크
        let isCorrect = true;
        let wrongJamo = null;
        for (let i = 0; i < inputJamos.length; i++) {
            if (i >= targetWordJamos.length || inputJamos[i] !== targetWordJamos[i]) {
                isCorrect = false;
                wrongJamo = inputJamos[i];
                break;
            }
        }

        if (isCorrect) {
            if (inputJamos.length > this.maxJamoCount) {
                const addedCount = inputJamos.length - this.maxJamoCount;
                this.currentWordKeystrokes += addedCount;
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
            const targetChar = this.currentWord[currentCharIndex];

            const targetNorm = targetChar ? targetChar.normalize('NFC') : '';
            const compNorm = this.composingText.normalize('NFC');

            // 1. 완성 체크
            if (compNorm === targetNorm) {
                if (currentCharIndex === this.currentWord.length - 1) {
                    this.app.keyboard.setCurrentKey('Enter', false);
                    this.app.updateHandImage('Enter');
                    return;
                }
                const nextChar = this.currentWord[currentCharIndex + 1];
                const nextJamo = this.getNextJamo(nextChar, '');
                this.highlightKey(nextJamo);
                return;
            }

            // 2. 예측 체크 (연음)
            if (targetChar && currentCharIndex + 1 < this.currentWord.length) {
                const nextChar = this.currentWord[currentCharIndex + 1];
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
        } else {
            const currentCharIndex = this.currentInput.length;
            if (currentCharIndex < this.currentWord.length) {
                const targetChar = this.currentWord[currentCharIndex];
                const nextJamo = this.getNextJamo(targetChar, '');
                this.highlightKey(nextJamo);
            }
        }

        this.updateStats();
    }

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
            targetText.innerHTML = this.renderTargetWord();
        }
        this.updateInputDisplay();
        const nextText = document.getElementById('next-text');
        if (nextText) {
            nextText.textContent = this.nextWord;
        }
        this.updateCurrentKeyHighlight();
    }

    updateCurrentKeyHighlight() {
        const currentCharIndex = this.currentInput.length;

        if (this.composingText && this.composingText.length > 0) {
            const targetChar = this.currentWord[currentCharIndex];

            const targetNorm = targetChar ? targetChar.normalize('NFC') : '';
            const compNorm = this.composingText.normalize('NFC');

            // 1. 완성 체크
            if (compNorm === targetNorm) {
                if (currentCharIndex === this.currentWord.length - 1) {
                    this.app.keyboard.setCurrentKey('Enter', false);
                    this.app.updateHandImage('Enter');
                    return;
                }
                const nextChar = this.currentWord[currentCharIndex + 1];
                const nextJamo = this.getNextJamo(nextChar, '');
                this.highlightKey(nextJamo);
                return;
            }

            // 2. 예측 체크
            if (targetChar && currentCharIndex + 1 < this.currentWord.length) {
                const nextChar = this.currentWord[currentCharIndex + 1];
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

        if (currentCharIndex < this.currentWord.length) {
            const nextChar = this.currentWord[currentCharIndex];
            const nextJamo = this.getNextJamo(nextChar, '');
            this.highlightKey(nextJamo);
        } else {
            this.app.keyboard.setCurrentKey('Enter', false);
            this.app.updateHandImage('Enter');
        }
    }

    renderTargetWord() {
        if (!this.currentWord) return '';
        let html = '';
        for (let i = 0; i < this.currentWord.length; i++) {
            let className = '';
            if (i < this.currentInput.length) {
                className = this.currentInput[i] === this.currentWord[i] ? 'correct' : 'incorrect';
            } else if (i === this.currentInput.length) {
                className = 'current';
            }
            html += `<span class="${className}">${this.currentWord[i]}</span>`;
        }
        return html;
    }

    handleSpecialKey(key) {
        if (!this.isActive) return;
        this.checkStartTime();

        if (key === 'Enter' || key === ' ') {
            // [수정] 현재 입력한 글자 수가 낱말 길이와 일치할 때만 다음으로 넘어감
            if (this.currentInput.length === this.currentWord.length) {
                // 완성된 단어의 정확도에 따라 마지막 스트로크(엔터/스페이스) 가산 여부 결정?
                // 보통 기능키는 오타가 아니면 가산함.
                const currentCharIndex = this.currentInput.length;
                const expectedChar = this.currentWord[currentCharIndex];
                if (key === expectedChar || (key === ' ' && !expectedChar) || (key === 'Enter' && !expectedChar)) {
                    // 조합 중인 글자가 타겟과 일치하면 수동 커밋 처리
                    if (this.composingText.length > 0) {
                        const compNorm = this.composingText.normalize('NFC');
                        const targetChar = this.currentWord[this.currentInput.length];
                        const targetNorm = targetChar ? targetChar.normalize('NFC') : '';
                        if (compNorm === targetNorm) {
                            this.lastManualCommit = targetChar;
                            this.handleCharInput(targetChar);
                        }
                    }
                    this.currentWordKeystrokes++;
                    this.totalKeystrokes++;
                }
                this.maxJamoCount = 0;
                this.moveToNextWord();
            } else {
                // [신규] 일찍 넘어가려 할 때 피드백? (선택사항이나 사용자 요청에 부합하게)
                this.showWrongFeedback(' ');
            }
        } else if (key === 'Backspace') {
            if (this.currentInput.length > 0 || this.composingText.length > 0) {
                if (this.composingText.length > 0) {
                    // 조합 중인 글자가 있을 때는 updateComposing에서 처리됨.
                } else {
                    this.currentInput = this.currentInput.slice(0, -1);
                    // 삭제 시 현재 입력 상태에 맞춰 maxJamoCount 재설정
                    const currentInputJamos = this.getWordJamoList(this.currentInput);
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

        // [중복 방지] 수동 커밋 등으로 이미 입력된 글자라면 무시
        if (this.lastManualCommit === char) {
            this.lastManualCommit = null;
            this.composingText = '';
            return;
        }
        this.lastManualCommit = null;

        const code = char.charCodeAt(0);

        // 커밋된 시점의 전체 자모 분석
        this.composingText = '';
        const prevInput = this.currentInput;
        this.currentInput += char;

        const targetWordJamos = this.getWordJamoList(this.currentWord);
        const inputJamos = this.getWordJamoList(this.currentInput);

        let isCorrect = true;
        let wrongJamo = null;
        for (let i = 0; i < inputJamos.length; i++) {
            if (i >= targetWordJamos.length || inputJamos[i] !== targetWordJamos[i]) {
                isCorrect = false;
                wrongJamo = inputJamos[i];
                break;
            }
        }

        if (isCorrect) {
            if (inputJamos.length > this.maxJamoCount) {
                const addedCount = inputJamos.length - this.maxJamoCount;
                this.currentWordKeystrokes += addedCount;
                this.totalKeystrokes += addedCount;
                this.maxJamoCount = inputJamos.length;
            }
        } else {
            // 특수문자나 커밋된 글자가 오타인 경우 피드백
            this.showWrongFeedback(wrongJamo || char);
        }

        this.totalCharsTyped++;

        const currentCharIndex = this.currentInput.length - 1;
        const expectedChar = this.currentWord[currentCharIndex];
        if (char === expectedChar) {
            this.correctChars++;
        } else {
            this.wrongCount++;
        }

        this.updateDisplay();
        this.updateStats();
    }

    moveToNextWord() {
        let wordElapsed = 0;
        if (this.startTime) {
            wordElapsed = (Date.now() - this.startTime) / 1000;
        }

        // [수정] WPM 계산 시 최소 시간 보정 (비정상적으로 높은 타수 방지)
        // [수정] 타수 계산 로직 개선 (물리적 한계 속도 반영)
        // 스트로크당 최소 0.04초(분당 1500타)는 소요된다고 가정
        const minTimePerStroke = 0.04;
        const effectiveElapsed = Math.max(wordElapsed, this.currentWordKeystrokes * minTimePerStroke);

        if (effectiveElapsed > 0) {
            this.lastWordSpeed = Math.round((this.currentWordKeystrokes / effectiveElapsed) * 60);
        } else {
            this.lastWordSpeed = 0;
        }

        // 단어 완성 시점의 속도로 최고 타수 갱신
        if (this.lastWordSpeed > this.maxSpeed) {
            this.maxSpeed = this.lastWordSpeed;
        }

        // 1200타 제한 제거 (사용자 요청)

        if (this.startTime) {
            this.accumulatedTime += (Date.now() - this.startTime);
            this.startTime = null;
        }

        this.currentWordKeystrokes = 0;
        this.maxJamoCount = 0;

        this.currentWordIndex++;
        if (this.currentWordIndex >= this.words.length) {
            this.currentWordIndex = 0;
        }

        this.currentWord = this.words[this.currentWordIndex];
        this.nextWord = this.words[(this.currentWordIndex + 1) % this.words.length];
        this.currentInput = '';
        this.composingText = '';

        this.updateDisplay();
        this.updateStats();
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

    updateStats() {
        const now = Date.now();

        let wordElapsed = 0;
        if (this.startTime) {
            wordElapsed = (now - this.startTime) / 1000;
        }

        let wordSpeed = this.lastWordSpeed;
        if (this.startTime && wordElapsed > 0.05) {
            wordSpeed = Math.round((this.currentWordKeystrokes / wordElapsed) * 60);
        }

        let totalElapsedSeconds = this.accumulatedTime / 1000;
        if (this.startTime) {
            totalElapsedSeconds += wordElapsed;
        }

        const minutes = Math.floor(totalElapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(totalElapsedSeconds % 60).toString().padStart(2, '0');

        let avgSpeed = 0;
        if (totalElapsedSeconds > 0) {
            avgSpeed = Math.round((this.totalKeystrokes / totalElapsedSeconds) * 60);
        }

        document.getElementById('time-display').textContent = `${minutes}:${seconds}`;
        document.getElementById('speed-display').textContent = wordSpeed;

        const avgEl = document.getElementById('avg-speed');
        if (avgEl) avgEl.textContent = `평균: ${avgSpeed}`;

        document.getElementById('max-speed').textContent = `최고: ${this.maxSpeed}`;

        const accuracy = this.totalCharsTyped > 0
            ? Math.round((this.correctChars / this.totalCharsTyped) * 100)
            : 100;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('error-count').textContent = `오타: ${this.wrongCount}`;
    }
}

window.WordPractice = WordPractice;
