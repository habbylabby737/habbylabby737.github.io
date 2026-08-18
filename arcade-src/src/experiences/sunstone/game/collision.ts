import type { AABB } from "./types";
import type { Maze, WallSeg } from "./maze";

export type WallIndex = {
  map: Map<string, AABB[]>;
  cellSize: number;
};

export function segsToAabbs(maze: Maze, segs: WallSeg[]): AABB[] {
  const halfL = maze.cellSize / 2 + maze.wallThickness / 2;
  const halfT = maze.wallThickness / 2;
  return segs.map((s) =>
    s.horizontal
      ? { minX: s.x - halfL, maxX: s.x + halfL, minZ: s.z - halfT, maxZ: s.z + halfT }
      : { minX: s.x - halfT, maxX: s.x + halfT, minZ: s.z - halfL, maxZ: s.z + halfL },
  );
}

export function buildWallIndex(boxes: AABB[], cellSize: number): WallIndex {
  const map = new Map<string, AABB[]>();
  for (const b of boxes) {
    const x0 = Math.floor(b.minX / cellSize);
    const x1 = Math.floor(b.maxX / cellSize);
    const z0 = Math.floor(b.minZ / cellSize);
    const z1 = Math.floor(b.maxZ / cellSize);
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const k = `${x},${z}`;
        const arr = map.get(k);
        if (arr) arr.push(b);
        else map.set(k, [b]);
      }
    }
  }
  return { map, cellSize };
}

function queryWalls(index: WallIndex, x: number, z: number, r: number): AABB[] {
  const cs = index.cellSize;
  const x0 = Math.floor((x - r) / cs);
  const x1 = Math.floor((x + r) / cs);
  const z0 = Math.floor((z - r) / cs);
  const z1 = Math.floor((z + r) / cs);
  const out: AABB[] = [];
  const seen = new Set<AABB>();
  for (let zz = z0; zz <= z1; zz++) {
    for (let xx = x0; xx <= x1; xx++) {
      const arr = index.map.get(`${xx},${zz}`);
      if (!arr) continue;
      for (const b of arr) {
        if (seen.has(b)) continue;
        seen.add(b);
        out.push(b);
      }
    }
  }
  return out;
}

export function resolveCircleAabb(
  x: number,
  z: number,
  r: number,
  box: AABB,
): { x: number; z: number; hit: boolean } {
  const cx = Math.max(box.minX, Math.min(x, box.maxX));
  const cz = Math.max(box.minZ, Math.min(z, box.maxZ));
  let dx = x - cx;
  let dz = z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return { x, z, hit: false };
  if (d2 < 1e-10) {
    const left = x - box.minX;
    const right = box.maxX - x;
    const north = z - box.minZ;
    const south = box.maxZ - z;
    const m = Math.min(left, right, north, south);
    if (m === left) return { x: box.minX - r, z, hit: true };
    if (m === right) return { x: box.maxX + r, z, hit: true };
    if (m === north) return { x, z: box.minZ - r, hit: true };
    return { x, z: box.maxZ + r, hit: true };
  }
  const d = Math.sqrt(d2);
  const k = (r - d) / d;
  return { x: x + dx * k, z: z + dz * k, hit: true };
}

export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  index: WallIndex,
  substeps = 5,
): { x: number; z: number; hit: boolean } {
  let px = x;
  let pz = z;
  let hit = false;
  const sx = dx / substeps;
  const sz = dz / substeps;
  const pad = radius + 0.12;
  for (let i = 0; i < substeps; i++) {
    px += sx;
    for (const w of queryWalls(index, px, pz, pad)) {
      const r = resolveCircleAabb(px, pz, radius, w);
      px = r.x;
      pz = r.z;
      if (r.hit) hit = true;
    }
    pz += sz;
    for (const w of queryWalls(index, px, pz, pad)) {
      const r = resolveCircleAabb(px, pz, radius, w);
      px = r.x;
      pz = r.z;
      if (r.hit) hit = true;
    }
  }
  return { x: px, z: pz, hit };
}
