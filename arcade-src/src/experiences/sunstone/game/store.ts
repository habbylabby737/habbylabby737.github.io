import { create } from "zustand";
import type { HudSnapshot, Phase } from "./types";

const INITIAL: HudSnapshot = {
  phase: "title",
  time: 0,
  collected: 0,
  total: 0,
  bestTime: null,
  isNewBest: false,
  pointerLocked: false,
  isCoarse: false,
};

type GameStore = HudSnapshot & {
  setHud: (partial: Partial<HudSnapshot>) => void;
  resetHud: (partial?: Partial<HudSnapshot>) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL,
  setHud: (partial) => set(partial),
  resetHud: (partial) => set({ ...INITIAL, ...partial }),
}));

export function readBestTime(): number | null {
  try {
    const raw = localStorage.getItem("sunstone-best");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeBestTime(seconds: number) {
  try {
    localStorage.setItem("sunstone-best", String(seconds));
  } catch {
    /* ignore quota */
  }
}

export type { Phase };
