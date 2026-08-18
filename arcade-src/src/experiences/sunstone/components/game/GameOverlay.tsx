import type { ReactNode } from "react";
import { Gem, Pause, Timer } from "lucide-react";
import { useGameStore } from "@/experiences/sunstone/game/store";
import { Button } from "@/experiences/sunstone/components/ui/button";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  const whole = Math.floor(rem);
  const frac = Math.floor((rem - whole) * 100)
    .toString()
    .padStart(2, "0");
  return `${m}:${whole.toString().padStart(2, "0")}.${frac}`;
}

export function GameOverlay({
  onPlay,
  onResume,
  onRestart,
  onPause,
}: {
  onPlay: () => void;
  onResume: () => void;
  onRestart: () => void;
  onPause: () => void;
}) {
  const phase = useGameStore((s) => s.phase);
  const time = useGameStore((s) => s.time);
  const collected = useGameStore((s) => s.collected);
  const total = useGameStore((s) => s.total);
  const bestTime = useGameStore((s) => s.bestTime);
  const isNewBest = useGameStore((s) => s.isNewBest);
  const isCoarse = useGameStore((s) => s.isCoarse);

  return (
    <>
      {(phase === "playing" || phase === "paused") && (
        <div className="pointer-events-none absolute inset-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[9.5rem] sm:p-5 sm:pr-[13rem]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="pointer-events-auto flex items-center gap-2">
                <HudChip icon={<Timer className="size-3.5" />} label={formatTime(time)} />
                <HudChip
                  icon={<Gem className="size-3.5" />}
                  label={`${collected}/${total}`}
                />
              </div>
              {isCoarse ? (
                <button
                  type="button"
                  onClick={onPause}
                  className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-md border border-border bg-surface/80 text-foreground"
                  aria-label="Pause"
                >
                  <Pause className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/80" />
        </div>
      )}

      {phase === "title" && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-background/35 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="overlay-enter w-full max-w-md rounded-xl border border-border bg-surface/92 p-6 shadow-panel sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Low-poly maze
              </p>
            </div>
            <h1 className="font-display text-5xl leading-none tracking-[-0.03em] text-foreground sm:text-6xl">
              Sunstone
            </h1>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
              Wander the sandstone corridors, pocket every sunstone, and step through
              the glowing gate. Walls are solid. The map only remembers where you have
              been.
            </p>
            <ul className="mt-6 space-y-1.5 text-sm text-muted">
              <li>
                <span className="text-foreground">Move</span>
                {isCoarse ? " — left stick" : " — WASD or arrows"}
              </li>
              <li>
                <span className="text-foreground">Look</span>
                {isCoarse ? " — drag on the right" : " — mouse · Esc to pause"}
              </li>
              <li>
                <span className="text-foreground">Sprint</span> — Shift
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="w-full sm:flex-1" onClick={onPlay}>
                Enter the maze
              </Button>
            </div>
            {bestTime !== null ? (
              <p className="mt-5 text-xs tabular-nums text-subtle">
                Best run {formatTime(bestTime)}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {phase === "paused" && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/50 p-5">
          <div className="overlay-enter w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-panel sm:p-7">
            <h2 className="font-display text-3xl tracking-[-0.03em]">Paused</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {formatTime(time)} in · {collected} of {total} stones
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" onClick={onResume}>
                Resume
              </Button>
              <Button size="lg" variant="outline" onClick={onRestart}>
                New maze
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === "won" && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/50 p-5">
          <div className="overlay-enter w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-panel sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Gate found
            </p>
            <h2 className="mt-2 font-display text-4xl tracking-[-0.03em]">You made it</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat label="Time" value={formatTime(time)} />
              <Stat label="Stones" value={`${collected}/${total}`} />
            </div>
            {isNewBest ? (
              <p className="mt-4 text-sm text-foreground">New best time.</p>
            ) : bestTime !== null ? (
              <p className="mt-4 text-sm text-muted">
                Best {formatTime(bestTime)}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" onClick={onRestart}>
                Wander again
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HudChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/80 px-3 py-2 text-sm tabular-nums text-foreground backdrop-blur-sm">
      <span className="text-muted">{icon}</span>
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-elevated px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}
