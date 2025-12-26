import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSectionTitle } from '@/lib/i18n';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Question, Section } from '@/types/exam';

interface QuestionNavigationProps {
  sections: Section[];
  questions: Question[];
  currentSection: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: string[];
  sectionFinished: Record<string, boolean>;
  onQuestionSelect: (sectionNumber: number, questionIndex: number) => void;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  sections,
  questions,
  currentSection,
  currentQuestionIndex,
  answers,
  flaggedQuestions,
  sectionFinished,
  onQuestionSelect,
}) => {
  const { language } = useLanguage();
  const [expandedSections, setExpandedSections] = React.useState<number[]>([currentSection]);

  const toggleSection = (sectionNumber: number) => {
    setExpandedSections(prev =>
      prev.includes(sectionNumber)
        ? prev.filter(s => s !== sectionNumber)
        : [...prev, sectionNumber]
    );
  };

  const getQuestionStatus = (question: Question, sectionNumber: number, indexInSection: number) => {
    const isCurrentSection = sectionNumber === currentSection;
    const isActive = isCurrentSection && indexInSection === currentQuestionIndex;
    const isAnswered = !!answers[question.id];
    const isFlagged = flaggedQuestions.includes(question.id);

    return { isActive, isAnswered, isFlagged };
  };

  const getSectionQuestions = (sectionNumber: number) => {
    return questions.filter(q => q.section_number === sectionNumber);
  };

  const isSectionLocked = (sectionNumber: number) => {
    // Can't access sections before current if already finished
    if (sectionNumber < currentSection) {
      return sectionFinished[sectionNumber.toString()];
    }
    // Can't access sections after current
    return sectionNumber > currentSection;
  };

  const isSectionActive = (sectionNumber: number) => {
    return sectionNumber === currentSection;
  };

  const isSectionCompleted = (sectionNumber: number) => {
    return sectionFinished[sectionNumber.toString()];
  };

  // Short section names for display
  const getSectionShortName = (sectionNumber: number) => {
    const names: Record<number, string> = {
      1: 'Intro',
      2: 'Conv',
      3: 'List',
      4: 'Read',
    };
    return names[sectionNumber] || `S${sectionNumber}`;
  };

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Auto-collapse on mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsCollapsed(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={cn(
      "exam-sidebar flex flex-col h-full overflow-y-auto transition-all duration-300 border-r border-border",
      isCollapsed ? "w-14" : "w-44 lg:w-56"
    )}>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden flex items-center justify-center py-2 bg-[hsl(var(--exam-header))] text-[hsl(var(--exam-header-foreground))]"
      >
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => {
          const sectionQuestions = getSectionQuestions(section.number);
          const isExpanded = expandedSections.includes(section.number);
          const isLocked = isSectionLocked(section.number);
          const isActive = isSectionActive(section.number);
          const isCompleted = isSectionCompleted(section.number);

          return (
            <div key={section.number} className="border-b border-border">
              {/* Section Header */}
              <button
                onClick={() => !isLocked && toggleSection(section.number)}
                disabled={isLocked}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 text-left transition-colors',
                  isActive && 'bg-[hsl(90,50%,85%)] text-foreground font-medium',
                  isCompleted && !isActive && 'bg-muted text-muted-foreground',
                  isLocked && !isCompleted && 'bg-background text-muted-foreground cursor-not-allowed',
                  !isActive && !isCompleted && !isLocked && 'bg-background hover:bg-muted'
                )}
              >
                <span className={cn("text-xs truncate", isCollapsed && "text-center w-full")}>
                  {isCollapsed ? `S${section.number}` : getSectionShortName(section.number)}
                </span>
                {!isLocked && !isCollapsed && (
                  isExpanded ? (
                    <ChevronUp className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                  )
                )}
              </button>

              {/* Question Numbers - Grid layout for compact view */}
              {isExpanded && !isLocked && (
                <div className={cn(
                  "grid gap-1 p-1.5 bg-background",
                  isCollapsed ? "grid-cols-1" : "grid-cols-4 sm:grid-cols-5 lg:grid-cols-4"
                )}>
                  {sectionQuestions.map((question, index) => {
                    const { isActive, isAnswered, isFlagged } = getQuestionStatus(
                      question,
                      section.number,
                      index
                    );

                    return (
                      <button
                        key={question.id}
                        onClick={() => onQuestionSelect(section.number, index)}
                        className={cn(
                          'flex items-center justify-center w-7 h-7 rounded text-xs transition-all',
                          // Active - green
                          isActive && 'bg-[hsl(90,50%,40%)] text-white font-medium',
                          // Answered - light green
                          !isActive && isAnswered && !isFlagged && 'bg-[hsl(90,40%,90%)] text-foreground',
                          // Flagged - amber
                          !isActive && isFlagged && 'bg-[hsl(var(--exam-question-flagged))] text-[hsl(var(--warning-foreground))]',
                          // Default
                          !isActive && !isAnswered && !isFlagged && 'bg-muted hover:bg-muted/80 text-foreground'
                        )}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact Legend - only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-2 border-t border-border grid grid-cols-2 gap-1 text-[10px] bg-background">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[hsl(90,50%,40%)]" />
            <span className="text-muted-foreground">Now</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[hsl(90,40%,90%)]" />
            <span className="text-muted-foreground">Done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[hsl(var(--exam-question-flagged))]" />
            <span className="text-muted-foreground">Flag</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted border border-border" />
            <span className="text-muted-foreground">Empty</span>
          </div>
        </div>
      )}
    </div>
  );
};
