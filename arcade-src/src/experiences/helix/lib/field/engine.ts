import {
  BACKGROUND_BY_ID,
  PALETTE_BY_ID,
  type FieldBackgroundId,
  type FieldPalette,
  type FieldPaletteId,
} from "./theme";

export type EngineSettings = {
  count: number;
  force: number;
  trail: number;
  background: FieldBackgroundId;
  palette: FieldPaletteId;
};

type Pulse = {
  x: number;
  y: number;
  age: number;
  life: number;
  radius: number;
};

const CAP = 14000;
const HUE_STEPS = 72;
const SPRITE = 48;
const SPARK_CAP = 220;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function makeGlowSprite(h: number, s: number, l: number, light: boolean) {
  const c = document.createElement("canvas");
  c.width = SPRITE;
  c.height = SPRITE;
  const g = c.getContext("2d")!;
  const mid = SPRITE / 2;
  const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  if (light) {
    grad.addColorStop(0, `hsla(${h} ${s}% ${Math.max(18, l - 28)}% / 0.95)`);
    grad.addColorStop(0.22, `hsla(${h} ${s}% ${Math.max(14, l - 34)}% / 0.55)`);
    grad.addColorStop(0.55, `hsla(${h} ${s}% ${Math.max(10, l - 40)}% / 0.16)`);
    grad.addColorStop(1, `hsla(${h} ${s}% ${l}% / 0)`);
  } else {
    grad.addColorStop(0, `hsla(${h} ${Math.min(100, s + 8)}% ${Math.min(92, l + 22)}% / 1)`);
    grad.addColorStop(0.18, `hsla(${h} ${s}% ${l}% / 0.85)`);
    grad.addColorStop(0.46, `hsla(${h} ${s}% ${Math.max(30, l - 8)}% / 0.28)`);
    grad.addColorStop(1, `hsla(${h} ${s}% ${l}% / 0)`);
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  return c;
}

function bakeSprites(palette: FieldPalette, light: boolean) {
  const out: HTMLCanvasElement[] = new Array(HUE_STEPS);
  for (let i = 0; i < HUE_STEPS; i++) {
    const hue = (palette.hue + (i / HUE_STEPS) * palette.spread) % 360;
    out[i] = makeGlowSprite(hue, palette.sat, palette.lit, light);
  }
  return out;
}

export class ParticleField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private running = false;
  private last = 0;

  private w = 1;
  private h = 1;
  private dpr = 1;

  private x = new Float32Array(CAP);
  private y = new Float32Array(CAP);
  private vx = new Float32Array(CAP);
  private vy = new Float32Array(CAP);
  private hue = new Float32Array(CAP);
  private size = new Float32Array(CAP);

  private sx = new Float32Array(SPARK_CAP);
  private sy = new Float32Array(SPARK_CAP);
  private svx = new Float32Array(SPARK_CAP);
  private svy = new Float32Array(SPARK_CAP);
  private slife = new Float32Array(SPARK_CAP);
  private shue = new Float32Array(SPARK_CAP);
  private sparkN = 0;

  private count = 4200;
  private force = 1;
  private trail = 0.72;
  private bgId: FieldBackgroundId = "void";
  private paletteId: FieldPaletteId = "ember";
  private sprites: HTMLCanvasElement[] = [];
  private light = false;
  private bgRgb: [number, number, number] = [5, 5, 6];

  private px = 0;
  private py = 0;
  private pvx = 0;
  private pvy = 0;
  private hasPointer = false;
  private down = false;
  private pulses: Pulse[] = [];

  private reduced = false;
  private skipSoft = false;
  private frameMs = 16;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.rebuildSprites();
    this.resize();
    this.seedAll();
  }

  setSettings(next: EngineSettings) {
    const paletteChanged = next.palette !== this.paletteId;
    const bgChanged = next.background !== this.bgId;
    const countChanged = next.count !== this.count;

    this.force = next.force;
    this.trail = next.trail;
    this.bgId = next.background;
    this.paletteId = next.palette;

    const bg = BACKGROUND_BY_ID[this.bgId];
    this.bgRgb = bg.rgb;
    this.light = bg.light;

    if (paletteChanged || bgChanged) this.rebuildSprites();
    if (countChanged) this.setCount(next.count);
  }

  setPointer(x: number, y: number, down: boolean, vx: number, vy: number) {
    this.px = x;
    this.py = y;
    this.pvx = vx;
    this.pvy = vy;
    this.down = down;
    this.hasPointer = true;
  }

  clearPointer() {
    this.hasPointer = false;
    this.down = false;
    this.pvx = 0;
    this.pvy = 0;
  }

  pulseAt(x: number, y: number) {
    this.pulses.push({ x, y, age: 0, life: 0.55, radius: 18 });
    if (this.pulses.length > 6) this.pulses.shift();

    const boost = 220 * this.force;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const dx = this.x[i] - x;
      const dy = this.y[i] - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 220 * 220) continue;
      const d = Math.sqrt(d2) + 8;
      const k = boost / d;
      this.vx[i] += (dx / d) * k;
      this.vy[i] += (dy / d) * k;
    }

    this.emitSparks(x, y, 28, 280);
  }

  clearTrails() {
    const { ctx, canvas, bgRgb } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(${bgRgb[0]} ${bgRgb[1]} ${bgRgb[2]})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  resetParticles() {
    this.seedAll();
    this.sparkN = 0;
    this.pulses.length = 0;
    this.clearTrails();
  }

  capture(): string {
    return this.canvas.toDataURL("image/png");
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const nextDpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (w === this.w && h === this.h && nextDpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = nextDpr;
    this.canvas.width = Math.floor(w * nextDpr);
    this.canvas.height = Math.floor(h * nextDpr);
    this.ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    this.clearTrails();
  }

  private rebuildSprites() {
    const palette = PALETTE_BY_ID[this.paletteId];
    this.sprites = bakeSprites(palette, this.light);
  }

  private setCount(next: number) {
    const n = clamp(Math.round(next), 1, CAP);
    if (n > this.count) {
      for (let i = this.count; i < n; i++) this.seed(i);
    }
    this.count = n;
  }

  private seedAll() {
    for (let i = 0; i < this.count; i++) this.seed(i);
  }

  private seed(i: number) {
    this.x[i] = Math.random() * this.w;
    this.y[i] = Math.random() * this.h;
    this.vx[i] = (Math.random() - 0.5) * 28;
    this.vy[i] = (Math.random() - 0.5) * 28;
    this.hue[i] = Math.random();
    this.size[i] = 0.7 + Math.random() * 2.05;
  }

  private emitSparks(x: number, y: number, n: number, speed: number) {
    const room = SPARK_CAP - this.sparkN;
    const add = Math.min(n, room);
    for (let i = 0; i < add; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random());
      const k = this.sparkN++;
      this.sx[k] = x;
      this.sy[k] = y;
      this.svx[k] = Math.cos(a) * s;
      this.svy[k] = Math.sin(a) * s;
      this.slife[k] = 0.28 + Math.random() * 0.4;
      this.shue[k] = Math.random();
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
    dt = Math.min(dt, 0.05);
    this.frameMs = this.frameMs * 0.9 + dt * 1000 * 0.1;
    this.skipSoft = this.frameMs > 21;

    this.step(dt);
    this.draw(dt);
    this.raf = requestAnimationFrame(this.tick);
  };

  private step(dt: number) {
    const { w, h, count, force } = this;
    const attractorX = this.hasPointer ? this.px : w * 0.5;
    const attractorY = this.hasPointer ? this.py : h * 0.5;
    const hold = this.down ? 2.35 : 1;
    const swirlMul = (this.hasPointer ? 1 : 0.48) * hold * force;
    const pullMul = (this.hasPointer ? 1 : 0.2) * hold * force;
    const wakeX = this.hasPointer ? this.pvx : 0;
    const wakeY = this.hasPointer ? this.pvy : 0;
    const wakeMag = Math.hypot(wakeX, wakeY);
    const damp = Math.pow(0.965, dt * 60);
    const palette = PALETTE_BY_ID[this.paletteId];

    if (this.hasPointer && wakeMag > 80 && Math.random() < dt * 18) {
      this.emitSparks(this.px, this.py, 3, 90 + wakeMag * 0.15);
    }

    for (let i = 0; i < count; i++) {
      let x = this.x[i];
      let y = this.y[i];
      let vx = this.vx[i];
      let vy = this.vy[i];

      const dx = attractorX - x;
      const dy = attractorY - y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 12;
      const inv = 1 / dist;
      const nx = dx * inv;
      const ny = dy * inv;

      const falloff = force / (dist * 0.018 + 1);
      const pull = pullMul * falloff * 92;
      const swirl = swirlMul * falloff * 118;

      vx += (nx * pull + -ny * swirl) * dt;
      vy += (ny * pull + nx * swirl) * dt;

      if (wakeMag > 4 && dist < 240) {
        const wk = (1 - dist / 240) * 0.55 * dt;
        vx += wakeX * wk;
        vy += wakeY * wk;
      }

      vx *= damp;
      vy *= damp;

      const speed = Math.hypot(vx, vy);
      const max = 980;
      if (speed > max) {
        const s = max / speed;
        vx *= s;
        vy *= s;
      }

      x += vx * dt;
      y += vy * dt;

      if (x < -20) x = w + 20;
      else if (x > w + 20) x = -20;
      if (y < -20) y = h + 20;
      else if (y > h + 20) y = -20;

      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = vx;
      this.vy[i] = vy;

      if (palette.id === "prism") {
        const ang = Math.atan2(dy, dx);
        this.hue[i] = (ang / (Math.PI * 2) + 1) % 1;
      } else {
        const shift = clamp(speed / 520, 0, 1) * 0.35;
        this.hue[i] = (this.hue[i] * 0.994 + (0.15 + shift) * 0.006) % 1;
      }
    }

    let write = 0;
    for (let i = 0; i < this.sparkN; i++) {
      this.slife[i] -= dt;
      if (this.slife[i] <= 0) continue;
      this.sx[i] += this.svx[i] * dt;
      this.sy[i] += this.svy[i] * dt;
      this.svx[i] *= 0.9;
      this.svy[i] *= 0.9;
      if (write !== i) {
        this.sx[write] = this.sx[i];
        this.sy[write] = this.sy[i];
        this.svx[write] = this.svx[i];
        this.svy[write] = this.svy[i];
        this.slife[write] = this.slife[i];
        this.shue[write] = this.shue[i];
      }
      write++;
    }
    this.sparkN = write;

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.age += dt;
      p.radius += dt * 380;
      if (p.age >= p.life) this.pulses.splice(i, 1);
    }
  }

  private draw(dt: number) {
    const { ctx, w, h, bgRgb, trail, count, sprites } = this;
    void dt;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const fade = this.reduced
      ? 0.28
      : 0.035 + (1 - trail) * 0.22;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = fade;
    ctx.fillStyle = `rgb(${bgRgb[0]} ${bgRgb[1]} ${bgRgb[2]})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = this.light ? "multiply" : "lighter";

    const streakLimit = this.skipSoft ? 0 : count;
    const sizeBoost = this.skipSoft ? 0.82 : 1;

    for (let i = 0; i < count; i++) {
      const vx = this.vx[i];
      const vy = this.vy[i];
      const speed = Math.hypot(vx, vy);
      const idx = ((this.hue[i] * HUE_STEPS) | 0) % HUE_STEPS;
      const sprite = sprites[idx];
      const s = this.size[i] * (7.2 + Math.min(speed * 0.016, 9)) * sizeBoost;
      ctx.drawImage(sprite, this.x[i] - s * 0.5, this.y[i] - s * 0.5, s, s);

      if (speed > 220 && i < streakLimit && (i & 1) === 0) {
        const hue = (PALETTE_BY_ID[this.paletteId].hue +
          this.hue[i] * PALETTE_BY_ID[this.paletteId].spread) %
          360;
        ctx.strokeStyle = `hsla(${hue} 80% ${this.light ? 28 : 72}% / ${this.light ? 0.28 : 0.22})`;
        ctx.lineWidth = Math.min(2.2, 0.6 + this.size[i] * 0.4);
        ctx.beginPath();
        ctx.moveTo(this.x[i], this.y[i]);
        ctx.lineTo(this.x[i] - vx * 0.028, this.y[i] - vy * 0.028);
        ctx.stroke();
      }
    }

    for (let i = 0; i < this.sparkN; i++) {
      const idx = ((this.shue[i] * HUE_STEPS) | 0) % HUE_STEPS;
      const sprite = sprites[idx];
      const a = clamp(this.slife[i] / 0.4, 0, 1);
      const s = 10 * a;
      ctx.globalAlpha = a;
      ctx.drawImage(sprite, this.sx[i] - s * 0.5, this.sy[i] - s * 0.5, s, s);
    }
    ctx.globalAlpha = 1;

    this.drawPulses();
    this.drawCursor();
  }

  private drawPulses() {
    const { ctx } = this;
    ctx.globalCompositeOperation = this.light ? "multiply" : "lighter";
    for (const p of this.pulses) {
      const t = p.age / p.life;
      const alpha = (1 - t) * (this.light ? 0.28 : 0.45);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.light
        ? `rgba(40, 32, 24, ${alpha})`
        : `rgba(255, 236, 210, ${alpha})`;
      ctx.lineWidth = 1.6 * (1 - t) + 0.4;
      ctx.stroke();
    }
  }

  private drawCursor() {
    if (!this.hasPointer) return;
    const { ctx, px, py, down } = this;
    const r = down ? 16 : 11;
    ctx.globalCompositeOperation = this.light ? "multiply" : "lighter";
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.light
      ? "rgba(40, 32, 24, 0.45)"
      : "rgba(255, 244, 224, 0.55)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = this.light
      ? "rgba(28, 22, 16, 0.8)"
      : "rgba(255, 248, 236, 0.95)";
    ctx.fill();
  }
}
