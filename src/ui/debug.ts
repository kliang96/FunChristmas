
import { type HandLandmarkerResult } from '@mediapipe/tasks-vision';

export class DebugView {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        this.container.style.width = '320px'; // Small preview size
        // Height is determined by aspect ratio in update()
        this.container.style.zIndex = '100';
        this.container.style.border = '2px solid rgba(255, 215, 0, 0.5)'; // Gold-ish border
        this.container.style.borderRadius = '8px';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block'; // Removes bottom spacing since canvas is inline
        this.container.appendChild(this.canvas);

        document.body.appendChild(this.container);

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get debug canvas context');
        this.ctx = context;
    }

    update(video: HTMLVideoElement, results: HandLandmarkerResult | null) {
        // Match canvas resolution to video resolution (or a scaled version)
        if (this.canvas.width !== video.videoWidth || this.canvas.height !== video.videoHeight) {
            this.canvas.width = video.videoWidth;
            this.canvas.height = video.videoHeight;

            // Adjust container height to match aspect ratio
            const aspectRatio = video.videoHeight / video.videoWidth;
            const containerWidth = 320;
            this.container.style.height = `${containerWidth * aspectRatio}px`;
        }

        // 1. Draw Video
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Mirroring (video is usually mirrored in the main view logic, but here we read raw video)
        // If the main video is CSS transformed, we might need to manually flip here to match user expectation.
        // The user usually expects a mirror view for self-view.
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);

        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // 2. Draw Landmarks
        if (results && results.landmarks) {
            for (const landmarks of results.landmarks) {
                this.drawSkeleton(landmarks);
            }
        }
    }

    drawSkeleton(landmarks: any[]) {
        // Actually, let's just stick the drawing in a mirrored context so we don't do math manually.
        this.ctx.save();
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);

        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = 'white';

        // Redrawing paths with the correct transform
        // Thumb
        this.drawPath(landmarks, [0, 1, 2, 3, 4]);
        // Index
        this.drawPath(landmarks, [0, 5, 6, 7, 8]);
        // Middle
        this.drawPath(landmarks, [0, 9, 10, 11, 12]);
        // Ring
        this.drawPath(landmarks, [0, 13, 14, 15, 16]);
        // Pinky
        this.drawPath(landmarks, [0, 17, 18, 19, 20]);
        // Knuckles
        this.drawPath(landmarks, [5, 9, 13, 17]);

        // Points
        this.ctx.fillStyle = '#FFD700'; // Gold joints
        for (const point of landmarks) {
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawPath(landmarks: any[], indices: number[]) {
        if (indices.length < 2) return;

        this.ctx.beginPath();
        const first = landmarks[indices[0]];
        this.ctx.moveTo(first.x * this.canvas.width, first.y * this.canvas.height);

        for (let i = 1; i < indices.length; i++) {
            const point = landmarks[indices[i]];
            this.ctx.lineTo(point.x * this.canvas.width, point.y * this.canvas.height);
        }
        this.ctx.stroke();
    }
}

export const debugView = new DebugView();
