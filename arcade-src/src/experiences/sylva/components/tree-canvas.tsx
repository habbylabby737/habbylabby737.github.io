import { useEffect, useRef } from "react";
import { drawScene, GROW_SECONDS, makeGrainPattern, seedParticles } from "@/experiences/sylva/lib/tree/draw";
import { getPalette } from "@/experiences/sylva/lib/tree/palettes";
import { useTreeStore } from "@/experiences/sylva/lib/tree/store";

export function TreeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let growOrigin = performance.now();
    let lastGrowKey = useTreeStore.getState().growKey;
    let lastSeed = useTreeStore.getState().seed;
    let particles = seedParticles(lastSeed);
    let grain: CanvasPattern | null = null;
    try {
      grain = makeGrainPattern(ctx);
    } catch {
      grain = null;
    }

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedMq.matches;
    const onMotion = () => {
      reduced = reducedMq.matches;
    };
    reducedMq.addEventListener("change", onMotion);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    const tick = (now: number) => {
      const state = useTreeStore.getState();
      if (state.growKey !== lastGrowKey) {
        lastGrowKey = state.growKey;
        growOrigin = now;
      }
      if (state.seed !== lastSeed) {
        lastSeed = state.seed;
        particles = seedParticles(state.seed);
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const growT = state.animateGrowth && !reduced ? (now - growOrigin) / 1000 : GROW_SECONDS + 1;

      drawScene({
        ctx,
        width: w,
        height: h,
        model: state.model,
        angleDeg: state.angle,
        lengthScale: state.length,
        wind: state.wind,
        palette: getPalette(state.paletteId),
        overlay: state.overlay,
        time: now / 1000,
        growT,
        reducedMotion: reduced,
        particles,
        grain,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      reducedMq.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 block size-full"
      aria-label="Generative fractal tree"
    />
  );
}
