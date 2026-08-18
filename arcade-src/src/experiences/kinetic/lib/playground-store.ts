import { create } from "zustand";

export type ShapeKind = "sphere" | "box" | "cylinder";

export type BodySpec = {
  id: string;
  kind: ShapeKind;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  angularVelocity: [number, number, number];
};

export const MAX_BODIES = 72;
export const ARENA_HALF = 6.4;

export const SPHERE_COLORS = ["#b85c38", "#c46a42", "#a34e2e", "#d47850"] as const;
export const BOX_COLORS = ["#d8d0c0", "#cfc6b4", "#e2dbcc", "#c4bba8"] as const;
export const CYLINDER_COLORS = ["#8a949c", "#7a848c", "#96a0a8", "#6e787f"] as const;

const COLORS: Record<ShapeKind, readonly string[]> = {
  sphere: SPHERE_COLORS,
  box: BOX_COLORS,
  cylinder: CYLINDER_COLORS,
};

let seq = 0;

function nid() {
  seq += 1;
  return `b-${seq}`;
}

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function makeBody(
  kind: ShapeKind,
  position?: [number, number, number],
): BodySpec {
  const pos: [number, number, number] = position ?? [
    rand(-1.4, 1.4),
    rand(4.6, 6.4),
    rand(-1.4, 1.4),
  ];
  return {
    id: nid(),
    kind,
    position: pos,
    rotation: [rand(0, 0.5), rand(0, Math.PI), rand(0, 0.5)],
    color: pick(COLORS[kind]),
    angularVelocity: [rand(-1.2, 1.2), rand(-0.8, 0.8), rand(-1.2, 1.2)],
  };
}

export function seedBodies(): BodySpec[] {
  const bodies: BodySpec[] = [];
  const size = 0.7;
  const gap = 0.01;
  const cols = 3;
  const rows = 2;
  const layers = 5;
  const startX = -((cols - 1) * (size + gap)) / 2;
  const startZ = -((rows - 1) * (size + gap)) / 2;

  for (let y = 0; y < layers; y += 1) {
    for (let z = 0; z < rows; z += 1) {
      for (let x = 0; x < cols; x += 1) {
        bodies.push({
          id: nid(),
          kind: "box",
          position: [
            startX + x * (size + gap),
            size / 2 + y * (size + gap),
            startZ + z * (size + gap),
          ],
          rotation: [0, 0, 0],
          color: BOX_COLORS[(x + y + z) % BOX_COLORS.length],
          angularVelocity: [0, 0, 0],
        });
      }
    }
  }

  bodies.push({
    id: nid(),
    kind: "sphere",
    position: [-2.6, 0.4, 0.15],
    rotation: [0, 0, 0],
    color: SPHERE_COLORS[0],
    angularVelocity: [0, 0, 0],
  });
  bodies.push({
    id: nid(),
    kind: "sphere",
    position: [-3.2, 0.4, -0.55],
    rotation: [0, 0, 0],
    color: SPHERE_COLORS[2],
    angularVelocity: [0, 0, 0],
  });
  bodies.push({
    id: nid(),
    kind: "cylinder",
    position: [2.7, 0.38, -0.35],
    rotation: [0, 0.4, 0],
    color: CYLINDER_COLORS[0],
    angularVelocity: [0, 0, 0],
  });

  return bodies;
}

type PlaygroundState = {
  bodies: BodySpec[];
  selected: ShapeKind;
  gravity: number;
  restitution: number;
  paused: boolean;
  dragging: boolean;
  spawn: (kind?: ShapeKind, position?: [number, number, number]) => void;
  rain: () => void;
  clear: () => void;
  reset: () => void;
  remove: (id: string) => void;
  setSelected: (kind: ShapeKind) => void;
  setGravity: (value: number) => void;
  setRestitution: (value: number) => void;
  setPaused: (value: boolean) => void;
  togglePaused: () => void;
  setDragging: (value: boolean) => void;
};

function trim(bodies: BodySpec[]) {
  return bodies.length > MAX_BODIES ? bodies.slice(bodies.length - MAX_BODIES) : bodies;
}

export const usePlayground = create<PlaygroundState>((set, get) => ({
  bodies: seedBodies(),
  selected: "sphere",
  gravity: 9.81,
  restitution: 0.22,
  paused: false,
  dragging: false,
  spawn: (kind, position) => {
    const state = get();
    const spec = makeBody(kind ?? state.selected, position);
    set({ bodies: trim([...state.bodies, spec]) });
  },
  rain: () => {
    const kinds: ShapeKind[] = ["sphere", "box", "cylinder"];
    const extra: BodySpec[] = [];
    for (let i = 0; i < 10; i += 1) {
      extra.push(
        makeBody(kinds[i % 3], [
          rand(-2.8, 2.8),
          4.2 + i * 0.45,
          rand(-2.8, 2.8),
        ]),
      );
    }
    set({ bodies: trim([...get().bodies, ...extra]) });
  },
  clear: () => set({ bodies: [] }),
  reset: () => set({ bodies: seedBodies(), paused: false }),
  remove: (id) => set({ bodies: get().bodies.filter((body) => body.id !== id) }),
  setSelected: (kind) => set({ selected: kind }),
  setGravity: (value) => set({ gravity: value }),
  setRestitution: (value) => set({ restitution: value }),
  setPaused: (value) => set({ paused: value }),
  togglePaused: () => set({ paused: !get().paused }),
  setDragging: (value) => set({ dragging: value }),
}));
