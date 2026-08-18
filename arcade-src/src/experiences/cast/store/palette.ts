import { create } from "zustand";
import { formatHex, normalizeHex } from "@/experiences/cast/lib/color";
import { generateHexes, type Harmony, HARMONIES } from "@/experiences/cast/lib/generate";

export type PaletteSwatch = {
  id: string;
  hex: string;
  locked: boolean;
};

export const DEFAULT_HEXES = [
  "#1B1B1E",
  "#E8E2D6",
  "#C45C26",
  "#2F4A3C",
  "#8A9A7C",
] as const;

const IDS = ["a", "b", "c", "d", "e"] as const;

function fromHexes(hexes: readonly string[], locks: boolean[] = []): PaletteSwatch[] {
  return IDS.map((id, i) => ({
    id,
    hex: formatHex(hexes[i] ?? DEFAULT_HEXES[i]!),
    locked: Boolean(locks[i]),
  }));
}

function isHarmony(value: string): value is Harmony {
  return (HARMONIES as readonly string[]).includes(value);
}

export function parsePaletteHash(hash: string): {
  hexes: string[];
  locks: boolean[];
  harmony: Harmony;
} | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;
  const params = new URLSearchParams(raw.includes("&") || raw.includes("=") ? raw : `p=${raw}`);
  const packed = params.get("p") ?? (raw.includes("&") ? raw.split("&")[0] : raw);
  const parts = packed
    .split(/[-_,]/)
    .map((p) => normalizeHex(p))
    .filter((p): p is string => Boolean(p));
  if (parts.length !== 5) return null;
  const lockStr = params.get("l") ?? "";
  const locks = Array.from({ length: 5 }, (_, i) => lockStr[i] === "1");
  const h = params.get("m") ?? "";
  return {
    hexes: parts,
    locks,
    harmony: isHarmony(h) ? h : "mix",
  };
}

export function serializePalette(swatches: PaletteSwatch[], harmony: Harmony): string {
  const p = swatches.map((s) => s.hex.replace("#", "")).join("-");
  const l = swatches.map((s) => (s.locked ? "1" : "0")).join("");
  return `#p=${p}&l=${l}&m=${harmony}`;
}

export type PaletteState = {
  swatches: PaletteSwatch[];
  harmony: Harmony;
  ready: boolean;
  hydrateFromHash: () => void;
  persistHash: () => void;
  shuffle: () => void;
  toggleLock: (id: string) => void;
  setHex: (id: string, hex: string, lock?: boolean) => void;
  setHarmony: (harmony: Harmony) => void;
  lockAll: () => void;
  unlockAll: () => void;
};

export const usePalette = create<PaletteState>((set, get) => ({
  swatches: fromHexes(DEFAULT_HEXES),
  harmony: "mix",
  ready: false,

  hydrateFromHash: () => {
    if (typeof window === "undefined") return;
    const parsed = parsePaletteHash(window.location.hash);
    if (parsed) {
      set({
        swatches: fromHexes(parsed.hexes, parsed.locks),
        harmony: parsed.harmony,
        ready: true,
      });
      return;
    }
    set({ ready: true });
  },

  persistHash: () => {
    if (typeof window === "undefined") return;
    const next = serializePalette(get().swatches, get().harmony);
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  },

  shuffle: () => {
    const { swatches, harmony } = get();
    const fresh = generateHexes(harmony);
    const next = swatches.map((s, i) =>
      s.locked ? s : { ...s, hex: fresh[i] ?? s.hex },
    );
    set({ swatches: next });
    get().persistHash();
  },

  toggleLock: (id) => {
    set({
      swatches: get().swatches.map((s) =>
        s.id === id ? { ...s, locked: !s.locked } : s,
      ),
    });
    get().persistHash();
  },

  setHex: (id, hex, lock = true) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    set({
      swatches: get().swatches.map((s) =>
        s.id === id ? { ...s, hex: normalized, locked: lock ? true : s.locked } : s,
      ),
    });
    get().persistHash();
  },

  setHarmony: (harmony) => {
    set({ harmony });
    get().persistHash();
  },

  lockAll: () => {
    set({ swatches: get().swatches.map((s) => ({ ...s, locked: true })) });
    get().persistHash();
  },

  unlockAll: () => {
    set({ swatches: get().swatches.map((s) => ({ ...s, locked: false })) });
    get().persistHash();
  },
}));

