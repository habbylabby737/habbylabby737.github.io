export type OverlayMode = "none" | "leaves" | "blossoms" | "both";

export type Branch = {
  parent: number;
  angleFactor: number;
  angleJitter: number;
  length: number;
  width: number;
  level: number;
  dist: number;
  phase: number;
  amp: number;
  hueJitter: number;
  curve: number;
  tip: boolean;
  leafCount: number;
  blossomCount: number;
  leafPhase: number;
};

export type TreeModel = {
  branches: Branch[];
  maxDist: number;
  maxLevel: number;
  maxWidth: number;
};

export type Particle = {
  x: number;
  y: number;
  r: number;
  s: number;
  phase: number;
};
