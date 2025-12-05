varying vec3 vColor;

void main() {
  // Circular soft particle
  vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;
  float dist = length(uv);
  if (dist > 1.0) discard;
  
  float alpha = 1.0 - smoothstep(0.5, 1.0, dist);
  
  gl_FragColor = vec4(vColor, alpha);
}
