import { cachedHex, lerp, lerpRgb, mixHex, rgbToCss } from "./color";
import { generateParticles } from "./generate";
import type { Palette } from "./palettes";
import type { OverlayMode, Particle, TreeModel } from "./types";

export type DrawParams = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  model: TreeModel;
  angleDeg: number;
  lengthScale: number;
  wind: number;
  palette: Palette;
  overlay: OverlayMode;
  time: number;
  growT: number;
  reducedMotion: boolean;
  particles: Particle[];
  grain: CanvasPattern | null;
};

const GROW_SECONDS = 5.1;
const BRANCH_GROW = 0.42;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function makeGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const g = document.createElement("canvas");
  g.width = 128;
  g.height = 128;
  const gctx = g.getContext("2d");
  if (!gctx) return null;
  const img = gctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 70;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  gctx.putImageData(img, 0, 0);
  return ctx.createPattern(g, "repeat");
}

export function seedParticles(seed: number) {
  return generateParticles(seed);
}

export function drawScene(p: DrawParams) {
  const { ctx, width: w, height: h, palette } = p;
  ctx.clearRect(0, 0, w, h);
  drawSky(ctx, w, h, palette, p.time);
  drawGround(ctx, w, h, palette);
  drawTree(p);
  drawParticles(p);
  if (p.grain) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = p.grain;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: Palette,
  time: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(0.38, palette.sky[1]);
  sky.addColorStop(0.72, palette.sky[2]);
  sky.addColorStop(1, palette.sky[3]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunY = h * palette.sunY;
  const sunX = w * 0.72;
  const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, h * 0.55);
  glow.addColorStop(0, mixHex(palette.sun, palette.sun, 0, 0.95));
  glow.addColorStop(0.12, mixHex(palette.sunGlow, palette.sun, 0.3, 0.45));
  glow.addColorStop(0.45, mixHex(palette.sunGlow, palette.sky[2], 0.4, 0.12));
  glow.addColorStop(1, mixHex(palette.sunGlow, palette.sky[2], 0.4, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.fillStyle = palette.sun;
  ctx.globalAlpha = 0.95;
  ctx.arc(sunX, sunY, Math.max(10, h * 0.028), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (palette.stars) {
    const rng = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    ctx.fillStyle = "#e8eef2";
    for (let i = 0; i < 70; i++) {
      const x = rng(i + 1) * w;
      const y = rng(i + 17) * h * 0.55;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(time * 1.3 + i));
      ctx.globalAlpha = 0.15 + tw * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + rng(i + 33) * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const haze = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.86);
  haze.addColorStop(0, mixHex(palette.haze, palette.sky[3], 0.4, 0));
  haze.addColorStop(0.5, mixHex(palette.haze, palette.sky[3], 0.3, 0.16));
  haze.addColorStop(1, mixHex(palette.haze, palette.sky[3], 0.2, 0.05));
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.5, w, h * 0.4);
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: Palette,
) {
  const gy = h * 0.835;
  const g = ctx.createLinearGradient(0, gy, 0, h);
  g.addColorStop(0, palette.groundTop);
  g.addColorStop(1, palette.ground);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, gy + 8);
  ctx.quadraticCurveTo(w * 0.25, gy - 10, w * 0.5, gy + 4);
  ctx.quadraticCurveTo(w * 0.75, gy + 18, w, gy);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = mixHex(palette.grass, palette.groundTop, 0.3, 0.55);
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  const step = Math.max(7, w / 90);
  for (let x = 0; x < w; x += step) {
    const base = gy + Math.sin(x * 0.04) * 6 + (x / w) * 10;
    const hh = 6 + ((x * 13) % 11);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x - 2, base - hh * 0.6, x + 1.5, base - hh);
    ctx.stroke();
  }
}

function drawTree(p: DrawParams) {
  const { ctx, width: w, height: h, model, palette } = p;
  const n = model.branches.length;
  const x0 = new Float32Array(n);
  const y0 = new Float32Array(n);
  const x1 = new Float32Array(n);
  const y1 = new Float32Array(n);
  const cx = new Float32Array(n);
  const cy = new Float32Array(n);
  const heading = new Float32Array(n);
  const grow = new Float32Array(n);

  const groundY = h * 0.835;
  const originX = w * (w < 720 ? 0.5 : 0.56);
  const originY = groundY + 6;
  const scale = h * 0.195 * p.lengthScale * (w < 720 ? 0.92 : 1);
  const angleRad = (p.angleDeg * Math.PI) / 180;
  const gust = 0.62 + 0.38 * Math.sin(p.time * 0.47);
  const windK = p.reducedMotion ? p.wind * 0.15 : p.wind;

  for (let i = 0; i < n; i++) {
    const b = model.branches[i]!;
    const start = (b.dist / model.maxDist) * (GROW_SECONDS - BRANCH_GROW);
    let g = p.reducedMotion ? 1 : clamp((p.growT - start) / BRANCH_GROW, 0, 1);
    g = easeOutCubic(g);

    const parentG = b.parent < 0 ? 1 : grow[b.parent]!;
    if (b.parent >= 0 && parentG < 0.62) g = 0;
    grow[i] = g;

    const parentH = b.parent < 0 ? -Math.PI / 2 : heading[b.parent]!;
    const px = b.parent < 0 ? originX : x1[b.parent]!;
    const py = b.parent < 0 ? originY : y1[b.parent]!;

    const levelF = b.level / Math.max(1, model.maxLevel);
    const wind =
      Math.sin(p.time * 1.05 + b.phase + px * 0.004) *
      b.amp *
      windK *
      gust *
      (0.2 + levelF * 1.55);

    // Soft upward tropism so the crown lifts instead of flopping.
    const desired = parentH + b.angleFactor * angleRad + b.angleJitter + wind;
    const upPull = ( -Math.PI / 2 - desired) * (0.08 + (1 - levelF) * 0.06);
    const hd = desired + upPull;
    heading[i] = hd;

    const len = b.length * scale * g;
    const nx = -Math.sin(hd);
    const ny = Math.cos(hd);
    x0[i] = px;
    y0[i] = py;
    x1[i] = px + Math.cos(hd) * len;
    y1[i] = py + Math.sin(hd) * len;
    cx[i] = (x0[i]! + x1[i]!) * 0.5 + nx * b.curve * len;
    cy[i] = (y0[i]! + y1[i]!) * 0.5 + ny * b.curve * len;
  }

  // Ground shadow
  const shadow = ctx.createRadialGradient(originX, groundY, 4, originX, groundY, scale * 1.15);
  shadow.addColorStop(0, "rgba(0,0,0,0.38)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(originX, groundY + 4, scale * 0.85, scale * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const dark = cachedHex(palette.barkDark);
  const light = cachedHex(palette.barkLight);
  const trunkW = Math.max(11, Math.min(w, h) * 0.02);

  for (let i = 0; i < n; i++) {
    if (grow[i]! <= 0.002) continue;
    const b = model.branches[i]!;
    const t = clamp(b.level / model.maxLevel + b.hueJitter * 0.4, 0, 1);
    const col = lerpRgb(dark, light, t);
    const width = Math.max(0.7, b.width * trunkW * (0.55 + 0.45 * grow[i]!));

    ctx.strokeStyle = rgbToCss(col);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0[i]!, y0[i]!);
    ctx.quadraticCurveTo(cx[i]!, cy[i]!, x1[i]!, y1[i]!);
    ctx.stroke();
  }

  const showLeaves = p.overlay === "leaves" || p.overlay === "both";
  const showBlossoms = p.overlay === "blossoms" || p.overlay === "both";
  if (!showLeaves && !showBlossoms) return;

  for (let i = 0; i < n; i++) {
    const b = model.branches[i]!;
    if (!b.tip || grow[i]! < 0.82) continue;
    const appear = easeOutCubic(clamp((grow[i]! - 0.82) / 0.18, 0, 1));
    const flutter = 1 + Math.sin(p.time * 2.1 + b.leafPhase) * 0.05 * (p.reducedMotion ? 0 : 1);
    const size = (5.5 + (1 - b.level / model.maxLevel) * 3.5) * appear * flutter * (h / 820);

    if (showLeaves) {
      for (let k = 0; k < b.leafCount; k++) {
        const a = heading[i]! + (k - (b.leafCount - 1) / 2) * 0.7 + Math.sin(p.time + b.phase + k) * 0.12 * windK;
        const along = 0.15 + k * 0.12;
        const lx = lerp(x0[i]!, x1[i]!, 0.72 + along * 0.2);
        const ly = lerp(y0[i]!, y1[i]!, 0.72 + along * 0.2);
        const col = mixHex(palette.leafA, palette.leafB, (k / Math.max(1, b.leafCount)) * 0.7 + b.hueJitter);
        drawLeaf(ctx, lx, ly, a, size * (0.85 + (k % 3) * 0.12), col, appear);
      }
    }

    if (showBlossoms) {
      for (let k = 0; k < b.blossomCount; k++) {
        const a = heading[i]! + k * 0.9 + b.leafPhase;
        const bx = x1[i]! + Math.cos(a) * size * 0.7;
        const by = y1[i]! + Math.sin(a) * size * 0.7;
        const petal = mixHex(palette.blossomA, palette.blossomB, (k + b.hueJitter) * 0.5);
        drawBlossom(ctx, bx, by, a + p.time * 0.15, size * 0.72, petal, palette.blossomCenter, appear);
      }
    }
  }
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.82 * alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.35, -size * 0.38, size * 0.8, -size * 0.18, size, 0);
  ctx.bezierCurveTo(size * 0.8, size * 0.18, size * 0.35, size * 0.38, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawBlossom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  petal: string,
  center: string,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.9 * alpha;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.ellipse(size * 0.42, 0, size * 0.42, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(p: DrawParams) {
  const { ctx, width: w, height: h, palette, time, wind } = p;
  ctx.fillStyle = palette.particle;
  for (const pt of p.particles) {
    const drift = time * pt.s * (0.4 + wind);
    const x = ((pt.x + drift * 0.035) % 1) * w;
    const y = ((pt.y + Math.sin(time * 0.4 + pt.phase) * 0.03) % 1) * h * 0.82;
    ctx.globalAlpha = 0.18 + 0.35 * (0.5 + 0.5 * Math.sin(time + pt.phase));
    ctx.beginPath();
    ctx.arc(x, y, pt.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export { GROW_SECONDS };
