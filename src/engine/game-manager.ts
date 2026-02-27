/**
 * 고스톱 게임 매니저 — 순수 함수 기반 상태 전이
 */
import {
  GameState, CardId, Month, PlayerState,
  SpecialEvent, Difficulty,
} from './types';
import { getCard, getCardMonth } from './cards';
import { dealCards } from './deck';
import { resolveMatch, executeMatch } from './match-resolver';
import { checkSseul, calcEventPenalty } from './event-detector';
import { calculateScore } from './scoring';
import { MIN_SCORE_TO_STOP, PLAYER_COUNT } from '@/lib/constants';

/** 고유 ID 생성 */
function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 깊은 복사 유틸 */
function clonePlayers(players: PlayerState[]): PlayerState[] {
  return players.map(p => ({
    ...p,
    hand: [...p.hand],
    captured: {
      gwang: [...p.captured.gwang],
      yeol: [...p.captured.yeol],
      tti: [...p.captured.tti],
      pi: [...p.captured.pi],
    },
  }));
}

function cloneTable(table: Map<Month, CardId[]>): Map<Month, CardId[]> {
  const m = new Map<Month, CardId[]>();
  table.forEach((v, k) => {
    m.set(k, [...v]);
  });
  return m;
}

/** 초기 게임 상태 생성 */
export function createInitialGameState(difficulty: Difficulty): GameState {
  return {
    gameId: genId(),
    phase: 'idle',
    players: [],
    tableCards: new Map(),
    drawPile: [],
    turnIndex: 0,
    turnCount: 0,
    currentTurnAction: null,
    pendingMatchOptions: [],
    lastEvent: 'none',
    difficulty,
    winner: null,
    gameResult: null,
    goStopPlayer: null,
    lastCaptured: [],
  };
}

/** 게임 시작: 배패 */
export function startGame(state: GameState): GameState {
  const deal = dealCards();
  return {
    ...state,
    phase: 'play-hand',
    players: deal.players,
    tableCards: deal.tableCards,
    drawPile: deal.drawPile,
    turnIndex: 0,
    turnCount: 1,
  };
}

/** 손패에서 카드 내기 */
export function playHandCard(state: GameState, cardId: CardId): GameState {
  const players = clonePlayers(state.players);
  const player = players[state.turnIndex];
  const tableCards = cloneTable(state.tableCards);

  // 손패에서 제거
  player.hand = player.hand.filter(id => id !== cardId);

  // 바닥 매칭 판정
  const matchResult = resolveMatch(tableCards, cardId);

  if (matchResult.type === 'select') {
    // 2장 중 선택 필요
    return {
      ...state,
      players,
      tableCards,
      phase: 'hand-match-select',
      pendingMatchOptions: matchResult.options,
      currentTurnAction: { playedCardId: cardId, capturedCards: [], events: [] },
    };
  }

  // 즉시 매칭 처리
  const { newTable, captured } = executeMatch(tableCards, cardId, matchResult);

  return {
    ...state,
    players,
    tableCards: newTable,
    phase: 'draw',
    pendingMatchOptions: [],
    currentTurnAction: {
      playedCardId: cardId,
      handMatchTarget: captured.length > 1 ? captured[1] : null,
      capturedCards: captured,
      events: matchResult.type === 'ttadak' ? ['ttadak'] : [],
    },
    lastEvent: matchResult.type === 'ttadak' ? 'ttadak' : 'none',
  };
}

/** 바닥 2장 중 매칭 카드 선택 (hand-match-select / draw-match-select) */
export function selectMatchTarget(state: GameState, targetId: CardId): GameState {
  const tableCards = cloneTable(state.tableCards);
  const action = state.currentTurnAction!;
  const playedId = state.phase === 'hand-match-select'
    ? action.playedCardId!
    : action.drawnCardId!;

  const matchResult = resolveMatch(tableCards, playedId);
  const { newTable, captured } = executeMatch(tableCards, playedId, matchResult, targetId);

  const prevCaptured = action.capturedCards || [];

  if (state.phase === 'hand-match-select') {
    return {
      ...state,
      tableCards: newTable,
      phase: 'draw',
      pendingMatchOptions: [],
      currentTurnAction: {
        ...action,
        handMatchTarget: targetId,
        capturedCards: [...prevCaptured, ...captured],
      },
    };
  }

  // draw-match-select
  return {
    ...state,
    tableCards: newTable,
    phase: 'resolve-capture',
    pendingMatchOptions: [],
    currentTurnAction: {
      ...action,
      drawMatchTarget: targetId,
      capturedCards: [...prevCaptured, ...captured],
    },
  };
}

/** 뽑을 패에서 1장 뽑기 */
export function drawCard(state: GameState): GameState {
  if (state.drawPile.length === 0) {
    // 뽑을 패 소진 → 턴 종료 처리
    return {
      ...state,
      phase: 'resolve-capture',
      currentTurnAction: {
        ...state.currentTurnAction,
        drawnCardId: null,
      },
    };
  }

  const drawPile = [...state.drawPile];
  const drawnId = drawPile.pop()!;
  const tableCards = cloneTable(state.tableCards);

  const matchResult = resolveMatch(tableCards, drawnId);

  if (matchResult.type === 'select') {
    return {
      ...state,
      drawPile,
      phase: 'draw-match-select',
      pendingMatchOptions: matchResult.options,
      currentTurnAction: {
        ...state.currentTurnAction,
        drawnCardId: drawnId,
      },
    };
  }

  const { newTable, captured } = executeMatch(tableCards, drawnId, matchResult);
  const prevCaptured = state.currentTurnAction?.capturedCards || [];
  const prevEvents = state.currentTurnAction?.events || [];
  const newEvents = matchResult.type === 'ttadak' ? [...prevEvents, 'ttadak' as SpecialEvent] : prevEvents;

  return {
    ...state,
    drawPile,
    tableCards: newTable,
    phase: 'resolve-capture',
    pendingMatchOptions: [],
    currentTurnAction: {
      ...state.currentTurnAction,
      drawnCardId: drawnId,
      drawMatchTarget: captured.length > 1 ? captured[1] : null,
      capturedCards: [...prevCaptured, ...captured],
      events: newEvents,
    },
    lastEvent: matchResult.type === 'ttadak' ? 'ttadak' : state.lastEvent,
  };
}

/** 먹기 확정 + 이벤트 처리 + 점수 체크 */
export function resolveCapture(state: GameState): GameState {
  const players = clonePlayers(state.players);
  const player = players[state.turnIndex];
  const action = state.currentTurnAction!;
  const captured = action.capturedCards || [];

  // 먹은 카드를 타입별로 분류
  for (const cardId of captured) {
    const card = getCard(cardId);
    switch (card.type) {
      case 'gwang': player.captured.gwang.push(cardId); break;
      case 'yeol': player.captured.yeol.push(cardId); break;
      case 'tti': player.captured.tti.push(cardId); break;
      case 'pi': player.captured.pi.push(cardId); break;
    }
  }

  // 쓸 체크
  const isSseul = captured.length > 0 && checkSseul(state.tableCards);
  let events = action.events || [];
  if (isSseul) {
    events = [...events, 'sseul'];
    player.sseulCount++;
  }

  // 이벤트 패널티: 따닥/폭탄/쓸 → 상대에게 피 1장씩 받기
  const penalty = calcEventPenalty(events);
  if (penalty > 0) {
    // 다른 플레이어에게서 피 가져오기 (가장 마지막 피)
    for (let i = 0; i < PLAYER_COUNT; i++) {
      if (i === state.turnIndex) continue;
      for (let p = 0; p < penalty; p++) {
        if (players[i].captured.pi.length > 0) {
          const stolen = players[i].captured.pi.pop()!;
          player.captured.pi.push(stolen);
        }
      }
    }
  }

  // 점수 계산
  const score = calculateScore(player.captured, player.goCount);

  // 3점 이상이면 고/스톱 선택 가능
  if (score.baseScore >= MIN_SCORE_TO_STOP) {
    return {
      ...state,
      players,
      phase: 'go-stop-decision',
      goStopPlayer: state.turnIndex,
      currentTurnAction: { ...action, events },
      lastEvent: isSseul ? 'sseul' : (events[0] || 'none'),
      lastCaptured: captured,
    };
  }

  // 뽑을 패 소진 체크
  if (state.drawPile.length === 0) {
    return resolveGameEnd(state, players);
  }

  // 다음 턴
  return advanceTurn({
    ...state,
    players,
    currentTurnAction: null,
    lastEvent: isSseul ? 'sseul' : (events[0] || 'none'),
    lastCaptured: captured,
  });
}

/** 고 선택 */
export function declareGo(state: GameState): GameState {
  const players = clonePlayers(state.players);
  const player = players[state.turnIndex];
  player.goCount++;

  // 뽑을 패 소진 체크
  if (state.drawPile.length === 0) {
    return resolveGameEnd(state, players);
  }

  // 폭탄 후 고 선언 → 아직 일반 카드를 내지 않았으므로 play-hand로 복귀
  // (currentTurnAction에 playedCardId가 없으면 폭탄 후 상태)
  if (!state.currentTurnAction?.playedCardId) {
    return {
      ...state,
      players,
      goStopPlayer: null,
      currentTurnAction: null,
      lastEvent: 'none',
      phase: 'play-hand',
    };
  }

  return advanceTurn({
    ...state,
    players,
    goStopPlayer: null,
    currentTurnAction: null,
    lastEvent: 'none',
  });
}

/** 스톱 선택 */
export function declareStop(state: GameState): GameState {
  const players = clonePlayers(state.players);
  const winner = players[state.turnIndex];
  const score = calculateScore(winner.captured, winner.goCount);

  return {
    ...state,
    players,
    phase: 'game-over',
    winner: state.turnIndex,
    gameResult: score,
    goStopPlayer: null,
  };
}

/** 폭탄 선언 */
export function declareBomb(state: GameState, month: Month): GameState {
  const players = clonePlayers(state.players);
  const player = players[state.turnIndex];
  const tableCards = cloneTable(state.tableCards);

  // 손패에서 해당 월 3장 제거
  const bombCards = player.hand.filter(id => getCardMonth(id) === month);
  player.hand = player.hand.filter(id => getCardMonth(id) !== month);

  // 바닥에서 해당 월 카드 가져오기
  const tableMonthCards = tableCards.get(month) || [];
  tableCards.delete(month);

  // 모든 카드 먹기
  const captured = [...bombCards, ...tableMonthCards];
  for (const cardId of captured) {
    const card = getCard(cardId);
    switch (card.type) {
      case 'gwang': player.captured.gwang.push(cardId); break;
      case 'yeol': player.captured.yeol.push(cardId); break;
      case 'tti': player.captured.tti.push(cardId); break;
      case 'pi': player.captured.pi.push(cardId); break;
    }
  }

  // 쓸 체크
  const isSseul = checkSseul(tableCards);
  if (isSseul) player.sseulCount++;

  const events: SpecialEvent[] = ['bomb'];
  if (isSseul) events.push('sseul');

  // 이벤트 패널티: 폭탄 + 쓸 → 상대에게 피 빼앗기
  const penalty = calcEventPenalty(events);
  for (let i = 0; i < PLAYER_COUNT; i++) {
    if (i === state.turnIndex) continue;
    for (let p = 0; p < penalty; p++) {
      if (players[i].captured.pi.length > 0) {
        const stolen = players[i].captured.pi.pop()!;
        player.captured.pi.push(stolen);
      }
    }
  }

  // 점수 체크
  const score = calculateScore(player.captured, player.goCount);
  if (score.baseScore >= MIN_SCORE_TO_STOP) {
    return {
      ...state,
      players,
      tableCards,
      phase: 'go-stop-decision',
      goStopPlayer: state.turnIndex,
      lastEvent: 'bomb',
      lastCaptured: captured,
    };
  }

  // 폭탄 후에도 손패 카드를 내야 함 → play-hand 유지
  return {
    ...state,
    players,
    tableCards,
    phase: 'play-hand',
    lastEvent: 'bomb',
    lastCaptured: captured,
  };
}

/** 다음 턴으로 이동 */
export function advanceTurn(state: GameState): GameState {
  let nextIndex = (state.turnIndex + 1) % PLAYER_COUNT;

  // 손패가 빈 플레이어는 스킵 (폭탄으로 인한 조기 소진 대비)
  let tries = 0;
  while (state.players[nextIndex].hand.length === 0 && tries < PLAYER_COUNT) {
    nextIndex = (nextIndex + 1) % PLAYER_COUNT;
    tries++;
  }

  // 모든 플레이어 손패가 비면 게임 종료
  if (tries >= PLAYER_COUNT) {
    return resolveGameEnd(state, state.players);
  }

  return {
    ...state,
    phase: 'play-hand',
    turnIndex: nextIndex,
    turnCount: state.turnCount + 1,
    currentTurnAction: null,
    pendingMatchOptions: [],
  };
}

/** 게임 종료 처리 (뽑을 패 소진) */
function resolveGameEnd(state: GameState, players: PlayerState[]): GameState {
  // 최고 점수 플레이어 찾기
  let bestScore = -1;
  let bestPlayer = -1;

  for (let i = 0; i < PLAYER_COUNT; i++) {
    const score = calculateScore(players[i].captured, players[i].goCount);
    if (score.baseScore > bestScore) {
      bestScore = score.baseScore;
      bestPlayer = i;
    }
  }

  if (bestScore >= MIN_SCORE_TO_STOP) {
    const result = calculateScore(players[bestPlayer].captured, players[bestPlayer].goCount);
    return {
      ...state,
      players,
      phase: 'game-over',
      winner: bestPlayer,
      gameResult: result,
    };
  }

  // 아무도 점수 못 넘기면 무승부
  return {
    ...state,
    players,
    phase: 'game-over',
    winner: null,
    gameResult: null,
  };
}
