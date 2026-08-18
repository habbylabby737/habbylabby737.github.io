import { SettingsDialog } from "@/experiences/still-pomodoro/components/settings-dialog";
import { usePomodoroStore } from "@/experiences/still-pomodoro/lib/pomodoro-store";
import { cn } from "@/shared/cn";

function CycleDots() {
  const total = usePomodoroStore((s) => s.sessionsUntilLong);
  const done = usePomodoroStore((s) => s.workSessionsCompleted);
  const mode = usePomodoroStore((s) => s.mode);

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${done} of ${total} focus sessions in this cycle`}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < done;
        const current = mode === "work" && i === done;
        return (
          <span
            key={i}
            className={cn(
              "size-2 rounded-full transition-colors duration-200 ease-out",
              filled && "bg-primary",
              current && "bg-primary/40 ring-2 ring-primary/25 ring-offset-1 ring-offset-bg",
              !filled && !current && "bg-track",
            )}
          />
        );
      })}
    </div>
  );
}

export function AppHeader() {
  const completedToday = usePomodoroStore((s) => s.completedToday);

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="font-display text-2xl font-medium tracking-tight italic text-fg">Still Timer</h1>
        <p className="text-sm text-muted">
          <span className="tabular-nums text-fg">{completedToday}</span>
          {" "}
          today
        </p>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <CycleDots />
        <SettingsDialog />
      </div>
    </header>
  );
}
