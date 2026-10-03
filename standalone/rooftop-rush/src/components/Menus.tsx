import { engine } from '../game/engine';
import { useUI } from '../game/store';
import { MuteButton } from './HUD';

const fmt = (n: number) => n.toLocaleString('en-US');

function Controls() {
  return (
    <div className="controls">
      <div className="ctl">
        <span className="keys">
          <kbd>←</kbd>
          <kbd>→</kbd>
          <em>or</em>
          <kbd>A</kbd>
          <kbd>D</kbd>
        </span>
        <span className="ctl-what">Change lane</span>
      </div>
      <div className="ctl">
        <span className="keys">
          <kbd>↑</kbd>
          <kbd>W</kbd>
          <kbd className="wide">Space</kbd>
        </span>
        <span className="ctl-what">Jump</span>
      </div>
      <div className="ctl">
        <span className="keys">
          <kbd>↓</kbd>
          <kbd>S</kbd>
        </span>
        <span className="ctl-what">Slide</span>
      </div>
      <div className="ctl">
        <span className="keys">
          <kbd>P</kbd>
          <kbd>Esc</kbd>
        </span>
        <span className="ctl-what">Pause</span>
      </div>
      <div className="ctl touch-hint">
        <span className="keys">
          <kbd className="wide">Swipe</kbd>
        </span>
        <span className="ctl-what">Touch: swipe ← → ↑ ↓</span>
      </div>
    </div>
  );
}

export function MainMenu() {
  const phase = useUI((s) => s.phase);
  const high = useUI((s) => s.high);
  const show = phase === 'menu';
  return (
    <div className={`overlay menu ${show ? 'show' : ''}`} aria-hidden={!show}>
      <div className="menu-corner">
        <MuteButton />
      </div>
      <div className="panel title-panel">
        <div className="eyebrow">रूफटॉप रश</div>
        <h1 className="title">
          <span className="t1">ROOFTOP</span>
          <span className="t2">RUSH</span>
        </h1>
        <div className="tagline">
          <span className="tag-neo">NEO INDIA</span>
          <span className="tag-sub">Courier bot. Endless rooftops. Sunset city.</span>
        </div>
        <button className="btn primary" onClick={() => engine.startRun()} tabIndex={show ? 0 : -1}>
          START RUN
        </button>
        <div className="hint">Press Enter, Space or tap the button</div>
        <Controls />
        <div className="best">
          BEST <b>{fmt(high)}</b>
        </div>
      </div>
    </div>
  );
}

export function PauseMenu() {
  const phase = useUI((s) => s.phase);
  const show = phase === 'paused';
  return (
    <div className={`overlay pause ${show ? 'show' : ''}`} aria-hidden={!show}>
      <div className="panel">
        <h2>PAUSED</h2>
        <button className="btn primary" onClick={() => engine.resume()} tabIndex={show ? 0 : -1}>
          RESUME
        </button>
        <button className="btn" onClick={() => engine.startRun()} tabIndex={show ? 0 : -1}>
          RESTART
        </button>
        <Controls />
      </div>
    </div>
  );
}

export function GameOver() {
  const phase = useUI((s) => s.phase);
  const summary = useUI((s) => s.summary);
  const high = useUI((s) => s.high);
  const show = phase === 'gameover';
  return (
    <div className={`overlay gameover ${show ? 'show' : ''}`} aria-hidden={!show}>
      <div className="panel">
        <h2>RUN OVER</h2>
        {summary.newHigh && <div className="newbest">★ NEW HIGH SCORE ★</div>}
        <div className="final-score">{fmt(summary.score)}</div>
        <div className="stats">
          <div>
            <span>DISTANCE</span>
            <b>{fmt(summary.dist)} m</b>
          </div>
          <div>
            <span>ENERGY</span>
            <b>{fmt(summary.cells)}</b>
          </div>
          <div>
            <span>BEST</span>
            <b>{fmt(high)}</b>
          </div>
        </div>
        <button className="btn primary" onClick={() => engine.startRun()} tabIndex={show ? 0 : -1}>
          RUN AGAIN
        </button>
        <div className="hint">Enter or Space to restart instantly</div>
      </div>
    </div>
  );
}

export function LoadingScreen() {
  const ready = useUI((s) => s.ready);
  return (
    <div className={`loading ${ready ? 'done' : ''}`} aria-hidden={ready}>
      <div className="load-title">ROOFTOP RUSH</div>
      <div className="load-sub">Booting courier bot…</div>
      <div className="load-bar">
        <span />
      </div>
    </div>
  );
}
