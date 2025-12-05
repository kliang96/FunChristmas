export class AudioManager {
    audio: HTMLAudioElement;
    isPlaying: boolean = false;
    isMuted: boolean = false;

    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 0.5;
        // Placeholder or asset
        this.audio.src = 'https://assets.mixkit.co/music/preview/mixkit-christmas-atmosphere-2966.mp3'; // Public placeholder
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        return this.isMuted;
    }

    async play() {
        if (this.isPlaying) return;
        try {
            await this.audio.play();
            this.isPlaying = true;
        } catch (e) {
            console.warn("Audio play failed (user interaction needed)", e);
        }
    }

    stop() {
        this.audio.pause();
        this.isPlaying = false;
    }
}

export const audioManager = new AudioManager();
