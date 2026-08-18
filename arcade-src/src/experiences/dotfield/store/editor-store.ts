import { create } from "zustand";
import {
  BRUSH_SIZES,
  EMPTY,
  GRID_PRESETS,
  type BrushSize,
  type GridSize,
  type Tool,
  emptyPixels,
} from "@/experiences/dotfield/lib/pixel-palette";
import {
  bresenham,
  floodFill,
  isBlank,
  resizePixels,
  stamp,
} from "@/experiences/dotfield/lib/pixel-math";

const STORAGE_KEY = "dotfield.v1";
const MAX_HISTORY = 48;

export type Snapshot = {
  gridSize: number;
  pixels: number[];
};

type EditorState = {
  gridSize: number;
  pixels: number[];
  colorIndex: number;
  tool: Tool;
  brush: BrushSize;
  showGrid: boolean;
  history: Snapshot[];
  future: Snapshot[];
  hover: { x: number; y: number } | null;
  hasDrawn: boolean;
  hydrated: boolean;
  drawing: boolean;
};

type EditorActions = {
  hydrate: () => void;
  persist: () => void;
  setTool: (tool: Tool) => void;
  setColor: (index: number) => void;
  setBrush: (brush: BrushSize) => void;
  toggleGrid: () => void;
  setHover: (hover: { x: number; y: number } | null) => void;
  setGridSize: (size: number) => void;
  beginStroke: () => void;
  applyStrokePoint: (x: number, y: number, prev?: { x: number; y: number } | null) => void;
  fillAt: (x: number, y: number) => void;
  sampleAt: (x: number, y: number) => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  loadSprite: (sprite: { gridSize: number; pixels: number[] }) => void;
};

function snapshotOf(state: Pick<EditorState, "gridSize" | "pixels">): Snapshot {
  return { gridSize: state.gridSize, pixels: state.pixels.slice() };
}

function persistNow(state: EditorState) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      gridSize: state.gridSize,
      pixels: state.pixels,
      colorIndex: state.colorIndex,
      tool: state.tool,
      brush: state.brush,
      showGrid: state.showGrid,
      hasDrawn: state.hasDrawn,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — ignore
  }
}

export const useEditor = create<EditorState & EditorActions>((set, get) => ({
  gridSize: 16,
  pixels: emptyPixels(16),
  colorIndex: 13,
  tool: "pencil",
  brush: 1,
  showGrid: true,
  history: [],
  future: [],
  hover: null,
  hasDrawn: false,
  hydrated: false,
  drawing: false,

  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const data = JSON.parse(raw) as Partial<EditorState>;
      const gridSize = GRID_PRESETS.includes(data.gridSize as GridSize)
        ? (data.gridSize as number)
        : 16;
      const pixels =
        Array.isArray(data.pixels) && data.pixels.length === gridSize * gridSize
          ? data.pixels.map((n) => (typeof n === "number" ? n : EMPTY))
          : emptyPixels(gridSize);
      const brush = BRUSH_SIZES.includes(data.brush as BrushSize)
        ? (data.brush as BrushSize)
        : 1;
      set({
        gridSize,
        pixels,
        colorIndex:
          typeof data.colorIndex === "number" && data.colorIndex >= 0 && data.colorIndex < 16
            ? data.colorIndex
            : 13,
        tool:
          data.tool === "eraser" || data.tool === "fill" || data.tool === "eyedropper"
            ? data.tool
            : "pencil",
        brush,
        showGrid: data.showGrid !== false,
        hasDrawn: Boolean(data.hasDrawn) || !isBlank(pixels),
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  persist: () => persistNow(get()),

  setTool: (tool) => {
    set({ tool });
    persistNow(get());
  },

  setColor: (index) => {
    set({ colorIndex: index, tool: get().tool === "eraser" ? "pencil" : get().tool });
    persistNow(get());
  },

  setBrush: (brush) => {
    set({ brush });
    persistNow(get());
  },

  toggleGrid: () => {
    set({ showGrid: !get().showGrid });
    persistNow(get());
  },

  setHover: (hover) => set({ hover }),

  setGridSize: (size) => {
    const current = get();
    if (size === current.gridSize) return;
    if (!GRID_PRESETS.includes(size as GridSize)) return;
    const history = [...current.history, snapshotOf(current)].slice(-MAX_HISTORY);
    set({
      gridSize: size,
      pixels: resizePixels(current.pixels, current.gridSize, size),
      history,
      future: [],
    });
    persistNow(get());
  },

  beginStroke: () => {
    const current = get();
    if (current.drawing) return;
    set({
      drawing: true,
      history: [...current.history, snapshotOf(current)].slice(-MAX_HISTORY),
      future: [],
    });
  },

  applyStrokePoint: (x, y, prev) => {
    const { pixels, gridSize, tool, colorIndex, brush, drawing } = get();
    if (!drawing) return;
    if (tool !== "pencil" && tool !== "eraser") return;

    const next = pixels.slice();
    const value = tool === "eraser" ? EMPTY : colorIndex;
    if (prev && (prev.x !== x || prev.y !== y)) {
      bresenham(prev.x, prev.y, x, y, (px, py) => {
        stamp(next, gridSize, px, py, value, brush);
      });
    } else {
      stamp(next, gridSize, x, y, value, brush);
    }
    set({ pixels: next, hasDrawn: true });
  },

  fillAt: (x, y) => {
    const current = get();
    const next = floodFill(current.pixels, current.gridSize, x, y, current.colorIndex);
    if (next === current.pixels) return;
    set({
      pixels: next,
      hasDrawn: true,
      history: [...current.history, snapshotOf(current)].slice(-MAX_HISTORY),
      future: [],
    });
    persistNow(get());
  },

  sampleAt: (x, y) => {
    const { pixels, gridSize } = get();
    const value = pixels[y * gridSize + x] ?? EMPTY;
    if (value < 0) return;
    set({ colorIndex: value, tool: "pencil" });
    persistNow(get());
  },

  endStroke: () => {
    const current = get();
    if (!current.drawing) return;
    const last = current.history[current.history.length - 1];
    const unchanged =
      last &&
      last.gridSize === current.gridSize &&
      last.pixels.length === current.pixels.length &&
      last.pixels.every((v, i) => v === current.pixels[i]);
    set({
      drawing: false,
      history: unchanged ? current.history.slice(0, -1) : current.history,
    });
    persistNow(get());
  },

  undo: () => {
    const current = get();
    const prev = current.history[current.history.length - 1];
    if (!prev) return;
    set({
      history: current.history.slice(0, -1),
      future: [...current.future, snapshotOf(current)],
      gridSize: prev.gridSize,
      pixels: prev.pixels.slice(),
      drawing: false,
    });
    persistNow(get());
  },

  redo: () => {
    const current = get();
    const next = current.future[current.future.length - 1];
    if (!next) return;
    set({
      future: current.future.slice(0, -1),
      history: [...current.history, snapshotOf(current)].slice(-MAX_HISTORY),
      gridSize: next.gridSize,
      pixels: next.pixels.slice(),
      drawing: false,
    });
    persistNow(get());
  },

  clear: () => {
    const current = get();
    if (isBlank(current.pixels)) return;
    set({
      pixels: emptyPixels(current.gridSize),
      history: [...current.history, snapshotOf(current)].slice(-MAX_HISTORY),
      future: [],
    });
    persistNow(get());
  },

  loadSprite: (sprite) => {
    const current = get();
    set({
      gridSize: sprite.gridSize,
      pixels: sprite.pixels.slice(),
      hasDrawn: true,
      history: [...current.history, snapshotOf(current)].slice(-MAX_HISTORY),
      future: [],
    });
    persistNow(get());
  },
}));


