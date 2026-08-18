import { createNoise, type NoiseSampler } from "./noise";
import { getPalette, hexToRgb, type Palette } from "./palettes";
import { mulberry32 } from "./prng";
import type { FieldMode } from "./store";

export type EngineSettings = {
  seed: number;
  speed: number;
  trail: number;
  paletteId: string;
  density: number;
  scale: number;
  morph: number;
  fieldMode: FieldMode;
  paused: boolean;
};

const MAX_PARTICLES = 16000;
const CELL = 18;

export class FlowEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ro: ResizeObserver;
  private raf = 0;
  private running = false;
  private disposed = false;

  private cssW = 1;
  private cssH = 1;
  private dpr = 1;

  private settings: EngineSettings;
  private noise: NoiseSampler;
  private rng: () => number;
  private palette: Palette;
  private ink: string[] = [];
  private bgRgb: [number, number, number] = [7, 11, 16];

  private count = 0;
  private readonly x: Float32Array;
  private readonly y: Float32Array;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly color: Uint8Array;
  private readonly weight: Float32Array;

  private fieldW = 0;
  private fieldH = 0;
  private fieldX = new Float32Array(1);
  private fieldY = new Float32Array(1);
  private time = 0;
  private lastTs = 0;
  private pointer: { x: number; y: number } | null = null;
  private painting = false;

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings) {
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.canvas = canvas;
    this.ctx = ctx;
    this.settings = settings;
    this.noise = createNoise(settings.seed);
    this.rng = mulberry32(settings.seed ^ 0x9e3779b9);
    this.palette = getPalette(settings.paletteId);
    this.applyPalette(this.palette);

    this.x = new Float32Array(MAX_PARTICLES);
    this.y = new Float32Array(MAX_PARTICLES);
    this.px = new Float32Array(MAX_PARTICLES);
    this.py = new Float32Array(MAX_PARTICLES);
    this.life = new Float32Array(MAX_PARTICLES);
    this.maxLife = new Float32Array(MAX_PARTICLES);
    this.color = new Uint8Array(MAX_PARTICLES);
    this.weight = new Float32Array(MAX_PARTICLES);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.bindPointer();
  }

  apply(next: EngineSettings) {
    const prev = this.settings;
    this.settings = next;
    if (next.paletteId !== prev.paletteId) {
      this.palette = getPalette(next.paletteId);
      this.applyPalette(this.palette);
    }
    if (next.seed !== prev.seed) {
      this.noise = createNoise(next.seed);
      this.rng = mulberry32(next.seed ^ 0x9e3779b9);
      this.time = 0;
      this.clear(true);
      this.reseedParticles();
    } else if (next.density !== prev.density) {
      this.syncCount();
    }
    if (next.fieldMode !== prev.fieldMode || next.scale !== prev.scale) {
      this.buildField();
    }
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.unbindPointer();
  }

  clear(keepParticles = false) {
    const { ctx, cssW, cssH } = this;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.palette.bg;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.restore();
    if (!keepParticles) this.reseedParticles();
  }

  spawnAt(cssX: number, cssY: number, n = 64) {
    const { cssW, cssH } = this;
    for (let i = 0; i < n; i++) {
      const idx = (this.rng() * this.count) | 0;
      const a = this.rng() * Math.PI * 2;
      const r = Math.pow(this.rng(), 0.55) * 28;
      this.resetParticle(idx, cssX + Math.cos(a) * r, cssY + Math.sin(a) * r, cssW, cssH);
    }
  }

  async exportPng(filename: string): Promise<void> {
    const blob = await new Promise<Blob | null>((resolve) =>
      this.canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Could not encode PNG");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private applyPalette(palette: Palette) {
    this.ink = palette.ink.map((hex) => hex);
    this.bgRgb = hexToRgb(palette.bg);
  }

  private resize() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const rect = parent.getBoundingClientRect();
    const nextW = Math.max(1, Math.floor(rect.width));
    const nextH = Math.max(1, Math.floor(rect.height));
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const changed =
      nextW !== this.cssW || nextH !== this.cssH || nextDpr !== this.dpr;
    if (!changed && this.canvas.width) return;

    const snapshot = document.createElement("canvas");
    snapshot.width = this.canvas.width;
    snapshot.height = this.canvas.height;
    if (snapshot.width && snapshot.height) {
      snapshot.getContext("2d")?.drawImage(this.canvas, 0, 0);
    }

    this.cssW = nextW;
    this.cssH = nextH;
    this.dpr = nextDpr;
    this.canvas.width = Math.floor(nextW * nextDpr);
    this.canvas.height = Math.floor(nextH * nextDpr);
    this.canvas.style.width = `${nextW}px`;
    this.canvas.style.height = `${nextH}px`;

    const { ctx } = this;
    ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    ctx.fillStyle = this.palette.bg;
    ctx.fillRect(0, 0, nextW, nextH);
    if (snapshot.width && snapshot.height) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(snapshot, 0, 0, nextW, nextH);
    }

    this.buildField();
    this.syncCount();
  }

  private targetCount() {
    const area = this.cssW * this.cssH;
    const base = Math.floor(area / 58);
    return Math.max(1200, Math.min(MAX_PARTICLES, Math.floor(base * this.settings.density)));
  }

  private syncCount() {
    const next = this.targetCount();
    if (next > this.count) {
      for (let i = this.count; i < next; i++) {
        this.resetParticle(i, undefined, undefined, this.cssW, this.cssH);
      }
    }
    this.count = next;
  }

  private reseedParticles() {
    this.count = this.targetCount();
    for (let i = 0; i < this.count; i++) {
      this.resetParticle(i, undefined, undefined, this.cssW, this.cssH);
    }
  }

  private resetParticle(
    i: number,
    sx: number | undefined,
    sy: number | undefined,
    w: number,
    h: number,
  ) {
    const edge = this.rng();
    let x: number;
    let y: number;
    if (sx !== undefined && sy !== undefined) {
      x = sx;
      y = sy;
    } else if (edge < 0.22) {
      const side = (this.rng() * 4) | 0;
      if (side === 0) {
        x = this.rng() * w;
        y = 0;
      } else if (side === 1) {
        x = this.rng() * w;
        y = h;
      } else if (side === 2) {
        x = 0;
        y = this.rng() * h;
      } else {
        x = w;
        y = this.rng() * h;
      }
    } else {
      x = this.rng() * w;
      y = this.rng() * h;
    }
    this.x[i] = x;
    this.y[i] = y;
    this.px[i] = x;
    this.py[i] = y;
    const life = 90 + this.rng() * 280;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.color[i] = (this.rng() * this.ink.length) | 0;
    this.weight[i] = 0.45 + this.rng() * 1.15;
  }

  private buildField() {
    const cols = Math.ceil(this.cssW / CELL) + 2;
    const rows = Math.ceil(this.cssH / CELL) + 2;
    const size = cols * rows;
    if (size !== this.fieldX.length) {
      this.fieldX = new Float32Array(size);
      this.fieldY = new Float32Array(size);
    }
    this.fieldW = cols;
    this.fieldH = rows;
    this.sampleField();
  }

  private sampleField() {
    const { fieldW: cols, fieldH: rows, noise, time } = this;
    const scale = 0.0009 + (this.settings.scale / 100) * 0.0074;
    const mode = this.settings.fieldMode;
    const z = time;
    const eps = 0.85;

    for (let j = 0; j < rows; j++) {
      const y = j * CELL;
      for (let i = 0; i < cols; i++) {
        const x = i * CELL;
        const idx = j * cols + i;
        if (mode === "curl") {
          const n1 = noise.fbm3(x * scale, (y + eps) * scale, z, 3);
          const n2 = noise.fbm3(x * scale, (y - eps) * scale, z, 3);
          const n3 = noise.fbm3((x + eps) * scale, y * scale, z, 3);
          const n4 = noise.fbm3((x - eps) * scale, y * scale, z, 3);
          let vx = (n1 - n2) / (2 * eps);
          let vy = -(n3 - n4) / (2 * eps);
          const mag = Math.hypot(vx, vy) || 1;
          this.fieldX[idx] = vx / mag;
          this.fieldY[idx] = vy / mag;
        } else {
          const n = noise.fbm3(x * scale, y * scale, z, 3);
          const a = n * Math.PI * 2;
          this.fieldX[idx] = Math.cos(a);
          this.fieldY[idx] = Math.sin(a);
        }
      }
    }
  }

  private sampleVec(px: number, py: number): [number, number] {
    const gx = px / CELL;
    const gy = py / CELL;
    const x0 = Math.max(0, Math.min(this.fieldW - 2, Math.floor(gx)));
    const y0 = Math.max(0, Math.min(this.fieldH - 2, Math.floor(gy)));
    const tx = Math.min(1, Math.max(0, gx - x0));
    const ty = Math.min(1, Math.max(0, gy - y0));
    const i00 = y0 * this.fieldW + x0;
    const i10 = i00 + 1;
    const i01 = i00 + this.fieldW;
    const i11 = i01 + 1;
    const a = 1 - tx;
    const b = 1 - ty;
    const vx =
      this.fieldX[i00]! * a * b +
      this.fieldX[i10]! * tx * b +
      this.fieldX[i01]! * a * ty +
      this.fieldX[i11]! * tx * ty;
    const vy =
      this.fieldY[i00]! * a * b +
      this.fieldY[i10]! * tx * b +
      this.fieldY[i01]! * a * ty +
      this.fieldY[i11]! * tx * ty;
    return [vx, vy];
  }

  private tick = (ts: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    if (this.settings.paused) return;
    if (document.hidden) return;

    const morph = (this.settings.morph / 100) * 0.22;
    if (morph > 0.0001) {
      this.time += dt * morph;
      this.sampleField();
    }

    if (this.painting && this.pointer) {
      this.spawnAt(this.pointer.x, this.pointer.y, 28);
    }

    this.stepAndDraw(dt);
  };

  private stepAndDraw(dt: number) {
    const { ctx, cssW, cssH, count, ink } = this;
    const speed = this.settings.speed * 62 * dt;
    const fade = fadeFromTrail(this.settings.trail);
    const [br, bg, bb] = this.bgRgb;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${br},${bg},${bb},${fade})`;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const fine: number[][] = ink.map(() => []);
    const thick: number[][] = ink.map(() => []);
    for (let i = 0; i < count; i++) {
      this.life[i] -= 1;
      if (
        this.life[i]! <= 0 ||
        this.x[i]! < -12 ||
        this.y[i]! < -12 ||
        this.x[i]! > cssW + 12 ||
        this.y[i]! > cssH + 12
      ) {
        this.resetParticle(i, undefined, undefined, cssW, cssH);
        continue;
      }
      this.px[i] = this.x[i]!;
      this.py[i] = this.y[i]!;
      const [vx, vy] = this.sampleVec(this.x[i]!, this.y[i]!);
      this.x[i] += vx * speed;
      this.y[i] += vy * speed;
      const ci = this.color[i]! % ink.length;
      if (this.weight[i]! > 1) thick[ci]!.push(i);
      else fine[ci]!.push(i);
    }

    this.strokeBucket(fine, ink, 0.75, 0.48);
    this.strokeBucket(thick, ink, 1.35, 0.34);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private strokeBucket(
    buckets: number[][],
    ink: string[],
    width: number,
    alpha: number,
  ) {
    const { ctx } = this;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    for (let c = 0; c < ink.length; c++) {
      const list = buckets[c]!;
      if (!list.length) continue;
      ctx.beginPath();
      ctx.strokeStyle = ink[c]!;
      for (let n = 0; n < list.length; n++) {
        const i = list[n]!;
        ctx.moveTo(this.px[i]!, this.py[i]!);
        ctx.lineTo(this.x[i]!, this.y[i]!);
      }
      ctx.stroke();
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const p = this.eventToCanvas(e);
    this.pointer = p;
    this.painting = true;
    this.spawnAt(p.x, p.y, 90);
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    this.pointer = this.eventToCanvas(e);
  };

  private onPointerUp = (e: PointerEvent) => {
    this.painting = false;
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }
  };

  private eventToCanvas(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private bindPointer() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("lostpointercapture", this.onPointerUp);
  }

  private unbindPointer() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("lostpointercapture", this.onPointerUp);
  }
}

function fadeFromTrail(trail: number): number {
  const t = Math.min(100, Math.max(0, trail)) / 100;
  return 0.002 + Math.pow(1 - t, 2.15) * 0.2;
}
