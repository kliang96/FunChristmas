/**
 * Handles webcam access for the application.
 */
export class CameraSource {
    videoInput: HTMLVideoElement;
    stream: MediaStream | null = null;

    constructor() {
        this.videoInput = document.createElement('video');
        this.videoInput.style.position = 'absolute';
        this.videoInput.style.top = '0';
        this.videoInput.style.left = '0';
        this.videoInput.style.display = 'none'; // Hidden, we process it in background
        this.videoInput.autoplay = true;
        this.videoInput.playsInline = true;
        // Mirror the local video
        this.videoInput.style.transform = 'scaleX(-1)';

        document.body.appendChild(this.videoInput);
    }

    async start(): Promise<HTMLVideoElement> {
        if (this.stream) return this.videoInput;

        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoInput.srcObject = this.stream;

            return new Promise((resolve) => {
                this.videoInput.onloadedmetadata = () => {
                    this.videoInput.play();
                    console.log(`Webcam started: ${this.videoInput.videoWidth}x${this.videoInput.videoHeight}`);
                    resolve(this.videoInput);
                };
            });
        } catch (e) {
            console.error('Error accessing webcam:', e);
            throw e;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

export const camera = new CameraSource();
