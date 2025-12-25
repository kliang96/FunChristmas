import './style.css'
import { camera } from './input/camera';
import { sceneRenderer } from './render/scene';
import { ui } from './ui/overlay';
import { debugView } from './ui/debug';
import { handTracker } from './input/mediapipe';
import { classifier } from './input/gestures';
import { stateMachine } from './state/machine';
import * as THREE from 'three';

// --- Loading State Management ---
const loadingState = {
  isComplete: false,
  progress: 0,
  total: 0,
  loadedTextures: [] as THREE.Texture[],
  statusText: "Initializing..."
};

const loadingStatusEl = document.getElementById('loading-status');
const passwordSubmitBtn = document.getElementById('password-submit') as HTMLButtonElement;
const passwordInputEl = document.getElementById('password-input') as HTMLInputElement;
const passwordOverlay = document.getElementById('password-overlay');
const passwordError = document.getElementById('password-error');


// Background Loading Logic
async function startBackgroundLoad() {
  console.log("Starting background loading...");
  try {
    const { photoLoader } = await import('./photos/loader');

    // 1. Load Images
    loadingState.statusText = "Downloading photos...";
    updateLoadingUI();

    const textures = await photoLoader.loadUserPhotos();
    loadingState.total = textures.length;
    loadingState.loadedTextures = textures;

    // 2. Upload to GPU incrementally
    if (sceneRenderer.renderer) {
      console.log(`Background uploading ${textures.length} textures to GPU...`);

      for (let i = 0; i < textures.length; i++) {
        const tex = textures[i];
        sceneRenderer.renderer.initTexture(tex);
        loadingState.progress = i + 1;
        updateLoadingUI();

        // Yield to main thread every few textures to keep UI responsive
        if (i % 2 === 0) await new Promise(r => requestAnimationFrame(r));
      }
    }

    loadingState.statusText = "Ready!";
    loadingState.isComplete = true;
    updateLoadingUI();

    // COMPLETE:
    finishLoadingTransition();

  } catch (e) {
    console.error("Background load failed:", e);
    loadingState.statusText = "Error loading content.";
    updateLoadingUI();
  }
}

function updateLoadingUI() {
  if (!loadingStatusEl) return;
  const pct = loadingState.total > 0
    ? Math.round((loadingState.progress / loadingState.total) * 100)
    : 0;

  if (loadingState.statusText === "Downloading photos...") {
    loadingStatusEl.innerText = "Downloading...";
  } else {
    loadingStatusEl.innerText = `Preparing Christmas Magic... ${pct}%`;
  }
}

// NOTE: We do NOT auto-start loading anymore.

async function init() {
  ui.setMode('INITIALIZING');
  console.log("Initializing Christmas Gesture Art...");

  // 1. Setup Camera
  try {
    await camera.start();
    console.log("Camera started.");
  } catch (e) {
    console.error("Camera failed", e);
    ui.setMode('DEMO MODE');
  }

  // 2. Setup Scene - Apply loaded textures
  // (Textures apply later)

  // 3. State Machine Listeners
  stateMachine.onTransition((mode) => {
    ui.setMode(mode);
    sceneRenderer.setMode(mode);
  });

  // 4. Gesture Listener
  classifier.onGesture = (gesture) => {
    // Only allow gestures if fully loaded
    if (loadingState.isComplete) {
      if (gesture === 'FIST') stateMachine.transitionTo('TREE');
      if (gesture === 'OPEN') stateMachine.transitionTo('EXPANDED');
      if (gesture === 'PINCH') stateMachine.transitionTo('FOCUS');
    }
  };

  // 5. Keyboard Fallbacks
  window.addEventListener('keydown', (e) => {
    if (!loadingState.isComplete) return;
    if (e.key === 'f' || e.key === 'F') stateMachine.transitionTo('TREE');
    if (e.key === 'o' || e.key === 'O') stateMachine.transitionTo('EXPANDED');
    if (e.key === 'p' || e.key === 'P') stateMachine.transitionTo('FOCUS');
    if (e.key === 'Escape') stateMachine.transitionTo('EXPANDED'); // Back/Exit
  });

  // 6. UI Listeners
  document.getElementById('btn-mute')?.addEventListener('click', async () => {
    const { audioManager } = await import('./media/audio');
    const isMuted = audioManager.toggleMute();
    (document.getElementById('btn-mute') as HTMLElement).innerText = isMuted ? "🔇" : "🔊";

    if (!isMuted && !audioManager.isPlaying) {
      audioManager.play();
    }
  });

  // Start audio on first interaction
  window.addEventListener('click', async () => {
    const { audioManager } = await import('./media/audio');
    audioManager.play();
  }, { once: true });

  // IMPORTANT: Start in LOADING mode
  stateMachine.transitionTo('LOADING');

  rendererLoop();
}

let lastHandTime = 0;
let lastFrameTime = performance.now();
let fpsRolling = 60;

function rendererLoop() {
  requestAnimationFrame(rendererLoop);

  const now = performance.now();

  // Input Processing
  if (camera.videoInput && handTracker.ready) {
    const results = handTracker.detect(camera.videoInput);

    // Debug View
    if (results) {
      debugView.update(camera.videoInput, results);
    }

    if (results && results.landmarks && results.landmarks.length > 0) {
      classifier.classify(results);
      lastHandTime = now;

      // Calculate Hand Metrics
      const hand = results.landmarks[0];

      // X: Average of wrist(0) and middle_finger_tip(12)
      const avgX = (hand[0].x + hand[12].x) / 2;
      const normalizedX = (avgX * 2 - 1) * -1; // -1 (Left) to 1 (Right)

      // Y: Average Y
      const avgY = (hand[0].y + hand[12].y) / 2;
      const normalizedY = (avgY * 2 - 1); // -1 (Top) to 1 (Bottom)

      // Z (Size): Distance between wrist(0) and middle_finger_tip(12)
      // Close hand = Large Dist. Far hand = Small Dist.
      const dx = hand[0].x - hand[12].x;
      const dy = hand[0].y - hand[12].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Calibrate Scale roughly
      // Typical range: 0.15 (Far) to 0.4 (Close)
      const minSize = 0.15;
      const maxSize = 0.4;
      const clampedSize = Math.max(minSize, Math.min(maxSize, dist));
      const normalizedSize = (clampedSize - minSize) / (maxSize - minSize); // 0 (Far) to 1 (Close)

      sceneRenderer.updateHandInteraction(normalizedX, normalizedY, normalizedSize);

    } else {
      // Hand Lost Logic
      // Only auto-reset if fully loaded
      if (loadingState.isComplete && now - lastHandTime > 10000 && stateMachine.currentMode !== 'TREE') {
        stateMachine.transitionTo('TREE');
        lastHandTime = now;
      }
    }
  }

  sceneRenderer.render();

  // Calculate Real FPS
  const frameDelta = now - lastFrameTime;
  lastFrameTime = now;
  if (frameDelta > 0) {
    const currentFps = 1000 / frameDelta;
    fpsRolling = fpsRolling * 0.95 + currentFps * 0.05; // Smooth rolling average
  }
  ui.updateFPS(fpsRolling);
}


// --- Password & UI Logic ---

let hasLoggedIn = false;

function checkPassword() {
  if (hasLoggedIn) return;
  const password = passwordInputEl.value;
  // Simple check - in a real app use hashing
  if (password === 'kibbles') {
    if (passwordError) passwordError.style.display = 'none';
    hasLoggedIn = true;

    // 1. Hide Input Form UI, Show Status
    passwordInputEl.style.display = 'none';
    passwordSubmitBtn.style.display = 'none';
    if (loadingStatusEl) loadingStatusEl.style.display = 'block';

    // 2. Initialize Scene (showing Particles in LOADING mode)
    init().then(() => {
      // 3. Start Loading Assets
      startBackgroundLoad();
    });

  } else {
    if (passwordError) passwordError.style.display = 'block';
    // Shake animation
    if (passwordInputEl) {
      passwordInputEl.style.transform = 'translateX(10px)';
      setTimeout(() => passwordInputEl.style.transform = 'translateX(0)', 100);
      setTimeout(() => passwordInputEl.style.transform = 'translateX(-10px)', 200);
      setTimeout(() => passwordInputEl.style.transform = 'translateX(0)', 300);
    }
  }
}

function finishLoadingTransition() {
  // 4. DONE -> Transition

  // Apply Textures
  if (sceneRenderer.framesSystem) {
    sceneRenderer.framesSystem.setTextures(loadingState.loadedTextures);
  }

  // Fade out status text
  if (loadingStatusEl) {
    loadingStatusEl.style.transition = 'opacity 1.0s';
    loadingStatusEl.style.opacity = '0';
  }
  const h1 = document.querySelector('h1') as HTMLElement;
  if (h1) {
    h1.style.transition = 'opacity 1.0s';
    h1.style.opacity = '0';
  }

  // Fade out overlay background THEN trigger tree
  if (passwordOverlay) {
    passwordOverlay.style.transition = 'background-color 2.0s ease-out';
    passwordOverlay.style.background = 'transparent'; // Let the particles show through clearer

    // Wait for overlay fade to trigger dramatic entrance of tree
    setTimeout(() => {
      // Hide overlay completely logic
      passwordOverlay.style.display = 'none';

      // Trigger Dramatic Entrance
      stateMachine.transitionTo('TREE');
    }, 500);
  } else {
    stateMachine.transitionTo('TREE');
  }
}

passwordSubmitBtn?.addEventListener('click', checkPassword);
passwordInputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkPassword();
});

// Force focus
passwordInputEl?.focus();
