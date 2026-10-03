import { useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameOver, LoadingScreen, MainMenu, PauseMenu } from './components/Menus';
import { audio } from './game/audio';
import { engine } from './game/engine';
import { G } from './game/state';
import { installInput } from './game/input';
import { useUI } from './game/store';
import { installSiteBridge } from './game/siteBridge';

export function App() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audio.setMuted(useUI.getState().muted);
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    const removeBridge = installSiteBridge();
    const off = installInput(ref.current!, (a) => engine.command(a));
    const autoPause = () => {
      if (document.hidden && G.phase === 'playing') engine.pause();
    };
    const onBlur = () => { if (G.phase === 'playing') engine.pause(); };
    document.addEventListener('visibilitychange', autoPause);
    window.addEventListener('blur', onBlur);
    return () => {
      off();
      removeBridge();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', autoPause);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <div className="app" ref={ref}>
      <GameCanvas />
      <div className="vignette" />
      <HUD />
      <MainMenu />
      <PauseMenu />
      <GameOver />
      <LoadingScreen />
    </div>
  );
}
