let ctx: AudioContext | null = null
let muted = false
let lastChop = 0
let lastCombat = 0
let musicWanted = false
let combatActive = false
let combatWatch: number | null = null
let musicNodes: { stop: () => void } | null = null
let ambientMaster: GainNode | null = null
let combatMaster: GainNode | null = null

function ac(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'square',
  gain = 0.045,
  slide = 0,
): void {
  const audio = ac()
  if (!audio) return
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audio.currentTime)
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, audio.currentTime + dur)
  g.gain.setValueAtTime(gain, audio.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + dur)
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
    combatMaster.gain.linearRampToValueAtTime(0.07, t + 0.4)
    ambientMaster.gain.linearRampToValueAtTime(0.016, t + 0.5)
  } else {
    combatMaster.gain.linearRampToValueAtTime(0.0001, t + 1.4)
    ambientMaster.gain.linearRampToValueAtTime(0.042, t + 1.6)
  }
}

function stopMusicInternal(): void {
  if (combatWatch !== null) {
    window.clearInterval(combatWatch)
    combatWatch = null
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

  const ambient = audio.createGain()
  ambient.gain.setValueAtTime(0.0001, audio.currentTime)
  ambient.gain.linearRampToValueAtTime(0.042, audio.currentTime + 1.4)
  ambient.connect(dest)
  ambientMaster = ambient

  const combat = audio.createGain()
  combat.gain.setValueAtTime(0.0001, audio.currentTime)
  combat.connect(dest)
  combatMaster = combat

  const drone = audio.createOscillator()
  drone.type = 'sine'
  drone.frequency.value = 65.41
  const droneGain = audio.createGain()
  droneGain.gain.value = 0.55
  drone.connect(droneGain)
  droneGain.connect(ambient)
  drone.start()

  const fifth = audio.createOscillator()
  fifth.type = 'triangle'
  fifth.frequency.value = 98
  const fifthGain = audio.createGain()
  fifthGain.gain.value = 0.16
  fifth.connect(fifthGain)
  fifthGain.connect(ambient)
  fifth.start()

  const shimmer = audio.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.value = 196
  const lfo = audio.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.07
  const lfoGain = audio.createGain()
  lfoGain.gain.value = 8
  lfo.connect(lfoGain)
  lfoGain.connect(shimmer.frequency)
  const shimmerGain = audio.createGain()
  shimmerGain.gain.value = 0.07
  shimmer.connect(shimmerGain)
  shimmerGain.connect(ambient)
  shimmer.start()
  lfo.start()

  const pulse = audio.createOscillator()
  pulse.type = 'sine'
  pulse.frequency.value = 73.42
  const pulseGain = audio.createGain()
  pulseGain.gain.value = 0.32
  const march = audio.createOscillator()
  march.type = 'sine'
  march.frequency.value = 2.05
  const marchDepth = audio.createGain()
  marchDepth.gain.value = 0.2
  march.connect(marchDepth)
  marchDepth.connect(pulseGain.gain)
  pulse.connect(pulseGain)
  pulseGain.connect(combat)
  pulse.start()
  march.start()

  const tension = audio.createOscillator()
  tension.type = 'triangle'
  tension.frequency.value = 155.56
  const tensionGain = audio.createGain()
  tensionGain.gain.value = 0.14
  tension.connect(tensionGain)
  tensionGain.connect(combat)
  tension.start()

  const swell = audio.createOscillator()
  swell.type = 'sine'
  swell.frequency.value = 233.08
  const swellLfo = audio.createOscillator()
  swellLfo.type = 'sine'
  swellLfo.frequency.value = 0.22
  const swellDepth = audio.createGain()
  swellDepth.gain.value = 0.09
  const swellGain = audio.createGain()
  swellGain.gain.value = 0.11
  swellLfo.connect(swellDepth)
  swellDepth.connect(swellGain.gain)
  swell.connect(swellGain)
  swellGain.connect(combat)
  swell.start()
  swellLfo.start()

  const brass = audio.createOscillator()
  brass.type = 'sawtooth'
  brass.frequency.value = 110
  const brassFilter = audio.createBiquadFilter()
  brassFilter.type = 'lowpass'
  brassFilter.frequency.value = 420
  const brassGain = audio.createGain()
  brassGain.gain.value = 0.045
  brass.connect(brassFilter)
  brassFilter.connect(brassGain)
  brassGain.connect(combat)
  brass.start()

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
        drone.stop()
        fifth.stop()
        shimmer.stop()
        lfo.stop()
        pulse.stop()
        march.stop()
        tension.stop()
        swell.stop()
        swellLfo.stop()
        brass.stop()
        ambient.disconnect()
        combat.disconnect()
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
    case 'bow':
    case 'musket':
      return
    case 'chop':
      if (now - lastChop < 420) return
      lastChop = now
      tone(110, 0.11, 'sine', 0.028, -20)
      break
    case 'spawn':
      tone(330, 0.1, 'triangle', 0.045, 80)
      tone(392, 0.14, 'sine', 0.03, 40)
      break
    case 'age':
      tone(262, 0.18, 'triangle', 0.055)
      tone(330, 0.22, 'triangle', 0.045)
      tone(392, 0.3, 'sine', 0.05)
      tone(523, 0.36, 'triangle', 0.04)
      break
    case 'fanfare':
      tone(392, 0.2, 'triangle', 0.055)
      tone(523, 0.24, 'triangle', 0.055)
      tone(659, 0.38, 'sine', 0.06)
      tone(784, 0.28, 'triangle', 0.035)
      break
    case 'defeat':
      tone(220, 0.28, 'sawtooth', 0.055, -80)
      tone(130, 0.45, 'square', 0.04)
      tone(82, 0.5, 'triangle', 0.03, -20)
      break
    case 'siege':
      tone(52, 0.28, 'sine', 0.045)
      tone(36, 0.32, 'triangle', 0.03)
      break
    default:
      break
  }
}
