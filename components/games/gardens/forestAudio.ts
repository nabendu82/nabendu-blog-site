/**
 * Procedural Web Audio Ambient Soundscape & Music Engine for Escape the Forest.
 * Generates an immersive, high-quality audio experience with zero external audio assets:
 * - Dynamic canopy wind & breeze (pink noise through modulated bandpass filter)
 * - Tropical jungle cicadas, crickets & distant birds (frequency-modulated oscillators)
 * - Atmospheric mystical forest chords & pentatonic bamboo chimes
 * - Footsteps rustle while traversing jungle paths
 * - Victory fanfare at the Ancient Stone Gateway & Nightfall tension
 */

let ctx: AudioContext | null = null;
let muted = false;
let isPlaying = false;
let lastFootstep = 0;

// Master & channel gains
let masterGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

// Ambient nodes
let windSource: AudioNode | null = null;
let birdTimer: number | null = null;
let chimeTimer: number | null = null;
let droneOscs: OscillatorNode[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/**
 * Creates pink noise buffer for soft organic wind.
 */
function createPinkNoiseBuffer(audio: AudioContext): AudioBuffer {
  const bufferSize = audio.sampleRate * 4;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
    b6 = white * 0.115926;
  }
  return buffer;
}

/**
 * Starts the continuous jungle canopy wind & breeze.
 */
function startCanopyWind(audio: AudioContext, destination: AudioNode) {
  const noise = audio.createBufferSource();
  noise.buffer = createPinkNoiseBuffer(audio);
  noise.loop = true;

  // Dual-stage bandpass filter for organic forest wind
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 340;
  filter.Q.value = 1.2;

  // LFO to slowly modulate wind frequency (gusts & gentle breeze)
  const lfo = audio.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = audio.createGain();
  lfoGain.gain.value = 120;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const windGain = audio.createGain();
  windGain.gain.value = 0.32;

  noise.connect(filter);
  filter.connect(windGain);
  windGain.connect(destination);

  noise.start();
  lfo.start();
  windSource = noise;
}

/**
 * Starts warm mystical D-minor forest exploration drone.
 */
function startForestDrone(audio: AudioContext, destination: AudioNode) {
  // D2 (73.42Hz), A2 (110Hz), D3 (146.83Hz), F3 (174.61Hz)
  const freqs = [73.42, 110.0, 146.83, 174.61];
  const gains = [0.16, 0.1, 0.07, 0.04];

  droneOscs = freqs.map((freq, i) => {
    const osc = audio.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;

    const gainNode = audio.createGain();
    gainNode.gain.value = gains[i];

    // Slow subtle breathing shimmer on upper harmonics
    if (i > 0) {
      const lfo = audio.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = audio.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);
      lfo.start();
    }

    osc.connect(gainNode);
    gainNode.connect(destination);
    osc.start();
    return osc;
  });
}

/**
 * Plays a delicate wooden / bamboo pentatonic chime note.
 */
function playBambooChime(freq: number) {
  const audio = getAudioContext();
  if (!audio || muted || !musicGain) return;

  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const harm = audio.createOscillator();
  const gainNode = audio.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);

  harm.type = "triangle";
  harm.frequency.setValueAtTime(freq * 2.76, now); // Inharmonic metallic chime overtone

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(0.045, now + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

  osc.connect(gainNode);
  harm.connect(gainNode);
  gainNode.connect(musicGain);

  osc.start(now);
  harm.start(now);
  osc.stop(now + 2.9);
  harm.stop(now + 2.9);
}

/**
 * Plays distant jungle bird chirps & evening cicadas.
 */
function triggerJungleBird() {
  const audio = getAudioContext();
  if (!audio || muted || !ambientGain) return;

  const baseFreq = 1800 + Math.random() * 1200;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gainNode = audio.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.linearRampToValueAtTime(baseFreq + 600, now + 0.07);
  osc.frequency.linearRampToValueAtTime(baseFreq - 300, now + 0.16);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(0.018, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  osc.connect(gainNode);
  gainNode.connect(ambientGain);

  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * Starts continuous ambient soundscape and procedural musical chimes.
 */
export function startForestAudio(): void {
  if (isPlaying || muted) return;
  const audio = getAudioContext();
  if (!audio) return;

  isPlaying = true;

  // Master Gain
  masterGain = audio.createGain();
  masterGain.gain.setValueAtTime(0.0001, audio.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.85, audio.currentTime + 1.2);
  masterGain.connect(audio.destination);

  // Channels
  ambientGain = audio.createGain();
  ambientGain.gain.value = 0.5;
  ambientGain.connect(masterGain);

  musicGain = audio.createGain();
  musicGain.gain.value = 0.55;
  musicGain.connect(masterGain);

  sfxGain = audio.createGain();
  sfxGain.gain.value = 0.6;
  sfxGain.connect(masterGain);

  // Start continuous layers
  startCanopyWind(audio, ambientGain);
  startForestDrone(audio, musicGain);

  // Periodic bamboo chimes (peaceful pentatonic scale: D4, F4, G4, A4, C5, D5)
  const pentatonic = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33];
  chimeTimer = window.setInterval(() => {
    if (Math.random() < 0.65) {
      const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      playBambooChime(note);
    }
  }, 3200);

  // Periodic subtle distant jungle birds & cicadas
  birdTimer = window.setInterval(() => {
    if (Math.random() < 0.5) {
      triggerJungleBird();
    }
  }, 4500);
}

/**
 * Stops all forest audio.
 */
export function stopForestAudio(): void {
  if (!isPlaying) return;
  isPlaying = false;

  if (birdTimer) {
    clearInterval(birdTimer);
    birdTimer = null;
  }
  if (chimeTimer) {
    clearInterval(chimeTimer);
    chimeTimer = null;
  }

  if (ctx && masterGain) {
    const now = ctx.currentTime;
    masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
    setTimeout(() => {
      droneOscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {}
      });
      droneOscs = [];
      if (windSource) {
        try {
          (windSource as AudioBufferSourceNode).stop();
          windSource.disconnect();
        } catch {}
        windSource = null;
      }
    }, 350);
  }
}

/**
 * Mute / Unmute toggle.
 */
export function setForestAudioMuted(val: boolean): void {
  muted = val;
  if (muted) {
    stopForestAudio();
  } else {
    startForestAudio();
  }
}

export function isForestAudioMuted(): boolean {
  return muted;
}

/**
 * Plays subtle organic footstep crunch when walking through jungle footpaths.
 */
export function playForestFootstep(): void {
  const audio = getAudioContext();
  if (!audio || muted || !sfxGain) return;

  const now = performance.now();
  if (now - lastFootstep < 380) return;
  lastFootstep = now;

  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(80 + Math.random() * 30, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.09);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(280, t);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.025, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);

  osc.start(t);
  osc.stop(t + 0.1);
}

/**
 * Plays triumphant victory chime when reaching Ancient Stone Gateway.
 */
export function playEscapeVictory(): void {
  const audio = getAudioContext();
  if (!audio || muted || !musicGain) return;

  const chord = [293.66, 369.99, 440.0, 587.33, 739.99]; // D Major 9
  chord.forEach((freq, i) => {
    setTimeout(() => {
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(musicGain!);

      osc.start(now);
      osc.stop(now + 3.3);
    }, i * 160);
  });
}

/**
 * Plays eerie nightfall sting when survival countdown reaches zero.
 */
export function playNightfallSting(): void {
  const audio = getAudioContext();
  if (!audio || muted || !musicGain) return;

  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 2.5);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

  osc.connect(gain);
  gain.connect(musicGain);

  osc.start(now);
  osc.stop(now + 2.6);
}
