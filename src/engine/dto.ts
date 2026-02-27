/**
 * GameState ↔ JSON 직렬화/역직렬화
 * Map<Month, CardId[]> 처리 + 플레이어별 DTO 생성
 */
import type { GameState, Month, CardId, CapturedCards } from './types';
import { checkBombOptions } from './match-resolver';
import type { GameStateDTO } from '@/lib/online-types';

// ===== Map ↔ Record 변환 =====

export function serializeTableCards(map: Map<Month, CardId[]>): Record<string, number[]> {
  const obj: Record<string, number[]> = {};
  map.forEach((cards, month) => {
    obj[String(month)] = [...cards];
  });
  return obj;
}

export function deserializeTableCards(obj: Record<string, number[]>): Map<Month, CardId[]> {
  const map = new Map<Month, CardId[]>();
  for (const [key, cards] of Object.entries(obj)) {
    map.set(Number(key) as Month, cards);
  }
  return map;
}

// ===== GameState → DB 저장용 (전체 상태) =====

export function serializeFullState(state: GameState): Record<string, unknown> {
  return {
    ...state,
    tableCards: serializeTableCards(state.tableCards),
  };
}

// ===== DB → GameState 복원 =====

export function hydrateGameState(raw: Record<string, unknown>): GameState {
  const state = { ...raw } as unknown as GameState;
  // tableCards를 Map으로 복원
  if (raw.tableCards && typeof raw.tableCards === 'object' && !(raw.tableCards instanceof Map)) {
    state.tableCards = deserializeTableCards(raw.tableCards as Record<string, number[]>);
  }
  return state;
}

// ===== 플레이어별 DTO (상대 손패 숨김) =====

export function createPlayerDTO(
  state: GameState,
  forSeatIndex: number,
  turnDeadlineMs: number | null = null,
): GameStateDTO {
  const isMatchSelect = state.phase === 'hand-match-select' || state.phase === 'draw-match-select';

  return {
    gameId: state.gameId,
    phase: state.phase,
    players: state.players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      handCount: p.hand.length,
      hand: idx === forSeatIndex ? [...p.hand] : [],
      captured: deepCloneCaptured(p.captured),
      goCount: p.goCount,
      sseulCount: p.sseulCount,
      isAI: p.isAI,
    })),
    tableCards: serializeTableCards(state.tableCards),
    drawPileCount: state.drawPile.length,
    turnIndex: state.turnIndex,
    turnCount: state.turnCount,
    pendingMatchOptions:
      isMatchSelect && state.turnIndex === forSeatIndex
        ? [...state.pendingMatchOptions]
        : [],
    lastEvent: state.lastEvent,
    difficulty: state.difficulty,
    winner: state.winner,
    gameResult: state.gameResult,
    goStopPlayer: state.goStopPlayer,
    lastCaptured: [...state.lastCaptured],
    myBombOptions:
      state.phase === 'play-hand' && state.turnIndex === forSeatIndex
        ? checkBombOptions(state.players[forSeatIndex].hand, state.tableCards)
        : [],
    turnDeadlineMs,
  };
}

function deepCloneCaptured(c: CapturedCards): CapturedCards {
  return {
    gwang: [...c.gwang],
    yeol: [...c.yeol],
    tti: [...c.tti],
    pi: [...c.pi],
  };
}
