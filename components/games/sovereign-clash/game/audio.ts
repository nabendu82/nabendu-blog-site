/**
 * Audio Engine for Sovereign Clash (Age of Empires style 3D RTS).
 * - Background Music: Studio-recorded Indian classical Sarod & Dilruba soundtrack ("Dhaka" by Kevin MacLeod)
 * - Sound Effects: Crisp synthesized combat, gathering, spawning, and age progression SFX via Web Audio API
 * - Full mute/unmute and volume control integration
 */

let ctx: AudioContext | null = null
let bgAudio: HTMLAudioElement | null = null
let muted = false
let lastChop = 0
let lastCombat = 0
let musicWanted = false
let combatWatch: number | null = null

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

function initBgAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!bgAudio) {
    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.32
    audio.preload = 'auto'

    // Use lightweight .m4a (AAC) if supported, else fallback to .mp3
    if (audio.canPlayType && audio.canPlayType('audio/mp4; codecs="mp4a.40.2"')) {
      audio.src = '/games/sovereign-clash/bg-music.m4a'
    } else {
      audio.src = '/games/sovereign-clash/bg-music.mp3'
    }

    bgAudio = audio
  }
  return bgAudio
}

export function startMusic(): void {
  musicWanted = true
  if (muted || typeof window === 'undefined') return

  const audio = initBgAudio()
  if (!audio) return

  if (audio.paused) {
    audio.play().catch(() => {
      // Browser autoplay policy might defer until user click
    })
  }
}

export function stopMusic(): void {
  musicWanted = false
  if (bgAudio) {
    bgAudio.pause()
    bgAudio.currentTime = 0
  }
  if (combatWatch !== null) {
    window.clearInterval(combatWatch)
    combatWatch = null
  }
}

export function notifyCombat(): void {
  lastCombat = performance.now()
  if (muted || !musicWanted || !bgAudio) return

  // During active combat, duck the background music slightly so unit sounds cut through cleanly
  bgAudio.volume = 0.22

  if (combatWatch === null && typeof window !== 'undefined') {
    combatWatch = window.setInterval(() => {
      if (performance.now() - lastCombat > 4000) {
        if (bgAudio && !muted) {
          bgAudio.volume = 0.32
        }
        if (combatWatch !== null) {
          window.clearInterval(combatWatch)
          combatWatch = null
        }
      }
    }, 500)
  }
}

export function setMuted(value: boolean): void {
  muted = value
  if (muted) {
    if (bgAudio) {
      bgAudio.pause()
    }
    if (combatWatch !== null) {
      window.clearInterval(combatWatch)
      combatWatch = null
    }
  } else {
    if (musicWanted) {
      startMusic()
    }
  }
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
