/** Mulberry32 — tiny deterministic PRNG. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

export function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(randRange(rng, min, max + 1));
}
