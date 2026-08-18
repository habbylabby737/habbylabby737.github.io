import { cn } from "@/shared/cn";
import type { Mode } from "@/experiences/still-pomodoro/lib/pomodoro-store";

type ProgressRingProps = {
  progress: number;
  mode: Mode;
  running: boolean;
};

const SIZE = 260;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2 - 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ progress, mode, running }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped);
  const isBreak = mode !== "work";

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="size-full"
      aria-hidden="true"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        className="stroke-track"
        strokeWidth={STROKE}
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        className={cn(
          isBreak ? "stroke-break" : "stroke-primary",
          running && "origin-center",
        )}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{
          transition: "stroke-dashoffset 200ms linear",
        }}
      />
    </svg>
  );
}
