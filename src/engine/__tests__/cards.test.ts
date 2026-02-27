import { describe, it, expect } from 'vitest';
import { getAllCards, getCard, getCardsByMonth, getCardsByType, countPiValue, isGwang, isBiGwang, isGodoriTarget } from '../cards';
import { Month } from '../types';

describe('카드 데이터', () => {
  it('총 48장이 존재한다', () => {
    expect(getAllCards()).toHaveLength(48);
  });

  it('월별 4장씩 12개월 = 48장', () => {
    for (let m = 1; m <= 12; m++) {
      const cards = getCardsByMonth(m as Month);
      expect(cards).toHaveLength(4);
      cards.forEach(c => expect(c.month).toBe(m));
    }
  });

  it('CardId 0~47로 조회 가능하다', () => {
    for (let id = 0; id < 48; id++) {
      const card = getCard(id);
      expect(card.id).toBe(id);
      expect(card.month).toBeGreaterThanOrEqual(1);
      expect(card.month).toBeLessThanOrEqual(12);
    }
  });
});

describe('카드 타입별 개수', () => {
  it('광 5장', () => {
    expect(getCardsByType('gwang')).toHaveLength(5);
  });

  it('열끗 9장', () => {
    expect(getCardsByType('yeol')).toHaveLength(9);
  });

  it('띠 10장', () => {
    expect(getCardsByType('tti')).toHaveLength(10);
  });

  it('피 24장', () => {
    expect(getCardsByType('pi')).toHaveLength(24);
  });
});

describe('광 카드', () => {
  it('1, 3, 8, 11, 12월에 광이 있다', () => {
    const gwangCards = getCardsByType('gwang');
    const months = gwangCards.map(c => c.month).sort((a, b) => a - b);
    expect(months).toEqual([1, 3, 8, 11, 12]);
  });

  it('isGwang이 광 카드에 대해 true를 반환한다', () => {
    const gwangCards = getCardsByType('gwang');
    gwangCards.forEach(c => expect(isGwang(c.id)).toBe(true));
  });

  it('비광은 12월 광뿐이다', () => {
    const gwangCards = getCardsByType('gwang');
    const biGwang = gwangCards.filter(c => isBiGwang(c.id));
    expect(biGwang).toHaveLength(1);
    expect(biGwang[0].month).toBe(12);
  });
});

describe('고도리 대상', () => {
  it('2, 4, 8월 열끗이 고도리 대상이다', () => {
    const allCards = getAllCards();
    const godoriTargets = allCards.filter(c => isGodoriTarget(c.id));
    expect(godoriTargets).toHaveLength(3);
    const months = godoriTargets.map(c => c.month).sort((a, b) => a - b);
    expect(months).toEqual([2, 4, 8]);
  });

  it('다른 열끗은 고도리 대상이 아니다', () => {
    const yeolCards = getCardsByType('yeol');
    const nonGodori = yeolCards.filter(c => !isGodoriTarget(c.id));
    nonGodori.forEach(c => {
      expect([2, 4, 8]).not.toContain(c.month);
    });
  });
});

describe('쌍피 카운트', () => {
  it('일반 피는 1장으로 카운트', () => {
    // 1월 피 2장 (id: 2, 3)
    expect(countPiValue([2, 3])).toBe(2);
  });

  it('쌍피는 2장으로 카운트', () => {
    const allCards = getAllCards();
    const doublePis = allCards.filter(c => c.isDoublePi);
    expect(doublePis.length).toBeGreaterThanOrEqual(1);

    // 쌍피 1장만 넣으면 2로 카운트
    expect(countPiValue([doublePis[0].id])).toBe(2);
  });

  it('일반피 + 쌍피 혼합 카운트', () => {
    const allCards = getAllCards();
    const doublePi = allCards.find(c => c.isDoublePi)!;
    // 일반피 2장 + 쌍피 1장 = 4
    expect(countPiValue([2, 3, doublePi.id])).toBe(4);
  });
});

describe('띠 유형', () => {
  it('홍단은 1, 2, 3월 띠', () => {
    const ttiCards = getCardsByType('tti');
    const hongdan = ttiCards.filter(c => c.ribbonType === 'hongdan');
    expect(hongdan).toHaveLength(3);
    const months = hongdan.map(c => c.month).sort((a, b) => a - b);
    expect(months).toEqual([1, 2, 3]);
  });

  it('청단은 6, 9, 10월 띠', () => {
    const ttiCards = getCardsByType('tti');
    const cheongdan = ttiCards.filter(c => c.ribbonType === 'cheongdan');
    expect(cheongdan).toHaveLength(3);
    const months = cheongdan.map(c => c.month).sort((a, b) => a - b);
    expect(months).toEqual([6, 9, 10]);
  });

  it('초단은 4, 5, 7월 띠', () => {
    const ttiCards = getCardsByType('tti');
    const chodan = ttiCards.filter(c => c.ribbonType === 'chodan');
    expect(chodan).toHaveLength(3);
    const months = chodan.map(c => c.month).sort((a, b) => a - b);
    expect(months).toEqual([4, 5, 7]);
  });
});
