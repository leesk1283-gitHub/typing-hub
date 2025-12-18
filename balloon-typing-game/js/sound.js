class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = true; // 초기 상태 음소거 (아이콘과 동기화)
        this.initialized = false;
        this.bgmTimer = null;
        this.bgmNoteIndex = 0;
    }

    init() {
        if (this.initialized) return;

        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            console.log('SoundManager Initialized. State:', this.ctx.state);

            // 브라우저 정책 대응: 사용자 상호작용 시 무조건 Resume 시도
            const resumeHandler = () => {
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume().then(() => {
                        console.log('AudioContext Resumed by interaction');
                    });
                }
            };

            window.addEventListener('click', resumeHandler);
            window.addEventListener('keydown', resumeHandler);
            window.addEventListener('touchstart', resumeHandler);

        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
        } else {
            if (this.initialized && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            // 게임 중이라면 BGM 재개 (현재 게임 상태를 알기 어려우므로 외부에서 호출하거나 여기서 단순 재생)
            // 여기서는 단순 호출 (중복 방지 되어있음)
            this.playBGM();
        }
        return this.isMuted;
    }

    // "팡!" 효과음 (풍선 터짐)
    playPopSound() {
        if (this.isMuted || !this.initialized) return;

        // 방어 코드: resume 시도 (비동기라 이번 소리는 씹힐 수도 있음)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

        // 볼륨 감소 (0.5 -> 0.2) - 피시 볼륨과 조화
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    // 간단한 BGM (아르페지오)
    playBGM() {
        if (this.isMuted || !this.initialized) return;
        if (this.bgmTimer) return; // 이미 재생 중

        const melody = [
            523.25, 659.25, 783.99, 1046.50, // C Major Arpeggio
            587.33, 739.99, 880.00, 1174.66, // D Minor
            392.00, 493.88, 587.33, 783.99   // G Major
        ];

        this.bgmNoteIndex = 0;

        const playNote = () => {
            if (this.isMuted) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => { });
            }

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const freq = melody[this.bgmNoteIndex % melody.length];
            // 한 옥타브 낮춰서 부드럽게
            osc.frequency.setValueAtTime(freq / 2, t);

            // BGM 볼륨 감소 (0.1 -> 0.03) - 은은하게
            gain.gain.setValueAtTime(0.03, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2); // 짧은 핑 소리 느낌

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.2);

            this.bgmNoteIndex++;
        };

        this.bgmTimer = setInterval(playNote, 250); // 4비트
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
window.SoundManager = SoundManager;
