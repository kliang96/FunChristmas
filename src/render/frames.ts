import * as THREE from 'three';

const CONFIG = {
    FOCUS_Z_POS: 6.3,
    FRAME_COUNT: 8
};

// --- Shared Assets ---

// 1. Geometries (SHARED)
const ornamentGeo = new THREE.SphereGeometry(0.06, 16, 16);
const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
const unitPlaneGeo = new THREE.PlaneGeometry(1, 1);

// 2. Materials Palette
const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.1 });
const silverMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.9, roughness: 0.1 });
const redMetalMaterial = new THREE.MeshStandardMaterial({ color: 0xD32F2F, metalness: 0.7, roughness: 0.2 });
const greenMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x2E7D32, metalness: 0.7, roughness: 0.2 });
const blueMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x1976D2, metalness: 0.8, roughness: 0.2 });

const ORNAMENT_MATERIALS = [
    goldMaterial,
    silverMaterial,
    redMetalMaterial,
    greenMetalMaterial,
    blueMetalMaterial
];

// REFINEMENT: Gold Frame Material
const frameGoldMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFE082, // Light Gold / Brass
    metalness: 1.0,   // Full Metallic
    roughness: 0.3    // Semi-gloss
});

// Helper: Random pick
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to create a unique Frame Object
function createPhotoFrame(texture: THREE.Texture): THREE.Group | null {
    if (!texture.image) return null;
    const img = texture.image as HTMLImageElement;
    if (img.width === 0 || img.height === 0) return null;

    const group = new THREE.Group();

    // --- 1. Dimensions (THINNER) ---
    const photoAspect = img.width / img.height;
    const photoHeight = 1.4;
    const photoWidth = photoHeight * photoAspect;

    const padding = 0.16;
    const frameHeight = photoHeight + padding;
    const frameWidth = photoWidth + padding;
    const frameDepth = 0.08;

    // --- 2. Main Mesh (Shared Geo + Scaling) ---
    // Frame
    const frameMesh = new THREE.Mesh(unitBoxGeo, frameGoldMaterial);
    frameMesh.scale.set(frameWidth, frameHeight, frameDepth);
    // Box center is 0,0,0.
    group.add(frameMesh);

    // Photo
    // Darker base color to reduce Bloom intensity
    const photoMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCCCCC,
        toneMapped: false,
        map: texture
    });

    const photoMesh = new THREE.Mesh(unitPlaneGeo, photoMaterial);
    photoMesh.scale.set(photoWidth, photoHeight, 1);
    photoMesh.position.z = frameDepth / 2 + 0.005; // Slightly in front of frame
    group.add(photoMesh);


    // --- 3. Randomized Decoration (REFINED) ---

    // Logic: 1 to 4 corners get ONE ornament each.
    // 1. Determine Count (1-4)
    const numOrnaments = 1 + Math.floor(Math.random() * 4); // 1, 2, 3, or 4

    // 2. Shuffle Corner Indices
    const corners = [0, 1, 2, 3]; // TL, TR, BL, BR
    corners.sort(() => Math.random() - 0.5);

    // 3. Pick first N corners
    const selectedCorners = corners.slice(0, numOrnaments);

    // Theme for this frame
    const themeMat = pickRandom(ORNAMENT_MATERIALS);

    const cx = frameWidth / 2 - 0.03;
    const cy = frameHeight / 2 - 0.03;
    const cz = 0.04;

    selectedCorners.forEach(idx => {
        // Map 0,1,2,3 to Direction Vectors
        // 0: -1, 1 (Top Left)
        // 1: 1, 1 (Top Right)
        // 2: -1, -1 (Bottom Left)
        // 3: 1, -1 (Bottom Right)
        const xDir = (idx % 2 === 0) ? -1 : 1;
        const yDir = (idx < 2) ? 1 : -1;

        // Single Sphere only
        const orb = new THREE.Mesh(ornamentGeo, themeMat);
        orb.position.set(xDir * cx, yDir * cy, cz);

        // Parent to group directly to avoid squash effect if frame was scaled (frame scaling handled by .scale property now, but clean hierarchy is better)
        group.add(orb);
    });

    // REFINEMENT: Remove Holly Topper

    group.userData.isFrame = true;
    return group;
}

export class FramesSystem {
    group: THREE.Group;
    photoPool: THREE.Group[] = [];
    activeFrames: THREE.Group[] = [];
    count: number = CONFIG.FRAME_COUNT;

    focusIndex: number = 0;
    lastFocusChange: number = 0;
    lastMode: string = 'TREE';

    constructor() {
        this.group = new THREE.Group();
    }

    setTextures(textures: THREE.Texture[]) {
        this.photoPool = [];
        this.group.clear();
        this.activeFrames = [];

        console.log(`FramesSystem: Generating objects for ${textures.length} photos...`);

        textures.forEach(tex => {
            const frameObj = createPhotoFrame(tex);
            if (frameObj) {
                this.photoPool.push(frameObj);
            }
        });

        console.log(`FramesSystem: Created ${this.photoPool.length} valid frame objects.`);

        this.refreshFrameTextures();
    }

    refreshFrameTextures() {
        if (this.photoPool.length === 0) return;

        this.group.clear();
        this.activeFrames = [];

        const shuffled = [...this.photoPool].sort(() => Math.random() - 0.5);

        const count = Math.min(this.count, shuffled.length);
        for (let i = 0; i < count; i++) {
            const obj = shuffled[i];

            obj.position.set(0, 0, 0);
            obj.rotation.set(0, 0, 0);
            obj.scale.set(0, 0, 0);

            this.activeFrames.push(obj);
            this.group.add(obj);
        }
    }

    update(time: number, delta: number, mode: string) {
        // Frames only visible in interactive modes
        const visible = (mode === 'EXPANDED' || mode === 'FOCUS');
        const animTargetScale = visible ? 1.0 : 0.0;

        if (mode === 'FOCUS' && this.lastMode !== 'FOCUS') {
            this.refreshFrameTextures();
            this.focusIndex = Math.floor(Math.random() * this.activeFrames.length);
        }

        this.lastMode = mode;

        const count = this.activeFrames.length;
        if (count === 0) return;

        const lerpSpeed = 2.0;

        this.activeFrames.forEach((group, i) => {
            let targetPos = new THREE.Vector3();
            let targetRot = new THREE.Quaternion();
            let scaleMult = 1.0;

            if (mode === 'FOCUS') {
                if (i === this.focusIndex) {
                    scaleMult = 1.0;
                    targetPos.set(0, 1, CONFIG.FOCUS_Z_POS);

                    const dummy = new THREE.Object3D();
                    dummy.position.copy(targetPos);
                    dummy.lookAt(0, 1, 8);
                    targetRot.copy(dummy.quaternion);
                } else {
                    scaleMult = 0.5;
                    const angle = (i / count) * Math.PI * 2 + time * 0.1;
                    const r = 6.0;
                    targetPos.set(
                        Math.cos(angle) * r,
                        0,
                        Math.sin(angle) * r
                    );
                    const dummy = new THREE.Object3D();
                    dummy.position.copy(targetPos);
                    dummy.lookAt(0, 0, 0);
                    targetRot.copy(dummy.quaternion);
                }
            } else if (mode === 'EXPANDED') {
                scaleMult = 1.0;

                const angle = (i / count) * Math.PI * 2 + time * 0.1;
                const r = 3.0;
                targetPos.set(
                    Math.cos(angle) * r,
                    Math.sin(i * 0.5 + time) * 0.5,
                    Math.sin(angle) * r
                );
                const dummy = new THREE.Object3D();
                dummy.position.copy(targetPos);
                dummy.lookAt(0, 0, 0); // Look at center (0,0,0) LOCAL
                targetRot.copy(dummy.quaternion);

            } else {
                // TREE or LOADING (Hidden)
                scaleMult = 0.0;
                // Still calculate position for smooth transition if needed, but scale is 0
                targetPos.set(0, 0, 0);
            }

            // Delta-time based lerp
            const alpha = 1.0 - Math.exp(-lerpSpeed * delta);
            group.position.lerp(targetPos, alpha);
            group.quaternion.slerp(targetRot, alpha);

            const finalScale = animTargetScale * scaleMult;
            const lerpedScale = THREE.MathUtils.lerp(group.scale.x, finalScale, 0.1);
            group.scale.set(lerpedScale, lerpedScale, lerpedScale);
        });
    }
}
