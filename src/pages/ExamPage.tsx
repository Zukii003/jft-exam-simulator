import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Exam, Question, ExamState, Section } from '@/types/exam';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { QuestionNavigation } from '@/components/exam/QuestionNavigation';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ExamControls } from '@/components/exam/ExamControls';
import { SectionTransition } from '@/components/exam/SectionTransition';
import { ExamComplete } from '@/components/exam/ExamComplete';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [userName, setUserName] = useState('');

  const [state, setState] = useState<ExamState>({
    currentSection: 1,
    currentQuestionIndex: 0,
    answers: {},
    audioPlayCount: {},
    sectionFinished: { '1': false, '2': false, '3': false, '4': false },
    sectionTimes: {},
    flaggedQuestions: [],
    timeRemaining: 30 * 60, // 30 minutes default
  });

  // Get current section questions
  const sectionQuestions = questions.filter(q => q.section_number === state.currentSection);
  const currentQuestion = sectionQuestions[state.currentQuestionIndex];
  const isListeningSection = state.currentSection === 3;

  // Load exam data
  useEffect(() => {
    if (!user || !examId) {
      navigate('/dashboard');
      return;
    }
    loadExamData();
  }, [user, examId]);

  const loadExamData = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user!.id)
        .single();
      
      if (profile) setUserName(profile.name);

      // Fetch exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError || !examData) {
        toast({ title: t('error'), description: 'Exam not found', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }

      const typedExam: Exam = {
        ...examData,
        sections_json: examData.sections_json as unknown as Section[],
        language_options: examData.language_options as unknown as string[],
      };
      setExam(typedExam);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('section_number')
        .order('question_order');

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          options_json: q.options_json as string[],
          type: q.type as 'text' | 'image' | 'audio',
        })));
      }

      // Check for existing attempt
      const { data: existingAttempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existingAttempt) {
        if (existingAttempt.submitted_at) {
          toast({ title: t('alreadyAttempted'), variant: 'destructive' });
          navigate('/dashboard');
          return;
        }

        // Resume attempt
        setAttemptId(existingAttempt.id);
        setState(prev => ({
          ...prev,
          currentSection: existingAttempt.current_section,
          answers: existingAttempt.answers_json as Record<string, string>,
          audioPlayCount: existingAttempt.audio_play_json as Record<string, number>,
          sectionFinished: existingAttempt.section_finished_json as Record<string, boolean>,
          sectionTimes: existingAttempt.section_times_json as Record<string, number>,
          flaggedQuestions: existingAttempt.flagged_questions_json as string[],
        }));
      } else {
        // Create new attempt
        const { data: newAttempt, error: attemptError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId,
            user_id: user!.id,
          })
          .select()
          .single();

        if (attemptError) {
          toast({ title: t('error'), description: attemptError.message, variant: 'destructive' });
          navigate('/dashboard');
          return;
        }

        setAttemptId(newAttempt.id);
      }

      // Set initial timer based on first section
      const section = typedExam.sections_json.find(s => s.number === 1);
      if (section) {
        setState(prev => ({ ...prev, timeRemaining: section.duration_minutes * 60 }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading exam:', error);
      toast({ title: t('error'), description: 'Failed to load exam', variant: 'destructive' });
      navigate('/dashboard');
    }
  };

  // Save progress periodically
  const saveProgress = useCallback(async () => {
    if (!attemptId) return;

    await supabase
      .from('exam_attempts')
      .update({
        current_section: state.currentSection,
        answers_json: state.answers,
        audio_play_json: state.audioPlayCount,
        section_finished_json: state.sectionFinished,
        section_times_json: state.sectionTimes,
        flagged_questions_json: state.flaggedQuestions,
      })
      .eq('id', attemptId);
  }, [attemptId, state]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;
    
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: answer },
    }));
  };

  // Handle audio play
  const handleAudioPlay = () => {
    if (!currentQuestion) return;
    
    setState(prev => ({
      ...prev,
      audioPlayCount: {
        ...prev.audioPlayCount,
        [currentQuestion.id]: (prev.audioPlayCount[currentQuestion.id] || 0) + 1,
      },
    }));
  };

  // Handle flag toggle
  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    
    setState(prev => {
      const isFlagged = prev.flaggedQuestions.includes(currentQuestion.id);
      return {
        ...prev,
        flaggedQuestions: isFlagged
          ? prev.flaggedQuestions.filter(id => id !== currentQuestion.id)
          : [...prev.flaggedQuestions, currentQuestion.id],
      };
    });
  };

  // Handle navigation
  const handleNext = () => {
    if (state.currentQuestionIndex < sectionQuestions.length - 1) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    }
  };

  const handleBack = () => {
    if (!isListeningSection && state.currentQuestionIndex > 0) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }));
    }
  };

  const handleQuestionSelect = (index: number) => {
    if (!isListeningSection) {
      setState(prev => ({ ...prev, currentQuestionIndex: index }));
    }
  };

  // Handle time up
  const handleTimeUp = useCallback(() => {
    toast({ title: 'Time is up!', description: 'Moving to next section...' });
    finishCurrentSection();
  }, [state.currentSection]);

  // Finish current section
  const finishCurrentSection = async () => {
    const newSectionFinished = { ...state.sectionFinished, [state.currentSection]: true };
    
    await saveProgress();

    if (state.currentSection === 4) {
      // Last section - complete exam
      await calculateAndSubmitScore();
    } else {
      // Move to next section
      const nextSection = state.currentSection + 1;
      const section = exam?.sections_json.find(s => s.number === nextSection);
      
      setState(prev => ({
        ...prev,
        sectionFinished: newSectionFinished,
        currentSection: nextSection,
        currentQuestionIndex: 0,
        timeRemaining: section ? section.duration_minutes * 60 : 30 * 60,
      }));
      
      setShowFinishDialog(false);
      setShowTransition(true);
    }
  };

  // Calculate and submit score
  const calculateAndSubmitScore = async () => {
    if (!attemptId) return;

    const sectionScores: Record<string, number> = {};
    let totalCorrect = 0;
    let totalQuestions = 0;

    [1, 2, 3, 4].forEach(section => {
      const sectionQs = questions.filter(q => q.section_number === section);
      const correct = sectionQs.filter(q => state.answers[q.id] === q.correct_answer).length;
      
      sectionScores[section] = sectionQs.length > 0 ? (correct / sectionQs.length) * 100 : 0;
      totalCorrect += correct;
      totalQuestions += sectionQs.length;
    });

    const totalScore250 = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 250 : 0;

    await supabase
      .from('exam_attempts')
      .update({
        section_finished_json: { '1': true, '2': true, '3': true, '4': true },
        score_section_json: sectionScores,
        total_score_250: totalScore250,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    setIsComplete(true);
  };

  // Handle section transition continue
  const handleContinueToSection = () => {
    setShowTransition(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (isComplete && attemptId) {
    return <ExamComplete attemptId={attemptId} />;
  }

  if (showTransition) {
    return (
      <SectionTransition
        nextSection={state.currentSection}
        onContinue={handleContinueToSection}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No questions in this section</p>
      </div>
    );
  }

  return (
    <div className="exam-container flex flex-col h-screen">
      <ExamHeader
        sectionNumber={state.currentSection}
        userName={userName}
        timeRemaining={state.timeRemaining}
        onTimeUp={handleTimeUp}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Panel - Only for non-listening sections */}
        {!isListeningSection && (
          <QuestionNavigation
            questions={sectionQuestions}
            currentIndex={state.currentQuestionIndex}
            answers={state.answers}
            flaggedQuestions={state.flaggedQuestions}
            onQuestionSelect={handleQuestionSelect}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <QuestionCard
              question={currentQuestion}
              questionNumber={state.currentQuestionIndex + 1}
              totalQuestions={sectionQuestions.length}
              selectedAnswer={state.answers[currentQuestion.id] || null}
              audioPlayCount={state.audioPlayCount[currentQuestion.id] || 0}
              onAnswerSelect={handleAnswerSelect}
              onAudioPlay={handleAudioPlay}
            />

            <ExamControls
              canGoBack={!isListeningSection && state.currentQuestionIndex > 0}
              canGoNext={state.currentQuestionIndex < sectionQuestions.length - 1}
              isFlagged={state.flaggedQuestions.includes(currentQuestion.id)}
              isLastQuestion={state.currentQuestionIndex === sectionQuestions.length - 1}
              isListeningSection={isListeningSection}
              onBack={handleBack}
              onNext={handleNext}
              onToggleFlag={handleToggleFlag}
              onFinishSection={() => setShowFinishDialog(true)}
            />
          </div>
        </main>
      </div>

      {/* Finish Section Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmFinish')}</AlertDialogTitle>
            <AlertDialogDescription>
              {state.currentSection === 4
                ? t('confirmSubmit')
                : 'Once you finish this section, you cannot return to it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={finishCurrentSection}>
              {state.currentSection === 4 ? t('submitExam') : t('finishSection')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamPage;
