/**
 * Procedural Web Audio Engine for Sovereign Clash (Age of Empires style 3D RTS).
 * Re-engineered for grand, immersive, and pleasant medieval/historical atmosphere:
 * - Soothing Indian classical / medieval ambient harmonic drone (Tanpura/Sitar acoustic resonance)
 * - Delicate procedural melodic harp & flute chimes in regal pentatonic scale
 * - Cinematic war-drum cadence and warm orchestral horn swells during combat
 * - Crisp, balanced character & unit combat SFX
 */

let ctx: AudioContext | null = null
let muted = false
let lastChop = 0
let lastCombat = 0
let musicWanted = false
let combatActive = false
let combatWatch: number | null = null
let melodyTimer: number | null = null
let musicNodes: { stop: () => void } | null = null
let ambientMaster: GainNode | null = null
let combatMaster: GainNode | null = null

function ac(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.035,
  slide = 0,
): void {
  const audio = ac()
  if (!audio || muted) return
  const now = audio.currentTime
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, now + dur)
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start(now)
  osc.stop(now + dur)
}

function playMelodicNote(audio: AudioContext, destination: AudioNode, freq: number): void {
  if (muted) return
  const now = audio.currentTime
  const osc = audio.createOscillator()
  const harm = audio.createOscillator()
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, now)

  harm.type = 'triangle'
  harm.frequency.setValueAtTime(freq * 2, now)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, now)
  filter.frequency.exponentialRampToValueAtTime(300, now + 2.5)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.03, now + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4)

  osc.connect(filter)
  harm.connect(filter)
  filter.connect(gain)
  gain.connect(destination)

  osc.start(now)
  harm.start(now)
  osc.stop(now + 2.5)
  harm.stop(now + 2.5)
}

function setCombatLayer(on: boolean): void {
  const audio = ctx
  if (!audio || !combatMaster || !ambientMaster) return
  const t = audio.currentTime
  combatMaster.gain.cancelScheduledValues(t)
  ambientMaster.gain.cancelScheduledValues(t)
  combatMaster.gain.setValueAtTime(Math.max(0.0001, combatMaster.gain.value), t)
  ambientMaster.gain.setValueAtTime(Math.max(0.0001, ambientMaster.gain.value), t)
  if (on) {
    combatMaster.gain.linearRampToValueAtTime(0.038, t + 0.6)
    ambientMaster.gain.linearRampToValueAtTime(0.02, t + 0.6)
  } else {
    combatMaster.gain.linearRampToValueAtTime(0.0001, t + 1.8)
    ambientMaster.gain.linearRampToValueAtTime(0.035, t + 1.8)
  }
}

function stopMusicInternal(): void {
  if (combatWatch !== null) {
    window.clearInterval(combatWatch)
    combatWatch = null
  }
  if (melodyTimer !== null) {
    window.clearInterval(melodyTimer)
    melodyTimer = null
  }
  combatActive = false
  ambientMaster = null
  combatMaster = null
  musicNodes?.stop()
  musicNodes = null
}

export function startMusic(): void {
  musicWanted = true
  if (muted || musicNodes) return
  const audio = ac()
  if (!audio) return

  const dest = audio.destination

  // Ambient Channel
  const ambient = audio.createGain()
  ambient.gain.setValueAtTime(0.0001, audio.currentTime)
  ambient.gain.linearRampToValueAtTime(0.032, audio.currentTime + 1.6)
  ambient.connect(dest)
  ambientMaster = ambient

  // Combat Channel
  const combat = audio.createGain()
  combat.gain.setValueAtTime(0.0001, audio.currentTime)
  combat.connect(dest)
  combatMaster = combat

  // 1. Warm Indian Classical Tanpura / Sitar Ambient Drone
  // D2 (73.42Hz) Root + A2 (110Hz) Fifth + D3 (146.83Hz) Octave
  const drone1 = audio.createOscillator()
  drone1.type = 'sine'
  drone1.frequency.value = 73.42
  const droneGain1 = audio.createGain()
  droneGain1.gain.value = 0.45
  drone1.connect(droneGain1)
  droneGain1.connect(ambient)
  drone1.start()

  const drone2 = audio.createOscillator()
  drone2.type = 'triangle'
  drone2.frequency.value = 110.0
  const droneFilter = audio.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 320
  const droneGain2 = audio.createGain()
  droneGain2.gain.value = 0.22
  drone2.connect(droneFilter)
  droneFilter.connect(droneGain2)
  droneGain2.connect(ambient)
  drone2.start()

  const drone3 = audio.createOscillator()
  drone3.type = 'sine'
  drone3.frequency.value = 146.83
  // Gentle breathing LFO for rich organic motion
  const breathLfo = audio.createOscillator()
  breathLfo.frequency.value = 0.06
  const breathGain = audio.createGain()
  breathGain.gain.value = 0.04
  breathLfo.connect(breathGain)
  const droneGain3 = audio.createGain()
  droneGain3.gain.value = 0.12
  breathGain.connect(droneGain3.gain)
  drone3.connect(droneGain3)
  droneGain3.connect(ambient)
  drone3.start()
  breathLfo.start()

  // 2. Procedural Peaceful Raga Bhupali Melodies (D4, E4, F#4, A4, B4, D5)
  const ragaScale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33]
  melodyTimer = window.setInterval(() => {
    if (!muted && ambientMaster) {
      const note = ragaScale[Math.floor(Math.random() * ragaScale.length)]
      playMelodicNote(audio, ambientMaster, note)
    }
  }, 4200)

  // 3. Cinematic Cinematic War Drums for Combat
  // Low resonant kick drum (55Hz)
  const drumPulse = audio.createOscillator()
  drumPulse.type = 'sine'
  drumPulse.frequency.value = 55
  const drumLfo = audio.createOscillator()
  drumLfo.type = 'triangle'
  drumLfo.frequency.value = 1.35 // Marching tempo
  const drumDepth = audio.createGain()
  drumDepth.gain.value = 0.18
  drumLfo.connect(drumDepth)
  const drumGain = audio.createGain()
  drumGain.gain.value = 0.25
  drumDepth.connect(drumGain.gain)
  drumPulse.connect(drumGain)
  drumGain.connect(combat)
  drumPulse.start()
  drumLfo.start()

  // Warm Brass Fifth Horn Swells (D3 146.8Hz + A3 220Hz low-pass filtered)
  const horn1 = audio.createOscillator()
  horn1.type = 'triangle'
  horn1.frequency.value = 146.83
  const horn2 = audio.createOscillator()
  horn2.type = 'sine'
  horn2.frequency.value = 220.0
  const hornFilter = audio.createBiquadFilter()
  hornFilter.type = 'lowpass'
  hornFilter.frequency.value = 350
  const hornGain = audio.createGain()
  hornGain.gain.value = 0.16
  horn1.connect(hornFilter)
  horn2.connect(hornFilter)
  hornFilter.connect(hornGain)
  hornGain.connect(combat)
  horn1.start()
  horn2.start()

  combatWatch = window.setInterval(() => {
    if (!combatActive) return
    if (performance.now() - lastCombat < 4000) return
    combatActive = false
    setCombatLayer(false)
  }, 400)

  musicNodes = {
    stop: () => {
      const t = audio.currentTime
      ambient.gain.cancelScheduledValues(t)
      combat.gain.cancelScheduledValues(t)
      ambient.gain.setValueAtTime(Math.max(0.0001, ambient.gain.value), t)
      combat.gain.setValueAtTime(Math.max(0.0001, combat.gain.value), t)
      ambient.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      combat.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      window.setTimeout(() => {
        try {
          drone1.stop()
          drone2.stop()
          drone3.stop()
          breathLfo.stop()
          drumPulse.stop()
          drumLfo.stop()
          horn1.stop()
          horn2.stop()
          ambient.disconnect()
          combat.disconnect()
        } catch {}
      }, 400)
    },
  }
}

export function notifyCombat(): void {
  lastCombat = performance.now()
  if (muted || !musicWanted || !combatMaster) return
  if (combatActive) return
  combatActive = true
  setCombatLayer(true)
}

export function setMuted(value: boolean): void {
  muted = value
  if (muted) stopMusicInternal()
  else if (musicWanted) startMusic()
}

export function playSound(
  name: 'sword' | 'bow' | 'chop' | 'spawn' | 'fanfare' | 'defeat' | 'age' | 'siege' | 'musket',
): void {
  const now = performance.now()
  switch (name) {
    case 'sword':
      tone(880, 0.04, 'triangle', 0.035, -350)
      tone(440, 0.06, 'sine', 0.025, -120)
      break
    case 'bow':
      tone(320, 0.08, 'sine', 0.035, 120)
      break
    case 'musket':
      tone(160, 0.09, 'sawtooth', 0.045, -80)
      tone(60, 0.14, 'square', 0.035, -25)
      break
    case 'chop':
      if (now - lastChop < 420) return
      lastChop = now
      tone(120, 0.09, 'triangle', 0.028, -25)
      break
    case 'spawn':
      tone(330, 0.08, 'triangle', 0.035, 60)
      tone(392, 0.12, 'sine', 0.025, 30)
      break
    case 'age':
      tone(293, 0.16, 'triangle', 0.04)
      tone(369, 0.2, 'triangle', 0.035)
      tone(440, 0.28, 'sine', 0.04)
      tone(587, 0.34, 'triangle', 0.03)
      break
    case 'fanfare':
      tone(392, 0.18, 'triangle', 0.045)
      tone(523, 0.22, 'triangle', 0.045)
      tone(659, 0.32, 'sine', 0.05)
      tone(784, 0.26, 'triangle', 0.03)
      break
    case 'defeat':
      tone(220, 0.24, 'sine', 0.04, -60)
      tone(130, 0.38, 'triangle', 0.03)
      tone(82, 0.45, 'sine', 0.025, -15)
      break
    case 'siege':
      tone(58, 0.24, 'sine', 0.035)
      tone(40, 0.28, 'triangle', 0.025)
      break
    default:
      break
  }
}
