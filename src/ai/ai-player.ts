/**
 * 고스톱 AI 플레이어
 * Easy / Normal / Hard 3단계
 */
import { GameState, CardId, Month } from '@/engine/types';
import { getCardMonth, getCardType, isGodoriTarget, countPiValue } from '@/engine/cards';
import { checkBombOptions } from '@/engine/match-resolver';
import { calculateScore } from '@/engine/scoring';

// =================== 공개 API ===================

/** AI가 손패에서 카드 선택 */
export function aiChooseHandCard(state: GameState, playerId: number): CardId {
  const hand = state.players[playerId].hand;
  if (hand.length === 0) throw new Error('AI 손패 비어있음');

  switch (state.difficulty) {
    case 'easy': return easyChooseCard(hand);
    case 'normal': return normalChooseCard(hand, state);
    case 'hard': return hardChooseCard(hand, state, playerId);
    default: return easyChooseCard(hand);
  }
}

/** AI가 바닥에서 매칭 카드 선택 (2장 중 1장) */
export function aiSelectMatch(
  state: GameState,
  playerId: number,
  options: CardId[],
): CardId {
  switch (state.difficulty) {
    case 'easy': return options[Math.floor(Math.random() * options.length)];
    case 'normal':
    case 'hard':
      return selectBestMatch(options, state.players[playerId]);
    default: return options[0];
  }
}

/** AI가 고/스톱 결정 */
export function aiGoStopDecision(
  state: GameState,
  playerId: number,
): 'go' | 'stop' {
  const player = state.players[playerId];
  const score = calculateScore(player.captured, player.goCount);

  switch (state.difficulty) {
    case 'easy':
      return 'stop'; // Easy는 항상 스톱

    case 'normal': {
      if (score.baseScore >= 7) return 'stop';
      if (player.goCount >= 2) return 'stop';
      if (score.baseScore >= 3 && player.hand.length <= 2) return 'stop';
      return Math.random() < 0.4 ? 'go' : 'stop';
    }

    case 'hard': {
      // 남은 카드 수 고려
      const remaining = state.drawPile.length;
      if (remaining <= 3) return 'stop';
      if (player.goCount >= 3) return 'stop';
      if (score.baseScore >= 10) return 'stop';

      // 상대 점수 위협 분석
      const opponents = state.players.filter((_, i) => i !== playerId);
      const maxOpponentPi = Math.max(...opponents.map(o => countPiValue(o.captured.pi)));
      if (maxOpponentPi >= 8) return 'stop'; // 상대 피가 많으면 위험

      // 광 추가 가능성
      if (player.captured.gwang.length >= 3 && score.baseScore < 7) return 'go';

      return score.baseScore >= 5 ? 'stop' : 'go';
    }

    default: return 'stop';
  }
}

/** AI가 폭탄 사용 여부 결정 */
export function aiShouldBomb(
  state: GameState,
  playerId: number,
): Month | null {
  if (state.difficulty === 'easy') return null;

  const bombs = checkBombOptions(
    state.players[playerId].hand,
    state.tableCards,
  );

  if (bombs.length === 0) return null;

  // Normal: 광이나 열끗이 포함된 월만 폭탄
  for (const month of bombs) {
    const tableCards = state.tableCards.get(month) || [];
    const hasHighValue = tableCards.some(id => {
      const type = getCardType(id);
      return type === 'gwang' || type === 'yeol';
    });
    if (hasHighValue) return month;
  }

  // Hard: 쓸 기회도 고려
  if (state.difficulty === 'hard') {
    // 바닥 카드가 적으면 폭탄으로 쓸 가능
    let totalTableCards = 0;
    state.tableCards.forEach(cards => {
      totalTableCards += cards.length;
    });
    if (totalTableCards <= 4 && bombs.length > 0) return bombs[0];
  }

  return null;
}

// =================== Easy ===================

function easyChooseCard(hand: CardId[]): CardId {
  return hand[Math.floor(Math.random() * hand.length)];
}

// =================== Normal ===================

function normalChooseCard(hand: CardId[], state: GameState): CardId {
  // 1순위: 바닥에 매칭 가능한 카드 (먹을 수 있는)
  const matchable: { id: CardId; priority: number }[] = [];

  for (const cardId of hand) {
    const month = getCardMonth(cardId);
    const tableMonthCards = state.tableCards.get(month) || [];

    if (tableMonthCards.length > 0 && tableMonthCards.length !== 2) {
      // 매칭 가능 (1장=쪽, 3장=따닥)
      // 먹을 수 있는 카드의 가치로 우선순위
      let value = 0;
      for (const tid of tableMonthCards) {
        const type = getCardType(tid);
        if (type === 'gwang') value += 10;
        else if (type === 'yeol') value += 5;
        else if (type === 'tti') value += 3;
        else value += 1;
      }
      matchable.push({ id: cardId, priority: value });
    } else if (tableMonthCards.length === 2) {
      // 선택해야 하므로 매칭은 가능
      let value = 0;
      for (const tid of tableMonthCards) {
        const type = getCardType(tid);
        if (type === 'gwang') value += 10;
        else if (type === 'yeol') value += 5;
        else if (type === 'tti') value += 3;
        else value += 1;
      }
      matchable.push({ id: cardId, priority: value });
    }
  }

  if (matchable.length > 0) {
    matchable.sort((a, b) => b.priority - a.priority);
    return matchable[0].id;
  }

  // 매칭 불가 → 가장 가치 낮은 카드 버리기
  const ranked = hand.map(id => ({
    id,
    value: getCardValue(id),
  }));
  ranked.sort((a, b) => a.value - b.value);
  return ranked[0].id;
}

// =================== Hard ===================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hardChooseCard(hand: CardId[], state: GameState, playerId: number): CardId {
  // 카드 카운팅: 이미 나온 카드 추적
  const usedMonths = new Map<Month, number>();
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    for (const id of [...p.captured.gwang, ...p.captured.yeol, ...p.captured.tti, ...p.captured.pi]) {
      const m = getCardMonth(id);
      usedMonths.set(m, (usedMonths.get(m) || 0) + 1);
    }
  }
  state.tableCards.forEach(cards => {
    for (const id of cards) {
      const m = getCardMonth(id);
      usedMonths.set(m, (usedMonths.get(m) || 0) + 1);
    }
  });

  let bestCard = hand[0];
  let bestScore = -Infinity;

  for (const cardId of hand) {
    const month = getCardMonth(cardId);
    const tableMonthCards = state.tableCards.get(month) || [];
    let score = 0;

    // 매칭 가능하면 점수 추가
    if (tableMonthCards.length === 1 || tableMonthCards.length === 3) {
      for (const tid of tableMonthCards) {
        score += getCardValue(tid);
      }
      score += 5; // 매칭 보너스
    } else if (tableMonthCards.length === 2) {
      // 선택 매칭도 OK
      const bestTarget = Math.max(...tableMonthCards.map(tid => getCardValue(tid)));
      score += bestTarget + 3;
    }

    // 매칭 불가 → 남은 같은 월 카드 수 고려 (나중에 먹힐 확률)
    if (tableMonthCards.length === 0) {
      const used = usedMonths.get(month) || 0;
      const handSameMonth = hand.filter(id => getCardMonth(id) === month).length;
      const totalKnown = used + handSameMonth;
      const remaining = 4 - totalKnown;
      // 상대가 같은 월을 갖고 있을 확률이 높으면 위험 → 낮은 점수
      score = -getCardValue(cardId) - remaining * 2;
    }

    // 고도리 대상 보호: 바닥에 놓으면 상대에게 먹힐 위험
    // 매칭 가능할 때는 오히려 적극적으로 먹어야 함
    if (isGodoriTarget(cardId) && tableMonthCards.length === 0) {
      score -= 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCard = cardId;
    }
  }

  return bestCard;
}

// =================== 유틸 ===================

function getCardValue(id: CardId): number {
  const type = getCardType(id);
  switch (type) {
    case 'gwang': return 20;
    case 'yeol': return 10;
    case 'tti': return 5;
    case 'pi': return 1;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function selectBestMatch(options: CardId[], player: { captured: { gwang: CardId[]; yeol: CardId[]; tti: CardId[]; pi: CardId[] } }): CardId {
  // 가장 높은 가치의 카드 선택
  let best = options[0];
  let bestValue = getCardValue(options[0]);

  for (let i = 1; i < options.length; i++) {
    const v = getCardValue(options[i]);
    if (v > bestValue) {
      bestValue = v;
      best = options[i];
    }
  }

  return best;
}
