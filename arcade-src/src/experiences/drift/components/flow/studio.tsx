import { useEffect } from "react";
import { toast } from "sonner";
import { getFlowEngine } from "@/experiences/drift/components/flow/canvas";
import { FlowCanvas } from "@/experiences/drift/components/flow/canvas";
import { StudioChrome } from "@/experiences/drift/components/flow/controls";
import { formatSeed } from "@/experiences/drift/lib/flow/prng";
import { useFlowStore } from "@/experiences/drift/lib/flow/store";

export function Studio() {
  useKeyboard();
  useDesktopPanel();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <FlowCanvas />
      <StudioChrome />
    </main>
  );
}

function useDesktopPanel() {
  useEffect(() => {
    if (window.matchMedia("(min-width: 640px)").matches) {
      useFlowStore.getState().setPanelOpen(true);
    }
  }, []);
}

function useKeyboard() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const store = useFlowStore.getState();
      if (e.code === "Space") {
        e.preventDefault();
        store.togglePaused();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        store.randomize();
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        const engine = getFlowEngine();
        if (!engine) return;
        const name = `drift-${store.paletteId}-${formatSeed(store.seed)}.png`;
        void engine.exportPng(name).then(
          () => toast.success(`Saved ${name}`),
          () => toast.error("Could not export PNG"),
        );
        return;
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        getFlowEngine()?.clear(true);
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        store.togglePanel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
