import { mulberry32 } from "./prng";

const F3 = 1 / 3;
const G3 = 1 / 6;

const GRAD = new Float64Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0,
  -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

export type NoiseSampler = {
  noise3(x: number, y: number, z: number): number;
  fbm3(x: number, y: number, z: number, octaves?: number): number;
};

export function createNoise(seed: number): NoiseSampler {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  const rng = mulberry32(seed);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const tmp = p[i]!;
    p[i] = p[j]!;
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]!;

  function noise3(x: number, y: number, z: number): number {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);

    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else if (y0 < z0) {
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
    } else {
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    return (
      contrib(perm, ii, jj, kk, x0, y0, z0) +
      contrib(perm, ii + i1, jj + j1, kk + k1, x1, y1, z1) +
      contrib(perm, ii + i2, jj + j2, kk + k2, x2, y2, z2) +
      contrib(perm, ii + 1, jj + 1, kk + 1, x3, y3, z3)
    );
  }

  function fbm3(x: number, y: number, z: number, octaves = 3): number {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise3(x * freq, y * freq, z * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.02;
    }
    return sum / norm;
  }

  return { noise3, fbm3 };
}

function contrib(
  perm: Uint8Array,
  i: number,
  j: number,
  k: number,
  x: number,
  y: number,
  z: number,
): number {
  const t = 0.6 - x * x - y * y - z * z;
  if (t < 0) return 0;
  const gi = (perm[(i + perm[(j + perm[k & 255]!) & 255]!) & 255]! % 12) * 3;
  const t2 = t * t;
  return 8 * t2 * t2 * (GRAD[gi]! * x + GRAD[gi + 1]! * y + GRAD[gi + 2]! * z);
}
