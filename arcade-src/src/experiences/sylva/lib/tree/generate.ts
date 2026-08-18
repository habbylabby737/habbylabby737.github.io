import { mulberry32, randRange } from "./rng";
import type { Branch, Particle, TreeModel } from "./types";

export function generateTree(seed: number, depth: number): TreeModel {
  const rng = mulberry32(seed >>> 0);
  const branches: Branch[] = [];
  const maxLevel = Math.max(3, Math.min(12, Math.round(depth)));

  const root: Branch = {
    parent: -1,
    angleFactor: 0,
    angleJitter: randRange(rng, -0.06, 0.06),
    length: 1,
    width: 1,
    level: 0,
    dist: 0,
    phase: rng() * Math.PI * 2,
    amp: 0.04,
    hueJitter: randRange(rng, -0.08, 0.08),
    curve: randRange(rng, -0.08, 0.08),
    tip: false,
    leafCount: 0,
    blossomCount: 0,
    leafPhase: rng() * Math.PI * 2,
  };
  branches.push(root);

  function spawn(idx: number) {
    const parent = branches[idx]!;
    const level = parent.level + 1;
    if (level > maxLevel) {
      parent.tip = true;
      decorateTip(parent, rng, maxLevel);
      return;
    }

    // Occasional early stop so the crown is not a perfect fractal.
    if (level > 3 && rng() < 0.07 + level * 0.012) {
      parent.tip = true;
      decorateTip(parent, rng, maxLevel);
      return;
    }

    let count = 2;
    if (level < maxLevel - 1 && rng() < 0.3) count = 3;
    if (level <= 2 && rng() < 0.18) count = 3;
    if (level >= maxLevel - 1 && rng() < 0.22) count = 1;

    const spreads: number[] = [];
    if (count === 1) {
      spreads.push(randRange(rng, -0.22, 0.22));
    } else if (count === 2) {
      const a = randRange(rng, 0.72, 1.12);
      const b = randRange(rng, 0.72, 1.12);
      const bias = randRange(rng, -0.18, 0.18);
      spreads.push(-a + bias, b + bias);
    } else {
      spreads.push(
        -randRange(rng, 0.9, 1.25),
        randRange(rng, -0.18, 0.18),
        randRange(rng, 0.9, 1.25),
      );
    }

    for (let i = 0; i < count; i++) {
      const factor = spreads[i]!;
      // Leader branch stays a little longer and thicker.
      const isLeader = Math.abs(factor) < 0.28;
      const shrink = isLeader
        ? randRange(rng, 0.74, 0.9)
        : randRange(rng, 0.62, 0.8);
      const child: Branch = {
        parent: idx,
        angleFactor: factor,
        angleJitter: randRange(rng, -0.12, 0.12),
        length: parent.length * shrink,
        width: Math.max(0.045, parent.width * (isLeader ? 0.72 : randRange(rng, 0.52, 0.66))),
        level,
        dist: parent.dist + parent.length,
        phase: rng() * Math.PI * 2,
        amp: (0.05 + level * 0.035) * randRange(rng, 0.7, 1.3),
        hueJitter: randRange(rng, -0.12, 0.12),
        curve: randRange(rng, -0.16, 0.16),
        tip: false,
        leafCount: 0,
        blossomCount: 0,
        leafPhase: rng() * Math.PI * 2,
      };
      const childIdx = branches.length;
      branches.push(child);
      spawn(childIdx);
    }
  }

  spawn(0);

  let maxDist = 0;
  for (const b of branches) {
    const end = b.dist + b.length;
    if (end > maxDist) maxDist = end;
  }

  return {
    branches,
    maxDist: maxDist || 1,
    maxLevel,
    maxWidth: 1,
  };
}

function decorateTip(branch: Branch, rng: () => number, maxLevel: number) {
  const lush = branch.level >= maxLevel - 2 ? 1 : 0.55;
  branch.leafCount = Math.round(randRange(rng, 2, 5) * lush);
  branch.blossomCount = Math.round(randRange(rng, 1, 3) * lush);
}

export function generateParticles(seed: number, count = 56): Particle[] {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: rng(),
      y: rng() * 0.78,
      r: randRange(rng, 0.6, 1.8),
      s: randRange(rng, 0.15, 0.55),
      phase: rng() * Math.PI * 2,
    });
  }
  return out;
}

export function newSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
