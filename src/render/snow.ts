import * as THREE from 'three';
import snowVert from './shaders/snow.vert.glsl?raw';
import snowFrag from './shaders/snow.frag.glsl?raw';

export class SnowSystem {
    mesh: THREE.Points;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    count: number;

    constructor(count: number = 500) {
        this.count = count;
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: snowVert,
            fragmentShader: snowFrag,
            transparent: true,
            depthWrite: false,
            depthTest: true, // Enable depth testing so snow renders behind photos
            blending: THREE.NormalBlending // Use normal blending for snow
        });

        this.initSnow();
        this.mesh = new THREE.Points(this.geometry, this.material);

        // Set render order to ensure snow renders before (behind) other objects
        this.mesh.renderOrder = -1;
    }

    initSnow() {
        const positions = new Float32Array(this.count * 3);
        const startPositions = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        const speeds = new Float32Array(this.count);
        const phases = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            // Distribute snow in a wide area around the scene
            const x = (Math.random() - 0.5) * 20; // -10 to 10
            const y = Math.random() * 10 + 2; // 2 to 12 (start high)
            const z = (Math.random() - 0.5) * 20; // -10 to 10

            startPositions[i * 3] = x;
            startPositions[i * 3 + 1] = y;
            startPositions[i * 3 + 2] = z;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Vary snowflake sizes
            sizes[i] = Math.random() * 0.08 + 0.04; // 0.04 to 0.12

            // Vary fall speeds (slower = more gentle)
            speeds[i] = Math.random() * 0.3 + 0.2; // 0.2 to 0.5 (gentle fall)

            // Random phase for side-to-side motion
            phases[i] = Math.random() * Math.PI * 2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('startPosition', new THREE.BufferAttribute(startPositions, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        this.geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    }

    update(time: number) {
        this.material.uniforms.time.value = time;
    }
}
