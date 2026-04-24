/**
 * Voice Service for BĀBU
 * Handles text-to-speech with Hindi/English support.
 * Cross-platform: Web (browser) + Android (Capacitor WebView)
 */

/**
 * Standalone microphone permission helper.
 *
 * On Android (Capacitor native):
 *   - Attempts getUserMedia({ audio: true }) to trigger RECORD_AUDIO dialog.
 *   - If getUserMedia succeeds → granted, release stream, return true.
 *   - If getUserMedia throws → treat as WebView false-negative, return true.
 *     Capacitor WebView often reports NotAllowedError even when Android
 *     has already granted RECORD_AUDIO at the OS level.
 *
 * On Web / non-Capacitor: no-op → returns true.
 *
 * This function NEVER throws. It always returns true.
 * The only path that returns false is permanently removed —
 * permission denial is handled by the OS, not our UI.
 */
async function requestMicPermission(): Promise<boolean> {
    try {
        const { Capacitor } = await import('@capacitor/core');

        if (!Capacitor.isNativePlatform()) {
            console.log('🎤 [MicPerm] Web platform — skipping native mic permission');
            return true;
        }

        console.log('🎤 [MicPerm] Android native — requesting RECORD_AUDIO...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ [MicPerm] getUserMedia succeeded — mic permission granted');
            return true;
        } catch (mediaErr: any) {
            // Capacitor WebView false-negative: throws NotAllowedError
            // even when Android OS has already granted RECORD_AUDIO.
            // Do NOT return false — that would show the denied banner.
            console.warn(
                '⚠️ [MicPerm] getUserMedia error:', mediaErr?.name,
                '— treating as WebView false-negative, proceeding'
            );
            return true;
        }

    } catch (err: any) {
        console.warn('⚠️ [MicPerm] Unexpected error, proceeding:', err?.name ?? err);
        return true;
    }
}

class VoiceService {
    private synth: SpeechSynthesis | null = null;
    private voiceActivated: boolean = false;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private hindiVoice: SpeechSynthesisVoice | null = null;
    private englishVoice: SpeechSynthesisVoice | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            this.loadVoices();

            // Load voices when they change (Chrome requires this)
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    private loadVoices() {
        if (!this.synth) return;

        const voices = this.synth.getVoices();

        // Find Hindi voice (prefer Google Hindi)
        this.hindiVoice = voices.find(v =>
            v.lang.startsWith('hi') || v.name.includes('Hindi')
        ) || null;

        // Find English voice (prefer Google US English / Indian English)
        this.englishVoice = voices.find(v =>
            v.lang === 'en-US' || v.lang === 'en-IN'
        ) || voices[0] || null;

        console.log('🔊 Voices loaded:', {
            hindi: this.hindiVoice?.name,
            english: this.englishVoice?.name,
            total: voices.length,
        });
    }

    /**
     * Delegates to the standalone requestMicPermission().
     * Always returns true — never blocks voice activation.
     */
    private async requestMicrophonePermission(): Promise<boolean> {
        return requestMicPermission();
    }

    /**
     * Activate voice — MUST be called inside a user gesture handler (button click).
     *
     * On Web:    Silently unlocks the browser's SpeechSynthesis autoplay policy.
     * On Android: Attempts RECORD_AUDIO permission request, then unlocks
     *             SpeechSynthesis. Always succeeds — never shows denied banner.
     *
     * Returns true on success.
     */
    public async activate(): Promise<boolean> {
        if (!this.synth) {
            console.error('❌ [Activate] Speech synthesis not supported');
            return false;
        }

        try {
            console.log('🎤 [Activate] Step 1 — Requesting microphone permission...');
            await this.requestMicrophonePermission();
            console.log('🎤 [Activate] Step 1 complete — proceeding');

            console.log('🎤 [Activate] Step 2 — Unlocking SpeechSynthesis...');
            const testUtterance = new SpeechSynthesisUtterance('');
            testUtterance.volume = 0;
            this.synth.speak(testUtterance);

            this.voiceActivated = true;
            sessionStorage.setItem('babu_voice_activated', 'true');

            console.log('✅ [Activate] BĀBU voice activated successfully');
            return true;

        } catch (error: any) {
            console.error('❌ [Activate] Unexpected error:', error?.message ?? error);
            // Not a permission denial — still activate voice
            this.voiceActivated = true;
            sessionStorage.setItem('babu_voice_activated', 'true');
            return true;
        }
    }

    /**
     * Returns true if voice has been activated this session.
     */
    public isActivated(): boolean {
        return this.voiceActivated || sessionStorage.getItem('babu_voice_activated') === 'true';
    }

    /**
     * Speak text with automatic Hindi / English language detection.
     */
    public speak(text: string, force: boolean = false): void {
        if (!this.synth) {
            console.warn('⚠️ Speech synthesis not available');
            return;
        }

        if (!this.voiceActivated && !force) {
            console.warn('⚠️ Voice not activated — call activate() first');
            return;
        }

        // Stop any ongoing speech before starting new
        this.stop();

        const cleanText = this.cleanTextForSpeech(text);
        if (!cleanText.trim()) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Auto-detect language by checking for Devanagari Unicode range
        const isHindi = /[\u0900-\u097F]/.test(text);

        if (isHindi && this.hindiVoice) {
            utterance.voice = this.hindiVoice;
            utterance.lang = 'hi-IN';
            utterance.rate = 0.9;
        } else if (this.englishVoice) {
            utterance.voice = this.englishVoice;
            utterance.lang = 'en-IN';
            utterance.rate = 1.0;
        }

        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            console.log('🔊 Speaking:', cleanText.substring(0, 50));
        };

        utterance.onend = () => {
            this.currentUtterance = null;
        };

        utterance.onerror = (event) => {
            console.error('❌ Speech error:', event.error);
            if (this.currentUtterance === utterance) {
                this.currentUtterance = null;
            }
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    /**
     * Stop any currently playing speech.
     */
    public stop(): void {
        if (this.synth && this.synth.speaking) {
            this.synth.cancel();
            this.currentUtterance = null;
        }
    }

    /**
     * Returns true if speech synthesis is currently active.
     */
    public isSpeaking(): boolean {
        return this.synth?.speaking || false;
    }

    /**
     * Strips emojis, markdown, and extra whitespace from text before speaking.
     */
    private cleanTextForSpeech(text: string): string {
        return text
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/[\u{2600}-\u{26FF}]/gu, '')
            .replace(/[\u{2700}-\u{27BF}]/gu, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#+\s/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Deactivate voice and clear session state.
     */
    public deactivate(): void {
        this.stop();
        this.voiceActivated = false;
        sessionStorage.removeItem('babu_voice_activated');
    }
}

// Singleton — shared across the entire app
export const voiceService = new VoiceService();
export { requestMicPermission };
