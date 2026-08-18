import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/shared/cn";

type SliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display?: string;
  onValueChange: (value: number) => void;
};

export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  display,
  onValueChange,
}: SliderProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {display ?? value.toFixed(2)}
        </span>
      </span>
      <SliderPrimitive.Root
        className="relative flex h-11 w-full touch-none items-center select-none"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          const v = next[0];
          if (typeof v === "number") onValueChange(v);
        }}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-border">
          <SliderPrimitive.Range className="absolute h-full bg-fg" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block size-4 rounded-full bg-fg shadow-[0_0_0_4px_var(--color-bg)]",
            "outline-none transition-[box-shadow,transform] duration-150 ease-out",
            "hover:scale-105 focus-visible:shadow-[0_0_0_4px_var(--color-bg),0_0_0_6px_var(--color-primary)]",
          )}
          aria-label={label}
        />
      </SliderPrimitive.Root>
    </label>
  );
}
