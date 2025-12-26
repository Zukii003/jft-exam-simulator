import React from 'react';
import { Question } from '@/types/exam';
import { AudioPlayer } from './AudioPlayer';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  audioPlayCount: number;
  onAnswerSelect: (answer: string) => void;
  onAudioPlay: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  audioPlayCount,
  onAnswerSelect,
  onAudioPlay,
}) => {
  const { t } = useLanguage();
  const options = Array.isArray(question.options_json) 
    ? question.options_json 
    : [];

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="text-sm font-medium bg-secondary px-3 py-1 rounded-full">
          {t('question')} {questionNumber} {t('of')} {totalQuestions}
        </span>
        <span className="text-sm bg-accent px-3 py-1 rounded-full">
          {question.category}
        </span>
      </div>

      {/* Instruction text - always smaller */}
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {question.content_text}
      </p>

      {/* Question image - minimal padding for maximum visibility */}
      {question.type === 'image' && question.image_url && (
        <div className="rounded-lg overflow-hidden border border-border">
          <img
            src={question.image_url}
            alt="Question"
            className="w-full h-auto max-h-[65vh] object-contain"
          />
        </div>
      )}

      {question.type === 'text' && (
        <div className="bg-[hsl(200,60%,95%)] rounded-xl p-4 sm:p-5 border border-[hsl(200,40%,85%)]">
          <p className="text-base sm:text-lg font-medium leading-relaxed font-jp text-foreground">
            {question.content_text}
          </p>
        </div>
      )}

      {question.type === 'audio' && question.audio_url && (
        <div className="bg-card rounded-xl p-4 sm:p-6 border border-border shadow-sm">
          <AudioPlayer
            audioUrl={question.audio_url}
            playCount={audioPlayCount}
            maxPlays={2}
            onPlay={onAudioPlay}
          />
        </div>
      )}

      <div className="space-y-3">
        {options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index);
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={index}
              onClick={() => onAnswerSelect(option)}
              className={cn(
                'option-card w-full text-left flex items-start gap-4',
                isSelected && 'option-card-selected'
              )}
            >
              <span
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {optionLabel}
              </span>
              <span className="flex-1 font-jp">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
