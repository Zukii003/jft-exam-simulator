import React from 'react';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';

interface QuestionNavigationProps {
  questions: { id: string }[];
  currentIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: string[];
  onQuestionSelect: (index: number) => void;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentIndex,
  answers,
  flaggedQuestions,
  onQuestionSelect,
}) => {
  const getQuestionStatus = (questionId: string, index: number) => {
    const isActive = index === currentIndex;
    const isAnswered = !!answers[questionId];
    const isFlagged = flaggedQuestions.includes(questionId);

    return { isActive, isAnswered, isFlagged };
  };

  return (
    <div className="exam-sidebar w-48 lg:w-56 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        Questions
      </h3>
      <div className="grid grid-cols-4 gap-2 flex-1 overflow-y-auto">
        {questions.map((question, index) => {
          const { isActive, isAnswered, isFlagged } = getQuestionStatus(question.id, index);

          return (
            <button
              key={question.id}
              onClick={() => onQuestionSelect(index)}
              className={cn(
                'question-number relative',
                isActive && 'question-number-active',
                !isActive && isAnswered && !isFlagged && 'question-number-answered',
                !isActive && isFlagged && 'question-number-flagged',
                !isActive && !isAnswered && !isFlagged && 'question-number-default'
              )}
            >
              {index + 1}
              {isFlagged && !isActive && (
                <Flag className="absolute -top-1 -right-1 h-3 w-3 text-warning-foreground" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-exam-question-answered" />
          <span className="text-muted-foreground">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-exam-question-flagged" />
          <span className="text-muted-foreground">Flagged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-border bg-card" />
          <span className="text-muted-foreground">Not answered</span>
        </div>
      </div>
    </div>
  );
};
