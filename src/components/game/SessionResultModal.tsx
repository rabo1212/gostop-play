'use client';

import { RoundResult } from '@/engine/session';

interface SessionResultModalProps {
  ranking: { playerId: number; score: number }[];
  roundHistory: RoundResult[];
  playerNames: string[];
  onRestart: () => void;
  onBackToMenu: () => void;
}

export default function SessionResultModal({
  ranking,
  roundHistory,
  playerNames,
  onRestart,
  onBackToMenu,
}: SessionResultModalProps) {
  const winnerId = ranking[0]?.playerId ?? 0;
  const isPlayerWin = winnerId === 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-panel rounded-2xl border border-white/10 p-6 w-80 animate-result-appear shadow-panel">
        {/* 헤더 */}
        <div className="text-center mb-4">
          <p className="text-xs text-text-muted mb-1">3판 종합 결과</p>
          <h2
            className={`text-2xl font-bold ${
              isPlayerWin ? 'text-gold' : 'text-action-danger'
            }`}
          >
            {isPlayerWin ? '종합 승리!' : '종합 패배'}
          </h2>
        </div>

        {/* 순위 */}
        <div className="space-y-1.5 mb-4">
          {ranking.map((r, i) => (
            <div
              key={r.playerId}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                i === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-white/3'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-bold ${i === 0 ? 'text-gold' : 'text-text-muted'}`}>
                  {i + 1}위
                </span>
                <span className={i === 0 ? 'text-gold font-bold' : 'text-text-secondary'}>
                  {playerNames[r.playerId]}
                </span>
              </div>
              <span className={`font-bold ${i === 0 ? 'text-gold' : 'text-text-muted'}`}>
                {r.score}점
              </span>
            </div>
          ))}
        </div>

        {/* 라운드별 결과 */}
        <div className="bg-base/50 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-text-muted mb-2 font-bold">라운드별</p>
          {roundHistory.map((round, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
              <span className="text-text-muted">{i + 1}판</span>
              <span className="text-text-secondary">
                {round.winner !== null ? playerNames[round.winner] : '무승부'}
              </span>
              <span className="text-gold font-bold">{round.points}점</span>
              <div className="flex gap-0.5">
                {round.comboNames.map((name, j) => (
                  <span key={j} className="text-[9px] bg-gold/10 text-gold px-1 rounded">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            className="action-btn flex-1 py-2.5"
            onClick={onBackToMenu}
          >
            메뉴
          </button>
          <button
            className="action-btn action-btn-stop flex-1 py-2.5"
            onClick={onRestart}
          >
            다시 하기
          </button>
        </div>
      </div>
    </div>
  );
}
