import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { ProgressRing } from "@/experiences/still-pomodoro/components/progress-ring";
import { Button } from "@/experiences/still-pomodoro/components/ui/button";
import { MODE_FULL, MODE_LABEL, remainingNow, usePomodoroStore, type Mode } from "@/experiences/still-pomodoro/lib/pomodoro-store";
import { cn, formatClock } from "@/shared/cn";

const MODES: Mode[] = ["work", "shortBreak", "longBreak"];

function ModeSwitcher() {
  const mode = usePomodoroStore((s) => s.mode);
  const setMode = usePomodoroStore((s) => s.setMode);

  return (
    <div
      className="grid grid-cols-3 rounded-xl bg-surface-2 p-1"
      role="tablist"
      aria-label="Timer mode"
    >
      {MODES.map((item) => {
        const active = mode === item;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(item)}
            className={cn(
              "h-11 rounded-lg px-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ease-out",
              active
                ? "bg-primary text-primary-fg shadow-sm"
                : "bg-transparent text-muted hover:text-fg",
            )}
          >
            {MODE_LABEL[item]}
          </button>
        );
      })}
    </div>
  );
}

function StatusLine() {
  const kind = usePomodoroStore((s) => s.statusKind);
  const completedToday = usePomodoroStore((s) => s.completedToday);
  const mode = usePomodoroStore((s) => s.mode);

  if (kind === "workDone") {
    return (
      <p className="text-center text-sm text-muted" data-testid="status-line">
        Focus complete. {completedToday} today — {MODE_FULL[mode].toLowerCase()} is ready.
      </p>
    );
  }
  if (kind === "breakDone") {
    return (
      <p className="text-center text-sm text-muted" data-testid="status-line">
        Break over. Start the next focus when you are ready.
      </p>
    );
  }
  return (
    <p className="text-center text-sm text-muted" data-testid="status-line">
      {mode === "work" ? "Stay with one thing." : "Step away. The next block will wait."}
    </p>
  );
}

export function TimerPanel() {
  const mode = usePomodoroStore((s) => s.mode);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const remainingMs = usePomodoroStore((s) => s.remainingMs);
  const endsAt = usePomodoroStore((s) => s.endsAt);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const complete = usePomodoroStore((s) => s.complete);
  const durationMs = usePomodoroStore((s) => s.durationMs);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning || !endsAt) return;
    const id = window.setInterval(() => {
      if (endsAt - Date.now() <= 0) {
        complete();
        return;
      }
      setTick((n) => n + 1);
    }, 200);
    return () => window.clearInterval(id);
  }, [isRunning, endsAt, complete]);

  const remaining = remainingNow({ isRunning, endsAt, remainingMs });
  const total = durationMs();
  const progress = total > 0 ? remaining / total : 0;
  const clock = formatClock(remaining);

  useEffect(() => {
    const previous = document.title;
    document.title = `${clock} · ${MODE_FULL[mode]} — Still`;
    return () => {
      document.title = previous;
    };
  }, [clock, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (isRunning) pause();
        else start();
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, start, pause, reset]);

  return (
    <section className="flex flex-col items-center gap-6">
      <ModeSwitcher />

      <div className="relative size-64 sm:size-72">
        <ProgressRing progress={progress} mode={mode} running={isRunning} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            data-testid="timer-display"
            className="font-display text-6xl font-medium tracking-tight text-fg tabular-nums sm:text-7xl"
          >
            {clock}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium tracking-wide text-muted uppercase">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isRunning ? "bg-primary" : "bg-track",
              )}
              aria-hidden="true"
            />
            {isRunning ? "Running" : "Paused"}
          </p>
        </div>
      </div>

      <StatusLine />

      <div className="flex w-full items-center justify-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="min-w-36"
          data-testid={isRunning ? "pause-btn" : "start-btn"}
          onClick={isRunning ? pause : start}
        >
          <span className="relative inline-grid size-4 place-items-center">
            <Play
              className={cn(
                "absolute size-4 transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                isRunning ? "scale-[0.25] opacity-0 blur-[4px]" : "ml-0.5 scale-100 opacity-100 blur-none",
              )}
            />
            <Pause
              className={cn(
                "absolute size-4 transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                isRunning ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
              )}
            />
          </span>
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          data-testid="reset-btn"
          onClick={reset}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>
    </section>
  );
}
