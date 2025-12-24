import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
  label?: string;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  initialSeconds,
  onTimeUp,
  isPaused = false,
  label,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, seconds, onTimeUp]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const isWarning = seconds < 60;
  const isCritical = seconds < 30;

  const formatTime = () => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn('h-4 w-4', isCritical && 'text-destructive')} />
      <div className="flex flex-col items-center">
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
        <span
          className={cn(
            'font-mono text-base font-semibold tabular-nums',
            isWarning && !isCritical && 'text-warning',
            isCritical && 'text-destructive animate-pulse'
          )}
        >
          {formatTime()}
        </span>
      </div>
    </div>
  );
};
