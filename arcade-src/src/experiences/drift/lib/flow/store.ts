import { create } from "zustand";
import { DEFAULT_PALETTE_ID } from "./palettes";
import { randomSeed } from "./prng";

export type FieldMode = "curl" | "angle";

export type FlowSettings = {
  seed: number;
  speed: number;
  trail: number;
  paletteId: string;
  density: number;
  scale: number;
  morph: number;
  fieldMode: FieldMode;
  paused: boolean;
  panelOpen: boolean;
};

type FlowStore = FlowSettings & {
  setSpeed: (speed: number) => void;
  setTrail: (trail: number) => void;
  setPalette: (paletteId: string) => void;
  setDensity: (density: number) => void;
  setScale: (scale: number) => void;
  setMorph: (morph: number) => void;
  setFieldMode: (fieldMode: FieldMode) => void;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setPanelOpen: (panelOpen: boolean) => void;
  togglePanel: () => void;
  randomize: () => void;
  generation: number;
  bumpGeneration: () => void;
};

const initialSeed = 0xa3f17c02;

export const useFlowStore = create<FlowStore>((set) => ({
  seed: initialSeed,
  speed: 1.15,
  trail: 86,
  paletteId: DEFAULT_PALETTE_ID,
  density: 1,
  scale: 42,
  morph: 22,
  fieldMode: "curl",
  paused: false,
  panelOpen: false,
  generation: 0,
  setSpeed: (speed) => set({ speed }),
  setTrail: (trail) => set({ trail }),
  setPalette: (paletteId) => set({ paletteId }),
  setDensity: (density) => set({ density }),
  setScale: (scale) => set({ scale }),
  setMorph: (morph) => set({ morph }),
  setFieldMode: (fieldMode) => set({ fieldMode }),
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  randomize: () =>
    set((s) => ({
      seed: randomSeed(),
      generation: s.generation + 1,
    })),
  bumpGeneration: () => set((s) => ({ generation: s.generation + 1 })),
}));
