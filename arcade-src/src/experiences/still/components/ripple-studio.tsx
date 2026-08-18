import { useCallback, useEffect, useRef, useState } from "react";
import { Droplets, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/experiences/still/components/ui/button";
import { Slider } from "@/experiences/still/components/ui/slider";
import { RippleEngine } from "@/experiences/still/lib/ripple/engine";
import {
  COLOR_MAPS,
  DEFAULT_PARAMS,
  PARAMS_STORAGE_KEY,
  type ColorMapId,
  type RippleParams,
} from "@/experiences/still/lib/ripple/types";
import { cn } from "@/shared/cn";

function loadParams(): RippleParams {
  if (typeof window === "undefined") return { ...DEFAULT_PARAMS };
  try {
    const raw = window.localStorage.getItem(PARAMS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PARAMS };
    const parsed = JSON.parse(raw) as Partial<RippleParams>;
    const colorMap = COLOR_MAPS.some((m) => m.id === parsed.colorMap)
      ? (parsed.colorMap as ColorMapId)
      : DEFAULT_PARAMS.colorMap;
    return {
      viscosity: clamp01(parsed.viscosity ?? DEFAULT_PARAMS.viscosity),
      strength: clamp01(parsed.strength ?? DEFAULT_PARAMS.strength),
      colorMap,
    };
  } catch {
    return { ...DEFAULT_PARAMS };
  }
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function RippleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RippleEngine | null>(null);
  const lastPtr = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);
  const [params, setParams] = useState<RippleParams>(loadParams);
  const [hint, setHint] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const engine = new RippleEngine(canvas);
      engine.setParams(params);
      engine.start();
      engineRef.current = engine;
      setError(null);
      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start the surface.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setParams(params);
    try {
      window.localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(params));
    } catch {
      /* ignore quota */
    }
  }, [params]);

  const toUv = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const strokeTo = useCallback(
    (clientX: number, clientY: number, isStart: boolean) => {
      const uv = toUv(clientX, clientY);
      const engine = engineRef.current;
      if (!uv || !engine) return;
      if (isStart || !lastPtr.current) {
        engine.disturb(uv.x, uv.y, 1);
        lastPtr.current = uv;
        return;
      }
      const prev = lastPtr.current;
      const dx = uv.x - prev.x;
      const dy = uv.y - prev.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / 0.008));
      const force = Math.min(1.15, 0.55 + dist * 8);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        engine.disturb(prev.x + dx * t, prev.y + dy * t, force / Math.sqrt(steps));
      }
      lastPtr.current = uv;
    },
    [toUv],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    drawing.current = true;
    setHint(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    strokeTo(e.clientX, e.clientY, true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    strokeTo(e.clientX, e.clientY, false);
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    lastPtr.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const clearSurface = () => {
    engineRef.current?.clear();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.isContentEditable)) return;
      if (e.code === "Space" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        clearSurface();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-none"
        style={{ touchAction: "none", display: "block" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onContextMenu={(e) => e.preventDefault()}
      />

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-bg px-6 text-center">
          <div className="max-w-sm">
            <p className="font-display text-2xl">Surface unavailable</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        </div>
      ) : null}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
        <div>
          <p className="font-display text-3xl leading-none tracking-[-0.03em]">Still</p>
          <p className="mt-1 text-sm text-muted">A living surface</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="lg:hidden"
            aria-expanded={panelOpen}
            aria-controls="still-controls"
            onClick={() => setPanelOpen((o) => !o)}
          >
            {panelOpen ? <X className="size-4" /> : <SlidersHorizontal className="size-4" />}
            <span className="sr-only">{panelOpen ? "Close controls" : "Open controls"}</span>
          </Button>
        </div>
      </header>

      <p
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6 text-center font-display text-xl italic text-fg/70 transition-opacity duration-300 ease-out sm:text-2xl",
          hint ? "opacity-100" : "opacity-0",
        )}
      >
        Drag to disturb the surface
      </p>

      <aside
        id="still-controls"
        className={cn(
          "absolute z-10 border border-border bg-surface/92 p-4 shadow-lg backdrop-blur-sm",
          "inset-x-3 bottom-[max(4.5rem,env(safe-area-inset-bottom))] rounded-t-xl rounded-b-xl",
          "transition-[opacity,transform] duration-200 ease-out",
          "lg:inset-auto lg:right-6 lg:bottom-20 lg:w-[22rem] lg:rounded-xl lg:p-5",
          panelOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100",
        )}
      >
        <div className="mb-4 hidden items-center gap-2 lg:flex">
          <Droplets className="size-4 text-muted" />
          <p className="text-sm font-medium">Surface</p>
        </div>

        <div className="space-y-4">
          <Slider
            label="Viscosity"
            value={params.viscosity}
            onValueChange={(viscosity) => setParams((p) => ({ ...p, viscosity }))}
            display={`${Math.round(params.viscosity * 100)}`}
          />
          <Slider
            label="Wave strength"
            value={params.strength}
            onValueChange={(strength) => setParams((p) => ({ ...p, strength }))}
            display={`${Math.round(params.strength * 100)}`}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-fg">Color map</legend>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_MAPS.map((map) => {
                const active = params.colorMap === map.id;
                return (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, colorMap: map.id }))}
                    className={cn(
                      "h-11 rounded-sm border px-2 text-sm font-medium transition-colors duration-150",
                      active
                        ? "border-fg bg-fg text-primary-fg"
                        : "border-border bg-surface-2 text-muted hover:text-fg",
                    )}
                    aria-pressed={active}
                  >
                    {map.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Button type="button" variant="secondary" className="w-full" onClick={clearSurface}>
            <RotateCcw className="size-4" />
            Clear surface
          </Button>
        </div>
      </aside>
    </div>
  );
}
