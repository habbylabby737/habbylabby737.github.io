import { create } from "zustand";
import { generateTree, newSeed } from "./generate";
import type { OverlayMode, TreeModel } from "./types";

export type TreeSettings = {
  seed: number;
  angle: number;
  depth: number;
  length: number;
  wind: number;
  paletteId: string;
  overlay: OverlayMode;
  animateGrowth: boolean;
  growKey: number;
  model: TreeModel;
};

type TreeActions = {
  setAngle: (angle: number) => void;
  setDepth: (depth: number) => void;
  setLength: (length: number) => void;
  setWind: (wind: number) => void;
  setPalette: (paletteId: string) => void;
  setOverlay: (overlay: OverlayMode) => void;
  regenerate: () => void;
  replay: () => void;
};

export type TreeStore = TreeSettings & TreeActions;

const INITIAL_SEED = 0x5a17a;

export const useTreeStore = create<TreeStore>((set, get) => ({
  seed: INITIAL_SEED,
  angle: 24,
  depth: 9,
  length: 1,
  wind: 0.42,
  paletteId: "afterglow",
  overlay: "leaves",
  animateGrowth: true,
  growKey: 1,
  model: generateTree(INITIAL_SEED, 9),

  setAngle: (angle) => set({ angle }),
  setLength: (length) => set({ length }),
  setWind: (wind) => set({ wind }),
  setPalette: (paletteId) => set({ paletteId }),
  setOverlay: (overlay) => set({ overlay }),
  setDepth: (depth) => {
    const next = Math.round(depth);
    if (next === get().depth) return;
    set({
      depth: next,
      animateGrowth: false,
      model: generateTree(get().seed, next),
    });
  },
  regenerate: () => {
    const seed = newSeed();
    const { depth } = get();
    set({
      seed,
      model: generateTree(seed, depth),
      animateGrowth: true,
      growKey: get().growKey + 1,
    });
  },
  replay: () => set({ animateGrowth: true, growKey: get().growKey + 1 }),
}));
