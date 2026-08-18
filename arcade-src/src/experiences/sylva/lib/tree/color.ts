export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToCss(c: Rgb, a = 1): string {
  if (a >= 1) return `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

const rgbCache = new Map<string, Rgb>();

export function cachedHex(hex: string): Rgb {
  let c = rgbCache.get(hex);
  if (!c) {
    c = hexToRgb(hex);
    rgbCache.set(hex, c);
  }
  return c;
}

export function mixHex(a: string, b: string, t: number, alpha = 1): string {
  return rgbToCss(lerpRgb(cachedHex(a), cachedHex(b), t), alpha);
}
