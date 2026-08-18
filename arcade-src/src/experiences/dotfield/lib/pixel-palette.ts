/** Limited 16-color workshop palette — product data, not UI chrome. */
export type Swatch = {
  id: number;
  name: string;
  hex: string;
};

export const PALETTE: Swatch[] = [
  { id: 0, name: "Ink", hex: "#1b1714" },
  { id: 1, name: "Soot", hex: "#3a322c" },
  { id: 2, name: "Umber", hex: "#6b4634" },
  { id: 3, name: "Clay", hex: "#a86a42" },
  { id: 4, name: "Sand", hex: "#d7a56a" },
  { id: 5, name: "Bone", hex: "#f0e2c4" },
  { id: 6, name: "Chalk", hex: "#f7f1e6" },
  { id: 7, name: "Mist", hex: "#b7c4c8" },
  { id: 8, name: "Steel", hex: "#6d8494" },
  { id: 9, name: "Slate", hex: "#3c4d5a" },
  { id: 10, name: "Pine", hex: "#2f4a3a" },
  { id: 11, name: "Moss", hex: "#6f8f52" },
  { id: 12, name: "Rust", hex: "#8d332c" },
  { id: 13, name: "Coral", hex: "#c85a42" },
  { id: 14, name: "Amber", hex: "#e09a3e" },
  { id: 15, name: "Gold", hex: "#efd36a" },
];

export const EMPTY = -1;

export const GRID_PRESETS = [8, 16, 24, 32, 48, 64] as const;
export type GridSize = (typeof GRID_PRESETS)[number];

export const BRUSH_SIZES = [1, 2, 3] as const;
export type BrushSize = (typeof BRUSH_SIZES)[number];

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

export function emptyPixels(size: number): number[] {
  return Array.from({ length: size * size }, () => EMPTY);
}

export function parseSprite(rows: string[]): { gridSize: number; pixels: number[] } {
  const gridSize = rows.length;
  const pixels = emptyPixels(gridSize);
  for (let y = 0; y < gridSize; y++) {
    const row = rows[y] ?? "";
    for (let x = 0; x < gridSize; x++) {
      const ch = row[x];
      if (!ch || ch === ".") continue;
      const value = Number.parseInt(ch, 16);
      if (Number.isFinite(value) && value >= 0 && value < PALETTE.length) {
        pixels[y * gridSize + x] = value;
      }
    }
  }
  return { gridSize, pixels };
}

/** 16×16 lantern — a quiet first sample. */
export const SAMPLE_LANTERN = parseSprite([
  "................",
  "......5555......",
  ".....566665.....",
  ".....566665.....",
  "......5555......",
  ".....144441.....",
  "....14feef41....",
  "....14effe41....",
  "....14feef41....",
  "....14effe41....",
  ".....144441.....",
  "......1111......",
  "......1221......",
  ".......11.......",
  "................",
  "................",
]);

export const SAMPLE_MUSHROOM = parseSprite([
  "................",
  "......cccc......",
  "....ccddddcc....",
  "...cdd6dd6ddc...",
  "...cddddddddc...",
  "...c6dddddd6c...",
  "....cddddddc....",
  ".....555555.....",
  ".....544445.....",
  ".....544445.....",
  ".....544445.....",
  ".....555555.....",
  "......5..5......",
  "....bbb..bbb....",
  "...bb......bb...",
  "................",
]);
