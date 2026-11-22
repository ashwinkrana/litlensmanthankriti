/**
 * GLSL for the LitLens "silk" background: slow cloth folds lit by a light that
 * follows the pointer. Same technique as the PortfolioFInal background, with
 * the palette passed in as uniforms so light and dark themes share one shader.
 */

export const vertexShader = `
attribute vec2 aPosition;
void main() {
  // The full-screen triangle is already in clip space.
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const fragmentShader = `
precision highp float;

uniform vec2 uRes;      // drawing-buffer size in pixels
uniform float uTime;    // seconds of animation
uniform vec2 uMouse;    // smoothed pointer, 0..1, y up

// Palette (set per theme).
uniform vec3 uBase;       // cloth colour
uniform vec3 uTintA;      // warm tint
uniform vec3 uTintB;      // second warm tint
uniform vec3 uTintC;      // cool tint, appears in patches
uniform vec3 uGlintColor; // colour of the satin highlight
uniform float uTintMix;   // how strongly tints cover the base
uniform float uShadeFloor;
uniform float uShadeGain;
uniform float uGlint;

// Height of the cloth at point p and time t.
float folds(vec2 p, float t) {
  p.x += 0.35 * sin(p.y * 1.6 + t * 0.7);
  p.y += 0.25 * sin(p.x * 1.3 - t * 0.5);
  return sin(p.x * 3.1 + t) + 0.6 * sin((p.x + p.y) * 4.7 - t * 0.8) + 0.35 * sin(p.y * 7.3 + t * 0.6);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y; // keep folds round on wide screens
  p *= 1.2;
  float t = uTime * 0.18;  // drift, don't ripple

  // Surface normal from the slope of the folds.
  float e = 0.004;
  float h = folds(p, t);
  float dx = folds(p + vec2(e, 0.0), t) - h;
  float dy = folds(p + vec2(0.0, e), t) - h;
  vec3 normal = normalize(vec3(-dx / e * 0.16, -dy / e * 0.16, 1.0));

  // Light comes from the pointer, so the sheen follows the cursor.
  vec3 light = normalize(vec3((uMouse - 0.5) * 1.6, 0.9));
  float diffuse = clamp(dot(normal, light), 0.0, 1.0);
  float glint = pow(max(dot(reflect(-light, normal), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);

  // Blend the two warm tints first, then bring the cool tint in as patches.
  float blendA = 0.5 + 0.5 * sin(p.x * 1.1 + t * 0.6);
  float blendB = 0.5 + 0.5 * sin(p.y * 1.4 - t * 0.4 + 1.7);
  vec3 warm = mix(uTintA, uTintB, blendA);
  // Narrower band than the portfolio's (0.58-0.82): LitLens is warm-led.
  vec3 tint = mix(warm, uTintC, smoothstep(0.72, 0.94, blendB));

  vec3 color = mix(uBase, tint, uTintMix + 0.09 * h);
  color *= uShadeFloor + uShadeGain * diffuse;
  color += glint * uGlint * uGlintColor;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
