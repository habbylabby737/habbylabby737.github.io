import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Circle,
  CloudRain,
  Cylinder,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCurrentUserState } from "@/shared/auth";
import { SignedIn, SignedOut, UserButton } from "@/shared/auth";
import { Button } from "@/experiences/kinetic/components/ui/button";
import { LabeledSlider } from "@/experiences/kinetic/components/ui/slider";
import { MAX_BODIES, usePlayground, type ShapeKind } from "@/experiences/kinetic/lib/playground-store";
import { cn } from "@/shared/cn";

const SHAPES: { id: ShapeKind; label: string; icon: typeof Circle; hint: string }[] = [
  { id: "sphere", label: "Sphere", icon: Circle, hint: "1" },
  { id: "box", label: "Box", icon: Box, hint: "2" },
  { id: "cylinder", label: "Cylinder", icon: Cylinder, hint: "3" },
];

export function PlaygroundHud() {
  const selected = usePlayground((s) => s.selected);
  const setSelected = usePlayground((s) => s.setSelected);
  const spawn = usePlayground((s) => s.spawn);
  const rain = usePlayground((s) => s.rain);
  const clear = usePlayground((s) => s.clear);
  const reset = usePlayground((s) => s.reset);
  const count = usePlayground((s) => s.bodies.length);
  const gravity = usePlayground((s) => s.gravity);
  const setGravity = usePlayground((s) => s.setGravity);
  const restitution = usePlayground((s) => s.restitution);
  const setRestitution = usePlayground((s) => s.setRestitution);
  const paused = usePlayground((s) => s.paused);
  const togglePaused = usePlayground((s) => s.togglePaused);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(false), 7000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.isContentEditable)) return;
      if (event.key === "1") setSelected("sphere");
      else if (event.key === "2") setSelected("box");
      else if (event.key === "3") setSelected("cylinder");
      else if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        spawn();
      } else if (event.key === "r" || event.key === "R") rain();
      else if (event.key === "c" || event.key === "C" || event.key === "Backspace") clear();
      else if (event.key === "p" || event.key === "P") togglePaused();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelected, spawn, rain, clear, togglePaused]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      <header className="pointer-events-auto flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[2rem] leading-none tracking-tight sm:text-4xl">
            Kinetic
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            <span className="tabular-nums text-fg/80">{count}</span>
            <span className="text-subtle"> / {MAX_BODIES}</span>
            <span className="mx-2 text-subtle">·</span>
            physics bench
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            size="iconSm"
            aria-label={paused ? "Resume" : "Pause"}
            onClick={togglePaused}
          >
            {paused ? <Play className="size-4" strokeWidth={1.75} /> : <Pause className="size-4" strokeWidth={1.75} />}
          </Button>
          <AuthChip />
        </div>
      </header>

      <div className="flex flex-col items-stretch gap-3 sm:items-center">
        {hint ? (
          <p className="pointer-events-none text-center text-xs text-muted sm:text-sm">
            Click the floor to drop · drag a body to throw · orbit the empty space
          </p>
        ) : (
          <span className="hidden sm:block" />
        )}

        <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-2xl bg-surface/90 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_16px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md sm:rounded-[28px] sm:p-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {SHAPES.map((shape) => {
              const Icon = shape.icon;
              return (
                <Button
                  key={shape.id}
                  size="icon"
                  pressed={selected === shape.id}
                  aria-label={shape.label}
                  aria-pressed={selected === shape.id}
                  title={`${shape.label} (${shape.hint})`}
                  onClick={() => setSelected(shape.id)}
                  className={cn(selected === shape.id && "bg-fg text-bg")}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </Button>
              );
            })}
            <span className="mx-0.5 hidden h-7 w-px bg-border sm:block" />
            <Button onClick={() => spawn()} className="min-w-14">
              Drop
            </Button>
            <Button onClick={rain} aria-label="Rain shapes" title="Rain (R)">
              <CloudRain className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Rain</span>
            </Button>
            <Button onClick={reset} aria-label="Reset stack" title="Reset">
              <RotateCcw className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              variant="danger"
              onClick={clear}
              aria-label="Clear world"
              title="Clear (C)"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
          <div className="mt-2 flex flex-col gap-2 px-1.5 sm:mt-3 sm:flex-row sm:gap-6">
            <LabeledSlider
              label="Gravity"
              display={`${gravity.toFixed(1)} m/s²`}
              value={gravity}
              min={0}
              max={20}
              step={0.1}
              onValueChange={setGravity}
            />
            <LabeledSlider
              label="Bounce"
              display={restitution.toFixed(2)}
              value={restitution}
              min={0}
              max={0.95}
              step={0.01}
              onValueChange={setRestitution}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-9 animate-pulse rounded-lg bg-fg/8" />;
  }
  return (
    <>
      <SignedOut>
        <Link
          to="/"
          className="inline-flex h-9 items-center rounded-lg bg-fg/6 px-3 text-sm font-medium text-fg transition-colors duration-150 hover:bg-fg/10"
        >
          Sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <div className="hidden max-w-40 truncate sm:block">
          {user ? <UserButton /> : null}
        </div>
      </SignedIn>
    </>
  );
}
