export const G = 220;
export const STEP = 1 / 120;
export const SOFTEN2 = 4;
export const MAX_BODIES = 36;
export const TRAIL_CAP = 420;
export const WORLD_LIMIT = 18000;
export const RADIUS_K = 1.48;
export const FLING_SCALE = 1.08;

export type MassKind = "dust" | "moon" | "planet" | "giant" | "star";
export type SceneId = "system" | "choreography" | "binary" | "void";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface MassPreset {
  id: MassKind;
  label: string;
  mass: number;
  color: Rgb;
}

export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  px: number;
  py: number;
  mass: number;
  radius: number;
  color: Rgb;
  kind: MassKind;
  trailX: Float32Array;
  trailY: Float32Array;
  trailHead: number;
  trailCount: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: Rgb;
}

export interface Shock {
  x: number;
  y: number;
  r: number;
  max: number;
  life: number;
}

export interface LaunchGhost {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: Rgb;
  path: Float32Array;
  pathLen: number;
}

export const MASS_PRESETS: MassPreset[] = [
  { id: "dust", label: "Dust", mass: 3.2, color: { r: 198, g: 202, b: 210 } },
  { id: "moon", label: "Moon", mass: 18, color: { r: 154, g: 163, b: 178 } },
  { id: "planet", label: "Planet", mass: 92, color: { r: 126, g: 154, b: 168 } },
  { id: "giant", label: "Giant", mass: 430, color: { r: 186, g: 164, b: 136 } },
  { id: "star", label: "Star", mass: 5200, color: { r: 232, g: 226, b: 214 } },
];

export const SCENES: { id: SceneId; label: string }[] = [
  { id: "system", label: "System" },
  { id: "choreography", label: "Figure-8" },
  { id: "binary", label: "Binary" },
  { id: "void", label: "Void" },
];

let nextId = 1;

export function radiusOf(mass: number): number {
  return Math.max(2.1, RADIUS_K * Math.cbrt(mass));
}

export function presetById(id: MassKind): MassPreset {
  return MASS_PRESETS.find((p) => p.id === id) ?? MASS_PRESETS[2]!;
}

export function kindFromMass(mass: number): MassKind {
  if (mass >= 2200) return "star";
  if (mass >= 280) return "giant";
  if (mass >= 50) return "planet";
  if (mass >= 8) return "moon";
  return "dust";
}

function colorForKind(kind: MassKind): Rgb {
  return presetById(kind).color;
}

export function createBody(
  x: number,
  y: number,
  vx: number,
  vy: number,
  mass: number,
  color?: Rgb,
  kind?: MassKind,
): Body {
  const resolvedKind = kind ?? kindFromMass(mass);
  return {
    id: nextId++,
    x,
    y,
    vx,
    vy,
    ax: 0,
    ay: 0,
    px: x,
    py: y,
    mass,
    radius: radiusOf(mass),
    color: color ?? colorForKind(resolvedKind),
    kind: resolvedKind,
    trailX: new Float32Array(TRAIL_CAP),
    trailY: new Float32Array(TRAIL_CAP),
    trailHead: 0,
    trailCount: 0,
  };
}

function pushTrail(body: Body) {
  body.trailX[body.trailHead] = body.x;
  body.trailY[body.trailHead] = body.y;
  body.trailHead = (body.trailHead + 1) % TRAIL_CAP;
  if (body.trailCount < TRAIL_CAP) body.trailCount += 1;
}

function circularSpeed(centralMass: number, r: number): number {
  return Math.sqrt((G * centralMass) / Math.max(r, 1));
}

export interface CollisionEvent {
  x: number;
  y: number;
  mass: number;
  color: Rgb;
}

export class OrbitWorld {
  bodies: Body[] = [];
  particles: Particle[] = [];
  shocks: Shock[] = [];
  trauma = 0;
  timeScale = 1;
  paused = false;
  trailsEnabled = true;
  followCom = false;
  acc = 0;
  trailTick = 0;
  collisions: CollisionEvent[] = [];

  reset(scene: SceneId) {
    this.bodies = [];
    this.particles = [];
    this.shocks = [];
    this.trauma = 0;
    this.acc = 0;
    this.trailTick = 0;
    this.collisions = [];
    nextId = 1;
    loadScene(this, scene);
    this.computeAcc();
  }

  clear() {
    this.bodies = [];
    this.particles = [];
    this.shocks = [];
    this.trauma = 0;
    this.acc = 0;
    this.collisions = [];
  }

  addBody(body: Body): boolean {
    if (this.bodies.length >= MAX_BODIES) return false;
    this.bodies.push(body);
    return true;
  }

  centerOfMass(): { x: number; y: number } {
    let mx = 0;
    let my = 0;
    let m = 0;
    for (const b of this.bodies) {
      mx += b.x * b.mass;
      my += b.y * b.mass;
      m += b.mass;
    }
    if (m <= 0) return { x: 0, y: 0 };
    return { x: mx / m, y: my / m };
  }

  step(dt: number) {
    this.collisions.length = 0;
    const clamped = Math.min(Math.max(dt, 0), 0.1);
    if (!this.paused) {
      this.acc += clamped * this.timeScale;
      const cap = STEP * 32;
      if (this.acc > cap) this.acc = cap;
      while (this.acc >= STEP) {
        this.physicsStep(STEP);
        this.acc -= STEP;
      }
    }
    this.advanceJuice(clamped);
  }

  private physicsStep(h: number) {
    const close = this.anyClose();
    const n = close ? 4 : 1;
    const sub = h / n;
    for (let i = 0; i < n; i++) {
      this.verlet(sub);
      this.resolveMerges();
    }
    this.cullEscaped();
    this.trailTick += 1;
    if (this.trailsEnabled && this.trailTick % 2 === 0) {
      for (const b of this.bodies) pushTrail(b);
    }
  }

  private anyClose(): boolean {
    const bodies = this.bodies;
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      const a = bodies[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lim = (a.radius + b.radius) * 5;
        if (dx * dx + dy * dy < lim * lim) return true;
      }
    }
    return false;
  }

  private verlet(h: number) {
    const half = h * 0.5;
    for (const b of this.bodies) {
      b.px = b.x;
      b.py = b.y;
      b.vx += b.ax * half;
      b.vy += b.ay * half;
      b.x += b.vx * h;
      b.y += b.vy * h;
    }
    this.computeAcc();
    for (const b of this.bodies) {
      b.vx += b.ax * half;
      b.vy += b.ay * half;
    }
  }

  computeAcc() {
    const bodies = this.bodies;
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      const a = bodies[i]!;
      let ax = 0;
      let ay = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const b = bodies[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r2 = dx * dx + dy * dy + SOFTEN2;
        const inv = 1 / Math.sqrt(r2);
        const s = G * b.mass * inv * inv * inv;
        ax += dx * s;
        ay += dy * s;
      }
      a.ax = ax;
      a.ay = ay;
    }
  }

  private resolveMerges() {
    let guard = 0;
    while (guard++ < 10) {
      const bodies = this.bodies;
      const n = bodies.length;
      let hit = false;
      for (let i = 0; i < n; i++) {
        const a = bodies[i]!;
        for (let j = i + 1; j < n; j++) {
          const b = bodies[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = (a.radius + b.radius) * 0.88;
          if (dx * dx + dy * dy >= min * min) continue;
          this.merge(i, j);
          hit = true;
          break;
        }
        if (hit) break;
      }
      if (!hit) break;
    }
  }

  private merge(i: number, j: number) {
    const a = this.bodies[i]!;
    const b = this.bodies[j]!;
    const keep = a.mass >= b.mass ? a : b;
    const eat = keep === a ? b : a;
    const m = keep.mass + eat.mass;
    const x = (keep.x * keep.mass + eat.x * eat.mass) / m;
    const y = (keep.y * keep.mass + eat.y * eat.mass) / m;
    const vx = (keep.vx * keep.mass + eat.vx * eat.mass) / m;
    const vy = (keep.vy * keep.mass + eat.vy * eat.mass) / m;
    keep.x = x;
    keep.y = y;
    keep.px = x;
    keep.py = y;
    keep.vx = vx;
    keep.vy = vy;
    keep.mass = m;
    keep.radius = radiusOf(m);
    keep.kind = kindFromMass(m);
    const t = eat.mass / m;
    keep.color = {
      r: keep.color.r * (1 - t) + eat.color.r * t,
      g: keep.color.g * (1 - t) + eat.color.g * t,
      b: keep.color.b * (1 - t) + eat.color.b * t,
    };
    this.bodies.splice(this.bodies.indexOf(eat), 1);
    this.collisions.push({ x, y, mass: m, color: keep.color });
    this.burst(x, y, keep.color, m);
    this.shocks.push({ x, y, r: keep.radius, max: keep.radius * 7 + 40, life: 1 });
    const punch = Math.min(0.85, 0.18 + Math.log10(m + 1) * 0.12);
    this.trauma = Math.min(1, this.trauma + punch);
  }

  private cullEscaped() {
    const lim2 = WORLD_LIMIT * WORLD_LIMIT;
    this.bodies = this.bodies.filter((b) => b.x * b.x + b.y * b.y < lim2);
  }

  burst(x: number, y: number, color: Rgb, mass: number) {
    const count = Math.min(42, 10 + Math.floor(Math.cbrt(mass) * 2.4));
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 18 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        maxLife: 0.45 + Math.random() * 0.55,
        size: 1.2 + Math.random() * 2.4,
        color,
      });
    }
    if (this.particles.length > 280) {
      this.particles.splice(0, this.particles.length - 280);
    }
  }

  private advanceJuice(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      const s = this.shocks[i]!;
      s.life -= dt * 1.6;
      s.r += (s.max - s.r) * (1 - Math.exp(-8 * dt));
      if (s.life <= 0) this.shocks.splice(i, 1);
    }
  }

  predictLaunch(x: number, y: number, vx: number, vy: number, mass: number, color: Rgb): LaunchGhost {
    const steps = 220;
    const h = STEP * 3;
    const path = new Float32Array(steps * 2);
    const clones = this.bodies.map((b) => ({
      x: b.x,
      y: b.y,
      vx: b.vx,
      vy: b.vy,
      ax: 0,
      ay: 0,
      mass: b.mass,
    }));
    const ghost = { x, y, vx, vy, ax: 0, ay: 0, mass };
    const all = [...clones, ghost];
    let pathLen = 0;
    for (let s = 0; s < steps; s++) {
      const n = all.length;
      for (let i = 0; i < n; i++) {
        const a = all[i]!;
        let ax = 0;
        let ay = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const b = all[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const r2 = dx * dx + dy * dy + SOFTEN2;
          const inv = 1 / Math.sqrt(r2);
          const force = G * b.mass * inv * inv * inv;
          ax += dx * force;
          ay += dy * force;
        }
        a.ax = ax;
        a.ay = ay;
      }
      const half = h * 0.5;
      for (const a of all) {
        a.vx += a.ax * half;
        a.vy += a.ay * half;
        a.x += a.vx * h;
        a.y += a.vy * h;
        a.vx += a.ax * half;
        a.vy += a.ay * half;
      }
      path[pathLen * 2] = ghost.x;
      path[pathLen * 2 + 1] = ghost.y;
      pathLen += 1;
    }
    return {
      x,
      y,
      vx,
      vy,
      radius: radiusOf(mass),
      color,
      path,
      pathLen,
    };
  }
}

function loadScene(world: OrbitWorld, scene: SceneId) {
  if (scene === "void") return;

  if (scene === "system") {
    const sunMass = 14000;
    world.addBody(createBody(0, 0, 0, 0, sunMass, { r: 236, g: 230, b: 216 }, "star"));
    const orbits = [
      { r: 168, mass: 22, color: { r: 168, g: 164, b: 158 } },
      { r: 248, mass: 90, color: { r: 122, g: 154, b: 166 } },
      { r: 356, mass: 78, color: { r: 142, g: 160, b: 148 } },
      { r: 490, mass: 410, color: { r: 186, g: 164, b: 136 } },
      { r: 640, mass: 54, color: { r: 150, g: 158, b: 176 } },
    ];
    for (const o of orbits) {
      const v = circularSpeed(sunMass, o.r);
      world.addBody(createBody(o.r, 0, 0, v, o.mass, o.color));
    }
    const giant = world.bodies[4]!;
    const moonR = 36;
    const moonV = circularSpeed(giant.mass, moonR);
    world.addBody(
      createBody(giant.x + moonR, giant.y, giant.vx, giant.vy + moonV, 8, { r: 176, g: 180, b: 188 }, "moon"),
    );
    return;
  }

  if (scene === "binary") {
    const m = 3600;
    const sep = 210;
    const v = 0.5 * circularSpeed(m * 2, sep);
    world.addBody(createBody(-sep / 2, 0, 0, -v, m, { r: 232, g: 224, b: 210 }, "star"));
    world.addBody(createBody(sep / 2, 0, 0, v, m, { r: 210, g: 216, b: 226 }, "star"));
    const r = 520;
    const vOuter = circularSpeed(m * 2, r);
    world.addBody(createBody(0, r, -vOuter, 0, 70, { r: 126, g: 154, b: 168 }, "planet"));
    world.addBody(createBody(r * 0.72, -r * 0.55, vOuter * 0.42, vOuter * 0.55, 16, { r: 168, g: 172, b: 180 }, "moon"));
    return;
  }

  // Moore figure-8, scaled so a loop lands in about 20s at 1×.
  const S = 128;
  const mass = 720;
  const vMul = Math.sqrt((G * mass) / S);
  const p1x = -0.97000436 * S;
  const p1y = 0.24308753 * S;
  const v1x = 0.466203685 * vMul;
  const v1y = 0.43236573 * vMul;
  const c1 = { r: 198, g: 202, b: 210 };
  const c2 = { r: 126, g: 154, b: 168 };
  const c3 = { r: 186, g: 164, b: 136 };
  world.addBody(createBody(p1x, p1y, v1x, v1y, mass, c1, "giant"));
  world.addBody(createBody(-p1x, -p1y, v1x, v1y, mass, c2, "giant"));
  world.addBody(createBody(0, 0, -2 * v1x, -2 * v1y, mass, c3, "giant"));
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function worldToScreen(
  wx: number,
  wy: number,
  cam: Camera,
  w: number,
  h: number,
): { x: number; y: number } {
  return {
    x: (wx - cam.x) * cam.zoom + w * 0.5,
    y: (wy - cam.y) * cam.zoom + h * 0.5,
  };
}

export function screenToWorld(
  sx: number,
  sy: number,
  cam: Camera,
  w: number,
  h: number,
): { x: number; y: number } {
  return {
    x: (sx - w * 0.5) / cam.zoom + cam.x,
    y: (sy - h * 0.5) / cam.zoom + cam.y,
  };
}

export function fitSceneZoom(scene: SceneId): number {
  if (scene === "void") return 1;
  if (scene === "system") return 0.72;
  if (scene === "binary") return 0.78;
  return 1.35;
}

export function fitSceneCamera(scene: SceneId): Camera {
  return { x: 0, y: 36, zoom: fitSceneZoom(scene) };
}
