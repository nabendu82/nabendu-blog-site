/** Lightweight illustrations; interactive simulations live inside each lab. */
export function LabPreview({ kind, hero = false }: { kind: "physics" | "chemistry"; hero?: boolean }) {
  const id = `${kind}-${hero ? "hero" : "card"}`;
  return (
    <svg viewBox="0 0 480 260" aria-hidden="true" className="mx-auto block w-full max-w-lg">
      <defs>
        <radialGradient id={`${id}-ball`} cx="30%" cy="20%"><stop stopColor="#f0fdff" /><stop offset="0.35" stopColor="#67e8f9" /><stop offset="1" stopColor="#0891b2" /></radialGradient>
        <radialGradient id={`${id}-violet`} cx="30%" cy="20%"><stop stopColor="#ede9fe" /><stop offset="0.4" stopColor="#a78bfa" /><stop offset="1" stopColor="#6d28d9" /></radialGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#bae6fd" stopOpacity="0.5" /><stop offset="0.5" stopColor="#e0f2fe" stopOpacity="0.12" /><stop offset="1" stopColor="#7dd3fc" stopOpacity="0.4" /></linearGradient>
        <linearGradient id={`${id}-ramp`} x2="0" y2="1"><stop stopColor="#38bdf8" /><stop offset="1" stopColor="#0369a1" /></linearGradient>
      </defs>
      <ellipse cx="240" cy="225" rx="180" ry="19" fill={hero ? "#000" : "#64748b"} opacity="0.12" />
      {kind === "physics" ? <>
        <path d="M65 200 285 109 405 169 184 241Z" fill="#7dd3fc" opacity="0.17" />
        <path d="m106 193 216-113v112Z" fill={`url(#${id}-ramp)`} />
        <path d="m106 193 216-113 36 19-216 114Z" fill="#7dd3fc" />
        <path d="m322 80 36 19v113l-36-20Z" fill="#075985" />
        <path d="m216 109 40-21 30 16-40 22Z" fill="#fde68a" />
        <path d="m216 109 30 17v35l-30-17Z" fill="#d97706" />
        <path d="m246 126 40-22v35l-40 22Z" fill="#fbbf24" />
        <path d="M252 93V45m0 0-6 11m6-11 6 11" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" />
        <path d="m292 139 43-23m0 0-13 1m13-1-6 12" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <g fill="currentColor" className="text-sky-800 dark:text-sky-200" fontFamily="sans-serif" fontSize="11"><text x="268" y="49">FORCE</text><text x="85" y="80">CHANGE THE ANGLE.</text><text x="85" y="96">SEE THE DIFFERENCE.</text></g>
        <path d="M154 192a42 42 0 0 0-7-19" stroke="#e0f2fe" strokeWidth="2" fill="none" />
        <g stroke="#38bdf8" opacity="0.5"><path d="M77 218h35m-18-17v34M374 59h20m-10-10v20" /></g>
      </> : <>
        <g stroke="#94a3b8" strokeWidth="9" strokeLinecap="round"><path d="m286 96 49-32m-49 32 61 53m-61-53-36-40" /></g>
        <circle cx="286" cy="96" r="33" fill={`url(#${id}-violet)`} /><circle cx="339" cy="61" r="21" fill={`url(#${id}-ball)`} /><circle cx="350" cy="153" r="23" fill={`url(#${id}-ball)`} /><circle cx="246" cy="51" r="17" fill={`url(#${id}-ball)`} />
        <path d="M141 66v59l-43 69q-12 23 15 23h103q27 0 15-23l-43-69V66" fill={`url(#${id}-glass)`} stroke="#7dd3fc" strokeWidth="2" />
        <path d="m127 155-23 41q-6 14 12 14h97q18 0 12-14l-23-41Z" fill="#8b5cf6" opacity="0.75" />
        <ellipse cx="165" cy="155" rx="38" ry="7" fill="#c4b5fd" opacity="0.9" />
        <path d="M137 66h55M145 80v43l-21 36" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" fill="none" />
        <g fill="#e9d5ff"><circle cx="151" cy="178" r="5" /><circle cx="180" cy="191" r="3" /><circle cx="167" cy="136" r="5" /><circle cx="159" cy="116" r="3" /></g>
        <g stroke="#a78bfa" strokeWidth="1" opacity="0.5" fill="none"><ellipse cx="288" cy="100" rx="104" ry="77" transform="rotate(-25 288 100)" /><path d="M73 104h20m-10-10v20M381 200h20m-10-10v20" /></g>
        <text x="257" y="223" fill={hero ? "#cbd5e1" : "currentColor"} className="text-violet-800 dark:text-violet-200" fontFamily="sans-serif" fontSize="11" letterSpacing="2">A WORLD WITHIN.</text>
      </>}
    </svg>
  );
}
