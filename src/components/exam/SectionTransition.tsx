import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSectionTitle } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

interface SectionTransitionProps {
  nextSection: number;
  onContinue: () => void;
}

export const SectionTransition: React.FC<SectionTransitionProps> = ({
  nextSection,
  onContinue,
}) => {
  const { language, t } = useLanguage();
  const sectionTitle = getSectionTitle(nextSection, language);
  const isListeningSection = nextSection === 3;

  const sectionDurations: Record<number, number> = {
    1: 30,
    2: 30,
    3: 30,
    4: 30,
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Section Complete!</CardTitle>
          <CardDescription>
            You have completed the previous section. Get ready for the next one.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-accent rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Next Section</p>
            <h2 className="text-xl font-bold font-jp">{sectionTitle}</h2>
            <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{sectionDurations[nextSection]} minutes</span>
            </div>
          </div>

          {isListeningSection && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Listening Section Rules</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Questions appear one at a time in sequence</li>
                    <li>• You cannot go back to previous questions</li>
                    <li>• Each audio can only be played 2 times</li>
                    <li>• Answer carefully before moving to the next question</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!isListeningSection && (
            <div className="bg-muted rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                You can navigate freely between questions in this section. Use the flag feature
                to mark questions you want to review before finishing.
              </p>
            </div>
          )}

          <Button onClick={onContinue} className="w-full gap-2" size="lg">
            Start Section {nextSection}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
