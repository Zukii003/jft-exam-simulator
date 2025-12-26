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

      <div className="bg-card rounded-xl p-4 sm:p-6 border border-border shadow-sm">
        {/* Text content - smaller when there's an image */}
        <p className={cn(
          "font-medium leading-relaxed font-jp",
          question.type === 'image' ? "text-sm sm:text-base" : "text-base sm:text-lg"
        )}>
          {question.content_text}
        </p>

        {question.type === 'image' && question.image_url && (
          <div className="mt-3 sm:mt-4">
            <img
              src={question.image_url}
              alt="Question"
              className="max-w-full h-auto rounded-lg border border-border max-h-[50vh] object-contain mx-auto"
            />
          </div>
        )}

        {question.type === 'audio' && question.audio_url && (
          <div className="mt-4 sm:mt-6">
            <AudioPlayer
              audioUrl={question.audio_url}
              playCount={audioPlayCount}
              maxPlays={2}
              onPlay={onAudioPlay}
            />
          </div>
        )}
      </div>

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
