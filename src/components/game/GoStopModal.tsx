'use client';

import { ScoringResult } from '@/engine/types';

interface GoStopModalProps {
  score: ScoringResult;
  goCount: number;
  onGo: () => void;
  onStop: () => void;
}

export default function GoStopModal({ score, goCount, onGo, onStop }: GoStopModalProps) {
  const nextMultiplier = Math.pow(2, goCount + 1);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60"
      style={{ zIndex: 9990 }}
    >
      <div className="bg-panel rounded-2xl border border-white/10 p-6 w-80 animate-slide-up shadow-panel">
        <h2 className="text-center text-xl font-bold text-gold mb-4">
          고 or 스톱?
        </h2>

        {/* 현재 점수 */}
        <div className="text-center mb-4">
          <div className="text-3xl font-display font-bold text-gold mb-1">
            {score.baseScore}점
          </div>
          {score.combos.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mb-2">
              {score.combos.map(c => (
                <span key={c.id} className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded">
                  {c.nameKo} +{c.points}
                </span>
              ))}
            </div>
          )}
          {goCount > 0 && (
            <div className="text-sm text-hwatu-red font-bold">
              현재 {goCount}고 (×{Math.pow(2, goCount)})
            </div>
          )}
        </div>

        {/* 선택 버튼 */}
        <div className="flex gap-3">
          <button
            className="action-btn action-btn-go flex-1 py-3 text-lg"
            onClick={onGo}
          >
            고!
            <div className="text-[10px] font-normal opacity-70 mt-0.5">
              ×{nextMultiplier} 배수
            </div>
          </button>
          <button
            className="action-btn action-btn-stop flex-1 py-3 text-lg"
            onClick={onStop}
          >
            스톱!
            <div className="text-[10px] font-normal opacity-70 mt-0.5">
              {score.baseScore * (goCount > 0 ? Math.pow(2, goCount) : 1)}점 확정
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
