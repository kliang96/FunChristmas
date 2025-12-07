import * as THREE from 'three';

export class PresentsSystem {
    mesh: THREE.InstancedMesh;
    ribbonMesh: THREE.InstancedMesh;
    count: number = 50;
    dummy: THREE.Object3D;

    positions: Float32Array;
    speeds: Float32Array;
    rotations: Float32Array; // Store initial rotations

    constructor() {
        // Box Mesh
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.6,
            envMapIntensity: 1.0
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // Ribbon Mesh (Cross shape?)
        // Let's make a simple Torus or just a thinner Box for now as a "Strip"
        const ribbonGeo = new THREE.BoxGeometry(0.52, 0.52, 0.1); // Slightly larger
        const ribbonMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700, // Gold
            metalness: 1.0,
            roughness: 0.1
        });

        this.ribbonMesh = new THREE.InstancedMesh(ribbonGeo, ribbonMat, this.count);
        this.ribbonMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        this.dummy = new THREE.Object3D();

        this.positions = new Float32Array(this.count * 3);
        this.speeds = new Float32Array(this.count);
        this.rotations = new Float32Array(this.count * 3);

        this.init();
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            // Random orbit positions
            const r = 3.0 + Math.random() * 3.0;
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * 6;

            this.positions[i * 3] = r * Math.cos(theta);
            this.positions[i * 3 + 1] = y;
            this.positions[i * 3 + 2] = r * Math.sin(theta);

            this.speeds[i] = Math.random() * 0.5 + 0.1;

            // Random initial rotation
            this.rotations[i * 3] = Math.random() * Math.PI;
            this.rotations[i * 3 + 1] = Math.random() * Math.PI;
            this.rotations[i * 3 + 2] = Math.random() * Math.PI;

            // Set Color
            const hue = Math.random() > 0.5 ? 0.0 : 0.35;
            const color = new THREE.Color().setHSL(hue + (Math.random() * 0.1 - 0.05), 0.9, 0.5);
            this.mesh.setColorAt(i, color);
            // Ribbon color - Gold or Silver
            const ribbonColor = Math.random() > 0.5 ? 0xFFD700 : 0xC0C0C0;
            this.ribbonMesh.setColorAt(i, new THREE.Color(ribbonColor));

            // Init transforms
            this.updateInstance(i, 0, 1);
        }
        this.mesh.instanceColor!.needsUpdate = true;
        this.ribbonMesh.instanceColor!.needsUpdate = true;
    }

    updateInstance(i: number, time: number, scale: number) {
        const ix = i * 3;
        const x = this.positions[ix];
        let y = this.positions[ix + 1];
        const z = this.positions[ix + 2];

        // Float
        y += Math.sin(time * this.speeds[i] + i) * 0.005;
        this.positions[ix + 1] = y;

        this.dummy.position.set(x, y, z);
        this.dummy.rotation.set(
            this.rotations[ix] + time * this.speeds[i],
            this.rotations[ix + 1] + time * this.speeds[i] * 0.5,
            this.rotations[ix + 2]
        );
        this.dummy.scale.set(scale, scale, scale);

        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);

        // Ribbon: Same pos/rot, maybe slightly scaled up?
        // Actually geometry is already larger
        this.ribbonMesh.setMatrixAt(i, this.dummy.matrix);

        // Maybe add a second ribbon crossed? Too expensive? 
        // For now one band is better than nothing.
    }

    update(time: number, mode: string) {




        this.animate(time, mode);

        this.mesh.instanceMatrix.needsUpdate = true;
        this.ribbonMesh.instanceMatrix.needsUpdate = true;
    }

    // Internal tracker for smooth float
    currentSysScale: number = 0;

    animate(time: number, mode: string) {
        const visible = (mode === 'EXPANDED' || mode === 'FOCUS');
        const target = visible ? 1.0 : 0.0;
        this.currentSysScale += (target - this.currentSysScale) * 0.05;

        if (this.currentSysScale < 0.01) {
            this.mesh.visible = false;
            this.ribbonMesh.visible = false;
            if (!visible) return; // Optimization
        } else {
            this.mesh.visible = true;
            this.ribbonMesh.visible = true;
        }

        for (let i = 0; i < this.count; i++) {
            this.updateInstance(i, time, this.currentSysScale);
        }
    }
}
