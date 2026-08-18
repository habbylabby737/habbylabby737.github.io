import { useEffect } from "react";
import "./extra.css";
import { AppHeader } from "./components/app-header";
import { DesktopPanel, MobileControls } from "./components/control-panel";
import { TreeCanvas } from "./components/tree-canvas";
import { useTreeStore } from "./lib/tree/store";

export default function Sylva() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        useTreeStore.getState().regenerate();
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        useTreeStore.getState().replay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-background text-foreground">
      <TreeCanvas />
      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col justify-between p-4 md:p-6">
        <AppHeader />
        <div className="flex items-end justify-between gap-4">
          <DesktopPanel />
          <MobileControls />
          <p className="pointer-events-none hidden max-w-56 text-right text-xs leading-relaxed text-muted-foreground md:block">
            Press R to grow a new tree. G replays this one.
          </p>
        </div>
      </div>
    </main>
  );
}
