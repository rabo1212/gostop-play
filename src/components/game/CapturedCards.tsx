'use client';

import { CapturedCards as CapturedType, CardId } from '@/engine/types';
import { countPiValue } from '@/engine/cards';
import HwatuCard from './HwatuCard';

interface CapturedCardsProps {
  captured: CapturedType;
  compact?: boolean;
}

export default function CapturedCards({ captured, compact = false }: CapturedCardsProps) {
  const piCount = countPiValue(captured.pi);
  const size = compact ? 'xs' : 'sm';

  return (
    <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'}`}>
      {/* 광 */}
      {captured.gwang.length > 0 && (
        <Row label="광" count={captured.gwang.length} cards={captured.gwang} size={size} color="text-hwatu-gold" />
      )}
      {/* 열끗 */}
      {captured.yeol.length > 0 && (
        <Row label="열" count={captured.yeol.length} cards={captured.yeol} size={size} color="text-action-success" />
      )}
      {/* 띠 */}
      {captured.tti.length > 0 && (
        <Row label="띠" count={captured.tti.length} cards={captured.tti} size={size} color="text-action-blue" />
      )}
      {/* 피 */}
      {captured.pi.length > 0 && (
        <Row label="피" count={piCount} cards={captured.pi} size={size} color="text-text-muted" />
      )}
      {/* 비어있을 때 */}
      {captured.gwang.length === 0 && captured.yeol.length === 0 &&
       captured.tti.length === 0 && captured.pi.length === 0 && (
        <div className="text-[10px] text-text-muted">아직 없음</div>
      )}
    </div>
  );
}

function Row({
  label,
  count,
  cards,
  size,
  color,
}: {
  label: string;
  count: number;
  cards: CardId[];
  size: 'xs' | 'sm';
  color: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-bold ${color} w-5 text-right`}>
        {label}{count}
      </span>
      <div className="flex gap-0.5 flex-wrap">
        {cards.map(cardId => (
          <HwatuCard key={cardId} cardId={cardId} size={size} />
        ))}
      </div>
    </div>
  );
}
