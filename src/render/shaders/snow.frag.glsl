varying float vAlpha;

void main() {
  // Circular soft snowflake
  vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;
  float dist = length(uv);
  if (dist > 1.0) discard;
  
  // Soft edges
  float alpha = 1.0 - smoothstep(0.3, 1.0, dist);
  alpha *= vAlpha; // Apply fade from vertex shader
  
  // Soft white color
  vec3 snowColor = vec3(0.95, 0.97, 1.0);
  
  gl_FragColor = vec4(snowColor, alpha * 0.6);
}
