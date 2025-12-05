uniform float time;
uniform float targetMix; // 0=Random, 1=Tree
attribute vec3 treePosition;
attribute float size;
attribute float speed;
attribute vec3 randomStart;

varying vec3 vColor;

// Curl noise function or simplified flow
// For MVP, we stick to simple interpolation + noise

void main() {
  vec3 pos = mix(randomStart, treePosition, targetMix);
  
  // Add some noise/motion
  float offset = sin(time * speed + pos.x) * 0.1;
  pos.y += offset;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  
  gl_Position = projectionMatrix * mvPosition;
  
  // Color: mix between blue-ish white (random) and green/gold (tree)
  vec3 colorRandom = vec3(0.8, 0.9, 1.0);
  vec3 colorTree = vec3(0.1, 1.0, 0.4); // Green
  
  // Add some gold sparkles
  if (speed > 1.5) {
      colorTree = vec3(1.0, 0.8, 0.1); 
  }
  
  vColor = mix(colorRandom, colorTree, targetMix);
}
