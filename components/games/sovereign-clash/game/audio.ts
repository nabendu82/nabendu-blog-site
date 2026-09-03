/**
 * Audio Engine for Sovereign Clash (Age of Empires style 3D RTS).
 * - Background Music: Soft, soothing Indian classical Sarod & Dilruba soundtrack ("Dhaka")
 *   kept at a gentle ambient level (~0.13 volume) so environmental & combat SFX take priority.
 * - Sound Effects: Full dynamic range, uncompressed and punchy:
 *   - Villagers chopping timber (timber axe impact), mining gold (pickaxe clink), farming (scythe swish)
 *   - Steel sword clashes, gunpowder musket cracks, bow releases, and heavy siege detonations
 *   - Enemy raid horn alerts and royal fanfare
 * - Dynamic ducking: Background music automatically dips to 0.06 during active skirmishes.
 */

let ctx: AudioContext | null = null
let bgAudio: HTMLAudioElement | null = null
let muted = false
let musicWanted = false

let lastChop = 0
let lastMine = 0
let lastFarm = 0
let lastCombat = 0
let combatWatch: number | null = null

// Gentle ambient volume for background music so actions are front and center
const BG_VOLUME_NORMAL = 0.13
const BG_VOLUME_COMBAT = 0.06

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
  gain = 0.15,
  slide = 0,
): void {
  const audio = ac()
  if (!audio || muted) return
  const now = audio.currentTime
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), now + dur)
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start(now)
  osc.stop(now + dur)
}

function noiseBurst(dur: number, gain = 0.12, filterFreq = 1200): void {
  const audio = ac()
  if (!audio || muted) return
  const now = audio.currentTime
  const bufferSize = Math.floor(audio.sampleRate * dur)
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const noise = audio.createBufferSource()
  noise.buffer = buffer

  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(filterFreq, now)
  filter.frequency.exponentialRampToValueAtTime(200, now + dur)

  const g = audio.createGain()
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

  noise.connect(filter)
  filter.connect(g)
  g.connect(audio.destination)

  noise.start(now)
  noise.stop(now + dur)
}

function initBgAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!bgAudio) {
    const audio = new Audio()
    audio.loop = true
    audio.volume = BG_VOLUME_NORMAL
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

  audio.volume = BG_VOLUME_NORMAL
  if (audio.paused) {
    audio.play().catch(() => {
      // Handled upon first user pointer interaction
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

  // Automatically duck background music during combat so weapon hits and attack sounds are loud & clear
  bgAudio.volume = BG_VOLUME_COMBAT

  if (combatWatch === null && typeof window !== 'undefined') {
    combatWatch = window.setInterval(() => {
      if (performance.now() - lastCombat > 4000) {
        if (bgAudio && !muted) {
          bgAudio.volume = BG_VOLUME_NORMAL
        }
        if (combatWatch !== null) {
          window.clearInterval(combatWatch)
          combatWatch = null
        }
      }
    }, 400)
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
  name:
    | 'sword'
    | 'bow'
    | 'chop'
    | 'mine'
    | 'farm'
    | 'spawn'
    | 'fanfare'
    | 'defeat'
    | 'age'
    | 'siege'
    | 'musket'
    | 'raid',
): void {
  const now = performance.now()
  switch (name) {
    case 'sword':
      // Sharp steel clash + blade scrape
      tone(1050, 0.06, 'triangle', 0.18, -420)
      tone(520, 0.09, 'sine', 0.14, -140)
      noiseBurst(0.04, 0.1, 2400)
      break

    case 'bow':
      // Crisp bowstring release & arrow flight
      tone(420, 0.1, 'triangle', 0.16, 220)
      tone(680, 0.07, 'sine', 0.12, -260)
      break

    case 'musket':
      // Gunpowder blast + punchy low-end crack
      tone(190, 0.14, 'sawtooth', 0.22, -110)
      tone(65, 0.22, 'square', 0.2, -35)
      noiseBurst(0.12, 0.22, 1800)
      break

    case 'chop':
      // Heavy timber axe chop (solid wood impact)
      if (now - lastChop < 340) return
      lastChop = now
      tone(135, 0.11, 'triangle', 0.18, -40)
      tone(85, 0.16, 'sine', 0.14, -20)
      noiseBurst(0.05, 0.12, 900)
      break

    case 'mine':
      // Crisp metallic pickaxe clink against gold vein
      if (now - lastMine < 340) return
      lastMine = now
      tone(1250, 0.08, 'sine', 0.16, -100)
      tone(830, 0.14, 'triangle', 0.14, -60)
      break

    case 'farm':
      // Sickle crop swish
      if (now - lastFarm < 340) return
      lastFarm = now
      tone(320, 0.1, 'sine', 0.14, 120)
      noiseBurst(0.06, 0.1, 1100)
      break

    case 'raid':
      // Ominous enemy attack war-horn
      tone(146.8, 0.8, 'sawtooth', 0.2, -15)
      tone(110.0, 0.9, 'triangle', 0.18, -10)
      break

    case 'siege':
      // Catapult boulder slam & ground shake
      tone(62, 0.38, 'sawtooth', 0.24, -28)
      tone(44, 0.46, 'triangle', 0.22)
      noiseBurst(0.25, 0.24, 700)
      break

    case 'spawn':
      // Royal unit recruitment chime
      tone(349, 0.1, 'triangle', 0.15, 60)
      tone(440, 0.14, 'sine', 0.14, 35)
      break

    case 'age':
      // Grand age advancement chord
      tone(293, 0.2, 'triangle', 0.18)
      tone(369, 0.24, 'triangle', 0.17)
      tone(440, 0.32, 'sine', 0.19)
      tone(587, 0.42, 'triangle', 0.16)
      break

    case 'fanfare':
      // Victorious royal fanfare
      tone(392, 0.22, 'triangle', 0.2)
      tone(523, 0.26, 'triangle', 0.2)
      tone(659, 0.36, 'sine', 0.22)
      tone(784, 0.32, 'triangle', 0.18)
      break

    case 'defeat':
      // Defeat solemn cadence
      tone(220, 0.3, 'sine', 0.2, -60)
      tone(130, 0.45, 'triangle', 0.18)
      tone(82, 0.55, 'sine', 0.16, -15)
      break

    default:
      break
  }
}
