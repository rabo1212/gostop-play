/**
 * 화투 카드 생성 및 조회 유틸리티
 */
import { Card, CardId, Month, CardType } from './types';
import { CARD_DATA } from '@/lib/constants';

/** 모든 48장 카드 (모듈 로드 시 1회 생성) */
const ALL_CARDS: Card[] = CARD_DATA.map((data, id) => ({
  id,
  ...data,
}));

/** CardId로 카드 조회 */
export function getCard(id: CardId): Card {
  return ALL_CARDS[id];
}

/** 전체 카드 배열 반환 */
export function getAllCards(): Card[] {
  return ALL_CARDS;
}

/** 특정 월의 카드들 반환 */
export function getCardsByMonth(month: Month): Card[] {
  return ALL_CARDS.filter(c => c.month === month);
}

/** 특정 타입의 카드들 반환 */
export function getCardsByType(type: CardType): Card[] {
  return ALL_CARDS.filter(c => c.type === type);
}

/** CardId의 월 조회 */
export function getCardMonth(id: CardId): Month {
  return ALL_CARDS[id].month;
}

/** CardId의 타입 조회 */
export function getCardType(id: CardId): CardType {
  return ALL_CARDS[id].type;
}

/**
 * 피 카드들의 피 카운트 계산
 * 쌍피는 2장으로 카운트
 */
export function countPiValue(piCardIds: CardId[]): number {
  let count = 0;
  for (const id of piCardIds) {
    const card = ALL_CARDS[id];
    count += card.isDoublePi ? 2 : 1;
  }
  return count;
}

/** 광 카드인지 확인 */
export function isGwang(id: CardId): boolean {
  return ALL_CARDS[id].type === 'gwang';
}

/** 비광인지 확인 (12월 광) */
export function isBiGwang(id: CardId): boolean {
  return ALL_CARDS[id].isBiGwang;
}

/** 고도리 대상 열끗인지 확인 (2, 4, 8월 열끗) */
export function isGodoriTarget(id: CardId): boolean {
  const card = ALL_CARDS[id];
  return card.type === 'yeol' && [2, 4, 8].includes(card.month);
}
