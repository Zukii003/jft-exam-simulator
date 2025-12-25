import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  seconds: number;
  label?: string;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  seconds,
  label,
}) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const isWarning = seconds < 300; // 5 minutes warning
  const isCritical = seconds < 60; // 1 minute critical

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
            isWarning && !isCritical && 'text-yellow-600',
            isCritical && 'text-destructive animate-pulse'
          )}
        >
          {formatTime()}
        </span>
      </div>
    </div>
  );
};