import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const ROWS: { keys: string[]; action: string }[] = [
  { keys: ["Space"], action: "Shuffle unlocked colors" },
  { keys: ["1"], action: "Lock or unlock swatch 1" },
  { keys: ["2"], action: "Lock or unlock swatch 2" },
  { keys: ["3"], action: "Lock or unlock swatch 3" },
  { keys: ["4"], action: "Lock or unlock swatch 4" },
  { keys: ["5"], action: "Lock or unlock swatch 5" },
  { keys: ["C"], action: "Copy all hex values" },
  { keys: ["Shift", "C"], action: "Copy CSS variables" },
  { keys: ["E"], action: "Open export" },
  { keys: ["?"], action: "Show shortcuts" },
  { keys: ["Esc"], action: "Close dialogs" },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="shortcuts-desc">
        <DialogHeader>
          <DialogTitle>Shortcuts</DialogTitle>
          <DialogDescription id="shortcuts-desc">
            Keep a hand on the keyboard. Space is shuffle.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-hairline">
          {ROWS.map((row) => (
            <li
              key={row.action}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <span className="text-sm text-ink">{row.action}</span>
              <span className="flex shrink-0 items-center gap-1">
                {row.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-xs)] bg-ink/8 px-1.5 font-mono text-2xs text-ink"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
