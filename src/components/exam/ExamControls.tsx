import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Flag, FlagOff, CheckCircle } from 'lucide-react';

interface ExamControlsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isFlagged: boolean;
  isLastQuestion: boolean;
  isListeningSection: boolean;
  onBack: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onFinishSection: () => void;
}

export const ExamControls: React.FC<ExamControlsProps> = ({
  canGoBack,
  canGoNext,
  isFlagged,
  isLastQuestion,
  isListeningSection,
  onBack,
  onNext,
  onToggleFlag,
  onFinishSection,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <div className="flex items-center gap-2">
        {!isListeningSection && (
          <>
            <Button
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('previousQuestion')}
            </Button>
            
            <Button
              variant={isFlagged ? 'secondary' : 'outline'}
              onClick={onToggleFlag}
              className="gap-2"
            >
              {isFlagged ? (
                <>
                  <FlagOff className="h-4 w-4" />
                  {t('unflagQuestion')}
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  {t('flagQuestion')}
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isLastQuestion ? (
          <Button onClick={onFinishSection} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('finishSection')}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-2"
          >
            {t('nextQuestion')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
