let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio() {
  const ac = getCtx();
  if (ac && ac.state === "suspended") void ac.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
  const ac = getCtx();
  if (!ac || ac.state !== "running") return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function playFling(speed: number) {
  const n = Math.min(1, speed / 220);
  tone(180 + n * 90, 0.12, "sine", 0.035);
  tone(420 + n * 160, 0.08, "triangle", 0.018);
}

export function playMerge(mass: number) {
  const n = Math.min(1, Math.log10(mass + 1) / 4);
  tone(90 + n * 40, 0.22, "sine", 0.05);
  tone(48 + n * 20, 0.28, "triangle", 0.03, 0.01);
}

export function playPlace() {
  tone(260, 0.07, "sine", 0.02);
}
