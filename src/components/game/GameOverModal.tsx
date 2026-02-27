'use client';

import { PlayerState, ScoringResult } from '@/engine/types';

interface GameOverModalProps {
  winner: number | null;
  players: PlayerState[];
  gameResult: ScoringResult | null;
  onRestart: () => void;
  onBackToMenu: () => void;
  onNextRound?: () => void;
  roundLabel?: string;
}

export default function GameOverModal({
  winner,
  players,
  gameResult,
  onRestart,
  onBackToMenu,
  onNextRound,
  roundLabel,
}: GameOverModalProps) {
  const isDraw = winner === null;
  const isPlayerWin = winner === 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70"
      style={{ zIndex: 9995 }}
    >
      <div className="bg-panel rounded-2xl border border-white/10 p-6 w-80 animate-result-appear shadow-panel">
        {/* 결과 헤더 */}
        <div className="text-center mb-4">
          <h2
            className={`text-2xl font-bold mb-1 ${
              isDraw ? 'text-text-secondary' : isPlayerWin ? 'text-gold' : 'text-action-danger'
            }`}
          >
            {isDraw ? '무승부' : isPlayerWin ? '승리!' : '패배'}
          </h2>
          {!isDraw && (
            <p className="text-sm text-text-secondary">
              {players[winner!]?.name || ''} 승
            </p>
          )}
        </div>

        {/* 점수 상세 */}
        {gameResult && !isDraw && (
          <div className="bg-base/50 rounded-xl p-4 mb-4">
            <div className="text-center mb-3">
              <span className="text-3xl font-display font-bold text-gold">
                {gameResult.finalScore}
              </span>
              <span className="text-sm text-text-muted ml-1">점</span>
            </div>

            {gameResult.combos.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mb-2">
                {gameResult.combos.map(combo => (
                  <span
                    key={combo.id}
                    className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded"
                  >
                    {combo.nameKo} +{combo.points}
                  </span>
                ))}
              </div>
            )}

            {gameResult.goMultiplier > 1 && (
              <div className="text-center text-xs text-hwatu-red font-bold">
                고 배수 ×{gameResult.goMultiplier}
              </div>
            )}
          </div>
        )}

        {/* 각 플레이어 요약 */}
        <div className="space-y-1.5 mb-4">
          {players.map((p, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                i === winner ? 'bg-gold/10 border border-gold/20' : 'bg-white/3'
              }`}
            >
              <span className={i === winner ? 'text-gold font-bold' : 'text-text-secondary'}>
                {p.name}
              </span>
              <div className="flex gap-2 text-[10px] text-text-muted">
                <span>광{p.captured.gwang.length}</span>
                <span>열{p.captured.yeol.length}</span>
                <span>띠{p.captured.tti.length}</span>
                <span>피{p.captured.pi.length}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 라운드 표시 */}
        {roundLabel && (
          <p className="text-center text-[10px] text-text-muted mb-3">{roundLabel}</p>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            className="action-btn flex-1 py-2.5"
            onClick={onBackToMenu}
          >
            메뉴
          </button>
          {onNextRound ? (
            <button
              className="action-btn action-btn-stop flex-1 py-2.5"
              onClick={onNextRound}
            >
              다음 판
            </button>
          ) : (
            <button
              className="action-btn action-btn-stop flex-1 py-2.5"
              onClick={onRestart}
            >
              다시 하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
