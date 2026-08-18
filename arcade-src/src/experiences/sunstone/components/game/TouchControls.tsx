import { useRef } from "react";

type Props = {
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
};

export function TouchControls({ onMove, onLook }: Props) {
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lookLast = useRef<{ x: number; y: number; id: number } | null>(null);

  function setKnob(nx: number, ny: number) {
    const knob = knobRef.current;
    if (!knob) return;
    knob.style.transform = `translate(${nx * 28}px, ${-ny * 28}px)`;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      <div
        ref={stickRef}
        className="pointer-events-auto absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-5 size-24 rounded-full border border-border bg-surface/45"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const r = e.currentTarget.getBoundingClientRect();
          origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          const dx = e.clientX - origin.current.x;
          const dy = e.clientY - origin.current.y;
          const m = Math.hypot(dx, dy) || 1;
          const max = 36;
          const nx = (dx / m) * Math.min(1, m / max);
          const ny = (-dy / m) * Math.min(1, m / max);
          onMove(nx, ny);
          setKnob(nx, ny);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const dx = e.clientX - origin.current.x;
          const dy = e.clientY - origin.current.y;
          const m = Math.hypot(dx, dy) || 1;
          const max = 36;
          const nx = (dx / m) * Math.min(1, m / max);
          const ny = (-dy / m) * Math.min(1, m / max);
          onMove(nx, ny);
          setKnob(nx, ny);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          onMove(0, 0);
          setKnob(0, 0);
        }}
        onPointerCancel={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          onMove(0, 0);
          setKnob(0, 0);
        }}
      >
        <div
          ref={knobRef}
          className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/90"
        />
      </div>
      <div
        className="pointer-events-auto absolute inset-y-0 right-0 w-1/2"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          lookLast.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerMove={(e) => {
          const last = lookLast.current;
          if (!last || last.id !== e.pointerId) return;
          onLook(e.clientX - last.x, e.clientY - last.y);
          lookLast.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          if (lookLast.current?.id === e.pointerId) lookLast.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          if (lookLast.current?.id === e.pointerId) lookLast.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      />
    </div>
  );
}
