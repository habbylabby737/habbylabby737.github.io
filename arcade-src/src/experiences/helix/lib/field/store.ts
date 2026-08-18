import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_COUNT,
  DEFAULT_FORCE,
  DEFAULT_TRAIL,
  type FieldBackgroundId,
  type FieldPaletteId,
} from "./theme";

export type FieldSettings = {
  count: number;
  force: number;
  trail: number;
  background: FieldBackgroundId;
  palette: FieldPaletteId;
};

type FieldStore = FieldSettings & {
  setCount: (count: number) => void;
  setForce: (force: number) => void;
  setTrail: (trail: number) => void;
  setBackground: (background: FieldBackgroundId) => void;
  setPalette: (palette: FieldPaletteId) => void;
  resetDefaults: () => void;
};

const defaults: FieldSettings = {
  count: DEFAULT_COUNT,
  force: DEFAULT_FORCE,
  trail: DEFAULT_TRAIL,
  background: "void",
  palette: "ember",
};

export const useFieldStore = create<FieldStore>()(
  persist(
    (set) => ({
      ...defaults,
      setCount: (count) => set({ count }),
      setForce: (force) => set({ force }),
      setTrail: (trail) => set({ trail }),
      setBackground: (background) => set({ background }),
      setPalette: (palette) => set({ palette }),
      resetDefaults: () => set(defaults),
    }),
    { name: "helix-field-v1", skipHydration: true },
  ),
);
