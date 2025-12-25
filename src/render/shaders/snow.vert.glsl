uniform float time;
attribute vec3 startPosition;
attribute float size;
attribute float speed;
attribute float phase; // For side-to-side motion variation

varying float vAlpha;

void main() {
  vec3 pos = startPosition;
  
  // Falling motion - loop when reaching bottom
  float fallDistance = mod(time * speed, 10.0); // Fall 10 units then reset
  pos.y = startPosition.y - fallDistance;
  
  // Side-to-side gentle sway
  float swayAmount = 0.3;
  float swaySpeed = 0.5;
  pos.x += sin(time * swaySpeed + phase) * swayAmount;
  pos.z += cos(time * swaySpeed * 0.7 + phase * 1.3) * swayAmount * 0.5;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // Size based on distance
  float pointSize = size * (300.0 / -mvPosition.z);
  
  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * mvPosition;
  
  // Fade in/out at top and bottom of fall cycle
  float cyclePos = fallDistance / 10.0;
  vAlpha = smoothstep(0.0, 0.1, cyclePos) * (1.0 - smoothstep(0.9, 1.0, cyclePos));
}
