import { TERRAINS, type TerrainKind } from '../game/terrain'

export function TerrainPreview({ kind }: { kind: TerrainKind }) {
  const p = TERRAINS[kind]
  return <svg viewBox="0 0 160 100" className="mb-2 h-20 w-full rounded-md" aria-hidden="true">
    <rect width="160" height="100" fill={p.land} />
    {kind === 'lake' && <ellipse cx="80" cy="50" rx="35" ry="33" fill={p.water} stroke="#cfbf89" strokeWidth="3" />}
    {kind === 'river' && <>
      <path d="M72 -8 C120 22 37 69 90 108" stroke="#b8ba86" strokeWidth="21" fill="none" />
      <path d="M72 -8 C120 22 37 69 90 108" stroke={p.water} strokeWidth="16" fill="none" />
      <path d="M69 29H100 M60 72H89" stroke="#ddd0ab" strokeWidth="9" />
    </>}
    {kind === 'oasis' && <>
      <rect x="48" y="0" width="64" height="100" fill={p.water} />
      <path d="M65 25h25M70 50h25M65 75h25" stroke="#88d8e8" strokeWidth="2" />
    </>}
    {[15, 30, 130, 145].map((x,i) => <path key={x} d={`M${x} ${i % 2 ? 64 : 30}l-5 12h10z`} fill={kind === 'oasis' ? '#66783d' : '#315d35'} />)}
    <circle cx="23" cy="18" r="5" fill="#65d9ee" stroke="#173d51" strokeWidth="2" />
    <circle cx="137" cy="82" r="5" fill="#f88b73" stroke="#77342e" strokeWidth="2" />
  </svg>
}
