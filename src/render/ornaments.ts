import * as THREE from 'three';

export class OrnamentsSystem {
    mesh: THREE.InstancedMesh;
    count: number = 40; // More ornaments
    dummy: THREE.Object3D;

    treePositions: Float32Array;
    expandedPositions: Float32Array;

    constructor() {
        const geometry = new THREE.SphereGeometry(0.12, 32, 32); // Higher poly
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.1,
            envMapIntensity: 1.5 // Pop the reflections
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
        this.dummy = new THREE.Object3D();

        this.treePositions = new Float32Array(this.count * 3);
        this.expandedPositions = new Float32Array(this.count * 3);

        this.init();
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            // Tree Positions (Cone Surface)
            const h = Math.random() * 3.5; // Height
            const maxR = 1.4 * (1 - h / 4.0); // Slightly inside tree bounds
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

            currentPos.lerp(new THREE.Vector3(tx, ty, tz), 0.05);

            this.dummy.position.copy(currentPos);
            this.dummy.scale.setScalar(1);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}
