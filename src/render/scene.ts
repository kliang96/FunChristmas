import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, SMAAEffect, SMAAPreset, SelectiveBloomEffect } from 'postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ParticleSystem } from './particles';
import { PresentsSystem } from './presents';
import { FramesSystem } from './frames';
import { StarSystem } from './star';
import { OrnamentsSystem } from './ornaments';

export class SceneRenderer {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    container: HTMLElement;
    clock: THREE.Clock;

    // Content Container (for unified rotation)
    contentGroup: THREE.Group;

    particleSystem: ParticleSystem | undefined;
    presentsSystem: PresentsSystem | undefined;
    framesSystem: FramesSystem | undefined;
    starSystem: StarSystem | undefined;
    ornamentsSystem: OrnamentsSystem | undefined;

    bloomEffect: SelectiveBloomEffect;

    composer: EffectComposer;

    currentMode: string = 'TREE';

    // Interaction State
    targetRotationY: number = 0;
    currentRotationY: number = 0;

    targetRotationX: number = 0; // Pitch (Up/Down)
    currentRotationX: number = 0;

    targetZoomZ: number = 0; // Zoom (Near/Far)
    currentZoomZ: number = 0;

    constructor() {
        this.container = document.getElementById('app') as HTMLElement;
        this.clock = new THREE.Clock();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.02);

        this.contentGroup = new THREE.Group();
        this.scene.add(this.contentGroup);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffaa00, 1, 10);
        pointLight.position.set(0, 2, 0);
        this.scene.add(pointLight);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 1, 8);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.container.appendChild(this.renderer.domElement);

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        const roomEnv = new RoomEnvironment();
        this.scene.environment = pmremGenerator.fromScene(roomEnv).texture;

        this.composer = new EffectComposer(this.renderer, {
            depthBuffer: true,
            stencilBuffer: false
        });

        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
        this.composer.addPass(new EffectPass(this.camera, smaa));

        this.bloomEffect = new SelectiveBloomEffect(this.scene, this.camera, {
            intensity: 2.5,
            luminanceThreshold: 0.5,
            mipmapBlur: true,
            radius: 0.4
        });

        this.composer.addPass(new EffectPass(this.camera, this.bloomEffect));

        window.addEventListener('resize', this.onResize.bind(this));

        this.setupScenes();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    setupScenes() {
        // Add everything to contentGroup instead of scene
        this.particleSystem = new ParticleSystem(10000);
        this.contentGroup.add(this.particleSystem.mesh);

        // Add particles to bloom
        if (this.bloomEffect && this.particleSystem.mesh) {
            this.bloomEffect.selection.add(this.particleSystem.mesh);
        }

        this.presentsSystem = new PresentsSystem();
        this.contentGroup.add(this.presentsSystem.mesh);
        if (this.presentsSystem.ribbonMesh) this.contentGroup.add(this.presentsSystem.ribbonMesh);

        this.framesSystem = new FramesSystem();
        this.contentGroup.add(this.framesSystem.group);

        this.starSystem = new StarSystem();
        this.contentGroup.add(this.starSystem.mesh);
        // Add star to bloom
        if (this.bloomEffect && this.starSystem.mesh) {
            this.bloomEffect.selection.add(this.starSystem.mesh);
        }

        this.ornamentsSystem = new OrnamentsSystem();
        this.contentGroup.add(this.ornamentsSystem.mesh);
    }

    // Updates called from Main loop with hand data
    updateHandInteraction(normalizedX: number, normalizedY: number, sizeFactor: number) {
        if (this.currentMode === 'EXPANDED') {
            // 1. Yaw (Left/Right)
            const maxRotY = Math.PI / 1.5; // +/- 120 degrees
            this.targetRotationY = normalizedX * maxRotY;

            // 2. Pitch (Up/Down)
            // NormalizedY: -1 (Top) to 1 (Bottom).
            // Looking Up usually means Content tilts Down? Or Camera tilts Up?
            // "Move hand Up" -> Tilt content Up (positive X rot).
            const maxRotX = Math.PI / 6; // +/- 30 degrees (gentle tilt)
            this.targetRotationX = -normalizedY * maxRotX;

            // 3. Zoom (Near/Far)
            // sizeFactor: 0 (Small/Far) -> 1 (Big/Close)
            // We want Big Hand = Zoom In (Content moves closer to Camera)
            // Camera is at +8. Content at 0.
            // Move Content +Z towards camera. Max +2.5 (Reduced from 4.0)
            const maxZoom = 2.5;
            const minZoom = -2.0;

            // Map 0..1 to minZoom..maxZoom
            // Let's assume neutral hand is 0.5 -> Z=0
            const zoom = (sizeFactor - 0.5) * 2.0; // -1 to 1
            this.targetZoomZ = zoom * maxZoom;
        }
    }

    setMode(mode: string) {
        this.currentMode = mode;
        if (mode === 'TREE') {
            // Reset transforms logic
        }
    }

    render() {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // --- Interaction Logic ---
        if (this.currentMode === 'TREE') {
            // Auto Rotation
            this.targetRotationY += delta * 0.2;
            this.currentRotationY = this.targetRotationY;

            // Reset Pitch/Zoom
            this.currentRotationX = THREE.MathUtils.lerp(this.currentRotationX, 0, delta);
            this.contentGroup.position.z = THREE.MathUtils.lerp(this.contentGroup.position.z, 0, delta);

        } else if (this.currentMode === 'EXPANDED') {
            // Hand Control Lerp
            this.currentRotationY = THREE.MathUtils.lerp(this.currentRotationY, this.targetRotationY, delta * 2.0);
            this.currentRotationX = THREE.MathUtils.lerp(this.currentRotationX, this.targetRotationX, delta * 2.0);

            const currentZ = this.contentGroup.position.z;
            const newZ = THREE.MathUtils.lerp(currentZ, this.targetZoomZ, delta * 2.0);
            this.contentGroup.position.z = newZ;

        } else if (this.currentMode === 'FOCUS') {
            // Recenter
            this.currentRotationY = THREE.MathUtils.lerp(this.currentRotationY, 0, delta * 2.0);
            this.currentRotationX = THREE.MathUtils.lerp(this.currentRotationX, 0, delta * 2.0);
            // Keep content Z at 0, scene handles camera Z
            this.contentGroup.position.z = THREE.MathUtils.lerp(this.contentGroup.position.z, 0, delta * 2.0);
        }

        // Apply Transforms
        this.contentGroup.rotation.y = this.currentRotationY;
        this.contentGroup.rotation.x = this.currentRotationX;
        // Position Z set above

        // --- Sub-Systems Update ---
        if (this.particleSystem) {
            this.particleSystem.update(time, this.currentMode as any);
        }

        if (this.presentsSystem) this.presentsSystem.update(time, this.currentMode);
        if (this.framesSystem) this.framesSystem.update(time, delta, this.currentMode);
        if (this.starSystem) this.starSystem.update(time, this.currentMode);
        if (this.ornamentsSystem) this.ornamentsSystem.update(time, this.currentMode);

        this.composer.render();
    }
}

export const sceneRenderer = new SceneRenderer();
