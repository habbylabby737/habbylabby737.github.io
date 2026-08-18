import { midiToFreq } from "./theory";

export type Waveform = "sine" | "triangle" | "sawtooth" | "square";

export type SynthParams = {
  waveform: Waveform;
  cutoff: number;
  resonance: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number;
};

export const DEFAULT_PARAMS: SynthParams = {
  waveform: "sawtooth",
  cutoff: 2200,
  resonance: 3.2,
  attack: 0.025,
  decay: 0.18,
  sustain: 0.68,
  release: 0.32,
  volume: 0.72,
};

type Voice = {
  osc: OscillatorNode;
  gain: GainNode;
  midi: number;
};

const MAX_VOICES = 12;

export class SynthEngine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private voices = new Map<number, Voice>();
  private timeData: Uint8Array<ArrayBuffer> | null = null;
  params: SynthParams = { ...DEFAULT_PARAMS };

  get started() {
    return this.ctx !== null;
  }

  async start() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }

    const ctx = new AudioContext();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = this.params.cutoff;
    filter.Q.value = this.params.resonance;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;

    const master = ctx.createGain();
    master.gain.value = this.params.volume;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.55;

    filter.connect(compressor);
    compressor.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);

    this.ctx = ctx;
    this.filter = filter;
    this.master = master;
    this.analyser = analyser;
    this.timeData = new Uint8Array(new ArrayBuffer(analyser.fftSize));

    if (ctx.state === "suspended") await ctx.resume();
  }

  applyParams(next: Partial<SynthParams>) {
    this.params = { ...this.params, ...next };
    const now = this.ctx?.currentTime ?? 0;
    if (this.filter && next.cutoff !== undefined) {
      this.filter.frequency.cancelScheduledValues(now);
      this.filter.frequency.setTargetAtTime(next.cutoff, now, 0.02);
    }
    if (this.filter && next.resonance !== undefined) {
      this.filter.Q.cancelScheduledValues(now);
      this.filter.Q.setTargetAtTime(next.resonance, now, 0.02);
    }
    if (this.master && next.volume !== undefined) {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(next.volume, now, 0.02);
    }
    if (next.waveform) {
      for (const voice of this.voices.values()) {
        voice.osc.type = next.waveform;
      }
    }
  }

  noteOn(midi: number) {
    if (!this.ctx || !this.filter) return;
    this.stealIfNeeded();
    this.hardStop(midi);

    const now = this.ctx.currentTime;
    const { attack, decay, sustain, waveform } = this.params;

    const osc = this.ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.setValueAtTime(midiToFreq(midi), now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + Math.max(0.005, attack));
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, sustain),
      now + Math.max(0.005, attack) + Math.max(0.01, decay),
    );

    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(now);

    this.voices.set(midi, { osc, gain, midi });
  }

  noteOff(midi: number) {
    const voice = this.voices.get(midi);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    const release = Math.max(0.02, this.params.release);
    const current = Math.max(0.0001, voice.gain.gain.value);

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(current, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release);

    try {
      voice.osc.stop(now + release + 0.03);
    } catch {
      /* already stopped */
    }

    window.setTimeout(
      () => {
        if (this.voices.get(midi) === voice) this.voices.delete(midi);
        try {
          voice.osc.disconnect();
          voice.gain.disconnect();
        } catch {
          /* graph already torn down */
        }
      },
      (release + 0.08) * 1000,
    );
  }

  releaseAll() {
    for (const midi of [...this.voices.keys()]) this.noteOff(midi);
  }

  readAnalyser(): { samples: Uint8Array<ArrayBuffer> | null; rms: number } {
    if (!this.analyser || !this.timeData) return { samples: null, rms: 0 };
    this.analyser.getByteTimeDomainData(this.timeData);
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = ((this.timeData[i] ?? 128) - 128) / 128;
      sum += v * v;
    }
    return { samples: this.timeData, rms: Math.sqrt(sum / this.timeData.length) };
  }

  dispose() {
    this.releaseAll();
    const ctx = this.ctx;
    this.ctx = null;
    this.filter = null;
    this.master = null;
    this.analyser = null;
    this.timeData = null;
    this.voices.clear();
    if (ctx) void ctx.close();
  }

  private hardStop(midi: number) {
    const existing = this.voices.get(midi);
    if (!existing) return;
    try {
      existing.gain.gain.cancelScheduledValues(0);
      existing.gain.gain.value = 0;
      existing.osc.stop();
      existing.osc.disconnect();
      existing.gain.disconnect();
    } catch {
      /* ignore */
    }
    this.voices.delete(midi);
  }

  private stealIfNeeded() {
    if (this.voices.size < MAX_VOICES) return;
    const oldest = this.voices.keys().next().value;
    if (oldest !== undefined) this.hardStop(oldest);
  }
}
