export type Phase = "title" | "playing" | "paused" | "won";

export type CellWalls = {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
};

export type Maze = {
  cols: number;
  rows: number;
  cellSize: number;
  wallThickness: number;
  wallHeight: number;
  cells: CellWalls[][];
  start: { cx: number; cy: number };
  exit: { cx: number; cy: number };
  gems: { cx: number; cy: number; id: number }[];
};

export type AABB = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type HudSnapshot = {
  phase: Phase;
  time: number;
  collected: number;
  total: number;
  bestTime: number | null;
  isNewBest: boolean;
  pointerLocked: boolean;
  isCoarse: boolean;
};

export {};
