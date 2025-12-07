import * as THREE from 'three';

export class PhotoLoader {
    textures: THREE.Texture[] = [];

    // Placeholder textures
    placeholderColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];

    async loadUserPhotos(): Promise<THREE.Texture[]> {
        // 1. Load Local Photos from src/user_photos via Vite Glob Import
        // Use eager: true to bundle the paths directly and avoid 100s of tiny network requests
        const modules = import.meta.glob('../user_photos/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
        const localPromises: Promise<THREE.Texture>[] = [];

        console.log(`Found ${Object.keys(modules).length} image files in user_photos`);

        for (const path in modules) {
            localPromises.push(new Promise(async (resolve, reject) => {
                try {
                    // With eager: true, the module is already loaded.
                    const mod = modules[path] as { default: string };
                    const texture = await new THREE.TextureLoader().loadAsync(mod.default);
                    texture.colorSpace = THREE.SRGBColorSpace;
                    console.log(`Loaded: ${path}`);
                    resolve(texture);
                } catch (err) {
                    console.error(`Failed to load ${path}:`, err);
                    reject(err);
                }
            }));
        }

        try {
            const loaded = await Promise.all(localPromises);
            if (loaded.length > 0) {
                this.textures = loaded;
                console.log(`Successfully loaded ${loaded.length} photos!`);
                return loaded;
            }
        } catch (e) {
            console.warn("Error loading local photos", e);
        }

        console.log("No photos found, using placeholders");
        return this.getPlaceholders();
    }

    getPlaceholders(): THREE.Texture[] {
        if (this.textures.length > 0) return this.textures;

        // Generate procedural textures
        return this.placeholderColors.map(c => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = c;
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = 'white';
            ctx.font = '100px sans-serif';
            ctx.fillText('Photo', 150, 250);

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        });
    }
}

export const photoLoader = new PhotoLoader();
