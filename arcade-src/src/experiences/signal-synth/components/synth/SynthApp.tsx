import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Power } from "lucide-react";
import { AuthSlot } from "@/experiences/signal-synth/components/synth/AuthSlot";
import { Keyboard } from "@/experiences/signal-synth/components/synth/Keyboard";
import { Knob } from "@/experiences/signal-synth/components/synth/Knob";
import { Scope } from "@/experiences/signal-synth/components/synth/Scope";
import { WaveformPicker } from "@/experiences/signal-synth/components/synth/WaveformPicker";
import { Button } from "@/experiences/signal-synth/components/ui/button";
import { DEFAULT_PARAMS, SynthEngine, type SynthParams } from "@/experiences/signal-synth/lib/synth/engine";
import {
  BINDING_BY_CODE,
  KEY_COUNT,
  clampOctave,
  midiToName,
  startMidiForOctave,
} from "@/experiences/signal-synth/lib/synth/theory";
import { cn } from "@/shared/cn";

function formatHz(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}Hz`;
}

function formatSec(value: number) {
  return value < 1 ? `${Math.round(value * 1000)}ms` : `${value.toFixed(2)}s`;
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatQ(value: number) {
  return value.toFixed(1);
}

export function SynthApp() {
  const engineRef = useRef<SynthEngine | null>(null);
  if (!engineRef.current) engineRef.current = new SynthEngine();
  const engine = engineRef.current;

  const holds = useRef(new Map<number, Set<string>>());
  const sustained = useRef(new Set<number>());
  const keyMidi = useRef(new Map<string, number>());

  const [powered, setPowered] = useState(false);
  const [powerError, setPowerError] = useState<string | null>(null);
  const [octave, setOctave] = useState(0);
  const [sustain, setSustain] = useState(false);
  const [params, setParams] = useState<SynthParams>(DEFAULT_PARAMS);
  const [active, setActive] = useState<number[]>([]);

  const startMidi = startMidiForOctave(octave);
  const activeSet = useMemo(() => new Set(active), [active]);
  const playingLabel =
    active.length === 0
      ? "—"
      : [...active]
          .sort((a, b) => a - b)
          .map(midiToName)
          .join("  ");

  const syncActive = useCallback(() => {
    const notes = new Set<number>([...holds.current.keys(), ...sustained.current]);
    setActive([...notes]);
  }, []);

  const attack = useCallback(
    (midi: number, holdId: string) => {
      if (!engine.started) return;
      let set = holds.current.get(midi);
      if (!set) {
        set = new Set();
        holds.current.set(midi, set);
        engine.noteOn(midi);
      }
      set.add(holdId);
      sustained.current.delete(midi);
      syncActive();
    },
    [engine, syncActive],
  );

  const release = useCallback(
    (midi: number, holdId: string) => {
      const set = holds.current.get(midi);
      if (!set) return;
      set.delete(holdId);
      if (set.size > 0) return;
      holds.current.delete(midi);
      if (sustain) {
        sustained.current.add(midi);
      } else {
        engine.noteOff(midi);
      }
      syncActive();
    },
    [engine, sustain, syncActive],
  );

  const liftSustain = useCallback(() => {
    setSustain(false);
    for (const midi of [...sustained.current]) {
      if (!holds.current.has(midi)) engine.noteOff(midi);
    }
    sustained.current.clear();
    syncActive();
  }, [engine, syncActive]);

  const powerOn = useCallback(async () => {
    try {
      await engine.start();
      engine.applyParams(params);
      setPowered(true);
      setPowerError(null);
      return true;
    } catch (err) {
      setPowerError(err instanceof Error ? err.message : "Audio could not start");
      return false;
    }
  }, [engine, params]);

  const updateParams = useCallback(
    (patch: Partial<SynthParams>) => {
      setParams((prev) => {
        const next = { ...prev, ...patch };
        engine.applyParams(patch);
        return next;
      });
    },
    [engine],
  );

  const shiftOctave = useCallback((delta: number) => {
    setOctave((prev) => clampOctave(prev + delta));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) setSustain(true);
        return;
      }
      if (event.code === "KeyZ") {
        event.preventDefault();
        if (!event.repeat) shiftOctave(-1);
        return;
      }
      if (event.code === "KeyX") {
        event.preventDefault();
        if (!event.repeat) shiftOctave(1);
        return;
      }

      const offset = BINDING_BY_CODE.get(event.code);
      if (offset === undefined || event.repeat) return;
      event.preventDefault();
      if (keyMidi.current.has(event.code)) return;

      const midi = startMidiForOctave(octave) + offset;
      keyMidi.current.set(event.code, midi);

      if (engine.started) {
        attack(midi, `key:${event.code}`);
        return;
      }

      void (async () => {
        const ok = await powerOn();
        if (ok && keyMidi.current.get(event.code) === midi) {
          attack(midi, `key:${event.code}`);
        }
      })();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        liftSustain();
        return;
      }
      const midi = keyMidi.current.get(event.code);
      if (midi === undefined) return;
      event.preventDefault();
      keyMidi.current.delete(event.code);
      release(midi, `key:${event.code}`);
    };

    const onBlur = () => {
      for (const [code, midi] of keyMidi.current) {
        release(midi, `key:${code}`);
      }
      keyMidi.current.clear();
      liftSustain();
      engine.releaseAll();
      holds.current.clear();
      sustained.current.clear();
      setActive([]);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [attack, engine, liftSustain, octave, powerOn, release, shiftOctave]);

  useEffect(() => {
    return () => engine.dispose();
  }, [engine]);

  const octaveLabel = midiToName(startMidi);

  return (
    <main className="min-h-dvh bg-bg px-3 py-4 text-fg sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <section className="relative overflow-hidden rounded-xl bg-chassis shadow-[var(--shadow-panel)]">
          <div className="h-2 bg-rail" />

          <header className="relative z-30 flex items-start justify-between gap-3 px-4 pb-3 pt-5 sm:px-6">
            <div>
              <p className="font-mono text-2xs uppercase tracking-kicker text-subtle">
                Studio instrument
              </p>
              <h1 className="mt-1 text-3xl font-medium tracking-display text-fg sm:text-4xl">
                Signal
              </h1>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <AuthSlot />
              <button
                type="button"
                onClick={() => void powerOn()}
                disabled={powered}
                aria-pressed={powered}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-md px-3",
                  "bg-well font-mono text-micro uppercase tracking-label",
                  "shadow-[var(--shadow-panel)] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                  powered ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Power className="size-3.5" strokeWidth={2} />
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    powered ? "bg-accent" : "bg-subtle",
                  )}
                />
                {powered ? "Live" : "Power"}
              </button>
            </div>
          </header>

          {!powered && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/75 px-6">
              <div className="w-full max-w-sm rounded-lg bg-panel px-6 py-6 text-center shadow-[var(--shadow-panel)]">
                <p className="text-lg font-medium tracking-tight">Power on to play</p>
                <p className="mt-2 text-sm leading-snug text-muted">
                  Audio waits for a tap so nothing starts until you ask.
                </p>
                <Button
                  variant="primary"
                  className="mt-5 w-full"
                  onClick={() => void powerOn()}
                >
                  <Power className="size-4" strokeWidth={2} />
                  Enable audio
                </Button>
                {powerError && (
                  <p className="mt-3 text-sm text-danger">{powerError}</p>
                )}
              </div>
            </div>
          )}

          <div className="px-4 pb-5 sm:px-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <p className="font-mono text-2xs uppercase tracking-label text-subtle">
                Scope
              </p>
              <p className="font-mono text-sm tabular-nums text-muted">{playingLabel}</p>
            </div>
            <Scope engine={engine} live={powered} />

            <div className="mt-6 grid gap-6 lg:grid-cols-[10rem_1fr_auto]">
              <WaveformPicker
                value={params.waveform}
                onChange={(waveform) => updateParams({ waveform })}
              />

              <div className="flex flex-wrap items-start justify-between gap-4 sm:justify-start sm:gap-6">
                <div>
                  <p className="mb-2 font-mono text-2xs font-medium uppercase tracking-label text-subtle">
                    Filter
                  </p>
                  <div className="flex gap-3">
                    <Knob
                      label="Cut"
                      value={params.cutoff}
                      min={80}
                      max={12000}
                      curve="exp"
                      defaultValue={DEFAULT_PARAMS.cutoff}
                      format={formatHz}
                      onChange={(cutoff) => updateParams({ cutoff })}
                    />
                    <Knob
                      label="Res"
                      value={params.resonance}
                      min={0.2}
                      max={18}
                      curve="exp"
                      defaultValue={DEFAULT_PARAMS.resonance}
                      format={formatQ}
                      onChange={(resonance) => updateParams({ resonance })}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-mono text-2xs font-medium uppercase tracking-label text-subtle">
                    Envelope
                  </p>
                  <div className="flex gap-3">
                    <Knob
                      label="A"
                      value={params.attack}
                      min={0.005}
                      max={2}
                      curve="exp"
                      defaultValue={DEFAULT_PARAMS.attack}
                      format={formatSec}
                      onChange={(attackTime) => updateParams({ attack: attackTime })}
                    />
                    <Knob
                      label="D"
                      value={params.decay}
                      min={0.01}
                      max={2}
                      curve="exp"
                      defaultValue={DEFAULT_PARAMS.decay}
                      format={formatSec}
                      onChange={(decay) => updateParams({ decay })}
                    />
                    <Knob
                      label="S"
                      value={params.sustain}
                      min={0.0001}
                      max={1}
                      defaultValue={DEFAULT_PARAMS.sustain}
                      format={formatPct}
                      onChange={(sustainLevel) => updateParams({ sustain: sustainLevel })}
                    />
                    <Knob
                      label="R"
                      value={params.release}
                      min={0.02}
                      max={3}
                      curve="exp"
                      defaultValue={DEFAULT_PARAMS.release}
                      format={formatSec}
                      onChange={(releaseTime) => updateParams({ release: releaseTime })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div>
                  <p className="mb-2 font-mono text-2xs font-medium uppercase tracking-label text-subtle">
                    Master
                  </p>
                  <Knob
                    label="Vol"
                    value={params.volume}
                    min={0}
                    max={1}
                    defaultValue={DEFAULT_PARAMS.volume}
                    format={formatPct}
                    onChange={(volume) => updateParams({ volume })}
                  />
                </div>
                <div>
                  <p className="mb-2 font-mono text-2xs font-medium uppercase tracking-label text-subtle">
                    Octave
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="hardware"
                      size="icon"
                      aria-label="Octave down"
                      onClick={() => shiftOctave(-1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="w-10 text-center font-mono text-sm tabular-nums text-fg">
                      {octaveLabel}
                    </span>
                    <Button
                      variant="hardware"
                      size="icon"
                      aria-label="Octave up"
                      onClick={() => shiftOctave(1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 hidden font-mono text-2xs text-subtle sm:block">
                    Z / X
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 pb-3 sm:px-4">
            <div className="overflow-hidden rounded-lg bg-well p-2 sm:p-2.5">
              <Keyboard
                startMidi={startMidi}
                count={KEY_COUNT}
                active={activeSet}
                onAttack={attack}
                onRelease={release}
              />
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-4 pt-1 font-mono text-2xs uppercase tracking-label text-subtle">
            <p className="hidden sm:block">A–L keys · black on W E T Y U O P</p>
            <p>Space sustain · drag keys · double-tap knobs to reset</p>
          </footer>

          <div className="h-2 bg-rail" />
        </section>
      </div>
    </main>
  );
}
