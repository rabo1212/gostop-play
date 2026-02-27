'use client';

import HwatuCard from './HwatuCard';

interface DrawPileProps {
  remaining: number;
}

export default function DrawPile({ remaining }: DrawPileProps) {
  if (remaining <= 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-12 h-[72px] rounded border border-white/10 flex items-center justify-center">
          <span className="text-[10px] text-text-muted">없음</span>
        </div>
      </div>
    );
  }

  // 더미 두께 표현 (최대 4장까지)
  const layers = Math.min(remaining, 4);

  return (
    <div className="flex flex-col items-center gap-1" data-zone="draw">
      <div className="relative" style={{ width: 48 + layers * 2, height: 72 + layers * 2 }}>
        {Array.from({ length: layers }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: i * 1,
              bottom: i * 1,
              zIndex: i,
            }}
          >
            <HwatuCard faceDown size="sm" />
          </div>
        ))}
      </div>
      <span className="text-[10px] text-text-muted font-bold">{remaining}장</span>
    </div>
  );
}
