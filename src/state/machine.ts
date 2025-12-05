export type AppMode = 'TREE' | 'EXPANDED' | 'FOCUS';

class AppStateMachine {
    currentMode: AppMode = 'TREE';

    // Listeners
    listeners: ((mode: AppMode) => void)[] = [];

    transitionTo(mode: AppMode) {
        if (this.currentMode === mode) return;

        console.log(`State Transition: ${this.currentMode} -> ${mode}`);
        this.currentMode = mode;

        // Notify listeners
        this.listeners.forEach(cb => cb(this.currentMode));
    }

    onTransition(cb: (mode: AppMode) => void) {
        this.listeners.push(cb);
    }
}

export const stateMachine = new AppStateMachine();
