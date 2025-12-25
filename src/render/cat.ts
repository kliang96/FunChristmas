import * as THREE from 'three';

export class CatSystem {
    sprite: THREE.Sprite;
    material: THREE.SpriteMaterial;
    visible: boolean = false;

    // Animation state
    breathingPhase: number = 0;
    tailPhase: number = 0;
    baseScale: number = 1.2;

    constructor() {
        // Load cat texture
        const textureLoader = new THREE.TextureLoader();
        const catTexture = textureLoader.load('/ragdoll_cat_sprite.png', (texture) => {
            // Set texture filtering to prevent blur
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
        });

        // Create sprite material - darken slightly to blend better
        this.material = new THREE.SpriteMaterial({
            map: catTexture,
            transparent: true,
            opacity: 0,
            blending: THREE.NormalBlending,
            depthWrite: false,
            depthTest: true,
            sizeAttenuation: true,
            color: new THREE.Color(0.6, 0.6, 0.6),
        });

        this.sprite = new THREE.Sprite(this.material);

        // Position beside the tree at ground level, to the right
        this.sprite.position.set(2.5, -1.5, 0);
        this.sprite.scale.set(this.baseScale, this.baseScale, 1);

        // Start hidden
        this.sprite.visible = false;
    }

    update(time: number, mode: string) {
        const targetVisible = mode === 'TREE';

        // Smooth fade in/out
        const fadeSpeed = 0.02;
        if (targetVisible && !this.visible) {
            this.visible = true;
            this.sprite.visible = true;
        }

        if (targetVisible) {
            this.material.opacity = Math.min(1, this.material.opacity + fadeSpeed);
        } else {
            this.material.opacity = Math.max(0, this.material.opacity - fadeSpeed);
            if (this.material.opacity <= 0) {
                this.sprite.visible = false;
                this.visible = false;
            }
        }

        // Only animate when visible
        if (this.visible && this.material.opacity > 0) {
            // Breathing animation - gentle scale pulsing
            this.breathingPhase = time * 1.5;
            const breathScale = 1 + Math.sin(this.breathingPhase) * 0.03;

            // Tail sway - simulate with slight rotation
            this.tailPhase = time * 2.0;
            const tailSway = Math.sin(this.tailPhase) * 0.05;

            // Apply animations
            const finalScale = this.baseScale * breathScale;
            this.sprite.scale.set(finalScale, finalScale, 1);

            // Subtle position sway for tail effect
            this.sprite.position.x = 2.5 + tailSway * 0.1;

            // Occasional ear twitch
            if (Math.random() < 0.01) {
                const twitch = 1 + Math.random() * 0.05;
                this.sprite.scale.y *= twitch;
            }
        }
    }
}
