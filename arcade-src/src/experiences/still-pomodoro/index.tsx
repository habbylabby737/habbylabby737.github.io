import { useEffect } from "react";
import "./extra.css";
import { AppHeader } from "./components/app-header";
import { TaskList } from "./components/task-list";
import { TimerPanel } from "./components/timer-panel";
import { usePomodoroStore } from "./lib/pomodoro-store";

export default function StillTimer() {
  const hydrate = usePomodoroStore((s) => s.hydrate);
  const rollToday = usePomodoroStore((s) => s.rollToday);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = window.setInterval(rollToday, 60_000);
    return () => window.clearInterval(id);
  }, [rollToday]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col overflow-auto px-5 py-6 sm:px-8 sm:py-10">
      <AppHeader />
      <div className="mt-8 grid flex-1 items-start gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <TimerPanel />
        <TaskList />
      </div>
      <p className="mt-8 text-center text-xs text-subtle sm:mt-10">
        Space to start or pause · R to reset
      </p>
    </main>
  );
}
