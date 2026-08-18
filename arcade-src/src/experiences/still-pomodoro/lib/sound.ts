let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gain = 0.08,
) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playCompleteChime() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime + 0.01;
  tone(ctx, 523.25, now, 0.42, 0.07);
  tone(ctx, 659.25, now + 0.16, 0.5, 0.065);
  tone(ctx, 783.99, now + 0.34, 0.72, 0.055);
}
