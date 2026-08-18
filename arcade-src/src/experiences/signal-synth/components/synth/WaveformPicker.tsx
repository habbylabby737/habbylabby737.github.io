import type { Waveform } from "@/experiences/signal-synth/lib/synth/engine";
import { cn } from "@/shared/cn";

const WAVES: { id: Waveform; label: string }[] = [
  { id: "sine", label: "Sine" },
  { id: "triangle", label: "Tri" },
  { id: "sawtooth", label: "Saw" },
  { id: "square", label: "Sqr" },
];

function WaveIcon({ type }: { type: Waveform }) {
  const d =
    type === "sine"
      ? "M2 12c3-8 5-8 8 0s5 8 8 0"
      : type === "triangle"
        ? "M2 16 8 8l6 8 6-8"
        : type === "sawtooth"
          ? "M2 16V8l16 8V8"
          : "M3 16V8h7v8h7V8";
  return (
    <svg viewBox="0 0 22 24" className="h-5 w-6" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WaveformPicker({
  value,
  onChange,
}: {
  value: Waveform;
  onChange: (wave: Waveform) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 font-mono text-2xs font-medium uppercase tracking-label text-subtle">
        Wave
      </legend>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2">
        {WAVES.map((wave) => {
          const active = wave.id === value;
          return (
            <button
              key={wave.id}
              type="button"
              data-active={active}
              aria-pressed={active}
              onClick={() => onChange(wave.id)}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-md px-2",
                "bg-well text-muted shadow-panel",
                "transition-[background-color,color,box-shadow] duration-150 ease-out",
                "hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                "data-[active=true]:bg-panel data-[active=true]:text-fg",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full bg-subtle transition-colors duration-150",
                  active && "bg-accent",
                )}
              />
              <WaveIcon type={wave.id} />
              <span className="hidden font-mono text-micro uppercase tracking-wider sm:inline">
                {wave.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
