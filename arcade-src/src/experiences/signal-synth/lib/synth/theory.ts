export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

export const WHITE_COUNT_TWO_OCTAVES = 15;
export const KEY_COUNT = 25; // C → C across two octaves
export const BASE_MIDI = 48; // C3
export const OCTAVE_MIN = -2;
export const OCTAVE_MAX = 2;

export type ComputerBinding = {
  code: string;
  offset: number;
};

/** Two-row piano map starting at the visible keyboard's first C. */
export const COMPUTER_BINDINGS: ComputerBinding[] = [
  { code: "KeyA", offset: 0 },
  { code: "KeyW", offset: 1 },
  { code: "KeyS", offset: 2 },
  { code: "KeyE", offset: 3 },
  { code: "KeyD", offset: 4 },
  { code: "KeyF", offset: 5 },
  { code: "KeyT", offset: 6 },
  { code: "KeyG", offset: 7 },
  { code: "KeyY", offset: 8 },
  { code: "KeyH", offset: 9 },
  { code: "KeyU", offset: 10 },
  { code: "KeyJ", offset: 11 },
  { code: "KeyK", offset: 12 },
  { code: "KeyO", offset: 13 },
  { code: "KeyL", offset: 14 },
  { code: "KeyP", offset: 15 },
  { code: "Semicolon", offset: 16 },
  { code: "Quote", offset: 17 },
];

export const BINDING_BY_CODE = new Map(
  COMPUTER_BINDINGS.map((b) => [b.code, b.offset]),
);

export const HINT_BY_OFFSET = new Map(
  COMPUTER_BINDINGS.map((b) => [b.offset, hintFromCode(b.code)]),
);

function hintFromCode(code: string): string {
  if (code === "Semicolon") return ";";
  if (code === "Quote") return "'";
  return code.replace("Key", "");
}

export function midiToName(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function isBlack(midi: number): boolean {
  return BLACK_PCS.has(((midi % 12) + 12) % 12);
}

export function startMidiForOctave(octave: number): number {
  return BASE_MIDI + octave * 12;
}

export function clampOctave(value: number): number {
  return Math.min(OCTAVE_MAX, Math.max(OCTAVE_MIN, value));
}
