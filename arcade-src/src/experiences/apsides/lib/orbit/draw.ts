import type { Body, Camera, LaunchGhost, OrbitWorld, Particle, Rgb, Shock } from "./sim";
import { worldToScreen } from "./sim";

export interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  layer: number;
}

export function makeStars(count: number): Star[] {
  const stars: Star[] = [];
  let seed = 0x51ed;
  const rnd = () => {
    seed = (seed * 16807 + 11) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rnd(),
      y: rnd(),
      r: rnd() * 1.15 + 0.25,
      a: 0.18 + rnd() * 0.55,
      layer: rnd() < 0.45 ? 0 : 1,
    });
  }
  return stars;
}

function rgba(c: Rgb, a: number): string {
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;
}

function shade(c: Rgb, k: number): Rgb {
  return {
    r: Math.max(0, Math.min(255, c.r * k)),
    g: Math.max(0, Math.min(255, c.g * k)),
    b: Math.max(0, Math.min(255, c.b * k)),
  };
}

function lighten(c: Rgb, k: number): Rgb {
  return {
    r: Math.min(255, c.r + (255 - c.r) * k),
    g: Math.min(255, c.g + (255 - c.g) * k),
    b: Math.min(255, c.b + (255 - c.b) * k),
  };
}

export interface DrawFrame {
  world: OrbitWorld;
  cam: Camera;
  width: number;
  height: number;
  dpr: number;
  stars: Star[];
  ghost: LaunchGhost | null;
  shakeX: number;
  shakeY: number;
  alpha: number;
}

export function drawFrame(ctx: CanvasRenderingContext2D, frame: DrawFrame) {
  const { world, cam, width, height, dpr, stars, ghost, shakeX, shakeY, alpha } = frame;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#07080b";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawStars(ctx, stars, cam, width, height);
  drawOrigin(ctx, cam, width, height);

  for (const body of world.bodies) {
    if (world.trailsEnabled) drawTrail(ctx, body, cam, width, height);
  }

  for (const shock of world.shocks) drawShock(ctx, shock, cam, width, height);
  for (const p of world.particles) drawParticle(ctx, p, cam, width, height);

  if (ghost) {
    drawGhostPath(ctx, ghost, cam, width, height);
    drawGhostBody(ctx, ghost, cam, width, height);
  }

  for (const body of world.bodies) {
    const ix = body.px + (body.x - body.px) * alpha;
    const iy = body.py + (body.y - body.py) * alpha;
    drawBody(ctx, body, ix, iy, cam, width, height);
  }

  ctx.restore();
  drawVignette(ctx, width, height);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  cam: Camera,
  w: number,
  h: number,
) {
  const par0 = cam.zoom * 0.08;
  const par1 = cam.zoom * 0.18;
  for (const s of stars) {
    const par = s.layer === 0 ? par0 : par1;
    const x = ((s.x * w - cam.x * par) % w + w) % w;
    const y = ((s.y * h - cam.y * par) % h + h) % h;
    ctx.fillStyle = `rgba(232,230,224,${s.a})`;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOrigin(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number) {
  const o = worldToScreen(0, 0, cam, w, h);
  ctx.strokeStyle = "rgba(232,238,242,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(o.x - 18, o.y);
  ctx.lineTo(o.x + 18, o.y);
  ctx.moveTo(o.x, o.y - 18);
  ctx.lineTo(o.x, o.y + 18);
  ctx.stroke();
}

function drawTrail(ctx: CanvasRenderingContext2D, body: Body, cam: Camera, w: number, h: number) {
  const n = body.trailCount;
  if (n < 2) return;
  const start = (body.trailHead - n + body.trailX.length) % body.trailX.length;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const groups = 12;
  const span = Math.max(1, Math.floor(n / groups));
  for (let g = 0; g < groups; g++) {
    const i0 = g * span;
    const i1 = g === groups - 1 ? n - 1 : Math.min(n - 1, (g + 1) * span);
    if (i1 <= i0) continue;
    const a = 0.05 + (g / groups) * 0.38;
    ctx.strokeStyle = rgba(body.color, a);
    ctx.lineWidth = Math.max(0.6, Math.min(2.4, body.radius * cam.zoom * 0.11));
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const idx = (start + i) % body.trailX.length;
      const p = worldToScreen(body.trailX[idx]!, body.trailY[idx]!, cam, w, h);
      if (i === i0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  body: Body,
  x: number,
  y: number,
  cam: Camera,
  w: number,
  h: number,
) {
  const p = worldToScreen(x, y, cam, w, h);
  const r = Math.max(1.4, body.radius * cam.zoom);

  const glowR = r * (body.kind === "star" ? 4.2 : 2.6);
  const glow = ctx.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, glowR);
  glow.addColorStop(0, rgba(body.color, body.kind === "star" ? 0.42 : 0.22));
  glow.addColorStop(1, rgba(body.color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  const hx = p.x - r * 0.32;
  const hy = p.y - r * 0.34;
  const ball = ctx.createRadialGradient(hx, hy, r * 0.08, p.x, p.y, r);
  ball.addColorStop(0, rgba(lighten(body.color, 0.55), 1));
  ball.addColorStop(0.42, rgba(body.color, 1));
  ball.addColorStop(1, rgba(shade(body.color, 0.42), 1));
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

  if (body.kind === "star" || r > 10) {
    ctx.fillStyle = "rgba(255,252,246,0.35)";
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  cam: Camera,
  w: number,
  h: number,
) {
  const s = worldToScreen(p.x, p.y, cam, w, h);
  ctx.fillStyle = rgba(p.color, Math.max(0, p.life) * 0.85);
  ctx.beginPath();
  ctx.arc(s.x, s.y, p.size * cam.zoom, 0, Math.PI * 2);
  ctx.fill();
}

function drawShock(
  ctx: CanvasRenderingContext2D,
  shock: Shock,
  cam: Camera,
  w: number,
  h: number,
) {
  const p = worldToScreen(shock.x, shock.y, cam, w, h);
  ctx.strokeStyle = `rgba(232,230,224,${Math.max(0, shock.life) * 0.35})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(p.x, p.y, shock.r * cam.zoom, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGhostPath(
  ctx: CanvasRenderingContext2D,
  ghost: LaunchGhost,
  cam: Camera,
  w: number,
  h: number,
) {
  if (ghost.pathLen < 2) return;
  ctx.setLineDash([5, 7]);
  ctx.lineCap = "round";
  const groups = 6;
  const span = Math.max(1, Math.floor(ghost.pathLen / groups));
  for (let g = 0; g < groups; g++) {
    const i0 = g * span;
    const i1 = g === groups - 1 ? ghost.pathLen - 1 : Math.min(ghost.pathLen - 1, (g + 1) * span);
    ctx.strokeStyle = rgba(ghost.color, 0.42 - g * 0.055);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const p = worldToScreen(ghost.path[i * 2]!, ghost.path[i * 2 + 1]!, cam, w, h);
      if (i === i0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const origin = worldToScreen(ghost.x, ghost.y, cam, w, h);
  const tip = worldToScreen(ghost.x + ghost.vx * 0.42, ghost.y + ghost.vy * 0.42, cam, w, h);
  ctx.strokeStyle = rgba(lighten(ghost.color, 0.35), 0.85);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  const ang = Math.atan2(tip.y - origin.y, tip.x - origin.x);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - Math.cos(ang - 0.4) * 9, tip.y - Math.sin(ang - 0.4) * 9);
  ctx.lineTo(tip.x - Math.cos(ang + 0.4) * 9, tip.y - Math.sin(ang + 0.4) * 9);
  ctx.closePath();
  ctx.fillStyle = rgba(lighten(ghost.color, 0.35), 0.85);
  ctx.fill();
}

function drawGhostBody(
  ctx: CanvasRenderingContext2D,
  ghost: LaunchGhost,
  cam: Camera,
  w: number,
  h: number,
) {
  const p = worldToScreen(ghost.x, ghost.y, cam, w, h);
  const r = Math.max(1.6, ghost.radius * cam.zoom);
  ctx.fillStyle = rgba(ghost.color, 0.22);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(ghost.color, 0.9);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.35, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
  g.addColorStop(0, "rgba(7,8,11,0)");
  g.addColorStop(1, "rgba(7,8,11,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
