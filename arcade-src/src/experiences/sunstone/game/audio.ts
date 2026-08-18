export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private stepCooldown = 0;

  unlock() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
  }

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.2,
    delay = 0,
    slide = 0,
  ) {
    const ctx = this.ensure();
    const dest = this.master;
    if (!dest) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  collect() {
    this.unlock();
    this.tone(660, 0.12, "triangle", 0.18, 0, 80);
    this.tone(990, 0.16, "sine", 0.12, 0.05, 40);
  }

  win() {
    this.unlock();
    this.tone(392, 0.28, "triangle", 0.16, 0);
    this.tone(494, 0.3, "triangle", 0.14, 0.08);
    this.tone(587, 0.36, "sine", 0.16, 0.16);
    this.tone(784, 0.5, "sine", 0.12, 0.26);
  }

  footstep(dt: number, speed: number, maxSpeed: number) {
    if (speed < 0.6) {
      this.stepCooldown = 0;
      return;
    }
    this.stepCooldown -= dt;
    if (this.stepCooldown > 0) return;
    this.stepCooldown = 0.38 - Math.min(0.16, (speed / maxSpeed) * 0.16);
    const ctx = this.ensure();
    const dest = this.master;
    if (!dest) return;
    const t0 = ctx.currentTime;
    const dur = 0.07;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420 + Math.random() * 180;
    const g = ctx.createGain();
    g.gain.value = 0.12 * Math.min(1, speed / maxSpeed);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t0);
  }
}
