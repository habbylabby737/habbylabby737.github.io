import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { copyText } from "@/experiences/cast/lib/copy";
import { cn } from "@/shared/cn";

type CopyValueProps = {
  value: string;
  display?: string;
  label?: string;
  className?: string;
  compact?: boolean;
};

export function CopyValue({
  value,
  display,
  label,
  className,
  compact,
}: CopyValueProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onCopy() {
    const ok = await copyText(value);
    if (!ok) {
      toast.error("Could not copy");
      return;
    }
    setCopied(true);
    toast.success(`Copied ${label ?? value}`, { id: "copy" });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 900);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] text-left font-mono tabular-nums tracking-tight transition-[background-color,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-current/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50",
        compact ? "px-1.5 py-1" : "px-2 py-1.5",
        className,
      )}
      aria-label={`Copy ${label ?? value}`}
    >
      {copied ? (
        <>
          <Check className="size-3.5 shrink-0" strokeWidth={2.2} />
          <span>Copied</span>
        </>
      ) : (
        <span>{display ?? value}</span>
      )}
    </button>
  );
}
