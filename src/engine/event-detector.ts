/**
 * 특수 이벤트 감지
 */
import { CardId, Month, SpecialEvent } from './types';

/**
 * 쓸(판쓸이) 체크: 바닥에 카드가 하나도 없으면 쓸
 */
export function checkSseul(
  tableCards: Map<Month, CardId[]>,
): boolean {
  let hasCards = false;
  tableCards.forEach(cards => {
    if (cards.length > 0) hasCards = true;
  });
  if (hasCards) return false;
  return true;
}

/**
 * 턴 이벤트 종합 판정
 * 매칭 결과와 바닥 상태를 종합하여 이벤트 목록 반환
 */
export function detectTurnEvents(
  matchType: 'no-match' | 'jjok' | 'select' | 'ttadak',
  isSseul: boolean,
  isBomb: boolean,
): SpecialEvent[] {
  const events: SpecialEvent[] = [];

  if (isBomb) events.push('bomb');
  if (matchType === 'ttadak') events.push('ttadak');
  if (isSseul) events.push('sseul');
  if (matchType === 'jjok' && !isBomb && !isSseul) events.push('jjok');

  if (events.length === 0) events.push('none');
  return events;
}

/**
 * 이벤트로 인한 피 패널티 계산
 * 따닥/폭탄/쓸 → 상대방에게 피 1장씩 받음
 */
export function calcEventPenalty(events: SpecialEvent[]): number {
  let penalty = 0;
  for (const e of events) {
    if (e === 'ttadak' || e === 'bomb' || e === 'sseul') {
      penalty++;
    }
  }
  return penalty;
}
