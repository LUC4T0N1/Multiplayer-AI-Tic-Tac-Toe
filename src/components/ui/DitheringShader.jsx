import { useEffect, useRef } from "react";

// ── GLSL utilities ──────────────────────────────────────────────────────────

const declarePI = `
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`;

const proceduralHash11 = `
  float hash11(float p) {
    p = fract(p * 0.3183099) + 0.1;
    p *= p + 19.19;
    return fract(p * p);
  }
`;

const proceduralHash21 = `
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`;

const simplexNoise = `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

// ── Vertex shader ────────────────────────────────────────────────────────────

const VERT = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
void main() { gl_Position = a_position; }
`;

// ── Fragment shader ──────────────────────────────────────────────────────────

const FRAG = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec4  u_colorBack;
uniform vec4  u_colorFront;
uniform float u_shape;
uniform float u_type;
uniform float u_pxSize;

out vec4 fragColor;

${simplexNoise}
${declarePI}
${proceduralHash11}
${proceduralHash21}

float getSimplexNoise(vec2 uv, float t) {
  float noise = .5 * snoise(uv - vec2(0., .3 * t));
  noise += .5 * snoise(2. * uv + vec2(0., .32 * t));
  return noise;
}

const int bayer2x2[4]  = int[4](0, 2, 3, 1);
const int bayer4x4[16] = int[16](
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5
);
const int bayer8x8[64] = int[64](
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv, int size) {
  ivec2 pos   = ivec2(mod(uv, float(size)));
  int   index = pos.y * size + pos.x;
  if (size == 2) return float(bayer2x2[index]) / 4.0;
  if (size == 4) return float(bayer4x4[index]) / 16.0;
  if (size == 8) return float(bayer8x8[index]) / 64.0;
  return 0.0;
}

void main() {
  float t  = .5 * u_time;
  vec2  uv = gl_FragCoord.xy / u_resolution.xy;
  uv -= .5;

  float pxSize   = u_pxSize;
  vec2  pxCoord  = gl_FragCoord.xy;
  pxCoord -= .5 * u_resolution;
  pxCoord /= pxSize;
  vec2 pixelizedUv = floor(pxCoord) * pxSize / u_resolution.xy;
  pixelizedUv += .5;
  pixelizedUv -= .5;

  vec2 shape_uv        = pixelizedUv;
  vec2 dithering_uv    = pxCoord;
  vec2 ditheringNoise  = uv * u_resolution;

  float shape = 0.;

  if (u_shape < 1.5) {
    shape_uv *= .001;
    shape = 0.5 + 0.5 * getSimplexNoise(shape_uv, t);
    shape = smoothstep(0.3, 0.9, shape);

  } else if (u_shape < 2.5) {
    shape_uv *= .003;
    for (float i = 1.0; i < 6.0; i++) {
      shape_uv.x += 0.6 / i * cos(i * 2.5 * shape_uv.y + t);
      shape_uv.y += 0.6 / i * cos(i * 1.5 * shape_uv.x + t);
    }
    shape = .15 / abs(sin(t - shape_uv.y - shape_uv.x));
    shape = smoothstep(0.02, 1., shape);

  } else if (u_shape < 3.5) {
    shape_uv *= .05;
    float stripeIdx = floor(2. * shape_uv.x / TWO_PI);
    float rand = hash11(stripeIdx * 10.);
    rand = sign(rand - .5) * pow(.1 + abs(rand), .4);
    shape = sin(shape_uv.x) * cos(shape_uv.y - 5. * rand * t);
    shape = pow(abs(shape), 6.);

  } else if (u_shape < 4.5) {
    shape_uv *= 4.;
    float wave = cos(.5 * shape_uv.x - 2. * t) * sin(1.5 * shape_uv.x + t) * (.75 + .25 * cos(3. * t));
    shape = 1. - smoothstep(-1., 1., shape_uv.y + wave);

  } else if (u_shape < 5.5) {
    float dist  = length(shape_uv);
    float waves = sin(pow(dist, 1.7) * 7. - 3. * t) * .5 + .5;
    shape = waves;

  } else if (u_shape < 6.5) {
    float l      = length(shape_uv);
    float angle  = 6. * atan(shape_uv.y, shape_uv.x) + 4. * t;
    float twist  = 1.2;
    float offset = pow(l, -twist) + angle / TWO_PI;
    float mid    = smoothstep(0., 1., pow(l, twist));
    shape = mix(0., fract(offset), mid);

  } else {
    shape_uv *= 2.;
    float d      = 1. - pow(length(shape_uv), 2.);
    vec3  pos    = vec3(shape_uv, sqrt(d));
    vec3  light  = normalize(vec3(cos(1.5 * t), .8, sin(1.25 * t)));
    shape = .5 + .5 * dot(light, pos);
    shape *= step(0., d);
  }

  float dithering = 0.0;
  int   itype     = int(floor(u_type));
  switch (itype) {
    case 1:  dithering = step(hash21(ditheringNoise), shape); break;
    case 2:  dithering = getBayerValue(dithering_uv, 2);      break;
    case 3:  dithering = getBayerValue(dithering_uv, 4);      break;
    default: dithering = getBayerValue(dithering_uv, 8);      break;
  }

  dithering -= .5;
  float res = step(.5, shape + dithering);

  vec3  fgColor   = u_colorFront.rgb * u_colorFront.a;
  float fgOpacity = u_colorFront.a;
  vec3  bgColor   = u_colorBack.rgb  * u_colorBack.a;
  float bgOpacity = u_colorBack.a;

  vec3  color   = fgColor * res;
  float opacity = fgOpacity * res;
  color   += bgColor   * (1. - opacity);
  opacity += bgOpacity * (1. - opacity);

  fragColor = vec4(color, opacity);
}
`;

// ── Shape / type maps ────────────────────────────────────────────────────────

export const DitheringShapes = {
  simplex: 1, warp: 2, dots: 3, wave: 4, ripple: 5, swirl: 6, sphere: 7,
};

export const DitheringTypes = {
  random: 1, "2x2": 2, "4x4": 3, "8x8": 4,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex) {
  if (!hex || hex === "transparent") return [0, 0, 0, 0];
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return [0, 0, 0, 1];
  return [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255, 1];
}

function makeShader(gl, type, src) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function makeProgram(gl) {
  const vs = makeShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = makeShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Program error:", gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DitheringShader({
  width,
  height,
  colorBack  = "#000000",
  colorFront = "#ffffff",
  shape      = "simplex",
  type       = "8x8",
  pxSize     = 4,
  speed      = 1,
  style      = {},
}) {
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const progRef     = useRef(null);
  const glRef       = useRef(null);
  const uniformsRef = useRef({});
  const t0Ref       = useRef(Date.now());
  const sizeRef     = useRef({ w: width || window.innerWidth, h: height || window.innerHeight });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initW = width  || window.innerWidth;
    const initH = height || window.innerHeight;
    sizeRef.current = { w: initW, h: initH };

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false });
    if (!gl) { console.error("WebGL2 not supported"); return; }
    glRef.current = gl;

    const prog = makeProgram(gl);
    if (!prog) return;
    progRef.current = prog;

    uniformsRef.current = {
      u_time:       gl.getUniformLocation(prog, "u_time"),
      u_resolution: gl.getUniformLocation(prog, "u_resolution"),
      u_colorBack:  gl.getUniformLocation(prog, "u_colorBack"),
      u_colorFront: gl.getUniformLocation(prog, "u_colorFront"),
      u_shape:      gl.getUniformLocation(prog, "u_shape"),
      u_type:       gl.getUniformLocation(prog, "u_type"),
      u_pxSize:     gl.getUniformLocation(prog, "u_pxSize"),
    };

    const loc = gl.getAttribLocation(prog, "a_position");
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    canvas.width  = initW;
    canvas.height = initH;
    gl.viewport(0, 0, initW, initH);

    const handleResize = () => {
      if (width || height) return;
      const nw = window.innerWidth, nh = window.innerHeight;
      canvas.width = nw; canvas.height = nh;
      gl.viewport(0, 0, nw, nh);
      sizeRef.current = { w: nw, h: nh };
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      const ctx  = glRef.current;
      const pr   = progRef.current;
      if (!ctx || !pr) return;

      const { w: cw, h: ch } = sizeRef.current;
      const t   = (Date.now() - t0Ref.current) * 0.001 * speed;
      const u   = uniformsRef.current;

      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.useProgram(pr);
      if (u.u_time)       ctx.uniform1f(u.u_time, t);
      if (u.u_resolution) ctx.uniform2f(u.u_resolution, cw, ch);
      if (u.u_colorBack)  ctx.uniform4fv(u.u_colorBack,  hexToRgba(colorBack));
      if (u.u_colorFront) ctx.uniform4fv(u.u_colorFront, hexToRgba(colorFront));
      if (u.u_shape)      ctx.uniform1f(u.u_shape,  DitheringShapes[shape] ?? 1);
      if (u.u_type)       ctx.uniform1f(u.u_type,   DitheringTypes[type]   ?? 4);
      if (u.u_pxSize)     ctx.uniform1f(u.u_pxSize, pxSize);
      ctx.drawArrays(ctx.TRIANGLES, 0, 6);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (glRef.current && progRef.current) glRef.current.deleteProgram(progRef.current);
    };
  }, [width, height, colorBack, colorFront, shape, type, pxSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}

export default DitheringShader;
