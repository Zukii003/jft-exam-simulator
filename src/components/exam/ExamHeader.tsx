import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ExamTimer } from './ExamTimer';
import { getSectionTitle } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface ExamHeaderProps {
  sectionNumber: number;
  sectionTitle?: string;
  questionNumber: number;
  totalQuestions: number;
  examTitle: string;
  userName: string;
  timeRemaining: number;
  onTimeUp: () => void;
  onFinishSection: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  sectionNumber,
  sectionTitle,
  questionNumber,
  totalQuestions,
  examTitle,
  userName,
  timeRemaining,
  onTimeUp,
  onFinishSection,
}) => {
  const { language, t } = useLanguage();
  const displaySectionTitle = sectionTitle || getSectionTitle(sectionNumber, language);

  return (
    <header className="flex flex-col">
      {/* Top Row - Question info and timer */}
      <div className="bg-[hsl(50,40%,85%)] text-foreground py-2 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {t('question')}: {questionNumber}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('section')}: {displaySectionTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ExamTimer
              initialSeconds={timeRemaining}
              onTimeUp={onTimeUp}
              label={t('examTime')}
            />
          </div>
          
          <Button
            variant="outline"
            className="bg-background hover:bg-muted border-border"
            onClick={onFinishSection}
          >
            {sectionNumber === 4 ? t('submitExam') : t('finishSection')}
          </Button>
          
          <LanguageToggle />
        </div>
      </div>

      {/* Bottom Row - Test and Candidate info */}
      <div className="bg-[hsl(var(--exam-header))] text-[hsl(var(--exam-header-foreground))] py-2 px-4 flex items-center justify-between">
        <span className="text-sm font-medium">
          Test: {examTitle}
        </span>
        <span className="text-sm">
          Candidate: {userName}
        </span>
      </div>
    </header>
  );
};
