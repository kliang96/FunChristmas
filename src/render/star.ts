import * as THREE from 'three';

export class StarSystem {
    mesh: THREE.Mesh;

    constructor() {
        // 5-Point Star Shape
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 0.4;
        const innerRadius = 0.2; // Spikiness

        // Start from top
        for (let i = 0; i < points * 2; i++) {
            // Angle offset to point upwards
            const angle = (i * Math.PI) / points - (Math.PI / 2) + Math.PI; // Flip 180 degrees to point up
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.02,
            bevelSegments: 3
        });

        // Center the geometry
        geometry.center();

        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xFFAA00,
            emissiveIntensity: 2.0,
            roughness: 0.1,
            metalness: 1.0,
            envMapIntensity: 2.0
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 2.3, 0);

        // Add a point light for glow
        const light = new THREE.PointLight(0xFFAA00, 2, 8);
        this.mesh.add(light);
    }

    update(time: number, mode: string) {
        // Rotate
        this.mesh.rotation.y = time; // Spin
        this.mesh.rotation.z = Math.sin(time * 2) * 0.1; // Wobble

        // Visibility / Scale logic
        let targetScale = 1.0;
        if (mode === 'EXPANDED' || mode === 'FOCUS') {
            targetScale = 0.0;
        }

        const s = THREE.MathUtils.lerp(this.mesh.scale.x, targetScale, 0.1);
        this.mesh.scale.set(s, s, s);
    }
}
