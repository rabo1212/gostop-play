/**
 * 서버 사이드 AI 턴 프로세서
 * AI 턴을 사람 턴이 올 때까지 자동 체이닝
 */
import type { GameState, Month } from '@/engine/types';
import {
  playHandCard, selectMatchTarget, drawCard,
  resolveCapture, declareGo, declareStop, declareBomb,
} from '@/engine/game-manager';
import {
  aiChooseHandCard, aiSelectMatch,
  aiGoStopDecision, aiShouldBomb,
} from '@/ai/ai-player';

/** 타이머 상수 */
export const PLAY_HAND_TIMEOUT_MS = 30000;
export const MATCH_SELECT_TIMEOUT_MS = 15000;
export const GO_STOP_TIMEOUT_MS = 15000;

/** AI 턴 체이닝: 사람 턴이 올 때까지 자동 진행 */
export function processAITurns(state: GameState): GameState {
  let s = state;
  let iterations = 0;

  while (iterations++ < 200) {
    if (s.phase === 'game-over' || s.phase === 'idle') break;

    const currentPlayer = s.players[s.turnIndex];

    // go-stop-decision: AI면 결정, 사람이면 멈춤
    if (s.phase === 'go-stop-decision' && s.goStopPlayer !== null) {
      if (s.players[s.goStopPlayer].isAI) {
        const decision = aiGoStopDecision(s, s.goStopPlayer);
        s = decision === 'go' ? declareGo(s) : declareStop(s);
        continue;
      }
      break; // 사람이 결정해야 함
    }

    // 사람 턴이면 멈춤
    if (!currentPlayer.isAI) break;

    // AI의 play-hand
    if (s.phase === 'play-hand') {
      // 폭탄 체크
      const bombMonth: Month | null = aiShouldBomb(s, s.turnIndex);
      if (bombMonth !== null) {
        s = declareBomb(s, bombMonth);
        continue;
      }

      const cardId = aiChooseHandCard(s, s.turnIndex);
      s = playHandCard(s, cardId);
      continue;
    }

    // match-select
    if (s.phase === 'hand-match-select' || s.phase === 'draw-match-select') {
      const target = aiSelectMatch(s, s.turnIndex, s.pendingMatchOptions);
      s = selectMatchTarget(s, target);
      continue;
    }

    // draw
    if (s.phase === 'draw') {
      s = drawCard(s);
      continue;
    }

    // resolve-capture
    if (s.phase === 'resolve-capture') {
      s = resolveCapture(s);
      continue;
    }

    break; // 예상치 못한 phase
  }

  return s;
}

/** 사람 카드 내기 후 draw → resolve 자동 진행 */
export function autoProgressAfterPlay(state: GameState): GameState {
  let s = state;

  // draw 자동
  if (s.phase === 'draw') {
    s = drawCard(s);
  }

  // draw-match-select면 사람이 선택해야 하므로 멈춤
  if (s.phase === 'draw-match-select') {
    return s;
  }

  // resolve-capture 자동
  if (s.phase === 'resolve-capture') {
    s = resolveCapture(s);
  }

  // go-stop-decision은 사람이 결정해야 하므로 멈춤
  if (s.phase === 'go-stop-decision') {
    return s;
  }

  // 다음 턴이 AI면 체이닝
  if (s.phase === 'play-hand' && s.players[s.turnIndex].isAI) {
    s = processAITurns(s);
  }

  return s;
}

/** 턴 데드라인 계산 */
export function getDeadlineMs(phase: string): number | null {
  switch (phase) {
    case 'play-hand': return PLAY_HAND_TIMEOUT_MS;
    case 'hand-match-select':
    case 'draw-match-select': return MATCH_SELECT_TIMEOUT_MS;
    case 'go-stop-decision': return GO_STOP_TIMEOUT_MS;
    default: return null;
  }
}
