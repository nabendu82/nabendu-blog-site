import { memo } from 'react';
import { audio } from '../game/audio';
import { engine } from '../game/engine';
import { useUI } from '../game/store';

const fmt = (n: number) => n.toLocaleString('en-US');

function PowerBar({ kind, label, value }: { kind: string; label: string; value: number }) {
  if (value <= 0) return null;
  return (
    <div className={`power power-${kind} ${value < 0.22 ? 'expiring' : ''}`}>
      <span className="power-icon">{kind === 'magnet' ? '⌒' : kind === 'shield' ? '◈' : '⚡'}</span>
      <span className="power-label">{label}</span>
      <span className="power-track">
        <span className="power-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </span>
    </div>
  );
}

export const MuteButton = memo(function MuteButton() {
  const muted = useUI((s) => s.muted);
  return (
    <button
      className="icon-btn"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute' : 'Mute'}
      onClick={(e) => {
        e.stopPropagation();
        audio.unlock();
        audio.setMuted(!muted);
        useUI.getState().setMuted(!muted);
        (e.currentTarget as HTMLButtonElement).blur();
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
});

export function HUD() {
  const phase = useUI((s) => s.phase);
  const score = useUI((s) => s.score);
  const dist = useUI((s) => s.dist);
  const cells = useUI((s) => s.cells);
  const combo = useUI((s) => s.combo);
  const mult = useUI((s) => s.mult);
  const prog = useUI((s) => s.comboProgress);
  const level = useUI((s) => s.level);
  const speedNorm = useUI((s) => s.speedNorm);
  const magnet = useUI((s) => s.magnet);
  const shield = useUI((s) => s.shield);
  const overdrive = useUI((s) => s.overdrive);
  const toast = useUI((s) => s.toast);
  const visible = phase === 'playing' || phase === 'paused' || phase === 'dying';

  return (
    <div className={`hud ${visible ? 'show' : ''} ${overdrive > 0 ? 'overdrive' : ''}`} aria-hidden={!visible}>
      <div className="od-fx" />
      <div className="hud-top">
        <div className="hud-left">
          <div className="score-label">SCORE</div>
          <div className="score">{fmt(score)}</div>
          <div className="sub-row">
            <span className="chip">{fmt(dist)} m</span>
            <span className="chip chip-level">LV {level}</span>
          </div>
        </div>
        <div className="hud-right">
          <div className="cells" title="Energy cells">
            <span className="cell-icon" />
            <span className="cells-num">{fmt(cells)}</span>
          </div>
          <div className="btn-row">
            <MuteButton />
            <button
              className="icon-btn"
              aria-label="Pause"
              onClick={(e) => {
                e.stopPropagation();
                engine.pause();
                (e.currentTarget as HTMLButtonElement).blur();
              }}
            >
              ❚❚
            </button>
          </div>
        </div>
      </div>

      <div className="hud-mid-left">
        {combo > 0 && (
          <div className={`combo ${mult > 1 ? 'hot' : ''}`}>
            <span className="combo-x">x{mult}</span>
            <span className="combo-meta">
              <span className="combo-label">COMBO {combo}</span>
              <span className="combo-bar">
                <span style={{ width: `${prog * 100}%` }} />
              </span>
            </span>
          </div>
        )}
        <div className="powers">
          <PowerBar kind="magnet" label="MAGNET" value={magnet} />
          <PowerBar kind="shield" label="SHIELD" value={shield} />
          <PowerBar kind="overdrive" label="OVERDRIVE" value={overdrive} />
        </div>
      </div>

      {toast && (
        <div key={toast.id} className={`toast toast-${toast.kind}`}>
          {toast.text}
        </div>
      )}

      <div className="speedbar" aria-label="Speed">
        <span style={{ width: `${speedNorm * 100}%` }} />
      </div>
    </div>
  );
}
