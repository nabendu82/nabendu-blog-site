import { create } from 'zustand';
import type { Phase, ToastKind, ToastMsg } from './types';

const HIGH_KEY = 'rooftop-rush-neo-india:high';
const MUTE_KEY = 'rooftop-rush-neo-india:muted';

function readNumber(key: string): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) – ignore */
  }
}

export interface RunSummary {
  score: number;
  dist: number;
  cells: number;
  newHigh: boolean;
}

export interface UIState {
  phase: Phase;
  ready: boolean;
  score: number;
  dist: number;
  cells: number;
  combo: number;
  mult: number;
  comboProgress: number;
  level: number;
  speedNorm: number;
  speedMps: number;
  magnet: number;
  shield: number;
  overdrive: number;
  high: number;
  muted: boolean;
  toast: ToastMsg | null;
  summary: RunSummary;
  setMuted: (m: boolean) => void;
  commitHigh: (score: number) => boolean;
}

let toastId = 1;

export const useUI = create<UIState>((set, get) => ({
  phase: 'loading',
  ready: false,
  score: 0,
  dist: 0,
  cells: 0,
  combo: 0,
  mult: 1,
  comboProgress: 0,
  level: 1,
  speedNorm: 0,
  speedMps: 0,
  magnet: 0,
  shield: 0,
  overdrive: 0,
  high: readNumber(HIGH_KEY),
  muted: readNumber(MUTE_KEY) === 1,
  toast: null,
  summary: { score: 0, dist: 0, cells: 0, newHigh: false },
  setMuted: (m) => {
    write(MUTE_KEY, m ? '1' : '0');
    set({ muted: m });
  },
  commitHigh: (score) => {
    if (score > get().high) {
      write(HIGH_KEY, String(score));
      set({ high: score });
      return true;
    }
    return false;
  },
}));

export function showToast(text: string, kind: ToastKind = 'info'): void {
  useUI.setState({ toast: { id: toastId++, text, kind } });
}
