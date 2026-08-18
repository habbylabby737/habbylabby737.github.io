import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/experiences/helix/components/ui/button";
import { Label } from "@/experiences/helix/components/ui/label";
import { Separator } from "@/experiences/helix/components/ui/separator";
import { Slider } from "@/experiences/helix/components/ui/slider";
import {
  BACKGROUNDS,
  MAX_COUNT,
  MAX_FORCE,
  MIN_COUNT,
  MIN_FORCE,
  PALETTES,
} from "@/experiences/helix/lib/field/theme";
import { useFieldStore } from "@/experiences/helix/lib/field/store";
import { cn } from "@/shared/cn";

type Props = {
  onClear: () => void;
  onReset: () => void;
};

export function FieldControls({ onClear, onReset }: Props) {
  const count = useFieldStore((s) => s.count);
  const force = useFieldStore((s) => s.force);
  const trail = useFieldStore((s) => s.trail);
  const background = useFieldStore((s) => s.background);
  const palette = useFieldStore((s) => s.palette);
  const setCount = useFieldStore((s) => s.setCount);
  const setForce = useFieldStore((s) => s.setForce);
  const setTrail = useFieldStore((s) => s.setTrail);
  const setBackground = useFieldStore((s) => s.setBackground);
  const setPalette = useFieldStore((s) => s.setPalette);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4">
        <SliderRow
          id="count"
          label="Particles"
          valueLabel={count.toLocaleString()}
          min={MIN_COUNT}
          max={MAX_COUNT}
          step={100}
          value={count}
          onChange={setCount}
        />
        <SliderRow
          id="force"
          label="Force"
          valueLabel={force.toFixed(2)}
          min={MIN_FORCE}
          max={MAX_FORCE}
          step={0.05}
          value={force}
          onChange={setForce}
        />
        <SliderRow
          id="trail"
          label="Trails"
          valueLabel={`${Math.round(trail * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={trail}
          onChange={setTrail}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-2.5">
        <Label>Background</Label>
        <div className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              title={bg.label}
              aria-label={bg.label}
              aria-pressed={background === bg.id}
              onClick={() => setBackground(bg.id)}
              className={cn(
                "field-swatch size-8 rounded-sm outline-none transition-[box-shadow,scale] duration-150 ease-out",
                "focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.96]",
                background === bg.id ? "swatch-on" : "swatch-off",
              )}
              data-swatch={bg.id}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <Label>Color shift</Label>
        <div className="flex flex-wrap gap-1.5">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={palette === p.id}
              onClick={() => setPalette(p.id)}
              className={cn(
                "h-8 rounded-sm px-2.5 text-xs font-medium tracking-wide",
                "transition-[background-color,color,box-shadow,scale] duration-150 ease-out",
                "focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.96]",
                palette === p.id
                  ? "bg-accent text-accent-fg"
                  : "bg-transparent text-muted shadow-[0_0_0_1px_var(--color-border)] hover:text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={onClear}>
          <Trash2 className="size-4" />
          Clear
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  id,
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <span className="font-mono text-xs tabular-nums text-fg">{valueLabel}</span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}
