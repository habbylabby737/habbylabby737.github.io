import { Lock, LockOpen, Pipette } from "lucide-react";
import { useRef } from "react";
import { describeSwatch, formatHsl, formatRgb } from "@/experiences/cast/lib/color";
import { cn } from "@/shared/cn";
import { usePalette } from "@/experiences/cast/store/palette";
import { CopyValue } from "./copy-value";

type SwatchColumnProps = {
  id: string;
  hex: string;
  locked: boolean;
  index: number;
};

export function SwatchColumn({ id, hex, locked, index }: SwatchColumnProps) {
  const toggleLock = usePalette((s) => s.toggleLock);
  const setHex = usePalette((s) => s.setHex);
  const pickerRef = useRef<HTMLInputElement>(null);
  const swatch = describeSwatch(hex);
  const ink = swatch.contrast.text.hex;
  const { vsWhite, vsBlack, whiteLevel, blackLevel, needsScrim } = swatch.contrast;

  return (
    <article
      className="group relative flex min-h-44 flex-col justify-end overflow-hidden transition-[background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)] motion-reduce:transition-none md:min-h-0 md:flex-1"
      style={{ backgroundColor: swatch.hex, color: ink }}
    >
      {needsScrim ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
          style={{
            background: `linear-gradient(to top, color-mix(in oklab, ${ink} 28%, transparent), transparent)`,
          }}
        />
      ) : null}

      <div className="absolute top-1 right-1 flex items-center gap-0.5 sm:top-4 sm:right-4 sm:gap-1">
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="grid size-11 place-items-center rounded-[var(--radius-sm)] transition-[background-color,opacity,transform] duration-[var(--motion-quick)] hover:bg-current/12 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
          aria-label={`Pick color for swatch ${index + 1}`}
        >
          <Pipette className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => toggleLock(id)}
          className={cn(
            "grid size-11 place-items-center rounded-[var(--radius-sm)] transition-[background-color,opacity,transform] duration-[var(--motion-quick)] hover:bg-current/12 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50",
            locked ? "opacity-100" : "opacity-80",
          )}
          aria-pressed={locked}
          aria-label={
            locked
              ? `Unlock swatch ${index + 1}`
              : `Lock swatch ${index + 1}`
          }
        >
          {locked ? (
            <Lock className="size-4" strokeWidth={1.85} />
          ) : (
            <LockOpen className="size-4" strokeWidth={1.85} />
          )}
        </button>
        <input
          ref={pickerRef}
          type="color"
          value={swatch.hex.toLowerCase()}
          onChange={(e) => setHex(id, e.target.value, true)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col gap-1 p-3 sm:gap-3 sm:p-5 md:p-6">
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xs font-medium tracking-[0.16em] uppercase opacity-70">
            {String(index + 1).padStart(2, "0")} · {swatch.name}
          </p>
          <span className="hidden font-mono text-2xs tracking-wide opacity-55 sm:inline">
            {index + 1}
          </span>
        </div>

        <CopyValue
          value={swatch.hex}
          className="w-fit text-xl font-medium tracking-[-0.03em] sm:text-3xl md:text-display"
        />

        <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
          <CopyValue
            value={formatRgb(swatch.rgb)}
            display={formatRgb(swatch.rgb)}
            label={formatRgb(swatch.rgb)}
            compact
            className="text-xs opacity-80"
          />
          <CopyValue
            value={formatHsl(swatch.hsl)}
            display={formatHsl(swatch.hsl)}
            label={formatHsl(swatch.hsl)}
            compact
            className="text-xs opacity-80"
          />
        </div>

        <div className="mt-0.5 flex flex-wrap gap-1.5 sm:mt-1 sm:gap-2">
          <ContrastChip
            label="White"
            ratio={vsWhite}
            level={whiteLevel}
            sample="#F7F7F5"
          />
          <ContrastChip
            label="Black"
            ratio={vsBlack}
            level={blackLevel}
            sample="#141414"
          />
        </div>
      </div>
    </article>
  );
}

function ContrastChip({
  label,
  ratio,
  level,
  sample,
}: {
  label: string;
  ratio: number;
  level: "AAA" | "AA" | "fail";
  sample: string;
}) {
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-full bg-current/10 px-2.5 text-2xs font-medium tracking-wide">
      <span
        className="grid size-4 place-items-center rounded-full text-2xs font-semibold"
        style={{ backgroundColor: sample, color: sample === "#141414" ? "#F7F7F5" : "#141414" }}
        aria-hidden
      >
        A
      </span>
      <span className="opacity-75">{label}</span>
      <span className="font-mono tabular-nums">{ratio.toFixed(1)}</span>
      <span className={level === "fail" ? "opacity-55" : "opacity-90"}>
        {level === "fail" ? "Fail" : level}
      </span>
    </div>
  );
}
