import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';

export class HandTracker {
    handLandmarker: HandLandmarker | undefined;
    ready: boolean = false;
    lastVideoTime: number = -1;

    constructor() {
        this.init();
    }

    async init() {
        console.log("Loading MediaPipe Hands...");
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });

            this.ready = true;
            console.log("MediaPipe Hands Ready");
        } catch (e) {
            console.error("Failed to load MediaPipe Hands", e);
        }
    }

    detect(video: HTMLVideoElement): HandLandmarkerResult | null {
        if (!this.ready || !this.handLandmarker) return null;

        if (video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = video.currentTime;
            return this.handLandmarker.detectForVideo(video, performance.now());
        }
        return null; // No new frame or not ready
    }
}

export const handTracker = new HandTracker();
