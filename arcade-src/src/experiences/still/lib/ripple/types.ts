export const COLOR_MAPS = [
  { id: "abyss", label: "Abyss" },
  { id: "thermal", label: "Thermal" },
  { id: "aurora", label: "Aurora" },
  { id: "ink", label: "Ink" },
  { id: "ember", label: "Ember" },
  { id: "ice", label: "Ice" },
] as const;

export type ColorMapId = (typeof COLOR_MAPS)[number]["id"];

export type RippleParams = {
  viscosity: number;
  strength: number;
  colorMap: ColorMapId;
};

export const DEFAULT_PARAMS: RippleParams = {
  viscosity: 0.32,
  strength: 0.58,
  colorMap: "abyss",
};

export const PARAMS_STORAGE_KEY = "still.params.v1";
