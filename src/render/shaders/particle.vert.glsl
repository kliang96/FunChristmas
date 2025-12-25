uniform float time;
uniform float targetMix; // 0=Random, 1=Tree
uniform float uLoading; // 1=Loading, 0=Normal
uniform float uEntranceProgress; // 0=Start, 1=Complete
uniform float uBurst; // 0=None, 1=Max Burst
attribute vec3 treePosition;
attribute float size;
attribute float speed;
attribute vec3 randomStart;
attribute vec3 entranceStart; // NEW: Starting position for entrance
attribute float entranceDelay; // NEW: Per-particle entrance delay (0-0.4)
attribute float pId;

varying vec3 vColor;

void main() {
  vec3 pos = mix(randomStart, treePosition, targetMix);
  
  // Burst Effect: Offset particles from center
  if (uBurst > 0.01) {
      vec3 burstDir = normalize(pos + vec3(0, 0.5, 0)); // Offset from center+up
      pos += burstDir * uBurst * 2.0;
  }
  
  // Add some noise/motion
  float offset = sin(time * speed + pos.x) * 0.1;
  pos.y += offset;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // Default Size
  float pointSize = size * (300.0 / -mvPosition.z);

  // Loading Logic
  if (uLoading > 0.5) {
      // Only show first 10 particles
      if (pId > 10.0) {
          pointSize = 0.0;
      } else {
         // Make them floaty and slightly larger
         pointSize *= 1.5;
         // Center them more
         pos = randomStart * 0.3; // Closer to center
         offset = sin(time * speed * 2.0 + pos.x) * 0.2;
         pos.y += offset;
         mvPosition = modelViewMatrix * vec4(pos, 1.0);
      }
  }

  // Entrance Animation Logic
  if (uEntranceProgress < 1.0 && uLoading < 0.5) {
      // Calculate per-particle progress with delay
      // Particles with higher delay start later but all finish at progress=1.0
      float particleProgress = (uEntranceProgress - entranceDelay) / (1.0 - entranceDelay);
      particleProgress = clamp(particleProgress, 0.0, 1.0);
      
      // Ease-in (fast to slow): cubic easing
      float t = particleProgress * particleProgress * particleProgress;
      
      // Lerp from entrance start to tree position
      vec3 targetPos = mix(randomStart, treePosition, targetMix);
      pos = mix(entranceStart, targetPos, t);
      
      // Scale particles in as they arrive
      pointSize *= t;
      
      mvPosition = modelViewMatrix * vec4(pos, 1.0);
  }

  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * mvPosition;
  
  // Color: mix between blue-ish white (random) and green/gold (tree)
  vec3 colorRandom = vec3(0.8, 0.9, 1.0);
  vec3 colorTree = vec3(0.1, 1.0, 0.4); // Green
  
  // Add some gold sparkles
  if (speed > 1.5) {
      colorTree = vec3(1.0, 0.8, 0.1); 
  }
  
  vec3 finalColor = mix(colorRandom, colorTree, targetMix) * 3.0;

  if (uLoading > 0.5) {
      finalColor = vec3(0.9, 0.95, 1.0) * 4.0; // High intensity white
  }

  vColor = finalColor;
}
