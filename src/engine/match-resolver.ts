/**
 * 월별 매칭 로직
 * 손패/뽑은 카드와 바닥 카드의 매칭 규칙
 */
import { CardId, Month } from './types';
import { getCardMonth } from './cards';

/** 매칭 결과 유형 */
export type MatchResult =
  | { type: 'no-match' }                          // 같은 월 0장 → 바닥에 놓기
  | { type: 'jjok'; target: CardId }               // 같은 월 1장 → 바로 먹기
  | { type: 'select'; options: CardId[] }           // 같은 월 2장 → 선택 필요
  | { type: 'ttadak'; targets: CardId[] };          // 같은 월 3장 → 4장 전부 먹기

/**
 * 카드를 내거나 뽑았을 때 바닥과의 매칭 판정
 * @param tableCards 현재 바닥 카드 (월별 그룹)
 * @param playedCardId 내거나 뽑은 카드 ID
 */
export function resolveMatch(
  tableCards: Map<Month, CardId[]>,
  playedCardId: CardId,
): MatchResult {
  const month = getCardMonth(playedCardId);
  const onTable = tableCards.get(month) || [];

  switch (onTable.length) {
    case 0:
      return { type: 'no-match' };
    case 1:
      return { type: 'jjok', target: onTable[0] };
    case 2:
      return { type: 'select', options: [...onTable] };
    case 3:
      return { type: 'ttadak', targets: [...onTable] };
    default:
      // 4장 이상은 불가 (48장 중 월별 최대 4장)
      return { type: 'ttadak', targets: [...onTable] };
  }
}

/**
 * 매칭 후 바닥에서 카드 제거 + 먹은 카드 목록 반환
 * @returns [새 바닥 상태, 먹은 카드들 (내 카드 포함)]
 */
export function executeMatch(
  tableCards: Map<Month, CardId[]>,
  playedCardId: CardId,
  matchResult: MatchResult,
  selectedTarget?: CardId,
): { newTable: Map<Month, CardId[]>; captured: CardId[] } {
  const month = getCardMonth(playedCardId);
  const newTable = new Map(tableCards);

  switch (matchResult.type) {
    case 'no-match': {
      // 바닥에 놓기
      const existing = newTable.get(month) || [];
      newTable.set(month, [...existing, playedCardId]);
      return { newTable, captured: [] };
    }

    case 'jjok': {
      // 1장 매칭 → 둘 다 먹기
      newTable.delete(month);
      return { newTable, captured: [playedCardId, matchResult.target] };
    }

    case 'select': {
      // 2장 중 1장 선택 → 선택한 것만 먹기
      if (selectedTarget === undefined) {
        throw new Error('select 매칭에서 대상을 선택해야 합니다');
      }
      const remaining = matchResult.options.filter(id => id !== selectedTarget);
      if (remaining.length > 0) {
        newTable.set(month, remaining);
      } else {
        newTable.delete(month);
      }
      return { newTable, captured: [playedCardId, selectedTarget] };
    }

    case 'ttadak': {
      // 3장 + 내 카드 = 4장 전부 먹기
      newTable.delete(month);
      return { newTable, captured: [playedCardId, ...matchResult.targets] };
    }
  }
}

/**
 * 폭탄 가능 여부 체크
 * 손패에 같은 월 3장 + 바닥에 해당 월 1장 이상
 */
export function checkBombOptions(
  hand: CardId[],
  tableCards: Map<Month, CardId[]>,
): Month[] {
  // 손패에서 월별 카운트
  const monthCount = new Map<Month, number>();
  for (const id of hand) {
    const m = getCardMonth(id);
    monthCount.set(m, (monthCount.get(m) || 0) + 1);
  }

  const bombs: Month[] = [];
  monthCount.forEach((count, month) => {
    if (count >= 3) {
      const onTable = tableCards.get(month) || [];
      if (onTable.length >= 1) {
        bombs.push(month);
      }
    }
  });
  return bombs;
}

/**
 * 뻑 상태 체크: 바닥에 같은 월 3장 쌓인 것
 */
export function checkPpuk(tableCards: Map<Month, CardId[]>): Month[] {
  const ppukMonths: Month[] = [];
  tableCards.forEach((cards, month) => {
    if (cards.length >= 3) {
      ppukMonths.push(month);
    }
  });
  return ppukMonths;
}
