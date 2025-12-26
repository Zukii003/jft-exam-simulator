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
  onFinishSection,
}) => {
  const { language, t } = useLanguage();
  const displaySectionTitle = sectionTitle || getSectionTitle(sectionNumber, language);

  return (
    <header className="flex flex-col">
      {/* Top Row - Question info and timer */}
      <div className="bg-[hsl(50,40%,85%)] text-foreground py-1.5 px-2 sm:py-2 sm:px-4 flex items-center justify-between border-b border-border gap-2">
        {/* Question & Section - Compact on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Q{questionNumber}
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[120px]">
            {displaySectionTitle}
          </span>
        </div>

        {/* Timer & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ExamTimer
            seconds={timeRemaining}
            label={t('examTime')}
            compact
          />
          
          <Button
            variant="outline"
            size="sm"
            className="bg-background hover:bg-muted border-border text-xs px-2 sm:px-3 h-7 sm:h-8"
            onClick={onFinishSection}
          >
            <span className="hidden sm:inline">{sectionNumber === 4 ? t('submitExam') : t('finishSection')}</span>
            <span className="sm:hidden">Finish</span>
          </Button>
          
          <LanguageToggle />
        </div>
      </div>

      {/* Bottom Row - Test and Candidate info - More compact on mobile */}
      <div className="bg-[hsl(var(--exam-header))] text-[hsl(var(--exam-header-foreground))] py-1 px-2 sm:py-2 sm:px-4 flex items-center justify-between text-[10px] sm:text-sm gap-1">
        <span className="font-medium truncate max-w-[80px] sm:max-w-none">
          {examTitle}
        </span>
        <span className="text-white/90 whitespace-nowrap">
          <span className="hidden sm:inline">Powered by </span><span className="font-medium">Megono</span>
        </span>
        <span className="truncate max-w-[80px] sm:max-w-none">
          {userName}
        </span>
      </div>
    </header>
  );
};
