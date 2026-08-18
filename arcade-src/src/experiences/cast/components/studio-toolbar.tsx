import { Download, Keyboard, Shuffle } from "lucide-react";
import { usePalette } from "@/experiences/cast/store/palette";
import { HarmonyMenu } from "./harmony-menu";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

type StudioToolbarProps = {
  onExport: () => void;
  onShortcuts: () => void;
};

export function StudioToolbar({ onExport, onShortcuts }: StudioToolbarProps) {
  const shuffle = usePalette((s) => s.shuffle);

  return (
    <header className="flex flex-col gap-3 border-b border-hairline bg-chrome px-4 py-3 text-ink sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-none tracking-[-0.03em] italic">
            Cast
          </h1>
          <p className="mt-1 hidden text-xs text-mute sm:block">
            Five colors. Lock what you like.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={shuffle}
          className="sm:hidden"
          data-shuffle
        >
          <Shuffle className="size-4" strokeWidth={1.75} />
          Shuffle
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <HarmonyMenu />

        <Tooltip content="Shuffle · Space">
          <Button
            variant="primary"
            size="md"
            onClick={shuffle}
            className="hidden sm:inline-flex"
            data-shuffle
          >
            <Shuffle className="size-4" strokeWidth={1.75} />
            Shuffle
            <kbd className="ml-1 rounded-[var(--radius-xs)] bg-chrome/15 px-1.5 py-0.5 font-mono text-2xs font-normal tracking-wide">
              Space
            </kbd>
          </Button>
        </Tooltip>

        <Tooltip content="Export · E">
          <Button variant="outline" size="icon" onClick={onExport} aria-label="Export palette">
            <Download className="size-4" strokeWidth={1.75} />
          </Button>
        </Tooltip>

        <Tooltip content="Shortcuts · ?">
          <Button variant="outline" size="icon" onClick={onShortcuts} aria-label="Keyboard shortcuts">
            <Keyboard className="size-4" strokeWidth={1.75} />
          </Button>
        </Tooltip>

      </div>
    </header>
  );
}
