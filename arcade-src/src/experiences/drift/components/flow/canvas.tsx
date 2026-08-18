import { useEffect, useRef } from "react";
import { FlowEngine, type EngineSettings } from "@/experiences/drift/lib/flow/engine";
import { useFlowStore } from "@/experiences/drift/lib/flow/store";

let engineHandle: FlowEngine | null = null;

export function getFlowEngine() {
  return engineHandle;
}

function pickSettings(): EngineSettings {
  const s = useFlowStore.getState();
  return {
    seed: s.seed,
    speed: s.speed,
    trail: s.trail,
    paletteId: s.paletteId,
    density: s.density,
    scale: s.scale,
    morph: s.morph,
    fieldMode: s.fieldMode,
    paused: s.paused,
  };
}

export function FlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new FlowEngine(canvas, pickSettings());
    engineHandle = engine;
    engine.start();
    const unsub = useFlowStore.subscribe((state) => {
      engine.apply({
        seed: state.seed,
        speed: state.speed,
        trail: state.trail,
        paletteId: state.paletteId,
        density: state.density,
        scale: state.scale,
        morph: state.morph,
        fieldMode: state.fieldMode,
        paused: state.paused,
      });
    });
    return () => {
      unsub();
      engine.destroy();
      if (engineHandle === engine) engineHandle = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full touch-none"
      aria-label="Flow field canvas"
    />
  );
}
