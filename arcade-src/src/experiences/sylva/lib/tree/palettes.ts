export type Palette = {
  id: string;
  name: string;
  sky: [string, string, string, string];
  sun: string;
  sunGlow: string;
  ground: string;
  groundTop: string;
  grass: string;
  barkDark: string;
  barkLight: string;
  leafA: string;
  leafB: string;
  blossomA: string;
  blossomB: string;
  blossomCenter: string;
  haze: string;
  particle: string;
  stars: boolean;
  sunY: number;
  swatch: [string, string, string];
};

export const PALETTES: Palette[] = [
  {
    id: "afterglow",
    name: "Afterglow",
    sky: ["#1a1210", "#4a241c", "#c4683c", "#f0c090"],
    sun: "#ffd8a8",
    sunGlow: "#e88850",
    ground: "#1a120e",
    groundTop: "#2a1c14",
    grass: "#3a2a18",
    barkDark: "#241610",
    barkLight: "#8a5a38",
    leafA: "#3a5a28",
    leafB: "#8aaa48",
    blossomA: "#f0c8b0",
    blossomB: "#e8a090",
    blossomCenter: "#f0d878",
    haze: "#d47850",
    particle: "#f8d8b0",
    stars: false,
    sunY: 0.62,
    swatch: ["#c4683c", "#3a2418", "#5a7a38"],
  },
  {
    id: "harbor",
    name: "Harbor",
    sky: ["#0b1018", "#162030", "#3a4a5c", "#7a8a98"],
    sun: "#e8ece8",
    sunGlow: "#8aa0b0",
    ground: "#101418",
    groundTop: "#1a2228",
    grass: "#243038",
    barkDark: "#1a1816",
    barkLight: "#6a5e54",
    leafA: "#2a4a40",
    leafB: "#6a8a78",
    blossomA: "#d0d8d8",
    blossomB: "#b0c0c4",
    blossomCenter: "#e8ece4",
    haze: "#4a5a68",
    particle: "#c8d4d8",
    stars: true,
    sunY: 0.28,
    swatch: ["#3a4a5c", "#2a2420", "#4a6a58"],
  },
  {
    id: "harvest",
    name: "Harvest",
    sky: ["#180e0c", "#6a2818", "#c45a24", "#e8a040"],
    sun: "#ffc060",
    sunGlow: "#d06028",
    ground: "#18100c",
    groundTop: "#2a1810",
    grass: "#3a2414",
    barkDark: "#1c100c",
    barkLight: "#7a4024",
    leafA: "#8a3818",
    leafB: "#d47828",
    blossomA: "#f0b060",
    blossomB: "#e87838",
    blossomCenter: "#f8d878",
    haze: "#c45020",
    particle: "#f0c070",
    stars: false,
    sunY: 0.58,
    swatch: ["#c45a24", "#2a1410", "#c46820"],
  },
  {
    id: "nocturne",
    name: "Nocturne",
    sky: ["#07080c", "#10141c", "#1c2430", "#2a3444"],
    sun: "#dce4e8",
    sunGlow: "#6a7888",
    ground: "#0a0c10",
    groundTop: "#14181e",
    grass: "#1a2028",
    barkDark: "#16181c",
    barkLight: "#8a9098",
    leafA: "#3a4850",
    leafB: "#8a9aa4",
    blossomA: "#e8e4dc",
    blossomB: "#c8c4bc",
    blossomCenter: "#f4f0e4",
    haze: "#2a3440",
    particle: "#d0d8e0",
    stars: true,
    sunY: 0.22,
    swatch: ["#1c2430", "#2a2c30", "#c8c4bc"],
  },
  {
    id: "orchard",
    name: "Orchard",
    sky: ["#12160e", "#2a341c", "#6a7a40", "#c4c478"],
    sun: "#f0e0a0",
    sunGlow: "#88a050",
    ground: "#12140e",
    groundTop: "#1e2416",
    grass: "#2a3418",
    barkDark: "#221810",
    barkLight: "#6a4a30",
    leafA: "#2a4a20",
    leafB: "#6a8a38",
    blossomA: "#f0c0c8",
    blossomB: "#e898a8",
    blossomCenter: "#f8e8b0",
    haze: "#8a9a50",
    particle: "#f4d0d4",
    stars: false,
    sunY: 0.48,
    swatch: ["#6a7a40", "#2a1c14", "#e8a0ac"],
  },
];

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}
