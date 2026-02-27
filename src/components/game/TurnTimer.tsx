'use client';

import { useState, useEffect, useRef } from 'react';

interface TurnTimerProps {
  deadlineMs: number | null;
  onTimeout?: () => void;
}

export default function TurnTimer({ deadlineMs, onTimeout }: TurnTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (deadlineMs === null || deadlineMs <= 0) {
      setRemaining(null);
      return;
    }

    setRemaining(Math.ceil(deadlineMs / 1000));
    const endTime = Date.now() + deadlineMs;

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onTimeoutRef.current?.();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [deadlineMs]);

  if (remaining === null) return null;

  const isUrgent = remaining <= 5;

  return (
    <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
      isUrgent
        ? 'bg-action-danger/20 text-action-danger animate-pulse'
        : 'bg-white/5 text-text-muted'
    }`}>
      {remaining}s
    </div>
  );
}
