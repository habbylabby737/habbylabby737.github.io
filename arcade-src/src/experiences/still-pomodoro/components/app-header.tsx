import { Link } from "react-router-dom";
import { SettingsDialog } from "@/experiences/still-pomodoro/components/settings-dialog";
import { Button } from "@/experiences/still-pomodoro/components/ui/button";
import { useCurrentUserState } from "@/shared/auth";
import { UserButton } from "@/shared/auth";
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

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-8 animate-pulse rounded-full bg-surface-2" aria-hidden="true" />;
  }
  if (user) {
    return (
      <div className="hidden sm:block">
        <UserButton />
      </div>
    );
  }
  return (
    <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
      <Link to="/">Sign in</Link>
    </Button>
  );
}

export function AppHeader() {
  const completedToday = usePomodoroStore((s) => s.completedToday);

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="font-display text-2xl font-medium tracking-tight italic text-fg">Still</h1>
        <p className="text-sm text-muted">
          <span className="tabular-nums text-fg">{completedToday}</span>
          {" "}
          today
        </p>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <CycleDots />
        <AuthSlot />
        <SettingsDialog />
      </div>
    </header>
  );
}
