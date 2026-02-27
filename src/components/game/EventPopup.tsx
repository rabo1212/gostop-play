'use client';

import { SpecialEvent } from '@/engine/types';

interface EventPopupProps {
  event: SpecialEvent;
}

const EVENT_CONFIG: Record<string, { text: string; color: string; size: string }> = {
  ttadak: { text: '따닥!', color: '#FFD700', size: 'text-4xl' },
  bomb:   { text: '폭탄!', color: '#FF4444', size: 'text-5xl' },
  sseul:  { text: '쓸!',   color: '#4CAF50', size: 'text-5xl' },
  ppuk:   { text: '뻑!',   color: '#FF9800', size: 'text-4xl' },
  jjok:   { text: '쪽!',   color: '#64B5F6', size: 'text-3xl' },
};

export default function EventPopup({ event }: EventPopupProps) {
  const config = EVENT_CONFIG[event];

  if (!config) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      <div
        className={`event-popup ${config.size} font-bold ${event === 'bomb' ? 'event-shake' : ''}`}
        style={{ color: config.color }}
      >
        {config.text}
      </div>
    </div>
  );
}
