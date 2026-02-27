/**
 * 전적 기록 (localStorage)
 */
export interface GameRecord {
  date: string;
  result: 'win' | 'lose' | 'draw';
  score: number;
  comboNames: string[];
  turns: number;
  difficulty: string;
}

const STORAGE_KEY = 'gostop-history';

export function getHistory(): GameRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: GameRecord) {
  const history = getHistory();
  history.unshift(record);
  if (history.length > 100) history.length = 100;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getStats() {
  const history = getHistory();
  const total = history.length;
  const wins = history.filter(r => r.result === 'win').length;
  const losses = history.filter(r => r.result === 'lose').length;
  const draws = history.filter(r => r.result === 'draw').length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const avgScore = total > 0 ? Math.round(history.reduce((s, r) => s + r.score, 0) / total) : 0;
  return { total, wins, losses, draws, winRate, avgScore };
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
