import { useEffect, useRef, type MutableRefObject } from "react";
import { ParticleField } from "@/experiences/helix/lib/field/engine";
import { useFieldStore } from "@/experiences/helix/lib/field/store";

type Props = {
  engineRef: MutableRefObject<ParticleField | null>;
};

export function ParticleCanvas({ engineRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, lx: 0, ly: 0, t: 0 });
  const count = useFieldStore((s) => s.count);
  const force = useFieldStore((s) => s.force);
  const trail = useFieldStore((s) => s.trail);
  const background = useFieldStore((s) => s.background);
  const palette = useFieldStore((s) => s.palette);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const field = new ParticleField(canvas);
    engineRef.current = field;
    field.setSettings({ count, force, trail, background, palette });
    field.start();

    const ro = new ResizeObserver(() => field.resize());
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      field.stop();
      if (engineRef.current === field) engineRef.current = null;
    };
    // Engine is created once; settings sync in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineRef]);

  useEffect(() => {
    engineRef.current?.setSettings({ count, force, trail, background, palette });
  }, [engineRef, count, force, trail, background, palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onMove = (e: PointerEvent) => {
      const field = engineRef.current;
      if (!field) return;
      const { x, y } = local(e);
      const now = performance.now();
      const p = pointer.current;
      const dt = Math.max(0.008, (now - p.t) / 1000);
      const vx = (x - p.lx) / dt;
      const vy = (y - p.ly) / dt;
      p.x = x;
      p.y = y;
      p.lx = x;
      p.ly = y;
      p.t = now;
      field.setPointer(x, y, e.buttons === 1 || e.pointerType === "touch", vx, vy);
    };

    const onDown = (e: PointerEvent) => {
      const field = engineRef.current;
      if (!field) return;
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = local(e);
      pointer.current = { x, y, lx: x, ly: y, t: performance.now() };
      field.setPointer(x, y, true, 0, 0);
      field.pulseAt(x, y);
    };

    const onUp = (e: PointerEvent) => {
      const field = engineRef.current;
      if (!field) return;
      const { x, y } = local(e);
      field.setPointer(x, y, false, 0, 0);
    };

    const onLeave = () => {
      engineRef.current?.clearPointer();
    };

    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full touch-none select-none max-md:cursor-auto md:cursor-none"
      aria-label="Interactive particle field"
    />
  );
}
