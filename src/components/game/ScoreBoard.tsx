'use client';

import { ScoringResult } from '@/engine/types';

interface ScoreBoardProps {
  score: ScoringResult;
  goCount: number;
}

export default function ScoreBoard({ score, goCount }: ScoreBoardProps) {
  return (
    <div className="bg-panel/80 rounded-lg border border-white/5 px-2 py-1.5 shrink-0">
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="text-base font-display font-bold text-gold leading-tight">{score.baseScore}</div>
          <div className="text-[9px] text-text-muted">점</div>
        </div>

        {score.combos.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {score.combos.map(combo => (
              <span
                key={combo.id}
                className="px-1 py-0.5 rounded text-[9px] font-semibold bg-gold/15 text-gold border border-gold/20"
              >
                {combo.nameKo}
              </span>
            ))}
          </div>
        )}

        {goCount > 0 && (
          <div className="text-center">
            <div className="text-xs font-bold text-hwatu-red">{goCount}고</div>
            <div className="text-[9px] text-text-muted">×{Math.pow(2, goCount)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
