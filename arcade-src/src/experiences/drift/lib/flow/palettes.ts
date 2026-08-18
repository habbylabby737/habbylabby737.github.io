export type Palette = {
  id: string;
  name: string;
  bg: string;
  ink: readonly string[];
};

export const PALETTES: readonly Palette[] = [
  {
    id: "tide",
    name: "Tide",
    bg: "#070b10",
    ink: ["#d7ecec", "#8ecae6", "#219ebc", "#a8dadc", "#f1faee"],
  },
  {
    id: "ember",
    name: "Ember",
    bg: "#0c0705",
    ink: ["#ffd6a3", "#f4a261", "#e76f51", "#c44536", "#f2cc8f"],
  },
  {
    id: "porcelain",
    name: "Porcelain",
    bg: "#0c0b0a",
    ink: ["#f3efe6", "#d7cbb8", "#b09a7e", "#8a7a68", "#e7ddd0"],
  },
  {
    id: "moss",
    name: "Moss",
    bg: "#07110b",
    ink: ["#d8f3dc", "#95d5b2", "#52b788", "#2d6a4f", "#b7e4c7"],
  },
  {
    id: "polar",
    name: "Polar",
    bg: "#07080c",
    ink: ["#f8fafc", "#cbd5e1", "#94a3b8", "#7dd3fc", "#e2e8f0"],
  },
  {
    id: "copper",
    name: "Copper",
    bg: "#0d0907",
    ink: ["#f4e1c1", "#d4a373", "#bc6c25", "#6b8f71", "#e9c46a"],
  },
  {
    id: "noir",
    name: "Noir",
    bg: "#050505",
    ink: ["#ffffff", "#d4d4d8", "#a1a1aa", "#e4e4e7", "#fafafa"],
  },
] as const;

export const DEFAULT_PALETTE_ID = "tide";

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
