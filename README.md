# Christmas Gesture Art

A cozy, hand-controlled interactive Christmas art piece built with Three.js and MediaPipe.

## 🎄 Features
- **Gesture Control**: Use your webcam to control the scene.
  - **Fist (✊)**: Summon the magical particle tree.
  - **Open Palm (✋)**: Explode the tree into floating gifts and photos.
  - **Pinch (🤏)**: Zoom in on memories (Photo Frames).
- **Custom Photos**: Click "Load Photos" to upload your own images into the floating frames.
- **Visuals**: 15,000+ GPU-accelerated particles, Bloom effects, and dynamic lighting.
- **Audio**: Festive background loop with mute control.

## Usage
1. **Camera**: Allow camera access when prompted.
2. **Gestures**:
    - **Fist ✊**: Summon the Christmas Tree.
    - **Open Palm ✋**: Explode the tree into gifts and photos.
    - **Pinch 🤏**: Focus mode (Slideshow).
3. **Custom Photos**:
    - Place your `.jpg` or `.png` photo files into the `src/user_photos/` folder.
    - They will automatically load when you start the app!
    - Restart the dev server if you add new files: `npm run dev`.

## Configuration
- **Focus Distance**: You can adjust how close the photos zoomed in by editing `src/render/frames.ts` and changing `CONFIG.FOCUS_Z_POS`.

## 🛠️ Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 🎮 Controls & Fallbacks
If you don't have a webcam, or for testing:
- **F**: Trigger Tree Mode
- **O**: Trigger Expanded Mode
- **P**: Trigger Focus Mode
- **Esc**: Exit Focus

## 🖥️ Tech Stack
- **Three.js**: Rendering & Particles
- **MediaPipe Tasks Vision**: Hand Tracking
- **Postprocessing**: Bloom Effects
- **Vite**: Build Tool
