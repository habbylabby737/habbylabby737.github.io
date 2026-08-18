export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Oklch = { l: number; c: number; h: number };

export const WHITE: Rgb = { r: 255, g: 255, b: 255 };
export const BLACK: Rgb = { r: 17, g: 17, b: 17 };

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string): Rgb {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) =>
    clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case R:
        h = ((G - B) / d) % 6;
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      default:
        h = (R - G) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const S = s / 100;
  const L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const Hp = (((h % 360) + 360) % 360) / 60;
  const X = C * (1 - Math.abs((Hp % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (Hp < 1) [r1, g1, b1] = [C, X, 0];
  else if (Hp < 2) [r1, g1, b1] = [X, C, 0];
  else if (Hp < 3) [r1, g1, b1] = [0, C, X];
  else if (Hp < 4) [r1, g1, b1] = [0, X, C];
  else if (Hp < 5) [r1, g1, b1] = [X, 0, C];
  else [r1, g1, b1] = [C, 0, X];
  const m = L - C / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function srgbToLinear(c: number) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number) {
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return s;
}

export function relativeLuminance(rgb: Rgb): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "fail";

export function wcagLevel(ratio: number, large = false): WcagLevel {
  if (large) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

export function formatHex(hex: string): string {
  return rgbToHex(hexToRgb(hex));
}

export function formatRgb(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHsl(hsl: Hsl): string {
  return `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`;
}

export function formatRgbChannels(rgb: Rgb): string {
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!isValidHex(trimmed)) return null;
  return formatHex(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
}

export function bestTextOn(hex: string): { hex: string; rgb: Rgb } {
  const rgb = hexToRgb(hex);
  const white = contrastRatio(rgb, WHITE);
  const black = contrastRatio(rgb, BLACK);
  return white >= black
    ? { hex: "#F7F7F5", rgb: WHITE }
    : { hex: "#141414", rgb: BLACK };
}

export function contrastReport(hex: string) {
  const rgb = hexToRgb(hex);
  const vsWhite = contrastRatio(rgb, WHITE);
  const vsBlack = contrastRatio(rgb, BLACK);
  return {
    vsWhite,
    vsBlack,
    whiteLevel: wcagLevel(vsWhite),
    blackLevel: wcagLevel(vsBlack),
    whiteLarge: wcagLevel(vsWhite, true),
    blackLarge: wcagLevel(vsBlack, true),
    text: bestTextOn(hex),
    needsScrim: Math.max(vsWhite, vsBlack) < 3.2,
  };
}

function linearToOklab(r: number, g: number, b: number) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function oklabToLinear(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const lab = linearToOklab(
    srgbToLinear(rgb.r),
    srgbToLinear(rgb.g),
    srgbToLinear(rgb.b),
  );
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.L, c, h };
}

export function oklchToRgb(ok: Oklch): { rgb: Rgb; inGamut: boolean } {
  const h = (ok.h * Math.PI) / 180;
  const a = ok.c * Math.cos(h);
  const b = ok.c * Math.sin(h);
  const lin = oklabToLinear(ok.l, a, b);
  const inGamut =
    lin.r >= -0.001 &&
    lin.r <= 1.001 &&
    lin.g >= -0.001 &&
    lin.g <= 1.001 &&
    lin.b >= -0.001 &&
    lin.b <= 1.001;
  return {
    rgb: {
      r: clamp(Math.round(linearToSrgb(lin.r) * 255), 0, 255),
      g: clamp(Math.round(linearToSrgb(lin.g) * 255), 0, 255),
      b: clamp(Math.round(linearToSrgb(lin.b) * 255), 0, 255),
    },
    inGamut,
  };
}

export function oklchToHex(ok: Oklch): string {
  let lo = 0;
  let hi = Math.max(ok.c, 0);
  let best = oklchToRgb({ ...ok, c: 0 }).rgb;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const { rgb, inGamut } = oklchToRgb({ ...ok, c: mid });
    if (inGamut) {
      lo = mid;
      best = rgb;
    } else {
      hi = mid;
    }
  }
  if (ok.c === 0) best = oklchToRgb({ ...ok, c: 0 }).rgb;
  else {
    const { rgb, inGamut } = oklchToRgb(ok);
    if (inGamut) best = rgb;
  }
  return rgbToHex(best);
}

const HUE_NAMES: { name: string; h: number }[] = [
  { name: "Rose", h: 0 },
  { name: "Coral", h: 18 },
  { name: "Amber", h: 38 },
  { name: "Gold", h: 52 },
  { name: "Lime", h: 85 },
  { name: "Moss", h: 115 },
  { name: "Fern", h: 140 },
  { name: "Teal", h: 175 },
  { name: "Cyan", h: 195 },
  { name: "Azure", h: 215 },
  { name: "Indigo", h: 250 },
  { name: "Violet", h: 280 },
  { name: "Orchid", h: 310 },
  { name: "Crimson", h: 345 },
];

export function colorName(hex: string): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  if (hsl.s < 8) {
    if (hsl.l < 12) return "Ink";
    if (hsl.l < 28) return "Charcoal";
    if (hsl.l < 48) return "Graphite";
    if (hsl.l < 68) return "Stone";
    if (hsl.l < 86) return "Fog";
    return "Paper";
  }
  let closest = HUE_NAMES[0]!;
  let best = 180;
  for (const entry of HUE_NAMES) {
    const d = Math.min(
      Math.abs(hsl.h - entry.h),
      360 - Math.abs(hsl.h - entry.h),
    );
    if (d < best) {
      best = d;
      closest = entry;
    }
  }
  if (hsl.l < 22) return `Deep ${closest.name}`;
  if (hsl.l > 82) return `Pale ${closest.name}`;
  if (hsl.s < 22) return `Dusty ${closest.name}`;
  return closest.name;
}

export type SwatchValues = {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  name: string;
  contrast: ReturnType<typeof contrastReport>;
};

export function describeSwatch(hex: string): SwatchValues {
  const normalized = formatHex(hex);
  const rgb = hexToRgb(normalized);
  return {
    hex: normalized,
    rgb,
    hsl: rgbToHsl(rgb),
    name: colorName(normalized),
    contrast: contrastReport(normalized),
  };
}
