import { useCallback, useEffect, useRef, useState } from "react";
import { cellFromPoint } from "@/experiences/dotfield/lib/pixel-math";
import { PALETTE } from "@/experiences/dotfield/lib/pixel-palette";
import { cn } from "@/shared/cn";
import { useEditor } from "@/experiences/dotfield/store/editor-store";

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const lastCell = useRef<{ x: number; y: number } | null>(null);
  const pointerId = useRef<number | null>(null);
  const [side, setSide] = useState(280);

  const gridSize = useEditor((s) => s.gridSize);
  const pixels = useEditor((s) => s.pixels);
  const showGrid = useEditor((s) => s.showGrid);
  const tool = useEditor((s) => s.tool);
  const hover = useEditor((s) => s.hover);
  const hasDrawn = useEditor((s) => s.hasDrawn);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      const style = getComputedStyle(stage);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const next = Math.max(
        96,
        Math.floor(Math.min(rect.width - padX, rect.height - padY) - 2),
      );
      setSide((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(side * dpr));
    if (canvas.width !== w || canvas.height !== w) {
      canvas.width = w;
      canvas.height = w;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, w);

    const cell = w / gridSize;
    const state = useEditor.getState();

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = state.pixels[y * gridSize + x] ?? -1;
        if (color < 0) continue;
        ctx.fillStyle = PALETTE[color]?.hex ?? "#000";
        ctx.fillRect(
          Math.floor(x * cell),
          Math.floor(y * cell),
          Math.ceil(cell) + 1,
          Math.ceil(cell) + 1,
        );
      }
    }
  }, [gridSize, side]);

  useEffect(() => {
    paint();
  }, [paint, pixels, gridSize, side]);

  const resolveCell = (event: React.PointerEvent) => {
    const frame = frameRef.current;
    if (!frame) return null;
    return cellFromPoint(
      event.clientX,
      event.clientY,
      frame.getBoundingClientRect(),
      useEditor.getState().gridSize,
    );
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    const cell = resolveCell(event);
    if (!cell) return;

    const state = useEditor.getState();
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    lastCell.current = { x: cell.x, y: cell.y };
    state.setHover({ x: cell.x, y: cell.y });

    if (state.tool === "fill") {
      state.fillAt(cell.x, cell.y);
      return;
    }
    if (state.tool === "eyedropper") {
      state.sampleAt(cell.x, cell.y);
      return;
    }

    state.beginStroke();
    state.applyStrokePoint(cell.x, cell.y);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const cell = resolveCell(event);
    if (!cell) return;
    const state = useEditor.getState();

    if (cell.inside) state.setHover({ x: cell.x, y: cell.y });
    else if (pointerId.current === null) state.setHover(null);

    if (pointerId.current !== event.pointerId) return;
    if (state.tool !== "pencil" && state.tool !== "eraser") return;

    const prev = lastCell.current;
    state.applyStrokePoint(cell.x, cell.y, prev);
    lastCell.current = { x: cell.x, y: cell.y };
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    lastCell.current = null;
    useEditor.getState().endStroke();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cursor =
    tool === "eraser"
      ? "cursor-cell"
      : tool === "fill"
        ? "cursor-pointer"
        : tool === "eyedropper"
          ? "cursor-copy"
          : "cursor-crosshair";

  return (
    <div ref={stageRef} className="canvas-stage">
      <div
        ref={frameRef}
        className={cn(
          "canvas-frame overflow-hidden rounded-lg shadow-border shadow-lift",
          "checkerboard touch-none select-none",
          cursor,
        )}
        style={{ width: side, height: side }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={() => {
          if (pointerId.current === null) useEditor.getState().setHover(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          className="pixelated absolute inset-0 size-full"
          style={{ width: side, height: side }}
        />

        {showGrid ? (
          <div
            aria-hidden
            className="pixel-grid pointer-events-none absolute inset-0"
            style={{
              backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
            }}
          />
        ) : null}

        {hover ? (
          <div
            aria-hidden
            className="pointer-events-none absolute bg-primary/15 ring-1 ring-primary/70"
            style={{
              left: `${(hover.x / gridSize) * 100}%`,
              top: `${(hover.y / gridSize) * 100}%`,
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
            }}
          />
        ) : null}

        {!hasDrawn ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
            <p className="max-w-44 text-sm leading-snug text-muted">
              Drag to draw. Fill paints a whole region.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
