'use client';

import { create } from 'zustand';
import {
  GameState, GamePhase, CardId, Month, Difficulty,
  PlayerState, SpecialEvent, ScoringResult, TurnAction,
} from '@/engine/types';
import {
  createInitialGameState, startGame, playHandCard, selectMatchTarget,
  drawCard, resolveCapture, declareGo, declareStop, declareBomb,
} from '@/engine/game-manager';
import { checkBombOptions } from '@/engine/match-resolver';
import { calculateScore } from '@/engine/scoring';

interface GameStore {
  // 상태
  phase: GamePhase;
  players: PlayerState[];
  tableCards: Map<Month, CardId[]>;
  drawPile: CardId[];
  turnIndex: number;
  turnCount: number;
  currentTurnAction: Partial<TurnAction> | null;
  pendingMatchOptions: CardId[];
  lastEvent: SpecialEvent;
  difficulty: Difficulty;
  winner: number | null;
  gameResult: ScoringResult | null;
  goStopPlayer: number | null;
  lastCaptured: CardId[];

  // 내부 전체 상태
  _state: GameState | null;

  // 액션
  initGame: (difficulty: Difficulty) => void;
  playerPlayCard: (cardId: CardId) => void;
  playerSelectMatch: (targetId: CardId) => void;
  playerDrawCard: () => void;
  playerResolveCapture: () => void;
  playerDeclareGo: () => void;
  playerDeclareStop: () => void;
  playerDeclareBomb: (month: Month) => void;

  // AI 액션
  aiPlayCard: (cardId: CardId) => void;
  aiSelectMatch: (targetId: CardId) => void;
  aiDrawCard: () => void;
  aiResolveCapture: () => void;
  aiDeclareGo: () => void;
  aiDeclareStop: () => void;
  aiBomb: (month: Month) => void;

  // 헬퍼
  getBombOptions: () => Month[];
  getCurrentScore: (playerId: number) => ScoringResult;
  reset: () => void;
}

function stateToStore(s: GameState): Partial<GameStore> {
  return {
    phase: s.phase,
    players: s.players,
    tableCards: s.tableCards,
    drawPile: s.drawPile,
    turnIndex: s.turnIndex,
    turnCount: s.turnCount,
    currentTurnAction: s.currentTurnAction,
    pendingMatchOptions: s.pendingMatchOptions,
    lastEvent: s.lastEvent,
    difficulty: s.difficulty,
    winner: s.winner,
    gameResult: s.gameResult,
    goStopPlayer: s.goStopPlayer,
    lastCaptured: s.lastCaptured,
    _state: s,
  };
}

const initialStore = {
  phase: 'idle' as GamePhase,
  players: [] as PlayerState[],
  tableCards: new Map<Month, CardId[]>(),
  drawPile: [] as CardId[],
  turnIndex: 0,
  turnCount: 0,
  currentTurnAction: null,
  pendingMatchOptions: [] as CardId[],
  lastEvent: 'none' as SpecialEvent,
  difficulty: 'normal' as Difficulty,
  winner: null,
  gameResult: null,
  goStopPlayer: null,
  lastCaptured: [] as CardId[],
  _state: null as GameState | null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialStore,

  initGame: (difficulty) => {
    const state = createInitialGameState(difficulty);
    const started = startGame(state);
    set(stateToStore(started));
  },

  playerPlayCard: (cardId) => {
    const s = get()._state;
    if (!s) return;
    const next = playHandCard(s, cardId);
    set(stateToStore(next));
  },

  playerSelectMatch: (targetId) => {
    const s = get()._state;
    if (!s) return;
    const next = selectMatchTarget(s, targetId);
    set(stateToStore(next));
  },

  playerDrawCard: () => {
    const s = get()._state;
    if (!s) return;
    const next = drawCard(s);
    set(stateToStore(next));
  },

  playerResolveCapture: () => {
    const s = get()._state;
    if (!s) return;
    const next = resolveCapture(s);
    set(stateToStore(next));
  },

  playerDeclareGo: () => {
    const s = get()._state;
    if (!s) return;
    const next = declareGo(s);
    set(stateToStore(next));
  },

  playerDeclareStop: () => {
    const s = get()._state;
    if (!s) return;
    const next = declareStop(s);
    set(stateToStore(next));
  },

  playerDeclareBomb: (month) => {
    const s = get()._state;
    if (!s) return;
    const next = declareBomb(s, month);
    set(stateToStore(next));
  },

  // AI 액션 (게임 매니저 동일 함수 사용)
  aiPlayCard: (cardId) => {
    const s = get()._state;
    if (!s) return;
    const next = playHandCard(s, cardId);
    set(stateToStore(next));
  },

  aiSelectMatch: (targetId) => {
    const s = get()._state;
    if (!s) return;
    const next = selectMatchTarget(s, targetId);
    set(stateToStore(next));
  },

  aiDrawCard: () => {
    const s = get()._state;
    if (!s) return;
    const next = drawCard(s);
    set(stateToStore(next));
  },

  aiResolveCapture: () => {
    const s = get()._state;
    if (!s) return;
    const next = resolveCapture(s);
    set(stateToStore(next));
  },

  aiDeclareGo: () => {
    const s = get()._state;
    if (!s) return;
    const next = declareGo(s);
    set(stateToStore(next));
  },

  aiDeclareStop: () => {
    const s = get()._state;
    if (!s) return;
    const next = declareStop(s);
    set(stateToStore(next));
  },

  aiBomb: (month) => {
    const s = get()._state;
    if (!s) return;
    const next = declareBomb(s, month);
    set(stateToStore(next));
  },

  getBombOptions: () => {
    const s = get()._state;
    if (!s) return [];
    return checkBombOptions(s.players[0].hand, s.tableCards);
  },

  getCurrentScore: (playerId) => {
    const player = get().players[playerId];
    if (!player) return { baseScore: 0, combos: [], gwangScore: 0, ttiScore: 0, yeolScore: 0, piScore: 0, goMultiplier: 1, penalties: [], finalScore: 0 };
    return calculateScore(player.captured, player.goCount);
  },

  reset: () => set(initialStore),
}));
