import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { HARMONIES, HARMONY_LABELS } from "@/experiences/cast/lib/generate";
import { cn } from "@/shared/cn";
import { usePalette } from "@/experiences/cast/store/palette";

export function HarmonyMenu() {
  const harmony = usePalette((s) => s.harmony);
  const setHarmony = usePalette((s) => s.setHarmony);

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-mono text-xs text-ink shadow-[var(--shadow-border)] transition-[background-color,transform] duration-[var(--motion-quick)] hover:bg-ink/8 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/70"
          aria-label="Color harmony"
        >
          {HARMONY_LABELS[harmony]}
          <ChevronDown className="size-3.5 text-mute" strokeWidth={1.75} />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="start"
          sideOffset={8}
          className="z-50 min-w-40 rounded-[var(--radius-md)] bg-lift p-1.5 text-ink shadow-[var(--shadow-border)]"
        >
          {HARMONIES.map((id) => (
            <Dropdown.Item
              key={id}
              onSelect={() => setHarmony(id)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs outline-none",
                "data-highlighted:bg-ink/8",
              )}
            >
              {HARMONY_LABELS[id]}
              {harmony === id ? <Check className="size-3.5" strokeWidth={2} /> : null}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
