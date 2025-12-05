import type { HandLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'NONE' | 'FIST' | 'OPEN' | 'PINCH';

export class GestureClassifier {
    history: GestureType[] = [];
    historySize: number = 6;
    lastGesture: GestureType = 'NONE';
    lastTime: number = 0;
    cooldown: number = 300; // ms

    // Emitter callback (simple function for now)
    onGesture: ((gesture: GestureType) => void) | null = null;

    classify(results: HandLandmarkerResult): GestureType {
        if (!results.landmarks || results.landmarks.length === 0) return 'NONE';

        const landmarks = results.landmarks[0]; // First hand

        let gesture: GestureType = 'NONE';

        // 1. Calculate features
        const isFist = this.checkFist(landmarks);
        const isOpen = this.checkOpen(landmarks);
        const isPinch = this.checkPinch(landmarks);

        // Priority: Pinch > Fist > Open (roughly)
        if (isPinch) gesture = 'PINCH';
        else if (isFist) gesture = 'FIST';
        else if (isOpen) gesture = 'OPEN';

        // Rolling window
        this.history.push(gesture);
        if (this.history.length > this.historySize) this.history.shift();

        // Majority Vote
        const vote = this.getMajorityVote();

        // Cooldown and Change Detection
        if (vote !== this.lastGesture && vote !== 'NONE') {
            const now = performance.now();
            if (now - this.lastTime > this.cooldown) {
                this.lastGesture = vote;
                this.lastTime = now;
                // Emit
                if (this.onGesture) this.onGesture(vote);
                console.log(`Gesture Detected: ${vote}`);
            }
        } else if (vote === 'NONE' && this.lastGesture !== 'NONE') {
            // Optional: debounced exit? For now just keep lastGesture unless explicit change or time out? 
            // Logic says: transition between modes. NONE might just mean "keep doing what you're doing" or "idle".
            // We'll treat NONE as non-action.
        }

        return this.lastGesture;
    }

    private getMajorityVote(): GestureType {
        const counts: Record<string, number> = { 'NONE': 0, 'FIST': 0, 'OPEN': 0, 'PINCH': 0 };
        for (const g of this.history) counts[g]++;

        // Find max
        let maxG: GestureType = 'NONE';
        let maxCount = -1;
        for (const key of Object.keys(counts)) {
            if (counts[key] > maxCount) {
                maxCount = counts[key];
                maxG = key as GestureType;
            }
        }
        return maxG;
    }

    // --- Geometrics --- //

    private checkFist(lm: NormalizedLandmark[]): boolean {
        // Fist: fingertips are close to palm base (wrist 0) or MCP joints. 
        // Simple heuristic: Fingertips (8, 12, 16, 20) are below PIP joints (6, 10, 14, 18) relative to hand direction?
        // Better: Average finger curl.

        // Wrist is 0.
        // Finger tips: 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
        // PIP: 2, 6, 10, 14, 18
        // MCP: 1, 5, 9, 13, 17

        // Check if fingertips are closer to wrist than their PIP joints
        let foldedCount = 0;
        const tips = [8, 12, 16, 20];
        const mcps = [5, 9, 13, 17];

        const wrist = lm[0];

        for (let i = 0; i < 4; i++) {
            const dTip = this.dist(lm[tips[i]], wrist);
            const dMcp = this.dist(lm[mcps[i]], wrist);
            // If tip is closer to wrist than mcp, it's curled "in"
            // Or check if dTip < dMcp * constant?
            if (dTip < dMcp * 1.2) foldedCount++;
        }

        // Thumb is tricky. Ignore for "Fist" usually, or check if it's tucked.
        // Let's say 4 fingers folded is a fist.
        return foldedCount >= 4;
    }

    private checkOpen(lm: NormalizedLandmark[]): boolean {
        // All fingers extended. Tip further from wrist than PIP/MCP.
        let extendedCount = 0;
        const tips = [8, 12, 16, 20];
        const mcps = [5, 9, 13, 17];
        const wrist = lm[0];

        for (let i = 0; i < 4; i++) {
            const dTip = this.dist(lm[tips[i]], wrist);
            const dMcp = this.dist(lm[mcps[i]], wrist);
            if (dTip > dMcp * 1.5) extendedCount++;
        }

        // Also check thumb (4) vs (2)
        const dThumbTip = this.dist(lm[4], wrist);
        const dThumbIP = this.dist(lm[2], wrist);
        if (dThumbTip > dThumbIP) extendedCount++;

        return extendedCount >= 5;
    }

    private checkPinch(lm: NormalizedLandmark[]): boolean {
        // Thumb tip (4) and Index tip (8) are close
        const d = this.dist(lm[4], lm[8]);
        // Distance should be relative to hand bounds or something? 
        // 0.08 suggests normalized coordinates (0-1).
        return d < 0.05;
    }

    private dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        // z is relevant for 3D but maybe just 2D distance is okay for this logic?
        // Prompt implies 2D vision tasks usually using x,y. 
        // HandLandmarker returns x,y,z (normalized). we can use 3D dist if we want, but 2D is often more robust for these simple checks on screen.
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export const classifier = new GestureClassifier();
