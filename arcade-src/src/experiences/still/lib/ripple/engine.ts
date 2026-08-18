import type { ColorMapId, RippleParams } from "./types";
import { DEFAULT_PARAMS } from "./types";

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const SIM_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uDamping;
uniform float uC2;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec4 c = texture(uState, uv);
  float h = c.r;
  float hOld = c.g;
  float l = texture(uState, uv - vec2(uTexel.x, 0.0)).r;
  float r = texture(uState, uv + vec2(uTexel.x, 0.0)).r;
  float t = texture(uState, uv + vec2(0.0, uTexel.y)).r;
  float b = texture(uState, uv - vec2(0.0, uTexel.y)).r;
  float lap = (l + r + t + b) - 4.0 * h;
  float hNew = (2.0 * h - hOld) * uDamping + uC2 * lap;
  hNew *= 0.9992;
  hNew = clamp(hNew, -2.4, 2.4);
  fragColor = vec4(hNew, h, 0.0, 1.0);
}
`;

const DROP_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uPoint;
uniform float uAmp;
uniform float uRadius;
uniform float uAspect;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec4 c = texture(uState, uv);
  vec2 d = (uv - uPoint) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) / max(uRadius * uRadius, 1e-6));
  fragColor = vec4(c.r + uAmp * g, c.g, 0.0, 1.0);
}
`;

const CLEAR_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0);
}
`;

const DRAW_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uResolution;
uniform int uColorMap;
uniform float uTime;
out vec4 fragColor;

vec3 cmapAbyss(float t) {
  vec3 deep = vec3(0.016, 0.028, 0.045);
  vec3 mid = vec3(0.06, 0.14, 0.20);
  vec3 rim = vec3(0.42, 0.62, 0.68);
  vec3 foam = vec3(0.86, 0.90, 0.92);
  if (t < 0.48) return mix(deep, mid, t / 0.48);
  if (t < 0.74) return mix(mid, rim, (t - 0.48) / 0.26);
  return mix(rim, foam, (t - 0.74) / 0.26);
}

vec3 cmapThermal(float t) {
  vec3 a = vec3(0.03, 0.02, 0.04);
  vec3 b = vec3(0.42, 0.05, 0.08);
  vec3 c = vec3(0.86, 0.32, 0.06);
  vec3 d = vec3(0.98, 0.86, 0.42);
  vec3 e = vec3(0.99, 0.97, 0.92);
  if (t < 0.28) return mix(a, b, t / 0.28);
  if (t < 0.52) return mix(b, c, (t - 0.28) / 0.24);
  if (t < 0.78) return mix(c, d, (t - 0.52) / 0.26);
  return mix(d, e, (t - 0.78) / 0.22);
}

vec3 cmapAurora(float t) {
  vec3 a = vec3(0.02, 0.04, 0.06);
  vec3 b = vec3(0.04, 0.22, 0.24);
  vec3 c = vec3(0.10, 0.55, 0.48);
  vec3 d = vec3(0.55, 0.82, 0.62);
  vec3 e = vec3(0.86, 0.94, 0.90);
  if (t < 0.3) return mix(a, b, t / 0.3);
  if (t < 0.55) return mix(b, c, (t - 0.3) / 0.25);
  if (t < 0.8) return mix(c, d, (t - 0.55) / 0.25);
  return mix(d, e, (t - 0.8) / 0.2);
}

vec3 cmapInk(float t) {
  vec3 a = vec3(0.05, 0.05, 0.045);
  vec3 b = vec3(0.16, 0.16, 0.15);
  vec3 c = vec3(0.62, 0.61, 0.58);
  vec3 d = vec3(0.93, 0.92, 0.88);
  if (t < 0.4) return mix(a, b, t / 0.4);
  if (t < 0.72) return mix(b, c, (t - 0.4) / 0.32);
  return mix(c, d, (t - 0.72) / 0.28);
}

vec3 cmapEmber(float t) {
  vec3 a = vec3(0.04, 0.025, 0.02);
  vec3 b = vec3(0.22, 0.07, 0.04);
  vec3 c = vec3(0.62, 0.22, 0.08);
  vec3 d = vec3(0.92, 0.58, 0.32);
  vec3 e = vec3(0.98, 0.90, 0.78);
  if (t < 0.3) return mix(a, b, t / 0.3);
  if (t < 0.55) return mix(b, c, (t - 0.3) / 0.25);
  if (t < 0.8) return mix(c, d, (t - 0.55) / 0.25);
  return mix(d, e, (t - 0.8) / 0.2);
}

vec3 cmapIce(float t) {
  vec3 a = vec3(0.03, 0.05, 0.08);
  vec3 b = vec3(0.08, 0.18, 0.28);
  vec3 c = vec3(0.32, 0.58, 0.70);
  vec3 d = vec3(0.78, 0.90, 0.94);
  vec3 e = vec3(0.95, 0.98, 0.99);
  if (t < 0.32) return mix(a, b, t / 0.32);
  if (t < 0.58) return mix(b, c, (t - 0.32) / 0.26);
  if (t < 0.82) return mix(c, d, (t - 0.58) / 0.24);
  return mix(d, e, (t - 0.82) / 0.18);
}

vec3 colormap(float t, int id) {
  t = clamp(t, 0.0, 1.0);
  if (id == 1) return cmapThermal(t);
  if (id == 2) return cmapAurora(t);
  if (id == 3) return cmapInk(t);
  if (id == 4) return cmapEmber(t);
  if (id == 5) return cmapIce(t);
  return cmapAbyss(t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float h = texture(uState, uv).r;
  float hx = texture(uState, uv + vec2(uTexel.x, 0.0)).r - texture(uState, uv - vec2(uTexel.x, 0.0)).r;
  float hy = texture(uState, uv + vec2(0.0, uTexel.y)).r - texture(uState, uv - vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3(-hx * 10.0, -hy * 10.0, 1.0));
  vec3 light = normalize(vec3(-0.35, 0.62, 0.78));
  float ndotl = max(dot(n, light), 0.0);
  vec3 view = vec3(0.0, 0.0, 1.0);
  float spec = pow(max(dot(reflect(-light, n), view), 0.0), 42.0);
  float fres = pow(1.0 - max(n.z, 0.0), 3.0);

  float t = 0.5 + 0.5 * tanh(h * 2.1);
  vec3 base = colormap(t, uColorMap);
  vec3 col = base * (0.28 + 0.72 * ndotl);
  col += spec * vec3(0.85, 0.90, 0.94) * 0.55;
  col += fres * base * 0.22;
  col += abs(h) * 0.04;

  float grain = fract(sin(dot(gl_FragCoord.xy + uTime * 12.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.018;

  float vig = smoothstep(1.15, 0.35, length((uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0)));
  col *= mix(0.72, 1.0, vig);

  fragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.92)), 1.0);
}
`;

const COLOR_INDEX: Record<ColorMapId, number> = {
  abyss: 0,
  thermal: 1,
  aurora: 2,
  ink: 3,
  ember: 4,
  ice: 5,
};

type Program = {
  prog: WebGLProgram;
  loc: Record<string, WebGLUniformLocation | null>;
};

type Target = {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("Unable to create shader");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "shader compile failed";
    gl.deleteShader(sh);
    throw new Error(log);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vert: string, frag: string, uniforms: string[]): Program {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  if (!prog) throw new Error("Unable to create program");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) ?? "program link failed";
    gl.deleteProgram(prog);
    throw new Error(log);
  }
  const loc: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniforms) loc[name] = gl.getUniformLocation(prog, name);
  return { prog, loc };
}

export class RippleEngine {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private vao: WebGLVertexArrayObject;
  private sim: Program;
  private drop: Program;
  private clearProg: Program;
  private draw: Program;
  private a: Target;
  private b: Target;
  private readA = true;
  private simW = 1;
  private simH = 1;
  private params: RippleParams = { ...DEFAULT_PARAMS };
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private ro: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL2 is required for Still.");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("EXT_float_blend");

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Unable to create VAO");
    this.vao = vao;
    gl.bindVertexArray(vao);

    this.sim = link(gl, VERT, SIM_FRAG, ["uState", "uTexel", "uDamping", "uC2"]);
    this.drop = link(gl, VERT, DROP_FRAG, ["uState", "uTexel", "uPoint", "uAmp", "uRadius", "uAspect"]);
    this.clearProg = link(gl, VERT, CLEAR_FRAG, []);
    this.draw = link(gl, VERT, DRAW_FRAG, ["uState", "uTexel", "uResolution", "uColorMap", "uTime"]);

    this.a = this.makeTarget(1, 1);
    this.b = this.makeTarget(1, 1);
    this.resize();
    this.seed();
  }

  setParams(next: Partial<RippleParams>) {
    this.params = { ...this.params, ...next };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.1);
      this.last = now;
      this.acc += dt;
      const step = 1 / 60;
      let n = 0;
      while (this.acc >= step && n < 3) {
        this.stepSim();
        this.acc -= step;
        n += 1;
      }
      this.render(now / 1000);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);

    const parent = this.canvas.parentElement ?? this.canvas;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(parent);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.ro = null;
  }

  destroy() {
    this.stop();
    const gl = this.gl;
    this.deleteTarget(this.a);
    this.deleteTarget(this.b);
    gl.deleteProgram(this.sim.prog);
    gl.deleteProgram(this.drop.prog);
    gl.deleteProgram(this.clearProg.prog);
    gl.deleteProgram(this.draw.prog);
    gl.deleteVertexArray(this.vao);
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  }

  clear() {
    this.pass(this.clearProg, this.a, null);
    this.pass(this.clearProg, this.b, null);
  }

  disturb(nx: number, ny: number, force = 1) {
    const strength = 0.045 + this.params.strength * 0.62;
    const radius = 0.016 + (1 - this.params.strength) * 0.01;
    const amp = strength * force * (0.55 + (1 - this.params.viscosity) * 0.45);
    this.addDrop(nx, 1 - ny, amp, radius);
  }

  private seed() {
    this.addDrop(0.5, 0.52, 0.42, 0.028);
    this.addDrop(0.38, 0.44, 0.18, 0.02);
    this.addDrop(0.64, 0.58, 0.14, 0.018);
  }

  private addDrop(x: number, y: number, amp: number, radius: number) {
    const src = this.readA ? this.a : this.b;
    const dst = this.readA ? this.b : this.a;
    const gl = this.gl;
    gl.useProgram(this.drop.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, this.simW, this.simH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(this.drop.loc.uState, 0);
    gl.uniform2f(this.drop.loc.uTexel, 1 / this.simW, 1 / this.simH);
    gl.uniform2f(this.drop.loc.uPoint, x, y);
    gl.uniform1f(this.drop.loc.uAmp, amp);
    gl.uniform1f(this.drop.loc.uRadius, radius);
    gl.uniform1f(this.drop.loc.uAspect, this.simW / this.simH);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.readA = !this.readA;
  }

  private stepSim() {
    const src = this.readA ? this.a : this.b;
    const dst = this.readA ? this.b : this.a;
    const v = this.params.viscosity;
    const damping = 0.9975 - v * 0.07;
    const c2 = 0.38 * (1 - v * 0.62);
    const gl = this.gl;
    gl.useProgram(this.sim.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, this.simW, this.simH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(this.sim.loc.uState, 0);
    gl.uniform2f(this.sim.loc.uTexel, 1 / this.simW, 1 / this.simH);
    gl.uniform1f(this.sim.loc.uDamping, damping);
    gl.uniform1f(this.sim.loc.uC2, c2);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.readA = !this.readA;
  }

  private render(time: number) {
    const src = this.readA ? this.a : this.b;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.draw.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(this.draw.loc.uState, 0);
    gl.uniform2f(this.draw.loc.uTexel, 1 / this.simW, 1 / this.simH);
    gl.uniform2f(this.draw.loc.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1i(this.draw.loc.uColorMap, COLOR_INDEX[this.params.colorMap]);
    gl.uniform1f(this.draw.loc.uTime, time);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  private pass(program: Program, dst: Target, src: Target | null) {
    const gl = this.gl;
    gl.useProgram(program.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, this.simW, this.simH);
    if (src) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
    }
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize() {
    const canvas = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, canvas.clientWidth || window.innerWidth);
    const cssH = Math.max(1, canvas.clientHeight || window.innerHeight);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const maxDim = cssW < 480 ? 384 : 560;
    const aspect = cssW / cssH;
    let simW: number;
    let simH: number;
    if (aspect >= 1) {
      simW = maxDim;
      simH = Math.max(96, Math.round(maxDim / aspect));
    } else {
      simH = maxDim;
      simW = Math.max(96, Math.round(maxDim * aspect));
    }
    if (simW === this.simW && simH === this.simH && this.a.tex) return;

    this.simW = simW;
    this.simH = simH;
    this.deleteTarget(this.a);
    this.deleteTarget(this.b);
    this.a = this.makeTarget(simW, simH);
    this.b = this.makeTarget(simW, simH);
    this.readA = true;
  }

  private makeTarget(w: number, h: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) throw new Error("Unable to allocate surface");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Surface buffer is incomplete");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo };
  }

  private deleteTarget(t: Target) {
    const gl = this.gl;
    if (t.tex) gl.deleteTexture(t.tex);
    if (t.fbo) gl.deleteFramebuffer(t.fbo);
  }
}
