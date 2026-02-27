import { describe, it, expect } from 'vitest';
import { resolveMatch, executeMatch, checkBombOptions } from '../match-resolver';
import { Month, CardId } from '../types';

/** 빈 바닥 */
function emptyTable(): Map<Month, CardId[]> {
  return new Map();
}

// 1월 카드 ID: 0, 1, 2, 3
// 2월 카드 ID: 4, 5, 6, 7

describe('resolveMatch', () => {
  it('바닥에 같은 월 0장 → no-match', () => {
    const table = emptyTable();
    const result = resolveMatch(table, 0); // 1월 카드
    expect(result.type).toBe('no-match');
  });

  it('바닥에 같은 월 1장 → jjok', () => {
    const table = emptyTable();
    table.set(1, [1]); // 1월 카드 1장
    const result = resolveMatch(table, 0); // 1월 카드 낸다
    expect(result.type).toBe('jjok');
    if (result.type === 'jjok') {
      expect(result.target).toBe(1);
    }
  });

  it('바닥에 같은 월 2장 → select (options 2개)', () => {
    const table = emptyTable();
    table.set(1, [1, 2]); // 1월 카드 2장
    const result = resolveMatch(table, 0); // 1월 카드 낸다
    expect(result.type).toBe('select');
    if (result.type === 'select') {
      expect(result.options).toHaveLength(2);
      expect(result.options).toContain(1);
      expect(result.options).toContain(2);
    }
  });

  it('바닥에 같은 월 3장 → ttadak (전부 먹기)', () => {
    const table = emptyTable();
    table.set(1, [1, 2, 3]); // 1월 카드 3장
    const result = resolveMatch(table, 0); // 1월 카드 낸다
    expect(result.type).toBe('ttadak');
    if (result.type === 'ttadak') {
      expect(result.targets).toHaveLength(3);
    }
  });

  it('다른 월 카드는 매칭되지 않는다', () => {
    const table = emptyTable();
    table.set(1, [0, 1]); // 1월 2장
    const result = resolveMatch(table, 4); // 2월 카드 낸다
    expect(result.type).toBe('no-match');
  });
});

describe('executeMatch', () => {
  it('no-match → 바닥에 카드 놓기', () => {
    const table = emptyTable();
    const matchResult = resolveMatch(table, 0);
    const { newTable, captured } = executeMatch(table, 0, matchResult);
    expect(captured).toHaveLength(0);
    expect(newTable.get(1)).toContain(0);
  });

  it('jjok → 두 장 먹기', () => {
    const table = emptyTable();
    table.set(1, [1]);
    const matchResult = resolveMatch(table, 0);
    const { newTable, captured } = executeMatch(table, 0, matchResult);
    expect(captured).toHaveLength(2);
    expect(captured).toContain(0);
    expect(captured).toContain(1);
    expect(newTable.has(1)).toBe(false);
  });

  it('select → 선택한 카드만 먹기', () => {
    const table = emptyTable();
    table.set(1, [1, 2]);
    const matchResult = resolveMatch(table, 0);
    const { newTable, captured } = executeMatch(table, 0, matchResult, 1);
    expect(captured).toHaveLength(2);
    expect(captured).toContain(0);
    expect(captured).toContain(1);
    // 선택 안 된 카드는 바닥에 남음
    expect(newTable.get(1)).toEqual([2]);
  });

  it('select에서 대상 없으면 에러', () => {
    const table = emptyTable();
    table.set(1, [1, 2]);
    const matchResult = resolveMatch(table, 0);
    expect(() => executeMatch(table, 0, matchResult)).toThrow();
  });

  it('ttadak → 4장 전부 먹기', () => {
    const table = emptyTable();
    table.set(1, [1, 2, 3]);
    const matchResult = resolveMatch(table, 0);
    const { newTable, captured } = executeMatch(table, 0, matchResult);
    expect(captured).toHaveLength(4);
    expect(captured).toContain(0);
    expect(captured).toContain(1);
    expect(captured).toContain(2);
    expect(captured).toContain(3);
    expect(newTable.has(1)).toBe(false);
  });
});

describe('checkBombOptions', () => {
  it('손패에 같은 월 3장 + 바닥 1장 → 폭탄 가능', () => {
    const hand: CardId[] = [0, 1, 2, 4]; // 1월 3장 + 2월 1장
    const table = emptyTable();
    table.set(1, [3]); // 바닥에 1월 1장
    const bombs = checkBombOptions(hand, table);
    expect(bombs).toContain(1);
  });

  it('손패에 같은 월 3장이지만 바닥에 해당 월 없으면 → 불가', () => {
    const hand: CardId[] = [0, 1, 2]; // 1월 3장
    const table = emptyTable();
    // 바닥에 1월 없음
    const bombs = checkBombOptions(hand, table);
    expect(bombs).toHaveLength(0);
  });

  it('손패에 같은 월 2장 → 폭탄 불가', () => {
    const hand: CardId[] = [0, 1, 4, 5]; // 1월 2장 + 2월 2장
    const table = emptyTable();
    table.set(1, [2]);
    table.set(2, [6]);
    const bombs = checkBombOptions(hand, table);
    expect(bombs).toHaveLength(0);
  });

  it('여러 월에서 폭탄 가능할 수 있다', () => {
    const hand: CardId[] = [0, 1, 2, 4, 5, 6]; // 1월 3장 + 2월 3장
    const table = emptyTable();
    table.set(1, [3]);
    table.set(2, [7]);
    const bombs = checkBombOptions(hand, table);
    expect(bombs).toHaveLength(2);
    expect(bombs).toContain(1);
    expect(bombs).toContain(2);
  });
});
