import type { Action } from './types';

type Handler = (a: Action) => void;

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
  KeyP: 'pause',
  Escape: 'pause',
  Enter: 'confirm',
};

const SWIPE_MIN = 26;

/** Keyboard + swipe controller. Returns an uninstall function. */
export function installInput(target: HTMLElement, handler: Handler): () => void {
  const onKey = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat) return;
    handler(action);
  };
  window.addEventListener('keydown', onKey);

  let sx = 0;
  let sy = 0;
  let pid = -1;
  const onDown = (e: PointerEvent) => {
    if (pid !== -1) return;
    pid = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
    if (Math.abs(dx) > Math.abs(dy)) handler(dx > 0 ? 'right' : 'left');
    else handler(dy < 0 ? 'jump' : 'slide');
    // re-anchor so a long drag can chain multiple swipes
    sx = e.clientX;
    sy = e.clientY;
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId === pid) pid = -1;
  };
  target.addEventListener('pointerdown', onDown);
  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
  target.addEventListener('pointercancel', onUp);

  return () => {
    window.removeEventListener('keydown', onKey);
    target.removeEventListener('pointerdown', onDown);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
  };
}
