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
                targetMix: { value: 0 }
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
        const positions = new Float32Array(this.count * 3); // Current pos (not used much due to shader mix)
        const treePositions = new Float32Array(this.count * 3);
        const randomStarts = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        const speeds = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            // Random sphere cloud
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

            sizes[i] = Math.random() * 0.1 + 0.05;
            speeds[i] = Math.random() + 0.5;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('randomStart', new THREE.BufferAttribute(randomStarts, 3));
        this.geometry.setAttribute('treePosition', new THREE.BufferAttribute(treePositions, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    }

    update(time: number, targetState: 'TREE' | 'EXPANDED' | 'FOCUS') {
        this.material.uniforms.time.value = time;

        let targetMix = 0;
        if (targetState === 'TREE') targetMix = 1;
        else if (targetState === 'EXPANDED') targetMix = 0;
        else if (targetState === 'FOCUS') targetMix = 0;

        // Smooth transition
        const current = this.material.uniforms.targetMix.value;
        this.material.uniforms.targetMix.value += (targetMix - current) * 0.05;
    }
}
