import type { ReactNode } from "react";
import { useState } from "react";
import { Drawer } from "vaul";
import { RotateCcw, SlidersHorizontal, Sprout } from "lucide-react";
import { Button } from "@/experiences/sylva/components/ui/button";
import { Label } from "@/experiences/sylva/components/ui/label";
import { Separator } from "@/experiences/sylva/components/ui/separator";
import { Slider } from "@/experiences/sylva/components/ui/slider";
import { PALETTES } from "@/experiences/sylva/lib/tree/palettes";
import { useTreeStore, type TreeStore } from "@/experiences/sylva/lib/tree/store";
import type { OverlayMode } from "@/experiences/sylva/lib/tree/types";
import { cn } from "@/shared/cn";

const OVERLAYS: { id: OverlayMode; label: string }[] = [
  { id: "none", label: "Bare" },
  { id: "leaves", label: "Leaves" },
  { id: "blossoms", label: "Blossoms" },
  { id: "both", label: "Both" },
];

function ControlFields() {
  const angle = useTreeStore((s) => s.angle);
  const depth = useTreeStore((s) => s.depth);
  const length = useTreeStore((s) => s.length);
  const wind = useTreeStore((s) => s.wind);
  const paletteId = useTreeStore((s) => s.paletteId);
  const overlay = useTreeStore((s) => s.overlay);
  const seed = useTreeStore((s) => s.seed);
  const setAngle = useTreeStore((s) => s.setAngle);
  const setDepth = useTreeStore((s) => s.setDepth);
  const setLength = useTreeStore((s) => s.setLength);
  const setWind = useTreeStore((s) => s.setWind);
  const setPalette = useTreeStore((s) => s.setPalette);
  const setOverlay = useTreeStore((s) => s.setOverlay);

  const [depthDraft, setDepthDraft] = useState(depth);

  return (
    <div className="flex flex-col gap-4">
      <Field
        id="angle"
        label="Branching angle"
        value={`${Math.round(angle)}°`}
      >
        <Slider
          id="angle"
          min={10}
          max={48}
          step={0.5}
          value={[angle]}
          onValueChange={([v]) => setAngle(v ?? angle)}
        />
      </Field>

      <Field id="depth" label="Depth" value={String(depthDraft)}>
        <Slider
          id="depth"
          min={5}
          max={11}
          step={1}
          value={[depthDraft]}
          onValueChange={([v]) => setDepthDraft(Math.round(v ?? depthDraft))}
          onValueCommit={([v]) => setDepth(v ?? depth)}
        />
      </Field>

      <Field id="length" label="Reach" value={length.toFixed(2)}>
        <Slider
          id="length"
          min={0.62}
          max={1.38}
          step={0.01}
          value={[length]}
          onValueChange={([v]) => setLength(v ?? length)}
        />
      </Field>

      <Field id="wind" label="Wind" value={`${Math.round(wind * 100)}%`}>
        <Slider
          id="wind"
          min={0}
          max={1}
          step={0.01}
          value={[wind]}
          onValueChange={([v]) => setWind(v ?? wind)}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <Label>Palette</Label>
        <div className="grid grid-cols-5 gap-2">
          {PALETTES.map((p) => {
            const active = p.id === paletteId;
            return (
              <button
                key={p.id}
                type="button"
                title={p.name}
                aria-label={p.name}
                aria-pressed={active}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "flex h-11 flex-col overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  active
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                    : "ring-1 ring-border",
                )}
              >
                <span className="h-1/2 w-full" style={{ background: p.swatch[0] }} />
                <span className="flex h-1/2 w-full">
                  <span className="h-full w-1/2" style={{ background: p.swatch[1] }} />
                  <span className="h-full w-1/2" style={{ background: p.swatch[2] }} />
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {PALETTES.find((p) => p.id === paletteId)?.name}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Overlay</Label>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
          {OVERLAYS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOverlay(o.id)}
              className={cn(
                "h-9 rounded-lg px-1 text-xs font-medium transition-[background-color,color] duration-150",
                overlay === o.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        Seed {seed.toString(16).padStart(8, "0")}
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  children,
}: {
  id: string;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <span className="font-mono text-xs tabular-nums text-foreground/80">{value}</span>
      </div>
      {children}
    </div>
  );
}

function ActionRow({ compact = false }: { compact?: boolean }) {
  const regenerate = useTreeStore((s: TreeStore) => s.regenerate);
  const replay = useTreeStore((s: TreeStore) => s.replay);
  return (
    <div className={cn("flex gap-2", compact && "w-full")}>
      <Button className="flex-1" onClick={() => regenerate()}>
        <Sprout />
        Regenerate
      </Button>
      <Button
        variant="outline"
        size={compact ? "default" : "icon"}
        className={compact ? "px-3" : undefined}
        onClick={() => replay()}
        aria-label="Replay growth"
        title="Replay growth"
      >
        <RotateCcw />
        {compact ? <span className="sr-only">Replay growth</span> : null}
      </Button>
    </div>
  );
}

export function DesktopPanel() {
  return (
    <aside className="pointer-events-auto hidden w-72 shrink-0 flex-col gap-5 rounded-3xl bg-card p-4 shadow-[var(--shadow-border)] md:flex">
      <div>
        <p className="font-display text-2xl leading-tight tracking-tight text-foreground">
          Shape
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          Angle, depth, and reach reshape the grove. Wind keeps it breathing.
        </p>
      </div>
      <Separator />
      <ControlFields />
      <ActionRow />
    </aside>
  );
}

export function MobileControls() {
  return (
    <div className="pointer-events-auto flex w-full items-center gap-2 md:hidden">
      <Drawer.Root>
        <Drawer.Trigger asChild>
          <Button variant="secondary" className="flex-1">
            <SlidersHorizontal />
            Adjust
          </Button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/55" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] flex-col overflow-hidden rounded-t-3xl bg-card px-4 pb-5 pt-3 shadow-[var(--shadow-border)] outline-none">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <Drawer.Title className="font-display text-2xl tracking-tight">
              Shape
            </Drawer.Title>
            <Drawer.Description className="mb-3 text-xs text-muted-foreground">
              Shape the tree, then let it grow.
            </Drawer.Description>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
              <ControlFields />
            </div>
            <div className="border-t border-border pt-3">
              <ActionRow compact />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <Button onClick={() => useTreeStore.getState().regenerate()} className="flex-1">
        <Sprout />
        Regenerate
      </Button>
    </div>
  );
}
