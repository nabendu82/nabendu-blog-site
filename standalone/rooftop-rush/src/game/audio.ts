/** Procedural Web Audio sound effects. Nothing starts until unlock() is called from a user gesture. */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private muted = false;
  private lastCoin = 0;

  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.55;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      /* audio unavailable */
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.02);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, endFreq?: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, f0: number, f1: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 0.9;
    filt.frequency.setValueAtTime(f0, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  jump(): void {
    this.tone(330, 0.2, 'square', 0.12, 780);
    this.tone(660, 0.12, 'sine', 0.08, 1100, 0.02);
  }
  slide(): void {
    this.noise(0.4, 0.28, 2400, 500);
  }
  land(): void {
    this.tone(120, 0.12, 'sine', 0.2, 60);
    this.noise(0.08, 0.1, 900, 300);
  }
  lane(): void {
    this.noise(0.09, 0.09, 1800, 900);
  }
  coin(combo: number): void {
    const now = performance.now();
    if (now - this.lastCoin < 25) return;
    this.lastCoin = now;
    const step = Math.min(combo, 14);
    const f = 880 * Math.pow(2, step / 12);
    this.tone(f, 0.09, 'triangle', 0.14);
    this.tone(f * 1.5, 0.14, 'sine', 0.1, undefined, 0.05);
  }
  power(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.16, undefined, i * 0.06));
    this.tone(200, 0.4, 'sawtooth', 0.05, 800);
  }
  powerEnd(): void {
    this.tone(660, 0.16, 'triangle', 0.12, 330);
    this.tone(440, 0.22, 'triangle', 0.1, 220, 0.1);
  }
  shieldBreak(): void {
    this.noise(0.35, 0.3, 4000, 300);
    this.tone(900, 0.3, 'sawtooth', 0.1, 120);
  }
  smash(): void {
    this.noise(0.25, 0.25, 1500, 200);
    this.tone(180, 0.2, 'square', 0.1, 60);
  }
  hit(): void {
    this.noise(0.5, 0.5, 1200, 90);
    this.tone(170, 0.45, 'sawtooth', 0.22, 40);
  }
  milestone(): void {
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.14, undefined, i * 0.08));
  }
  gameOver(): void {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.16, f * 0.9, i * 0.18));
  }
  ui(): void {
    this.tone(600, 0.08, 'square', 0.06, 900);
  }
}

export const audio = new AudioManager();
