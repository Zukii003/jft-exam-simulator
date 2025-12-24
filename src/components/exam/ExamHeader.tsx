import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ExamTimer } from './ExamTimer';
import { getSectionTitle } from '@/lib/i18n';
import { User } from 'lucide-react';

interface ExamHeaderProps {
  sectionNumber: number;
  userName: string;
  timeRemaining: number;
  onTimeUp: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  sectionNumber,
  userName,
  timeRemaining,
  onTimeUp,
}) => {
  const { language, t } = useLanguage();
  const sectionTitle = getSectionTitle(sectionNumber, language);

  return (
    <header className="exam-header">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-exam-header-foreground/70 uppercase tracking-wide">
            {t('section')} {sectionNumber}
          </span>
          <h1 className="text-lg font-semibold font-jp">{sectionTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ExamTimer
          initialSeconds={timeRemaining}
          onTimeUp={onTimeUp}
        />
        
        <div className="hidden sm:flex items-center gap-2 text-exam-header-foreground/80">
          <User className="h-4 w-4" />
          <span className="text-sm">{userName}</span>
        </div>

        <LanguageToggle />
      </div>
    </header>
  );
};
