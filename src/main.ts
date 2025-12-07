import './style.css'
import { camera } from './input/camera';
import { sceneRenderer } from './render/scene';
import { ui } from './ui/overlay';
import { debugView } from './ui/debug';
import { handTracker } from './input/mediapipe';
import { classifier } from './input/gestures';
import { stateMachine } from './state/machine';

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

  // 2. Setup Scene
  // sceneRenderer.setupParticles is called in constructor

  // Auto-load photos
  import('./photos/loader').then(async ({ photoLoader }) => {
    const textures = await photoLoader.loadUserPhotos();
    if (sceneRenderer.framesSystem) {
      sceneRenderer.framesSystem.setTextures(textures);
      console.log("Auto-loaded user photos");
    }
  });

  // 3. State Machine Listeners
  stateMachine.onTransition((mode) => {
    ui.setMode(mode);
    sceneRenderer.setMode(mode);
  });

  // 4. Gesture Listener
  classifier.onGesture = (gesture) => {
    if (gesture === 'FIST') stateMachine.transitionTo('TREE');
    if (gesture === 'OPEN') stateMachine.transitionTo('EXPANDED');
    if (gesture === 'PINCH') stateMachine.transitionTo('FOCUS');
  };

  // 5. Keyboard Fallbacks
  window.addEventListener('keydown', (e) => {
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

  stateMachine.transitionTo('TREE');

  rendererLoop();
}

let lastHandTime = 0;

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
      if (now - lastHandTime > 10000 && stateMachine.currentMode !== 'TREE') {
        stateMachine.transitionTo('TREE');
        lastHandTime = now;
      }
    }
  }

  sceneRenderer.render();

  // Mock FPS (later real)
  ui.updateFPS(1000 / 60);
}

init();
