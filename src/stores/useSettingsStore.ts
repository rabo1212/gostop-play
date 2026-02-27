'use client';

import { create } from 'zustand';
import { Difficulty } from '@/engine/types';

interface SettingsState {
  difficulty: Difficulty;
  soundEnabled: boolean;
  showHints: boolean;
  setDifficulty: (d: Difficulty) => void;
  setSoundEnabled: (v: boolean) => void;
  setShowHints: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  difficulty: 'normal',
  soundEnabled: true,
  showHints: true,
  setDifficulty: (d) => set({ difficulty: d }),
  setSoundEnabled: (v) => set({ soundEnabled: v }),
  setShowHints: (v) => set({ showHints: v }),
}));
