/** Original "Frontier Dawn" score. No samples or third-party recordings.
 * Render: node scripts/compose-sovereign-score.cjs /tmp/frontier-dawn.wav
 * Encode: afconvert -f m4af -d 'aac ' -b 160000 /tmp/frontier-dawn.wav public/games/sovereign-clash/frontier-dawn.m4a
 */
const fs = require('node:fs')
const rate = 32000, beat = 0.75, bars = 32, duration = bars * 4 * beat
const length = Math.round(duration * rate)
const left = new Float32Array(length), right = new Float32Array(length)
const tau = Math.PI * 2
let seed = 14
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
const hz = midi => 440 * 2 ** ((midi - 69) / 12)
function note(midi, start, seconds, level, instrument, pan = 0) {
  const frequency = hz(midi), count = Math.floor(seconds * rate), offset = Math.floor(start * rate)
  const l = Math.sqrt((1 - pan) / 2), r = Math.sqrt((1 + pan) / 2)
  for (let i = 0; i < count; i++) {
    const t = i / rate, p = i / count
    let envelope, wave
    if (instrument === 'strings') {
      envelope = Math.min(1,t / 0.65) * Math.min(1,(seconds - t) / 1.1)
      const phase = tau * frequency * t + 0.013 * Math.sin(tau * 4.5 * t)
      wave = Math.sin(phase) * 0.66 + Math.sin(phase * 2 + 0.15) * 0.18 + Math.sin(phase * 3) * 0.07 + Math.sin(tau * frequency * 1.002 * t) * 0.15
    } else if (instrument === 'harp') {
      envelope = Math.min(1,t / 0.012) * Math.exp(-t * 2.9) * Math.min(1,(seconds - t) / 0.15)
      wave = Math.sin(tau * frequency * t) + 0.27 * Math.sin(tau * frequency * 2 * t) * Math.exp(-t * 3) + 0.1 * Math.sin(tau * frequency * 3 * t) * Math.exp(-t * 5)
    } else if (instrument === 'flute') {
      envelope = Math.min(1,t / 0.12) * Math.min(1,(seconds - t) / 0.25) * (0.93 + 0.07 * Math.sin(tau * 2 * t))
      const phase = tau * frequency * t + Math.min(1,t / 0.3) * 0.022 * Math.sin(tau * 5.2 * t)
      wave = Math.sin(phase) * 0.85 + Math.sin(phase * 2) * 0.075
    } else {
      envelope = Math.sin(Math.PI * p) ** 2
      wave = Math.sin(tau * frequency * t) * 0.9
    }
    const at = (offset + i) % length, value = wave * envelope * level
    left[at] += value * l; right[at] += value * r
  }
}
// D minor → B-flat → F → C → G minor → D minor → B-flat → A suspended.
const harmony = [[50,57,65],[46,53,62],[48,57,65],[48,55,64],[43,58,62],[50,57,65],[46,53,62],[45,57,64]]
const melody = [[74,77,76,72],[74,70,69,65],[69,72,77,76],[72,67,64,67],[70,74,72,70],[69,65,69,74],[77,74,70,69],[76,73,69,73]]
for (let bar = 0; bar < bars; bar++) {
  const chord = harmony[bar % 8], start = bar * beat * 4, section = Math.floor(bar / 8)
  chord.forEach((m,i) => note(m, start, beat * 4 + 0.9, 0.046, 'strings', (i - 1) * 0.48))
  note(chord[0] - 12, start, beat * 3.7, 0.057, 'bass', 0)
  for (let i = 0; i < 8; i++) {
    const pitch = chord[[0,1,2,1,0,2,1,2][i]] + 12
    note(pitch, start + i * beat / 2 + random() * 0.018, 1.6, 0.047 + random() * 0.013, 'harp', i % 2 ? 0.36 : -0.36)
  }
  if (section !== 2 || bar % 2 === 0) {
    melody[bar % 8].forEach((m,i) => {
      if (i === 3 && bar % 2 === 0) return
      note(m + (section === 3 && bar % 4 === 0 ? 12 : 0), start + beat * (0.35 + i * 0.88), beat * (i === 2 ? 1.25 : 0.84), 0.055, 'flute', -0.08)
    })
  }
}
// Circular stereo reflections make a continuous loop, including the final decay.
const dryL = left.slice(), dryR = right.slice()
for (const [delay, gain] of [[0.13,0.18],[0.23,0.14],[0.37,0.11],[0.53,0.08],[0.79,0.05]]) {
  const samples = Math.round(delay * rate)
  for (let i = 0; i < length; i++) {
    const src = (i - samples + length) % length
    left[i] += dryR[src] * gain; right[i] += dryL[src] * gain
  }
}
let peak = 0, sum = 0
for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
const scale = 0.78 / peak
const out = Buffer.alloc(44 + length * 4)
out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8)
out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(2,22)
out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*4,28);out.writeUInt16LE(4,32);out.writeUInt16LE(16,34)
out.write('data',36);out.writeUInt32LE(length*4,40)
for(let i=0;i<length;i++) {
  const l=left[i]*scale,r=right[i]*scale
  sum += l*l+r*r
  out.writeInt16LE(Math.round(l*32767),44+i*4);out.writeInt16LE(Math.round(r*32767),46+i*4)
}
fs.writeFileSync(process.argv[2] || '/tmp/frontier-dawn.wav',out)
console.log(JSON.stringify({duration,peak:0.78,rms:Math.sqrt(sum/(length*2)),bytes:out.length}))
