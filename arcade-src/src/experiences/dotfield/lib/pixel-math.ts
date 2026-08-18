import { PALETTE } from "@/experiences/dotfield/lib/pixel-palette";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function indexOf(x: number, y: number, size: number) {
  return y * size + x;
}

export function bresenham(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  plot: (x: number, y: number) => void,
) {
  let dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  for (;;) {
    plot(x, y);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

export function stamp(
  pixels: number[],
  size: number,
  cx: number,
  cy: number,
  value: number,
  brush: number,
) {
  const half = Math.floor(brush / 2);
  for (let y = cy - half; y < cy - half + brush; y++) {
    for (let x = cx - half; x < cx - half + brush; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      pixels[indexOf(x, y, size)] = value;
    }
  }
}

export function floodFill(
  source: number[],
  size: number,
  x: number,
  y: number,
  to: number,
): number[] {
  const start = indexOf(x, y, size);
  const from = source[start];
  if (from === to) return source;

  const next = source.slice();
  const stackX = [x];
  const stackY = [y];

  while (stackX.length) {
    const cx = stackX.pop() as number;
    const cy = stackY.pop() as number;
    const i = indexOf(cx, cy, size);
    if (next[i] !== from) continue;
    next[i] = to;
    if (cx > 0) {
      stackX.push(cx - 1);
      stackY.push(cy);
    }
    if (cx < size - 1) {
      stackX.push(cx + 1);
      stackY.push(cy);
    }
    if (cy > 0) {
      stackX.push(cx);
      stackY.push(cy - 1);
    }
    if (cy < size - 1) {
      stackX.push(cx);
      stackY.push(cy + 1);
    }
  }

  return next;
}

export function resizePixels(
  source: number[],
  from: number,
  to: number,
): number[] {
  const next = Array.from({ length: to * to }, () => -1);
  const copy = Math.min(from, to);
  for (let y = 0; y < copy; y++) {
    for (let x = 0; x < copy; x++) {
      next[y * to + x] = source[y * from + x] ?? -1;
    }
  }
  return next;
}

export function isBlank(pixels: number[]) {
  for (const p of pixels) if (p >= 0) return false;
  return true;
}

export function exportPng(
  pixels: number[],
  gridSize: number,
  scale: number,
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize * scale;
  canvas.height = gridSize * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve();
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = pixels[y * gridSize + x] ?? -1;
      if (color < 0) continue;
      ctx.fillStyle = PALETTE[color]?.hex ?? "#000";
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dotfield-${gridSize}x${gridSize}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

export function cellFromPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  size: number,
) {
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  const x = Math.floor(nx * size);
  const y = Math.floor(ny * size);
  const inside = nx >= 0 && nx < 1 && ny >= 0 && ny < 1;
  return {
    x: clamp(x, 0, size - 1),
    y: clamp(y, 0, size - 1),
    inside,
  };
}
