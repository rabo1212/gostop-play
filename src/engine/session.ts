/**
 * 게임 세션 관리 (3판)
 */
import { GameState, Difficulty } from './types';
import { createInitialGameState, startGame } from './game-manager';

export interface GameSession {
  sessionId: string;
  difficulty: Difficulty;
  currentRound: number;
  maxRounds: number;
  scores: number[];        // 3명 누적 점수
  roundHistory: RoundResult[];
}

export interface RoundResult {
  round: number;
  winner: number | null;
  points: number;
  comboNames: string[];
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSession(difficulty: Difficulty): GameSession {
  return {
    sessionId: generateSessionId(),
    difficulty,
    currentRound: 0,
    maxRounds: 3,
    scores: [0, 0, 0],
    roundHistory: [],
  };
}

export function createRoundState(session: GameSession): GameState {
  const state = createInitialGameState(session.difficulty);
  return startGame(state);
}

export function recordRoundResult(
  session: GameSession,
  gameState: GameState,
): GameSession {
  const winner = gameState.winner;
  const points = gameState.gameResult?.finalScore ?? 0;
  const comboNames = gameState.gameResult?.combos.map(c => c.nameKo) ?? [];

  const newScores = [...session.scores];
  if (winner !== null) {
    newScores[winner] += points;
  }

  return {
    ...session,
    currentRound: session.currentRound + 1,
    scores: newScores,
    roundHistory: [
      ...session.roundHistory,
      { round: session.currentRound, winner, points, comboNames },
    ],
  };
}

export function isSessionOver(session: GameSession): boolean {
  return session.currentRound >= session.maxRounds;
}

export function getSessionRanking(session: GameSession): { playerId: number; score: number }[] {
  return session.scores
    .map((score, playerId) => ({ playerId, score }))
    .sort((a, b) => b.score - a.score);
}
