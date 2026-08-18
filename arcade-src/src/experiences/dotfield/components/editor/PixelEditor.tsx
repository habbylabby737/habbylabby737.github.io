import {
  Download,
  Eraser,
  Grid3x3,
  PaintBucket,
  Pencil,
  Pipette,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthChip } from "@/experiences/dotfield/components/AuthChip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/experiences/dotfield/components/ui/alert-dialog";
import { Button } from "@/experiences/dotfield/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/experiences/dotfield/components/ui/dropdown-menu";
import { Separator } from "@/experiences/dotfield/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/experiences/dotfield/components/ui/tooltip";
import { exportPng, isBlank } from "@/experiences/dotfield/lib/pixel-math";
import {
  BRUSH_SIZES,
  GRID_PRESETS,
  PALETTE,
  SAMPLE_LANTERN,
  SAMPLE_MUSHROOM,
  type Tool,
} from "@/experiences/dotfield/lib/pixel-palette";
import { cn } from "@/shared/cn";
import { useEditor } from "@/experiences/dotfield/store/editor-store";
import { PixelCanvas } from "./PixelCanvas";

const TOOLS: { id: Tool; label: string; shortcut: string; icon: typeof Pencil }[] = [
  { id: "pencil", label: "Pencil", shortcut: "B", icon: Pencil },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
  { id: "fill", label: "Fill", shortcut: "G", icon: PaintBucket },
  { id: "eyedropper", label: "Eyedropper", shortcut: "I", icon: Pipette },
];

export function PixelEditor() {
  const hydrate = useEditor((s) => s.hydrate);
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const colorIndex = useEditor((s) => s.colorIndex);
  const setColor = useEditor((s) => s.setColor);
  const brush = useEditor((s) => s.brush);
  const setBrush = useEditor((s) => s.setBrush);
  const gridSize = useEditor((s) => s.gridSize);
  const setGridSize = useEditor((s) => s.setGridSize);
  const showGrid = useEditor((s) => s.showGrid);
  const toggleGrid = useEditor((s) => s.toggleGrid);
  const hover = useEditor((s) => s.hover);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const history = useEditor((s) => s.history);
  const future = useEditor((s) => s.future);
  const pixels = useEditor((s) => s.pixels);
  const clear = useEditor((s) => s.clear);
  const loadSprite = useEditor((s) => s.loadSprite);

  const [clearOpen, setClearOpen] = useState(false);
  const [pendingSize, setPendingSize] = useState<number | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;

      if (meta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (meta && key === "s") {
        event.preventDefault();
        void handleExport(16);
        return;
      }
      if (event.key === "Backspace" && meta) {
        event.preventDefault();
        if (!isBlank(useEditor.getState().pixels)) setClearOpen(true);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (key === "b" || key === "p") setTool("pencil");
      else if (key === "e") setTool("eraser");
      else if (key === "g" || key === "f") setTool("fill");
      else if (key === "i") setTool("eyedropper");
      else if (key === "h") toggleGrid();
      else if (key === "[") setBrush(brush === 3 ? 2 : 1);
      else if (key === "]") setBrush(brush === 1 ? 2 : 3);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brush, redo, setBrush, setTool, toggleGrid, undo]);

  const handleExport = async (scale: number) => {
    const state = useEditor.getState();
    await exportPng(state.pixels, state.gridSize, scale);
    toast("PNG saved", { description: `${state.gridSize}×${state.gridSize} at ${scale}×` });
  };

  const requestSize = (size: number) => {
    if (size === gridSize) return;
    if (!isBlank(pixels)) {
      setPendingSize(size);
      return;
    }
    setGridSize(size);
  };

  const swatch = PALETTE[colorIndex];

  return (
    <div className="studio-grain studio-shell bg-bg text-fg">
      <header className="studio-header relative z-10 flex items-center gap-3 border-b border-border px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Mark />
          <div className="min-w-0">
            <h1 className="font-display text-lg leading-none font-semibold tracking-tight">
              Dotfield
            </h1>
            <p className="hidden text-xs text-subtle sm:block">Pixel studio</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden font-mono text-xs tabular-nums text-subtle sm:inline">
            {gridSize}×{gridSize}
            {hover ? `  ·  ${hover.x},${hover.y}` : ""}
          </span>
          <AuthChip />
        </div>
      </header>

      <nav aria-label="Tools" className="studio-tools relative z-10">
          {TOOLS.map((item) => {
            const Icon = item.icon;
            const active = tool === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${item.label} (${item.shortcut})`}
                    aria-pressed={active}
                    onClick={() => setTool(item.id)}
                    className={cn(
                      "relative grid size-11 shrink-0 place-items-center rounded-md transition-[background-color,color,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                      active
                        ? "bg-primary text-primary-fg"
                        : "text-muted hover:bg-raised hover:text-fg",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {item.label}
                  <span className="ml-2 font-mono text-subtle">{item.shortcut}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <Separator className="studio-rule-h bg-border" />
          <Separator orientation="vertical" className="studio-rule-v mx-1 h-6 bg-border" />

          <div className="studio-tools-brushes">
            {BRUSH_SIZES.map((size) => (
              <Tooltip key={size}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Brush ${size}`}
                    aria-pressed={brush === size}
                    onClick={() => setBrush(size)}
                    className={cn(
                      "grid size-11 place-items-center rounded-md transition-colors duration-[var(--motion-quick)]",
                      brush === size ? "bg-raised text-fg" : "text-subtle hover:text-fg",
                    )}
                  >
                    <span
                      className="block rounded-sm bg-current"
                      style={{ width: 4 + size * 4, height: 4 + size * 4 }}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Brush {size}px</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </nav>

        <main className="studio-stage relative z-10 bg-canvas">
          <PixelCanvas />
        </main>

        <aside className="studio-panel relative z-10">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xs font-medium tracking-wide text-subtle uppercase">
                Palette
              </h2>
              <span className="font-mono text-xs text-muted">{swatch?.name}</span>
            </div>
            <div className="studio-palette grid gap-1.5">
              {PALETTE.map((color) => {
                const selected = color.id === colorIndex;
                return (
                  <button
                    key={color.id}
                    type="button"
                    aria-label={color.name}
                    aria-pressed={selected}
                    onClick={() => setColor(color.id)}
                    className={cn(
                      "aspect-square rounded-sm shadow-border transition-[transform,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none",
                      selected && "scale-95 ring-2 ring-primary ring-offset-2 ring-offset-surface",
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                );
              })}
            </div>
          </section>

          <section className="studio-preview">
            <h2 className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">
              Preview
            </h2>
            <div className="flex items-center gap-4">
              <SpritePreview scale={1} />
              <SpritePreview scale={2} />
              <SpritePreview scale={4} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">
              Canvas
            </h2>
            <div className="grid grid-cols-3 gap-1.5">
              {GRID_PRESETS.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={gridSize === size}
                  onClick={() => requestSize(size)}
                  className={cn(
                    "h-10 rounded-md font-mono text-xs tabular-nums transition-colors duration-[var(--motion-quick)]",
                    gridSize === size
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-muted hover:text-fg",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="studio-size-note mt-2 text-xs leading-relaxed text-subtle">
              Resize keeps the top-left. Extra cells crop away.
            </p>
          </section>

          <section className="studio-samples">
            <h2 className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
              Samples
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSprite(SAMPLE_LANTERN)}
              >
                Lantern
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSprite(SAMPLE_MUSHROOM)}
              >
                Mushroom
              </Button>
            </div>
          </section>
        </aside>

      <footer className="studio-dock relative z-10 flex flex-wrap items-center gap-1.5 border-t border-border bg-bg px-2 py-2 sm:px-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Undo"
              disabled={history.length === 0}
              onClick={undo}
            >
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Undo <span className="ml-2 font-mono text-subtle">⌘Z</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Redo"
              disabled={future.length === 0}
              onClick={redo}
            >
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Redo <span className="ml-2 font-mono text-subtle">⌘⇧Z</span>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showGrid ? "secondary" : "ghost"}
              size="icon"
              aria-label="Toggle grid"
              aria-pressed={showGrid}
              onClick={toggleGrid}
            >
              <Grid3x3 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Grid <span className="ml-2 font-mono text-subtle">H</span>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear canvas"
              onClick={() => {
                if (!isBlank(pixels)) setClearOpen(true);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear canvas</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <p className="hidden font-mono text-xs tracking-wide text-subtle xl:block">
            B pencil · E eraser · G fill · I pick
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10">
                <Download className="size-4" />
                Export PNG
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Scale</DropdownMenuLabel>
              {[1, 8, 16, 32].map((scale) => (
                <DropdownMenuItem key={scale} onSelect={() => void handleExport(scale)}>
                  {scale}× — {gridSize * scale}px
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </footer>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              Every pixel on this sheet will be erased. You can undo after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clear();
                setClearOpen(false);
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingSize !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setPendingSize(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resize to {pendingSize}×{pendingSize}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pixels outside the new bounds are cropped from the bottom-right. This can be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-primary text-primary-fg hover:bg-primary/90")}
              onClick={() => {
                if (pendingSize) setGridSize(pendingSize);
                setPendingSize(null);
              }}
            >
              Resize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Mark() {
  const cells = [12, 13, 14, 5, 3, 4, 15, 6];
  return (
    <div
      aria-hidden
      className="grid size-8 grid-cols-4 gap-px overflow-hidden rounded-sm shadow-border"
    >
      {cells.map((id, i) => (
        <span key={i} style={{ backgroundColor: PALETTE[id]?.hex }} />
      ))}
    </div>
  );
}

function SpritePreview({ scale }: { scale: number }) {
  const gridSize = useEditor((s) => s.gridSize);
  const pixels = useEditor((s) => s.pixels);
  const size = gridSize * scale;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="checkerboard overflow-hidden rounded-sm shadow-border"
        style={{ width: Math.max(size, 16), height: Math.max(size, 16) }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${gridSize} ${gridSize}`}
          className="pixelated block"
          shapeRendering="crispEdges"
        >
          {pixels.map((color, i) => {
            if (color < 0) return null;
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={PALETTE[color]?.hex}
              />
            );
          })}
        </svg>
      </div>
      <span className="font-mono text-xs text-subtle">{scale}×</span>
    </div>
  );
}
