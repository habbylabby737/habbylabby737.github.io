import { useCallback, useRef } from "react";
import {
  HINT_BY_OFFSET,
  isBlack,
  midiToName,
  WHITE_COUNT_TWO_OCTAVES,
} from "@/experiences/signal-synth/lib/synth/theory";
import { cn } from "@/shared/cn";

type KeyboardProps = {
  startMidi: number;
  count: number;
  active: ReadonlySet<number>;
  onAttack: (midi: number, holdId: string) => void;
  onRelease: (midi: number, holdId: string) => void;
};

function blackOffset(midi: number, startMidi: number, whiteCount: number) {
  let whitesBefore = 0;
  for (let m = startMidi; m < midi; m++) {
    if (!isBlack(m)) whitesBefore += 1;
  }
  const whiteWidth = 100 / whiteCount;
  return whitesBefore * whiteWidth - whiteWidth * 0.32;
}

export function Keyboard({
  startMidi,
  count,
  active,
  onAttack,
  onRelease,
}: KeyboardProps) {
  const pointers = useRef(new Map<number, number>());
  const end = startMidi + count;
  const whites: number[] = [];
  const blacks: number[] = [];

  for (let midi = startMidi; midi < end; midi++) {
    if (isBlack(midi)) blacks.push(midi);
    else whites.push(midi);
  }

  const fromPoint = useCallback((x: number, y: number) => {
    const hit = document
      .elementsFromPoint(x, y)
      .find((el): el is HTMLElement => el instanceof HTMLElement && Boolean(el.dataset.midi));
    return hit ? Number(hit.dataset.midi) : null;
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const midi = fromPoint(event.clientX, event.clientY);
    if (midi === null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, midi);
    onAttack(midi, `ptr:${event.pointerId}`);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const next = fromPoint(event.clientX, event.clientY);
    const prev = pointers.current.get(event.pointerId);
    if (next === prev) return;
    if (prev !== undefined) onRelease(prev, `ptr:${event.pointerId}`);
    if (next !== null) {
      pointers.current.set(event.pointerId, next);
      onAttack(next, `ptr:${event.pointerId}`);
    } else {
      pointers.current.delete(event.pointerId);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(event.pointerId);
    if (prev !== undefined) onRelease(prev, `ptr:${event.pointerId}`);
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="relative isolate flex h-36 touch-none select-none sm:h-44"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      {whites.map((midi) => {
        const lit = active.has(midi);
        const hint = HINT_BY_OFFSET.get(midi - startMidi);
        return (
          <button
            key={midi}
            type="button"
            data-midi={midi}
            tabIndex={-1}
            aria-label={midiToName(midi)}
            aria-pressed={lit}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center justify-end rounded-b-md border border-line/70 bg-key-white pb-2.5 text-key-white-ink shadow-key",
              "transition-[background-color,box-shadow,transform] duration-100 ease-out",
              lit && "translate-y-0.5 bg-accent shadow-key-active",
            )}
          >
            <span className="pointer-events-none hidden font-mono text-2xs text-subtle sm:block">
              {hint ?? ""}
            </span>
            <span className="pointer-events-none hidden font-mono text-2xs font-medium text-key-white-ink/70 sm:mt-0.5 sm:block">
              {midiToName(midi)}
            </span>
          </button>
        );
      })}

      {blacks.map((midi) => {
        const lit = active.has(midi);
        const hint = HINT_BY_OFFSET.get(midi - startMidi);
        const left = blackOffset(midi, startMidi, WHITE_COUNT_TWO_OCTAVES);
        return (
          <button
            key={midi}
            type="button"
            data-midi={midi}
            tabIndex={-1}
            aria-label={midiToName(midi)}
            aria-pressed={lit}
            style={{ left: `${left}%`, width: `${(100 / WHITE_COUNT_TWO_OCTAVES) * 0.64}%` }}
            className={cn(
              "absolute top-0 z-10 flex h-3/5 flex-col items-center justify-end rounded-b-sm bg-key-black pb-2 text-key-black-ink shadow-key",
              "transition-[background-color,box-shadow,transform] duration-100 ease-out",
              lit && "translate-y-0.5 bg-accent-dim text-fg shadow-key-active",
            )}
          >
            <span className="pointer-events-none hidden font-mono text-2xs text-key-black-ink/70 sm:block">
              {hint ?? ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
