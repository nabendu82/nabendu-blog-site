import { audio } from './audio';
import { engine } from './engine';
import { useUI } from './store';

/** Same-origin iframe bridge. The game owns and persists its mute preference. */
export function installSiteBridge(): () => void {
  if (window.parent === window) return () => {};
  const report = () => window.parent.postMessage({
    type: 'rooftop-rush:state', muted: useUI.getState().muted,
  }, window.location.origin);
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data?.type === 'rooftop-rush:get-state') report();
    if (event.data?.type === 'rooftop-rush:set-muted' && typeof event.data.muted === 'boolean') {
      useUI.getState().setMuted(event.data.muted);
    }
    if (event.data?.type === 'rooftop-rush:pause') engine.pause();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') window.parent.postMessage({type:'rooftop-rush:escape'}, window.location.origin);
  };
  const unsubscribe = useUI.subscribe((state, previous) => {
    if (state.muted !== previous.muted) { audio.setMuted(state.muted); report(); }
  });
  window.addEventListener('message', onMessage);
  window.addEventListener('keydown', onKey);
  report();
  return () => {
    unsubscribe();
    window.removeEventListener('message', onMessage);
    window.removeEventListener('keydown', onKey);
  };
}
