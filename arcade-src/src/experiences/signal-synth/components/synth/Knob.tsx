import { useCallback, useId, useRef } from "react";

type KnobProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  curve?: "lin" | "exp";
  format: (value: number) => string;
  defaultValue: number;
  onChange: (value: number) => void;
};

function toNorm(value: number, min: number, max: number, curve: "lin" | "exp") {
  if (curve === "exp") {
    const a = Math.log(Math.max(min, 0.0001));
    const b = Math.log(Math.max(max, 0.0001));
    return (Math.log(Math.max(value, 0.0001)) - a) / (b - a);
  }
  return (value - min) / (max - min);
}

function fromNorm(norm: number, min: number, max: number, curve: "lin" | "exp") {
  const n = Math.min(1, Math.max(0, norm));
  if (curve === "exp") {
    const a = Math.log(Math.max(min, 0.0001));
    const b = Math.log(Math.max(max, 0.0001));
    return Math.exp(a + n * (b - a));
  }
  return min + n * (max - min);
}

function snap(value: number, step: number) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export function Knob({
  label,
  value,
  min,
  max,
  step = 0,
  curve = "lin",
  format,
  defaultValue,
  onChange,
}: KnobProps) {
  const id = useId();
  const drag = useRef<{ y: number; norm: number } | null>(null);
  const norm = toNorm(value, min, max, curve);
  const angle = -135 + norm * 270;

  const commit = useCallback(
    (nextNorm: number) => {
      const raw = fromNorm(nextNorm, min, max, curve);
      onChange(step ? snap(raw, step) : raw);
    },
    [curve, max, min, onChange, step],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { y: event.clientY, norm };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const delta = (drag.current.y - event.clientY) / 132;
    commit(drag.current.norm + delta);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const fine = event.shiftKey ? 0.01 : 0.04;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      commit(norm + fine);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      commit(norm - fine);
    } else if (event.key === "Home") {
      event.preventDefault();
      commit(0);
    } else if (event.key === "End") {
      event.preventDefault();
      commit(1);
    }
  };

  return (
    <div className="flex w-16 flex-col items-center gap-2">
      <label
        htmlFor={id}
        className="font-mono text-2xs font-medium uppercase tracking-label text-subtle"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-label={`${label} ${format(value)}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(3))}
        role="slider"
        className="relative size-14 touch-none rounded-full bg-well shadow-panel outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:size-16"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => onChange(defaultValue)}
        onKeyDown={onKeyDown}
      >
        <span
          aria-hidden
          className="absolute inset-1 rounded-full bg-panel"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--color-fg) 14%, var(--color-panel)), var(--color-well))",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute left-1/2 top-1.5 h-3 w-0.5 -translate-x-1/2 rounded-full bg-accent" />
        </span>
      </button>
      <span className="font-mono text-micro tabular-nums text-muted">{format(value)}</span>
    </div>
  );
}
