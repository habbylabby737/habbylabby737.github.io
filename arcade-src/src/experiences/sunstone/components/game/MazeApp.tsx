import { useEffect, useRef } from "react";
import { createEngine, type EngineHandle } from "@/experiences/sunstone/game/engine";
import { useGameStore } from "@/experiences/sunstone/game/store";
import { GameOverlay } from "./GameOverlay";
import { TouchControls } from "./TouchControls";

export function MazeApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);
  const phase = useGameStore((s) => s.phase);
  const isCoarse = useGameStore((s) => s.isCoarse);
  const showMap = phase === "playing" || phase === "paused";

  useEffect(() => {
    const canvas = canvasRef.current;
    const mini = miniRef.current;
    if (!canvas || !mini) return;
    const engine = createEngine(canvas, mini);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="vignette pointer-events-none absolute inset-0" />
      <canvas
        ref={miniRef}
        className={
          showMap
            ? "pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 size-[132px] rounded-xl border border-border shadow-panel sm:right-5 sm:size-[168px]"
            : "pointer-events-none invisible absolute size-[168px]"
        }
        aria-hidden={!showMap}
        aria-label="Minimap"
      />
      <GameOverlay
        onPlay={() => engineRef.current?.start()}
        onResume={() => engineRef.current?.resume()}
        onRestart={() => engineRef.current?.restart()}
        onPause={() => engineRef.current?.pause()}
      />
      {phase === "playing" && isCoarse ? (
        <TouchControls
          onMove={(x, y) => engineRef.current?.setTouchMove(x, y)}
          onLook={(dx, dy) => engineRef.current?.addTouchLook(dx, dy)}
        />
      ) : null}
    </div>
  );
}
