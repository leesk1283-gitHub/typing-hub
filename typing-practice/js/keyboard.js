// 키보드 렌더링 및 로직 모듈

class Keyboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.language = 'korean';
        this.highlightedKeys = new Set();
        this.currentKey = null;
        this.wrongKey = null;
        this.render();
    }

    setLanguage(lang) {
        this.language = lang;
        this.render();
    }

    render() {
        // 전체 키보드 레이아웃 (한글/영문)
        const koreanLayout = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Back'],
            ['Tab', 'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', '[', ']', '\\'],
            ['Caps', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ', ';', "'", 'Enter'],
            ['Shift', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', ',', '.', '/', 'Shift'],
            ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Ctrl']
        ];

        const englishLayout = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Back'],
            ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
            ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
            ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
            ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Ctrl']
        ];

        const layout = this.language === 'korean' ? koreanLayout : englishLayout;

        // 키 코드 매핑
        const keyCodeMap = {
            '`': 'Backquote', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4',
            '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9',
            '0': 'Digit0', '-': 'Minus', '=': 'Equal', 'Back': 'Backspace',
            'Tab': 'Tab', '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash',
            'Caps': 'CapsLock', ';': 'Semicolon', "'": 'Quote', 'Enter': 'Enter',
            ',': 'Comma', '.': 'Period', '/': 'Slash',
            'Ctrl': 'Control', 'Win': 'Meta', 'Alt': 'Alt', 'Space': 'Space',
            // 한글 자모
            'ㅂ': 'KeyQ', 'ㅈ': 'KeyW', 'ㄷ': 'KeyE', 'ㄱ': 'KeyR', 'ㅅ': 'KeyT',
            'ㅛ': 'KeyY', 'ㅕ': 'KeyU', 'ㅑ': 'KeyI', 'ㅐ': 'KeyO', 'ㅔ': 'KeyP',
            'ㅁ': 'KeyA', 'ㄴ': 'KeyS', 'ㅇ': 'KeyD', 'ㄹ': 'KeyF', 'ㅎ': 'KeyG',
            'ㅗ': 'KeyH', 'ㅓ': 'KeyJ', 'ㅏ': 'KeyK', 'ㅣ': 'KeyL',
            'ㅋ': 'KeyZ', 'ㅌ': 'KeyX', 'ㅊ': 'KeyC', 'ㅍ': 'KeyV',
            'ㅠ': 'KeyB', 'ㅜ': 'KeyN', 'ㅡ': 'KeyM',
            // 영문
            'Q': 'KeyQ', 'W': 'KeyW', 'E': 'KeyE', 'R': 'KeyR', 'T': 'KeyT',
            'Y': 'KeyY', 'U': 'KeyU', 'I': 'KeyI', 'O': 'KeyO', 'P': 'KeyP',
            'A': 'KeyA', 'S': 'KeyS', 'D': 'KeyD', 'F': 'KeyF', 'G': 'KeyG',
            'H': 'KeyH', 'J': 'KeyJ', 'K': 'KeyK', 'L': 'KeyL',
            'Z': 'KeyZ', 'X': 'KeyX', 'C': 'KeyC', 'V': 'KeyV',
            'B': 'KeyB', 'N': 'KeyN', 'M': 'KeyM'
        };

        let html = '<div class="keyboard">';

        layout.forEach((row, rowIndex) => {
            html += `<div class="keyboard-row row-${rowIndex}">`;
            row.forEach((key) => {
                const keyCode = keyCodeMap[key] || key;
                const isHighlighted = this.highlightedKeys.has(keyCode);
                const isCurrent = this.currentKey === keyCode;
                const isWrong = this.wrongKey === keyCode;

                let classes = 'key';

                // 특수 키 크기 클래스
                if (key === 'Back') classes += ' key-backspace';
                else if (key === 'Tab') classes += ' key-tab';
                else if (key === 'Caps') classes += ' key-caps';
                else if (key === 'Enter') classes += ' key-enter';
                else if (key === 'Shift') classes += ' key-shift';
                else if (key === 'Space') classes += ' key-space';
                else if (key === 'Ctrl' || key === 'Alt' || key === 'Win') classes += ' key-modifier';

                if (isHighlighted) classes += ' highlighted';
                if (isCurrent) classes += ' current';
                if (isWrong) classes += ' wrong';

                // 손가락 색상 클래스 추가
                const finger = window.TypingData.FINGER_MAP[keyCode];
                if (finger !== undefined) {
                    classes += ` finger-${finger}`;
                }

                html += `<div class="${classes}" data-key="${keyCode}">${key}</div>`;
            });
            html += '</div>';
        });

        html += '</div>';
        this.container.innerHTML = html;
    }

    setHighlightedKeys(keys) {
        this.highlightedKeys = new Set(keys);
        this.updateKeyStyles();
    }

    setCurrentKey(keyCode, needsShift = false) {
        this.currentKey = keyCode;
        this.needsShift = needsShift;
        this.updateKeyStyles();
    }

    isDoubleConsonant(char) {
        return ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅒ', 'ㅖ'].includes(char);
    }

    setWrongKey(keyCode) {
        this.wrongKey = keyCode;
        this.updateKeyStyles();
    }

    clearWrongKey() {
        this.wrongKey = null;
        this.updateKeyStyles();
    }

    updateKeyStyles() {
        const keys = this.container.querySelectorAll('.key');
        keys.forEach(keyEl => {
            const keyCode = keyEl.dataset.key;
            keyEl.classList.remove('highlighted', 'current', 'wrong');

            if (this.highlightedKeys.has(keyCode)) {
                keyEl.classList.add('highlighted');
            }
            if (this.currentKey === keyCode) {
                keyEl.classList.add('current');
            }
            if (this.needsShift && keyCode === 'Shift') {
                keyEl.classList.add('current');
            }
            if (this.wrongKey === keyCode) {
                keyEl.classList.add('wrong');
            }
        });
    }

    getKeyCodeForChar(char) {
        // [수정] 마침표 및 구두점 처리 추가
        const punctuationMap = {
            ',': 'Comma',
            '.': 'Period',
            '/': 'Slash',
            ';': 'Semicolon',
            "'": 'Quote',
            '[': 'BracketLeft',
            ']': 'BracketRight',
            '\\': 'Backslash',
            '-': 'Minus',
            '=': 'Equal',
            '`': 'Backquote'
        };

        if (punctuationMap[char]) {
            return punctuationMap[char];
        }

        const jamoToKeyCode = {
            'ㄱ': 'KeyR', 'ㄲ': 'KeyR', 'ㄴ': 'KeyS', 'ㄷ': 'KeyE', 'ㄸ': 'KeyE',
            'ㄹ': 'KeyF', 'ㅁ': 'KeyA', 'ㅂ': 'KeyQ', 'ㅃ': 'KeyQ', 'ㅅ': 'KeyT',
            'ㅆ': 'KeyT', 'ㅇ': 'KeyD', 'ㅈ': 'KeyW', 'ㅉ': 'KeyW', 'ㅊ': 'KeyC',
            'ㅋ': 'KeyZ', 'ㅌ': 'KeyX', 'ㅍ': 'KeyV', 'ㅎ': 'KeyG',
            'ㅏ': 'KeyK', 'ㅐ': 'KeyO', 'ㅑ': 'KeyI', 'ㅒ': 'KeyO',
            'ㅓ': 'KeyJ', 'ㅔ': 'KeyP', 'ㅕ': 'KeyU', 'ㅖ': 'KeyP',
            'ㅗ': 'KeyH', 'ㅘ': 'KeyH', 'ㅙ': 'KeyH', 'ㅚ': 'KeyH',
            'ㅛ': 'KeyY', 'ㅜ': 'KeyN', 'ㅝ': 'KeyN', 'ㅞ': 'KeyN',
            'ㅟ': 'KeyN', 'ㅠ': 'KeyB', 'ㅡ': 'KeyM', 'ㅢ': 'KeyM', 'ㅣ': 'KeyL'
        };

        if (jamoToKeyCode[char]) {
            return jamoToKeyCode[char];
        }

        const code = char.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const offset = code - 0xAC00;
            const jong = offset % 28;
            const jung = Math.floor(offset / 28) % 21;
            const cho = Math.floor(offset / 588);

            const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
            const jungsungList = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
            const jongsungList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

            if (jong > 0) {
                return this.getKeyCodeForChar(jongsungList[jong]);
            }
            return this.getKeyCodeForChar(jungsungList[jung]);
        }

        const upperChar = char.toUpperCase();
        if (upperChar >= 'A' && upperChar <= 'Z') {
            return 'Key' + upperChar;
        }

        if (char === ' ') return 'Space';

        return null;
    }

    getChosung(char) {
        const code = char.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const chosungIndex = Math.floor((code - 0xAC00) / 588);
            const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
            return chosungList[chosungIndex];
        }
        return null;
    }

    getFingerForKey(keyCode) {
        return window.TypingData.FINGER_MAP[keyCode];
    }
}

window.Keyboard = Keyboard;
