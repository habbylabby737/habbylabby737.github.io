import {
  describeSwatch,
  formatHsl,
  formatRgb,
  formatRgbChannels,
  rgbToOklch,
} from "./color";

export type ExportNaming = "numbered" | "semantic";

const SEMANTIC = ["ink", "shade", "accent", "tone", "paper"] as const;

export function buildCssVariables(hexes: string[], naming: ExportNaming): string {
  const described = hexes.map((hex) => describeSwatch(hex));
  const ordered =
    naming === "semantic"
      ? [...described].sort((a, b) => rgbToOklch(a.rgb).l - rgbToOklch(b.rgb).l)
      : described;

  const lines: string[] = [":root {"];
  ordered.forEach((swatch, i) => {
    const key = naming === "semantic" ? SEMANTIC[i] : String(i + 1);
    const token = `--color-${key}`;
    lines.push(`  ${token}: ${swatch.hex};`);
    lines.push(`  ${token}-rgb: ${formatRgbChannels(swatch.rgb)};`);
    lines.push(`  ${token}-hsl: ${formatHsl(swatch.hsl)};`);
  });
  lines.push("}");
  return lines.join("\n");
}

export function buildPlainList(hexes: string[]): string {
  return hexes.map((hex) => describeSwatch(hex).hex).join("\n");
}

export function buildRgbList(hexes: string[]): string {
  return hexes.map((hex) => formatRgb(describeSwatch(hex).rgb)).join("\n");
}

export function buildHslList(hexes: string[]): string {
  return hexes.map((hex) => formatHsl(describeSwatch(hex).hsl)).join("\n");
}
