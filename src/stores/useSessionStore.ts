'use client';

import { create } from 'zustand';
import { Difficulty, GameState } from '@/engine/types';
import {
  GameSession,
  RoundResult,
  createSession,
  recordRoundResult,
  isSessionOver,
  getSessionRanking,
} from '@/engine/session';

interface SessionStore {
  session: GameSession | null;
  isActive: boolean;

  startSession: (difficulty: Difficulty) => void;
  recordRound: (gameState: GameState) => void;
  getIsSessionOver: () => boolean;
  getRanking: () => { playerId: number; score: number }[];
  getRoundHistory: () => RoundResult[];
  getCurrentRound: () => number;
  getMaxRounds: () => number;
  endSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  isActive: false,

  startSession: (difficulty) => {
    const session = createSession(difficulty);
    set({ session, isActive: true });
  },

  recordRound: (gameState) => {
    const { session } = get();
    if (!session) return;
    const updated = recordRoundResult(session, gameState);
    set({ session: updated });
  },

  getIsSessionOver: () => {
    const { session } = get();
    if (!session) return false;
    return isSessionOver(session);
  },

  getRanking: () => {
    const { session } = get();
    if (!session) return [];
    return getSessionRanking(session);
  },

  getRoundHistory: () => {
    const { session } = get();
    return session?.roundHistory ?? [];
  },

  getCurrentRound: () => {
    const { session } = get();
    return session?.currentRound ?? 0;
  },

  getMaxRounds: () => {
    const { session } = get();
    return session?.maxRounds ?? 3;
  },

  endSession: () => {
    set({ session: null, isActive: false });
  },
}));
