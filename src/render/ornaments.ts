import * as THREE from 'three';

export class OrnamentsSystem {
    mesh: THREE.InstancedMesh;
    count: number = 40; // More ornaments
    dummy: THREE.Object3D;

    entranceTime: number = -1;
    entranceStartPositions: Float32Array;
    entranceDelays: Float32Array; // NEW: Per-ornament delay
    lastMode: string = 'LOADING'; // Default

    treePositions: Float32Array;
    expandedPositions: Float32Array;

    constructor() {
        const geometry = new THREE.SphereGeometry(0.12, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.1,
            envMapIntensity: 1.5
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
        this.dummy = new THREE.Object3D();

        this.treePositions = new Float32Array(this.count * 3);
        this.expandedPositions = new Float32Array(this.count * 3);
        this.entranceStartPositions = new Float32Array(this.count * 3);
        this.entranceDelays = new Float32Array(this.count);

        this.init();
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            // Tree Positions (Cone Surface)
            const h = Math.random() * 3.5;
            const maxR = 1.4 * (1 - h / 4.0);
            const angle = Math.random() * Math.PI * 2;

            this.treePositions[i * 3] = maxR * Math.cos(angle);
            this.treePositions[i * 3 + 1] = h - 2;
            this.treePositions[i * 3 + 2] = maxR * Math.sin(angle);

            // Expanded Positions (Floating around)
            const r = 3.0 + Math.random() * 3.0;
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * 6;

            this.expandedPositions[i * 3] = r * Math.cos(theta);
            this.expandedPositions[i * 3 + 1] = y;
            this.expandedPositions[i * 3 + 2] = r * Math.sin(theta);

            // Entrance Start Positions - Random sphere from ALL angles including toward camera
            const er = 10 + Math.random() * 15; // 10-25 units away
            const etheta = Math.random() * 2 * Math.PI;
            const ephi = Math.acos(2 * Math.random() - 1); // Full sphere distribution

            this.entranceStartPositions[i * 3] = er * Math.sin(ephi) * Math.cos(etheta);
            this.entranceStartPositions[i * 3 + 1] = er * Math.sin(ephi) * Math.sin(etheta);
            this.entranceStartPositions[i * 3 + 2] = er * Math.cos(ephi);

            // Per-ornament entrance delay for staggered start
            this.entranceDelays[i] = Math.random() * 0.4; // 0-40% delay

            // Random Color (Metallic/Jewel tones)
            const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.6);
            this.mesh.setColorAt(i, color);

            // Init
            this.dummy.position.set(this.treePositions[i * 3], this.treePositions[i * 3 + 1], this.treePositions[i * 3 + 2]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceColor!.needsUpdate = true;
    }

    update(time: number, mode: string) {
        const isTree = (mode === 'TREE');
        let scale = 1.0;

        // Hide in loading
        if (mode === 'LOADING') scale = 0.0;

        // Detect Entrance
        if (this.lastMode === 'LOADING' && mode === 'TREE') {
            this.entranceTime = time;
        }
        this.lastMode = mode;

        // Entrance Progress
        let entranceProgress = 1.0;
        if (this.entranceTime > 0) {
            const duration = 3.5; // Slower, more dramatic entrance
            const elapsed = time - this.entranceTime;
            if (elapsed < duration) {
                const t = elapsed / duration;
                entranceProgress = t * t * (3 - 2 * t);
            } else {
                this.entranceTime = -1;
            }
        }

        for (let i = 0; i < this.count; i++) {
            const ix = i * 3;

            // Get target
            const tx = isTree ? this.treePositions[ix] : this.expandedPositions[ix];
            let ty = isTree ? this.treePositions[ix + 1] : this.expandedPositions[ix + 1];
            const tz = isTree ? this.treePositions[ix + 2] : this.expandedPositions[ix + 2];

            // Float animation if expanded
            if (!isTree) {
                ty += Math.sin(time + i) * 0.05;
            }

            // Current pos (Lerp)
            this.mesh.getMatrixAt(i, this.dummy.matrix);
            const currentPos = new THREE.Vector3();
            currentPos.setFromMatrixPosition(this.dummy.matrix);

            let targetPos = new THREE.Vector3(tx, ty, tz);
            let currentScale = scale;

            // Apply Entrance Override
            if (mode === 'TREE' && entranceProgress < 1.0) {
                const sx = this.entranceStartPositions[ix];
                const sy = this.entranceStartPositions[ix + 1];
                const sz = this.entranceStartPositions[ix + 2];
                const startPos = new THREE.Vector3(sx, sy, sz);

                // Calculate per-ornament progress with delay
                const delay = this.entranceDelays[i];
                let particleProgress = (entranceProgress - delay) / (1.0 - delay);
                particleProgress = Math.max(0, Math.min(1, particleProgress));

                // Ease-in (fast to slow): cubic easing
                const t = particleProgress * particleProgress * particleProgress;

                // Fly in
                targetPos.lerpVectors(startPos, targetPos, t);

                // Scale in as they arrive
                currentScale *= t;

                // Direct set
                currentPos.copy(targetPos);
            } else {
                // Normal lazy lerp
                currentPos.lerp(targetPos, 0.05);
            }

            this.dummy.position.copy(currentPos);
            this.dummy.scale.setScalar(currentScale);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}
