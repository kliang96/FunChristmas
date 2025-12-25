import * as THREE from 'three';
import particleVert from './shaders/particle.vert.glsl?raw';
import particleFrag from './shaders/particle.frag.glsl?raw';

export class ParticleSystem {
    mesh: THREE.Points;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    count: number;

    constructor(count: number = 10000) {
        this.count = count;
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                targetMix: { value: 0 },
                uLoading: { value: 0 },
                uEntranceProgress: { value: 1 },
                uBurst: { value: 0 }
            },
            vertexShader: particleVert,
            fragmentShader: particleFrag,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.initParticles();
        this.mesh = new THREE.Points(this.geometry, this.material);
    }

    initParticles() {
        // Attributes
        const positions = new Float32Array(this.count * 3);
        const treePositions = new Float32Array(this.count * 3);
        const randomStarts = new Float32Array(this.count * 3);
        const entranceStarts = new Float32Array(this.count * 3); // NEW: Entrance start positions
        const entranceDelays = new Float32Array(this.count); // NEW: Per-particle entrance delay
        const sizes = new Float32Array(this.count);
        const speeds = new Float32Array(this.count);
        const ids = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            ids[i] = i;

            // Random sphere cloud (for EXPANDED mode)
            const r = 5 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            randomStarts[i * 3] = x;
            randomStarts[i * 3 + 1] = y;
            randomStarts[i * 3 + 2] = z;

            // Tree Shape (Full Cone Volume)
            const h = Math.random() * 4;
            const maxR = 1.5 * (1 - h / 4.5);

            const rInCircle = maxR * Math.sqrt(Math.random());
            const angle = Math.random() * 2 * Math.PI;

            treePositions[i * 3] = rInCircle * Math.cos(angle);
            treePositions[i * 3 + 1] = h - 2;
            treePositions[i * 3 + 2] = rInCircle * Math.sin(angle);

            // Entrance Start Positions - Random sphere from ALL angles including toward camera
            const entranceDistance = 10 + Math.random() * 15; // 10-25 units away
            const entranceTheta = Math.random() * 2 * Math.PI;
            const entrancePhi = Math.acos(2 * Math.random() - 1); // Full sphere

            entranceStarts[i * 3] = entranceDistance * Math.sin(entrancePhi) * Math.cos(entranceTheta);
            entranceStarts[i * 3 + 1] = entranceDistance * Math.sin(entrancePhi) * Math.sin(entranceTheta);
            entranceStarts[i * 3 + 2] = entranceDistance * Math.cos(entrancePhi);

            // Entrance delay - randomized so particles start moving at different times
            // but all finish at the same time (delay inversely proportional to distance)
            entranceDelays[i] = Math.random() * 0.4; // 0-40% delay

            sizes[i] = Math.random() * 0.1 + 0.05;
            speeds[i] = Math.random() + 0.5;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('randomStart', new THREE.BufferAttribute(randomStarts, 3));
        this.geometry.setAttribute('treePosition', new THREE.BufferAttribute(treePositions, 3));
        this.geometry.setAttribute('entranceStart', new THREE.BufferAttribute(entranceStarts, 3));
        this.geometry.setAttribute('entranceDelay', new THREE.BufferAttribute(entranceDelays, 1));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        this.geometry.setAttribute('pId', new THREE.BufferAttribute(ids, 1));
    }

    entranceTime: number = -1;
    lastMode: string = 'LOADING';
    burstIntensity: number = 0;

    triggerBurst() {
        this.burstIntensity = 1.0;
    }

    update(time: number, targetState: 'TREE' | 'EXPANDED' | 'FOCUS' | 'LOADING') {
        this.material.uniforms.time.value = time;

        let targetMix = 0;
        if (targetState === 'TREE') targetMix = 1;
        else if (targetState === 'EXPANDED') targetMix = 0;
        else if (targetState === 'FOCUS') targetMix = 0;
        else if (targetState === 'LOADING') targetMix = 0;

        // Smooth transition
        const current = this.material.uniforms.targetMix.value;
        this.material.uniforms.targetMix.value += (targetMix - current) * 0.05;

        // Pass loading state to shader
        if (!this.material.uniforms.uLoading) {
            this.material.uniforms.uLoading = { value: 0 };
        }
        this.material.uniforms.uLoading.value = (targetState === 'LOADING') ? 1.0 : 0.0;

        // Entrance Logic
        if (this.lastMode === 'LOADING' && targetState === 'TREE') {
            this.entranceTime = time;
        }
        this.lastMode = targetState;

        let entranceProgress = 1.0;
        if (this.entranceTime > 0) {
            const duration = 3.5; // Slower, more dramatic entrance
            const elapsed = time - this.entranceTime;
            if (elapsed < duration) {
                // simple linear or smoothstep
                const t = elapsed / duration;
                entranceProgress = t * t * (3 - 2 * t);
            } else {
                this.entranceTime = -1;
            }
        }

        if (!this.material.uniforms.uEntranceProgress) {
            this.material.uniforms.uEntranceProgress = { value: 1.0 };
        }
        this.material.uniforms.uEntranceProgress.value = entranceProgress;

        // Burst Animation
        if (this.burstIntensity > 0) {
            this.burstIntensity *= 0.95; // Decay
            if (this.burstIntensity < 0.01) this.burstIntensity = 0;
        }
        this.material.uniforms.uBurst.value = this.burstIntensity;
    }
}
