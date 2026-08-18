import { useMemo, useState } from "react";
import { toast } from "sonner";
import { copyText } from "@/experiences/cast/lib/copy";
import {
  buildCssVariables,
  buildHslList,
  buildPlainList,
  buildRgbList,
  type ExportNaming,
} from "@/experiences/cast/lib/export-css";
import { cn } from "@/shared/cn";
import { usePalette } from "@/experiences/cast/store/palette";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Format = "css" | "hex" | "rgb" | "hsl";

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const swatches = usePalette((s) => s.swatches);
  const [naming, setNaming] = useState<ExportNaming>("numbered");
  const [format, setFormat] = useState<Format>("css");

  const hexes = swatches.map((s) => s.hex);
  const body = useMemo(() => {
    if (format === "hex") return buildPlainList(hexes);
    if (format === "rgb") return buildRgbList(hexes);
    if (format === "hsl") return buildHslList(hexes);
    return buildCssVariables(hexes, naming);
  }, [format, hexes, naming]);

  async function onCopy() {
    const ok = await copyText(body);
    if (ok) toast.success("Copied export", { id: "copy" });
    else toast.error("Could not copy");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="export-desc">
        <DialogHeader>
          <DialogTitle>Export palette</DialogTitle>
          <DialogDescription id="export-desc">
            CSS variables, or a plain list of hex, RGB, and HSL values.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["css", "CSS"],
              ["hex", "Hex"],
              ["rgb", "RGB"],
              ["hsl", "HSL"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFormat(id)}
              className={cn(
                "h-9 rounded-full px-3 text-xs font-medium transition-colors duration-[var(--motion-quick)]",
                format === id
                  ? "bg-ink text-chrome"
                  : "bg-ink/8 text-mute hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {format === "css" ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                ["numbered", "Numbered"],
                ["semantic", "By lightness"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setNaming(id)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs font-medium transition-colors duration-[var(--motion-quick)]",
                  naming === id
                    ? "bg-ink text-chrome"
                    : "bg-ink/8 text-mute hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <pre className="max-h-72 overflow-auto rounded-[var(--radius-md)] bg-chrome p-4 font-mono text-xs leading-relaxed text-ink whitespace-pre">
          {body}
        </pre>

        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={onCopy}>
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
