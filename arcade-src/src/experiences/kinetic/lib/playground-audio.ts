let ctx: AudioContext | null = null;
let lastThunk = 0;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio() {
  const audio = getCtx();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function playThunk(intensity = 0.4) {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  if (now - lastThunk < 0.045) return;
  lastThunk = now;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420 + intensity * 280;
  osc.type = "triangle";
  osc.frequency.value = 72 + intensity * 90;
  const peak = Math.min(0.09, 0.02 + intensity * 0.07);
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}
