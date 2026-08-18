export type FieldBackgroundId =
  | "void"
  | "ink"
  | "midnight"
  | "slate"
  | "abyss"
  | "ember"
  | "paper";

export type FieldPaletteId = "ember" | "tide" | "ice" | "cinder" | "prism";

export type FieldBackground = {
  id: FieldBackgroundId;
  label: string;
  hex: string;
  rgb: [number, number, number];
  light: boolean;
};

export type FieldPalette = {
  id: FieldPaletteId;
  label: string;
  hue: number;
  spread: number;
  sat: number;
  lit: number;
  speedShift: number;
};

export const BACKGROUNDS: FieldBackground[] = [
  { id: "void", label: "Void", hex: "#050506", rgb: [5, 5, 6], light: false },
  { id: "ink", label: "Ink", hex: "#080b12", rgb: [8, 11, 18], light: false },
  {
    id: "midnight",
    label: "Midnight",
    hex: "#0a1322",
    rgb: [10, 19, 34],
    light: false,
  },
  { id: "slate", label: "Slate", hex: "#14161c", rgb: [20, 22, 28], light: false },
  { id: "abyss", label: "Abyss", hex: "#06140f", rgb: [6, 20, 15], light: false },
  { id: "ember", label: "Ember", hex: "#140c08", rgb: [20, 12, 8], light: false },
  { id: "paper", label: "Paper", hex: "#e8e2d6", rgb: [232, 226, 214], light: true },
];

export const PALETTES: FieldPalette[] = [
  {
    id: "ember",
    label: "Ember",
    hue: 22,
    spread: 28,
    sat: 82,
    lit: 58,
    speedShift: 18,
  },
  {
    id: "tide",
    label: "Tide",
    hue: 186,
    spread: 26,
    sat: 62,
    lit: 58,
    speedShift: 16,
  },
  {
    id: "ice",
    label: "Ice",
    hue: 210,
    spread: 22,
    sat: 28,
    lit: 78,
    speedShift: 10,
  },
  {
    id: "cinder",
    label: "Cinder",
    hue: 8,
    spread: 20,
    sat: 78,
    lit: 54,
    speedShift: 22,
  },
  {
    id: "prism",
    label: "Prism",
    hue: 0,
    spread: 360,
    sat: 55,
    lit: 62,
    speedShift: 24,
  },
];

export const BACKGROUND_BY_ID = Object.fromEntries(
  BACKGROUNDS.map((bg) => [bg.id, bg]),
) as Record<FieldBackgroundId, FieldBackground>;

export const PALETTE_BY_ID = Object.fromEntries(
  PALETTES.map((p) => [p.id, p]),
) as Record<FieldPaletteId, FieldPalette>;

export const DEFAULT_COUNT = 5200;
export const MIN_COUNT = 400;
export const MAX_COUNT = 12000;
export const DEFAULT_FORCE = 1;
export const MIN_FORCE = 0.15;
export const MAX_FORCE = 3;
export const DEFAULT_TRAIL = 0.72;
