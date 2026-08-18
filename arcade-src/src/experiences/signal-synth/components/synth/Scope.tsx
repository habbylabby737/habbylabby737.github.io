import { useEffect, useRef } from "react";
import type { SynthEngine } from "@/experiences/signal-synth/lib/synth/engine";

export function Scope({
  engine,
  live,
}: {
  engine: SynthEngine;
  live: boolean;
}) {
  const waveRef = useRef<HTMLCanvasElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wave = waveRef.current;
    const meter = meterRef.current;
    if (!wave || !meter) return;

    const ctx = wave.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let peak = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = wave.clientWidth;
      const height = wave.clientHeight;
      if (wave.width !== Math.floor(width * dpr) || wave.height !== Math.floor(height * dpr)) {
        wave.width = Math.floor(width * dpr);
        wave.height = Math.floor(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = getComputedStyle(wave).getPropertyValue("--color-well").trim() || "#0c0c0e";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(236,236,232,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      for (let x = 0; x < width; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }

      const { samples, rms } = live
        ? engine.readAnalyser()
        : { samples: null, rms: 0 };

      peak = Math.max(rms, peak * 0.92);
      meter.style.transform = `scaleY(${Math.min(1, peak * 3.4)})`;

      ctx.strokeStyle = getComputedStyle(wave).getPropertyValue("--color-scope").trim() || "#c5ccd4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      if (samples && samples.length > 0) {
        const step = samples.length / width;
        for (let x = 0; x < width; x++) {
          const i = Math.floor(x * step);
          const v = (samples[i]! - 128) / 128;
          const y = height / 2 + v * (height * 0.42);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
      }
      ctx.stroke();

      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, live]);

  return (
    <div className="grid grid-cols-[1fr_14px] gap-2 sm:grid-cols-[1fr_16px] sm:gap-3">
      <div className="overflow-hidden rounded-md bg-well shadow-[var(--shadow-panel)]">
        <canvas
          ref={waveRef}
          className="block h-24 w-full sm:h-28"
          aria-label="Oscilloscope"
        />
      </div>
      <div
        className="relative overflow-hidden rounded-md bg-well shadow-[var(--shadow-panel)]"
        aria-label="Level meter"
      >
        <div
          ref={meterRef}
          className="absolute inset-x-1 bottom-1 top-1 origin-bottom rounded-sm bg-accent"
          style={{ transform: "scaleY(0)" }}
        />
      </div>
    </div>
  );
}
