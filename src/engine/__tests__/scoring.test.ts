import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoring';
import { CapturedCards } from '../types';
import { getAllCards } from '../cards';

/** 빈 먹은 카드 */
function empty(): CapturedCards {
  return { gwang: [], yeol: [], tti: [], pi: [] };
}

/** CardId를 월 기반으로 빠르게 찾기 */
function findByMonth(month: number, type: string, index = 0) {
  const cards = getAllCards();
  const matches = cards.filter(c => c.month === month && c.type === type);
  return matches[index]?.id ?? -1;
}

// 광 카드 ID 조회
const gwang1 = findByMonth(1, 'gwang');   // 1월 광
const gwang3 = findByMonth(3, 'gwang');   // 3월 광
const gwang8 = findByMonth(8, 'gwang');   // 8월 광
const gwang11 = findByMonth(11, 'gwang'); // 11월 광
const gwang12 = findByMonth(12, 'gwang'); // 12월 비광

describe('광 점수', () => {
  it('오광 = 15점', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8, gwang11, gwang12];
    const result = calculateScore(cap);
    expect(result.gwangScore).toBe(15);
    expect(result.combos.find(c => c.id === 'ohgwang')).toBeTruthy();
  });

  it('사광 (비광 제외) = 4점', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8, gwang11];
    const result = calculateScore(cap);
    expect(result.gwangScore).toBe(4);
    expect(result.combos.find(c => c.id === 'sagwang')).toBeTruthy();
  });

  it('비사광 (비광 포함) = 4점', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8, gwang12];
    const result = calculateScore(cap);
    expect(result.gwangScore).toBe(4);
    expect(result.combos.find(c => c.id === 'bi-sagwang')).toBeTruthy();
  });

  it('삼광 (비광 제외) = 3점', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8];
    const result = calculateScore(cap);
    expect(result.gwangScore).toBe(3);
    expect(result.combos.find(c => c.id === 'samgwang')).toBeTruthy();
  });

  it('비삼광 (비광 포함) = 2점', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang12];
    const result = calculateScore(cap);
    expect(result.gwangScore).toBe(2);
    expect(result.combos.find(c => c.id === 'bi-samgwang')).toBeTruthy();
  });

  it('광 2장 이하 = 0점', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3];
    const result = calculateScore(cap);
    expect(result.gwangScore).toBe(0);
  });
});

describe('띠 점수', () => {
  it('홍단 = 3점', () => {
    const cap = empty();
    cap.tti = [
      findByMonth(1, 'tti'),
      findByMonth(2, 'tti'),
      findByMonth(3, 'tti'),
    ];
    const result = calculateScore(cap);
    expect(result.ttiScore).toBe(3);
    expect(result.combos.find(c => c.id === 'hongdan')).toBeTruthy();
  });

  it('청단 = 3점', () => {
    const cap = empty();
    cap.tti = [
      findByMonth(6, 'tti'),
      findByMonth(9, 'tti'),
      findByMonth(10, 'tti'),
    ];
    const result = calculateScore(cap);
    expect(result.ttiScore).toBe(3);
    expect(result.combos.find(c => c.id === 'cheongdan')).toBeTruthy();
  });

  it('초단 = 3점', () => {
    const cap = empty();
    cap.tti = [
      findByMonth(4, 'tti'),
      findByMonth(5, 'tti'),
      findByMonth(7, 'tti'),
    ];
    const result = calculateScore(cap);
    expect(result.ttiScore).toBe(3);
    expect(result.combos.find(c => c.id === 'chodan')).toBeTruthy();
  });

  it('띠 5장 = 세트점수 + 추가 1점', () => {
    const cap = empty();
    cap.tti = [
      findByMonth(1, 'tti'),
      findByMonth(2, 'tti'),
      findByMonth(3, 'tti'),
      findByMonth(4, 'tti'),
      findByMonth(5, 'tti'),
    ];
    const result = calculateScore(cap);
    // 홍단 3점 + 띠 5장 추가 1점 = 4점
    expect(result.ttiScore).toBe(4);
  });
});

describe('열끗 점수', () => {
  it('고도리 = 5점', () => {
    const cap = empty();
    cap.yeol = [
      findByMonth(2, 'yeol'),
      findByMonth(4, 'yeol'),
      findByMonth(8, 'yeol'),
    ];
    const result = calculateScore(cap);
    expect(result.yeolScore).toBe(5);
    expect(result.combos.find(c => c.id === 'godori')).toBeTruthy();
  });

  it('열끗 5장 = 고도리 5점 + 추가 1점', () => {
    const cap = empty();
    cap.yeol = [
      findByMonth(2, 'yeol'),
      findByMonth(4, 'yeol'),
      findByMonth(8, 'yeol'),
      findByMonth(5, 'yeol'),
      findByMonth(6, 'yeol'),
    ];
    const result = calculateScore(cap);
    // 고도리 5점 + 열끗 5장 추가 1점 = 6점
    expect(result.yeolScore).toBe(6);
  });
});

describe('피 점수', () => {
  it('피 10장 = 1점', () => {
    const allCards = getAllCards();
    const piCards = allCards.filter(c => c.type === 'pi' && !c.isDoublePi);
    const cap = empty();
    cap.pi = piCards.slice(0, 10).map(c => c.id);
    const result = calculateScore(cap);
    expect(result.piScore).toBe(1);
  });

  it('피 11장 = 2점', () => {
    const allCards = getAllCards();
    const piCards = allCards.filter(c => c.type === 'pi' && !c.isDoublePi);
    const cap = empty();
    cap.pi = piCards.slice(0, 11).map(c => c.id);
    const result = calculateScore(cap);
    expect(result.piScore).toBe(2);
  });

  it('피 9장 = 0점', () => {
    const allCards = getAllCards();
    const piCards = allCards.filter(c => c.type === 'pi' && !c.isDoublePi);
    const cap = empty();
    cap.pi = piCards.slice(0, 9).map(c => c.id);
    const result = calculateScore(cap);
    expect(result.piScore).toBe(0);
  });
});

describe('고 배수', () => {
  it('goCount=1이면 점수 ×2', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8];
    const result = calculateScore(cap, 1);
    expect(result.goMultiplier).toBe(2);
    expect(result.finalScore).toBe(3 * 2);
  });

  it('goCount=2이면 점수 ×4', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8];
    const result = calculateScore(cap, 2);
    expect(result.goMultiplier).toBe(4);
    expect(result.finalScore).toBe(3 * 4);
  });

  it('goCount=0이면 배수 없음', () => {
    const cap = empty();
    cap.gwang = [gwang1, gwang3, gwang8];
    const result = calculateScore(cap, 0);
    expect(result.goMultiplier).toBe(1);
    expect(result.finalScore).toBe(3);
  });
});
