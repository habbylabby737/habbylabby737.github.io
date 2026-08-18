import { oklchToHex, type Oklch } from "./color";

export const HARMONIES = [
  "mix",
  "analogous",
  "complementary",
  "split",
  "triad",
  "mono",
  "pastel",
  "jewel",
  "earth",
  "ink",
] as const;

export type Harmony = (typeof HARMONIES)[number];

export const HARMONY_LABELS: Record<Harmony, string> = {
  mix: "Mix",
  analogous: "Analogous",
  complementary: "Complement",
  split: "Split",
  triad: "Triad",
  mono: "Mono",
  pastel: "Pastel",
  jewel: "Jewel",
  earth: "Earth",
  ink: "Ink",
};

function rand(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function wrapHue(h: number) {
  return ((h % 360) + 360) % 360;
}

function jitter(rng: () => number, amount: number) {
  return (rng() - 0.5) * 2 * amount;
}

function sortByLightness(colors: Oklch[]): Oklch[] {
  return [...colors].sort((a, b) => a.l - b.l);
}

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function ensureSpread(colors: Oklch[], rng: () => number): Oklch[] {
  const sorted = sortByLightness(colors);
  if (sorted[0]!.l > 0.32) {
    sorted[0] = { ...sorted[0]!, l: rand(rng, 0.16, 0.28) };
  }
  if (sorted[4]!.l < 0.72) {
    sorted[4] = { ...sorted[4]!, l: Math.max(sorted[4]!.l, rand(rng, 0.78, 0.9)) };
  }
  return sorted;
}

function analogous(rng: () => number): Oklch[] {
  const h0 = rng() * 360;
  const step = rand(rng, 12, 28);
  const lights = shuffleInPlace([0.2, 0.36, 0.52, 0.7, 0.88], rng);
  return lights.map((l, i) => ({
    l: clamp01(l + jitter(rng, 0.04)),
    c: clampC(0.05 + rng() * 0.11 + (l > 0.82 || l < 0.22 ? -0.02 : 0.03)),
    h: wrapHue(h0 + (i - 2) * step + jitter(rng, 6)),
  }));
}

function complementary(rng: () => number): Oklch[] {
  const h0 = rng() * 360;
  const h1 = wrapHue(h0 + 180 + jitter(rng, 10));
  const a = [
    { l: rand(rng, 0.18, 0.3), c: rand(rng, 0.04, 0.1), h: h0 },
    { l: rand(rng, 0.42, 0.56), c: rand(rng, 0.1, 0.16), h: h0 },
    { l: rand(rng, 0.72, 0.86), c: rand(rng, 0.04, 0.09), h: h0 },
    { l: rand(rng, 0.34, 0.5), c: rand(rng, 0.12, 0.18), h: h1 },
    { l: rand(rng, 0.62, 0.78), c: rand(rng, 0.08, 0.14), h: h1 },
  ];
  return shuffleInPlace(a, rng);
}

function split(rng: () => number): Oklch[] {
  const h0 = rng() * 360;
  const offset = rand(rng, 140, 165);
  const hues = [h0, wrapHue(h0 + offset), wrapHue(h0 - offset)];
  const lights = [0.22, 0.4, 0.55, 0.72, 0.88];
  return lights.map((l, i) => ({
    l: clamp01(l + jitter(rng, 0.03)),
    c: clampC(0.06 + rng() * 0.1),
    h: wrapHue(hues[i % 3]! + jitter(rng, 8)),
  }));
}

function triad(rng: () => number): Oklch[] {
  const h0 = rng() * 360;
  const hues = [h0, wrapHue(h0 + 120), wrapHue(h0 + 240)];
  const lights = shuffleInPlace([0.2, 0.38, 0.54, 0.7, 0.86], rng);
  return lights.map((l, i) => ({
    l,
    c: clampC(i === 0 ? rand(rng, 0.02, 0.05) : rand(rng, 0.07, 0.14)),
    h: wrapHue(hues[i % 3]! + jitter(rng, 6)),
  }));
}

function mono(rng: () => number): Oklch[] {
  const h = rng() * 360;
  const peak = rand(rng, 0.08, 0.16);
  const lights = [0.16, 0.32, 0.5, 0.7, 0.9];
  return lights.map((l) => ({
    l: clamp01(l + jitter(rng, 0.02)),
    c: clampC(peak * (1 - Math.abs(l - 0.5) * 1.2)),
    h: wrapHue(h + jitter(rng, 4)),
  }));
}

function pastel(rng: () => number): Oklch[] {
  const h0 = rng() * 360;
  const step = rand(rng, 20, 50);
  return [0.62, 0.72, 0.8, 0.88, 0.94].map((l, i) => ({
    l: clamp01(l + jitter(rng, 0.02)),
    c: clampC(rand(rng, 0.03, 0.08)),
    h: wrapHue(h0 + (i - 2) * step + jitter(rng, 8)),
  }));
}

function jewel(rng: () => number): Oklch[] {
  const h0 = rng() * 360;
  const step = pick(rng, [60, 90, 120, 150, 180]);
  const lights = shuffleInPlace([0.28, 0.36, 0.44, 0.52, 0.64], rng);
  return lights.map((l, i) => ({
    l,
    c: clampC(rand(rng, 0.12, 0.2)),
    h: wrapHue(h0 + i * (step / 2) + jitter(rng, 10)),
  }));
}

function earth(rng: () => number): Oklch[] {
  const warm = rand(rng, 25, 55);
  const green = rand(rng, 85, 130);
  const cream = rand(rng, 70, 95);
  return shuffleInPlace(
    [
      { l: rand(rng, 0.16, 0.26), c: rand(rng, 0.02, 0.05), h: warm },
      { l: rand(rng, 0.34, 0.46), c: rand(rng, 0.06, 0.1), h: warm + jitter(rng, 8) },
      { l: rand(rng, 0.48, 0.6), c: rand(rng, 0.07, 0.11), h: green },
      { l: rand(rng, 0.7, 0.82), c: rand(rng, 0.04, 0.08), h: cream },
      { l: rand(rng, 0.86, 0.94), c: rand(rng, 0.02, 0.05), h: cream + 10 },
    ],
    rng,
  );
}

function ink(rng: () => number): Oklch[] {
  const accent = rng() * 360;
  const cool = wrapHue(accent + rand(rng, 160, 210));
  return [
    { l: rand(rng, 0.12, 0.2), c: rand(rng, 0.005, 0.02), h: cool },
    { l: rand(rng, 0.28, 0.38), c: rand(rng, 0.01, 0.03), h: cool },
    { l: rand(rng, 0.55, 0.68), c: rand(rng, 0.01, 0.03), h: cool },
    { l: rand(rng, 0.86, 0.94), c: rand(rng, 0.005, 0.02), h: cool },
    { l: rand(rng, 0.48, 0.62), c: rand(rng, 0.12, 0.2), h: accent },
  ];
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function clampC(n: number) {
  return Math.min(0.28, Math.max(0, n));
}

const RECIPES: Record<Exclude<Harmony, "mix">, (rng: () => number) => Oklch[]> = {
  analogous,
  complementary,
  split,
  triad,
  mono,
  pastel,
  jewel,
  earth,
  ink,
};

const MIX_WEIGHTS: Exclude<Harmony, "mix">[] = [
  "analogous",
  "analogous",
  "complementary",
  "split",
  "triad",
  "mono",
  "pastel",
  "jewel",
  "earth",
  "ink",
  "ink",
];

export function generateHexes(harmony: Harmony, rng: () => number = Math.random): string[] {
  const mode = harmony === "mix" ? pick(rng, MIX_WEIGHTS) : harmony;
  let colors = RECIPES[mode](rng);
  if (harmony !== "pastel" && harmony !== "jewel") {
    colors = shuffleInPlace(ensureSpread(colors, rng), rng);
  }
  return colors.slice(0, 5).map((c) => oklchToHex(c));
}
