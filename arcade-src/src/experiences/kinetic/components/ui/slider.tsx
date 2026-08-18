import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/shared/cn";

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  label: string;
  display: string;
  className?: string;
};

export function LabeledSlider({
  value,
  min,
  max,
  step = 0.01,
  onValueChange,
  label,
  display,
  className,
}: SliderProps) {
  return (
    <label className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}>
      <span className="flex items-baseline justify-between gap-3 text-xs tracking-wide text-muted">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-fg/80">{display}</span>
      </span>
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onValueChange(next[0] ?? value)}
        className="relative flex h-8 w-full touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-fg/12">
          <SliderPrimitive.Range className="absolute h-full bg-fg" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          className="block size-4 rounded-full bg-fg shadow-[0_0_0_4px_var(--color-bg)] transition-transform duration-150 ease-[var(--ease-out-soft)] hover:scale-110 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--color-bg),0_0_0_6px_var(--color-accent)]"
        />
      </SliderPrimitive.Root>
    </label>
  );
}
