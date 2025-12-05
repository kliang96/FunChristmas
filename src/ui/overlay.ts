export class UIOverlay {
    container: HTMLDivElement;
    modeElement: HTMLDivElement;
    fpsElement: HTMLDivElement;
    hintsElement: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'overlay';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // Pass through clicks
        this.container.style.zIndex = '10';
        document.body.appendChild(this.container);

        // FPS Meter (Top Left)
        this.fpsElement = document.createElement('div');
        this.fpsElement.style.position = 'absolute';
        this.fpsElement.style.top = '10px';
        this.fpsElement.style.left = '10px';
        this.fpsElement.style.color = '#00FF00';
        this.fpsElement.style.fontFamily = 'monospace';
        this.fpsElement.style.fontWeight = 'bold';
        this.fpsElement.innerText = 'FPS: --';
        this.container.appendChild(this.fpsElement);

        // Mode Indicator (Top Center)
        this.modeElement = document.createElement('div');
        this.modeElement.style.position = 'absolute';
        this.modeElement.style.top = '20px';
        this.modeElement.style.left = '50%';
        this.modeElement.style.transform = 'translateX(-50%)';
        this.modeElement.style.color = '#FFF';
        this.modeElement.style.fontSize = '24px';
        this.modeElement.style.fontWeight = 'bold';
        this.modeElement.style.textShadow = '0 0 10px rgba(255,215,0, 0.7)'; // Gold glow
        this.modeElement.innerText = 'INITIALIZING...';
        this.container.appendChild(this.modeElement);

        // Gesture Hints (Bottom Center)
        this.hintsElement = document.createElement('div');
        this.hintsElement.style.position = 'absolute';
        this.hintsElement.style.bottom = '30px';
        this.hintsElement.style.left = '50%';
        this.hintsElement.style.transform = 'translateX(-50%)';
        this.hintsElement.style.display = 'flex';
        this.hintsElement.style.gap = '20px';
        this.hintsElement.style.color = 'rgba(255,255,255,0.7)';

        this.hintsElement.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2em;">✊</div>
                <div style="font-size: 0.8em;">TREE</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 2em;">✋</div>
                <div style="font-size: 0.8em;">EXPAND</div>
            </div>
             <div style="text-align: center;">
                <div style="font-size: 2em;">🤏</div>
                <div style="font-size: 0.8em;">FOCUS</div>
            </div>
        `;
        this.container.appendChild(this.hintsElement);

        // Mute Button
        const muteBtn = document.createElement('button');
        muteBtn.innerText = "🔇";
        muteBtn.style.position = 'absolute';
        muteBtn.style.top = '10px';
        muteBtn.style.left = '120px'; // Next to FPS (kind of)
        muteBtn.style.fontSize = '20px';
        muteBtn.style.background = 'transparent';
        muteBtn.style.border = 'none';
        muteBtn.style.cursor = 'pointer';
        muteBtn.style.pointerEvents = 'auto';
        muteBtn.id = 'btn-mute';
        this.container.appendChild(muteBtn);
    }

    updateFPS(value: number) {
        this.fpsElement.innerText = `FPS: ${Math.round(value)}`;
        if (value < 45) this.fpsElement.style.color = 'red';
        else if (value < 58) this.fpsElement.style.color = 'orange';
        else this.fpsElement.style.color = '#00FF00';
    }

    setMode(mode: string) {
        this.modeElement.innerText = mode;
    }
}

export const ui = new UIOverlay();
