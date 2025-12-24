import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string;
  playCount: number;
  maxPlays: number;
  onPlay: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  playCount,
  maxPlays,
  onPlay,
}) => {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const remainingPlays = maxPlays - playCount;
  const canPlay = remainingPlays > 0;

  const handlePlayPause = () => {
    if (!audioRef.current || !canPlay) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!hasStarted) {
        onPlay();
        setHasStarted(true);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const percentage = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(percentage);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setHasStarted(false);
  };

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Volume2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-medium">{t('playAudio')}</span>
        </div>

        <Button
          variant={canPlay ? 'default' : 'secondary'}
          size="lg"
          onClick={handlePlayPause}
          disabled={!canPlay}
          className="w-16 h-16 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>

        <div className="w-full max-w-xs">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          className={cn(
            'text-sm font-medium px-4 py-2 rounded-full',
            remainingPlays <= 1 ? 'bg-warning/20 text-warning' : 'bg-secondary text-secondary-foreground'
          )}
        >
          {remainingPlays} {t('playsRemaining')}
        </div>

        {!canPlay && (
          <p className="text-destructive text-sm mt-2">{t('audioLimit')}</p>
        )}
      </div>
    </div>
  );
};
