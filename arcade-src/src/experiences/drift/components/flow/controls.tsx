import type { ReactNode } from "react";
import {
  ChevronDown,
  Dices,
  Download,
  Eraser,
  Pause,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/experiences/drift/components/ui/button";
import { Separator } from "@/experiences/drift/components/ui/separator";
import { Slider } from "@/experiences/drift/components/ui/slider";
import { getFlowEngine } from "@/experiences/drift/components/flow/canvas";
import { PALETTES } from "@/experiences/drift/lib/flow/palettes";
import { formatSeed } from "@/experiences/drift/lib/flow/prng";
import { useFlowStore, type FieldMode } from "@/experiences/drift/lib/flow/store";
import { cn } from "@/shared/cn";
import { AuthChip } from "./auth-chip";

export function StudioChrome() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-4">
      <TopBar />
      <ControlPanel />
    </div>
  );
}

function TopBar() {
  const seed = useFlowStore((s) => s.seed);
  const paused = useFlowStore((s) => s.paused);
  const paletteId = useFlowStore((s) => s.paletteId);
  const togglePaused = useFlowStore((s) => s.togglePaused);
  const randomize = useFlowStore((s) => s.randomize);

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-3 rounded-lg bg-bg/70 px-3 py-2 shadow-panel backdrop-blur-md">
        <h1 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
          Drift
        </h1>
        <p className="hidden font-mono text-xs text-fg-subtle sm:block">
          {formatSeed(seed)}
        </p>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg bg-bg/70 p-1.5 shadow-panel backdrop-blur-md">
        <IconAction label={paused ? "Resume" : "Pause"} onClick={togglePaused}>
          {paused ? <Play className="ml-0.5" /> : <Pause />}
        </IconAction>
        <IconAction label="Randomize seed" onClick={randomize}>
          <Dices />
        </IconAction>
        <IconAction label="Clear canvas" onClick={() => getFlowEngine()?.clear(true)}>
          <Eraser />
        </IconAction>
        <IconAction label="Export PNG" onClick={() => void exportPng(paletteId, seed)}>
          <Download />
        </IconAction>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <AuthChip />
      </div>
    </header>
  );
}

function ControlPanel() {
  const open = useFlowStore((s) => s.panelOpen);
  const togglePanel = useFlowStore((s) => s.togglePanel);
  const speed = useFlowStore((s) => s.speed);
  const trail = useFlowStore((s) => s.trail);
  const density = useFlowStore((s) => s.density);
  const scale = useFlowStore((s) => s.scale);
  const morph = useFlowStore((s) => s.morph);
  const paletteId = useFlowStore((s) => s.paletteId);
  const fieldMode = useFlowStore((s) => s.fieldMode);
  const setSpeed = useFlowStore((s) => s.setSpeed);
  const setTrail = useFlowStore((s) => s.setTrail);
  const setDensity = useFlowStore((s) => s.setDensity);
  const setScale = useFlowStore((s) => s.setScale);
  const setMorph = useFlowStore((s) => s.setMorph);
  const setPalette = useFlowStore((s) => s.setPalette);
  const setFieldMode = useFlowStore((s) => s.setFieldMode);

  return (
    <aside className="pointer-events-auto w-full max-w-md self-start rounded-xl bg-bg/78 shadow-panel backdrop-blur-md">
      <button
        type="button"
        onClick={togglePanel}
        className="flex h-11 w-full items-center justify-between px-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-fg">
          <SlidersHorizontal className="size-4 text-fg-muted" />
          Controls
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-fg-muted transition-transform duration-200 ease-[var(--ease-smooth-out)]",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-[var(--ease-smooth-out)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="max-h-[42dvh] space-y-3 overflow-y-auto px-4 pb-4 sm:max-h-[min(70dvh,36rem)]">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-fg-muted">
                Palette
                <span className="ml-2 font-normal text-fg">
                  {PALETTES.find((p) => p.id === paletteId)?.name}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p.id)}
                    aria-pressed={paletteId === p.id}
                    title={p.name}
                    className={cn(
                      "h-11 min-w-11 overflow-hidden rounded-sm shadow-border transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.96]",
                      paletteId === p.id
                        ? "ring-2 ring-fg ring-offset-2 ring-offset-bg"
                        : "hover:shadow-border-hover",
                    )}
                  >
                    <span className="sr-only">{p.name}</span>
                    <span className="flex h-full w-14">
                      {p.ink.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="h-full flex-1"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <FieldToggle value={fieldMode} onChange={setFieldMode} />

            <ControlSlider label="Speed" value={speed} display={speed.toFixed(2)} min={0.2} max={3.2} step={0.05} onChange={setSpeed} />
            <ControlSlider label="Trail" value={trail} display={Math.round(trail).toString()} min={0} max={100} step={1} onChange={setTrail} />
            <ControlSlider label="Density" value={density} display={density.toFixed(2)} min={0.35} max={2} step={0.05} onChange={setDensity} />
            <ControlSlider label="Scale" value={scale} display={Math.round(scale).toString()} min={8} max={100} step={1} onChange={setScale} />
            <ControlSlider label="Morph" value={morph} display={Math.round(morph).toString()} min={0} max={100} step={1} onChange={setMorph} />

            <p className="text-xs leading-relaxed text-fg-subtle">
              Drag on the canvas to seed filaments. Space pauses, R randomizes, E exports.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FieldToggle({
  value,
  onChange,
}: {
  value: FieldMode;
  onChange: (mode: FieldMode) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wide text-fg-muted">Field</p>
      <div className="grid grid-cols-2 gap-1 rounded-md bg-bg-subtle p-1">
        {([["curl", "Curl"], ["angle", "Angle"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={value === id}
            className={cn(
              "h-9 rounded-sm text-sm font-medium transition-[background-color,color] duration-150",
              value === id ? "bg-bg-elevated text-fg shadow-border" : "text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium tracking-wide text-fg-muted">{label}</label>
        <span className="font-mono text-xs tabular-nums text-fg">{display}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          const next = v[0];
          if (typeof next === "number") onChange(next);
        }}
        aria-label={label}
      />
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} title={label} onClick={onClick}>
      {children}
    </Button>
  );
}

async function exportPng(paletteId: string, seed: number) {
  const engine = getFlowEngine();
  if (!engine) {
    toast.error("Canvas is not ready");
    return;
  }
  const name = `drift-${paletteId}-${formatSeed(seed)}.png`;
  try {
    await engine.exportPng(name);
    toast.success(`Saved ${name}`);
  } catch {
    toast.error("Could not export PNG");
  }
}
