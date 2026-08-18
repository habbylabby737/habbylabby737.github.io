import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { copyText } from "@/experiences/cast/lib/copy";
import { buildCssVariables } from "@/experiences/cast/lib/export-css";
import { usePalette } from "@/experiences/cast/store/palette";
import { ExportDialog } from "./export-dialog";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { StudioToolbar } from "./studio-toolbar";
import { SwatchColumn } from "./swatch-column";
import { TooltipProvider } from "./ui/tooltip";

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function PaletteStudio() {
  const swatches = usePalette((s) => s.swatches);
  const shuffle = usePalette((s) => s.shuffle);
  const toggleLock = usePalette((s) => s.toggleLock);
  const hydrateFromHash = usePalette((s) => s.hydrateFromHash);
  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    hydrateFromHash();
  }, [hydrateFromHash]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        shuffle();
        return;
      }
      if (e.key === "Escape") {
        setExportOpen(false);
        setShortcutsOpen(false);
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setExportOpen(true);
        return;
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        const hexes = usePalette.getState().swatches.map((s) => s.hex);
        const payload = e.shiftKey
          ? buildCssVariables(hexes, "numbered")
          : hexes.join("  ");
        void copyText(payload).then((ok) => {
          if (ok) {
            toast.success(e.shiftKey ? "Copied CSS variables" : "Copied hex palette", {
              id: "copy",
            });
          }
        });
        return;
      }
      if (e.key >= "1" && e.key <= "5") {
        const swatch = usePalette.getState().swatches[Number(e.key) - 1];
        if (swatch) toggleLock(swatch.id);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [shuffle, toggleLock]);

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-chrome text-ink">
        <StudioToolbar
          onExport={() => setExportOpen(true)}
          onShortcuts={() => setShortcutsOpen(true)}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto md:flex-row md:overflow-hidden">
          {swatches.map((swatch, index) => (
            <SwatchColumn
              key={swatch.id}
              id={swatch.id}
              hex={swatch.hex}
              locked={swatch.locked}
              index={index}
            />
          ))}
        </main>
        <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <Toaster
          position="bottom-center"
          theme="dark"
          toastOptions={{
            className:
              "!bg-lift !text-ink !border-hairline !font-mono !text-xs !rounded-[var(--radius-sm)]",
          }}
        />
      </div>
    </TooltipProvider>
  );
}
