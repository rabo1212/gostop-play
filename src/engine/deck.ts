/**
 * 덱 관리: 셔플, 배패
 */
import { CardId, Month, PlayerState, CapturedCards } from './types';
import { getCardMonth } from './cards';
import { DEAL_HAND_COUNT, DEAL_TABLE_COUNT, PLAYER_COUNT } from '@/lib/constants';

/** Fisher-Yates 셔플 */
export function shuffle(cards: CardId[]): CardId[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 0~47 카드 ID 배열 생성 */
export function createDeck(): CardId[] {
  return Array.from({ length: 48 }, (_, i) => i);
}

/** 빈 먹은 카드 */
function emptyCaptured(): CapturedCards {
  return { gwang: [], yeol: [], tti: [], pi: [] };
}

/** 배패 결과 */
export interface DealResult {
  players: PlayerState[];
  tableCards: Map<Month, CardId[]>;
  drawPile: CardId[];
}

/**
 * 3인 배패
 * 각 7장 손패 + 바닥 6장 + 나머지 뽑을 더미
 */
export function dealCards(): DealResult {
  const deck = shuffle(createDeck());
  let idx = 0;

  // 3명에게 각 7장
  const players: PlayerState[] = [];
  for (let i = 0; i < PLAYER_COUNT; i++) {
    const hand = deck.slice(idx, idx + DEAL_HAND_COUNT);
    idx += DEAL_HAND_COUNT;
    players.push({
      id: i,
      name: i === 0 ? '나' : `AI ${i}`,
      hand: hand.sort((a, b) => a - b), // 월 순서 정렬
      captured: emptyCaptured(),
      goCount: 0,
      sseulCount: 0,
      isAI: i !== 0,
    });
  }

  // 바닥 6장
  const tableSlice = deck.slice(idx, idx + DEAL_TABLE_COUNT);
  idx += DEAL_TABLE_COUNT;

  const tableCards = new Map<Month, CardId[]>();
  for (const cardId of tableSlice) {
    const month = getCardMonth(cardId);
    if (!tableCards.has(month)) {
      tableCards.set(month, []);
    }
    tableCards.get(month)!.push(cardId);
  }

  // 나머지 뽑을 패 더미
  const drawPile = deck.slice(idx);

  return { players, tableCards, drawPile };
}
