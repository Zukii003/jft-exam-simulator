import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const EXAM_DURATION_SECONDS = 60 * 60; // 60 minutes for entire exam

  const startedAtMsRef = useRef<number | null>(null);
  const submitTriggeredRef = useRef(false);
  const saveProgressRef = useRef<(() => Promise<void>) | null>(null);

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
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
    timeRemaining: EXAM_DURATION_SECONDS,
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
    if (!loading) {
      loadExamData();
    }
  }, [user, examId, loading]);

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

      // Fetch questions from secure view (hides correct_answer from non-admins)
      const { data: questionsData } = await supabase
        .from('questions_public')
        .select('*')
        .eq('exam_id', examId)
        .order('section_number')
        .order('question_order');

      if (questionsData) {
        // Process questions and generate signed URLs for assets
        const processedQuestions = await Promise.all(
          questionsData.map(async (q) => {
            let imageUrl = q.image_url;
            let audioUrl = q.audio_url;

            // Generate signed URLs for assets (valid for 3 hours - covers exam duration)
            if (imageUrl && !imageUrl.startsWith('http')) {
              const { data } = await supabase.storage
                .from('exam-assets')
                .createSignedUrl(imageUrl, 10800); // 3 hours
              imageUrl = data?.signedUrl || imageUrl;
            }
            if (audioUrl && !audioUrl.startsWith('http')) {
              const { data } = await supabase.storage
                .from('exam-assets')
                .createSignedUrl(audioUrl, 10800); // 3 hours
              audioUrl = data?.signedUrl || audioUrl;
            }

            return {
              ...q,
              image_url: imageUrl,
              audio_url: audioUrl,
              options_json: q.options_json as string[],
              type: q.type as 'text' | 'image' | 'audio',
            };
          })
        );
        setQuestions(processedQuestions);
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

        // Keep exam time running across tab changes/reloads by deriving from started_at
        startedAtMsRef.current = new Date(existingAttempt.started_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startedAtMsRef.current) / 1000);
        const derivedTimeRemaining = Math.max(0, EXAM_DURATION_SECONDS - elapsedSeconds);

        // Restore answers/progress
        const restoredAnswers = existingAttempt.answers_json as Record<string, string>;
        const restoredSection = existingAttempt.current_section;
        const restoredSectionQuestions = (questionsData || [])
          .filter((q: any) => q.section_number === restoredSection)
          .sort((a: any, b: any) => (a.question_order ?? 0) - (b.question_order ?? 0));

        // Best-effort: restore the current question index to the first unanswered in the current section
        const firstUnansweredIdx = restoredSectionQuestions.findIndex(
          (q: any) => !restoredAnswers?.[q.id]
        );
        const restoredIndex = firstUnansweredIdx === -1 ? 0 : firstUnansweredIdx;

        setState(prev => ({
          ...prev,
          currentSection: restoredSection,
          currentQuestionIndex: restoredIndex,
          answers: restoredAnswers,
          audioPlayCount: existingAttempt.audio_play_json as Record<string, number>,
          sectionFinished: existingAttempt.section_finished_json as Record<string, boolean>,
          sectionTimes: existingAttempt.section_times_json as Record<string, number>,
          flaggedQuestions: existingAttempt.flagged_questions_json as string[],
          timeRemaining: derivedTimeRemaining,
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
        startedAtMsRef.current = new Date(newAttempt.started_at).getTime();

        // New attempt starts with full duration
        setState(prev => ({ ...prev, timeRemaining: EXAM_DURATION_SECONDS }));
      }

      setContentLoading(false);
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

  // Keep a ref to the latest saveProgress for lifecycle events
  useEffect(() => {
    saveProgressRef.current = saveProgress;
  }, [saveProgress]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Save progress when user switches tab / reloads / closes
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveProgressRef.current?.();
      }
    };

    const handlePageHide = () => {
      saveProgressRef.current?.();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Global exam timer - derive timeRemaining from started_at so it keeps running across tab changes/reloads
  useEffect(() => {
    if (loading || isComplete) return;

    // If startedAt isn't set yet, don't start the timer
    if (!startedAtMsRef.current) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - (startedAtMsRef.current || Date.now())) / 1000);
      const newTime = Math.max(0, EXAM_DURATION_SECONDS - elapsedSeconds);

      setState(prev => (prev.timeRemaining === newTime ? prev : { ...prev, timeRemaining: newTime }));

      if (newTime <= 0 && !submitTriggeredRef.current) {
        submitTriggeredRef.current = true;
        calculateAndSubmitScore();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isComplete, EXAM_DURATION_SECONDS]);

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


  // Finish current section
  const finishCurrentSection = async () => {
    const newSectionFinished = { ...state.sectionFinished, [state.currentSection]: true };
    
    await saveProgress();

    if (state.currentSection === 4) {
      // Last section - complete exam
      await calculateAndSubmitScore();
    } else {
      // Move to next section (keep same global timer - don't reset it)
      const nextSection = state.currentSection + 1;
      
      setState(prev => ({
        ...prev,
        sectionFinished: newSectionFinished,
        currentSection: nextSection,
        currentQuestionIndex: 0,
        // timeRemaining stays the same - global timer continues
      }));
      
      setShowFinishDialog(false);
      setShowTransition(true);
    }
  };

  // Submit exam score using secure server-side function
  const calculateAndSubmitScore = async () => {
    if (!attemptId) return;

    try {
      // Save final answers before submitting
      await saveProgress();

      // Call server-side function to calculate and submit score securely
      const { data, error } = await supabase.rpc('submit_exam_score', {
        p_attempt_id: attemptId
      });

      if (error) {
        console.error('Error submitting exam:', error);
        toast({ 
          title: t('error'), 
          description: 'Failed to submit exam. Please try again.', 
          variant: 'destructive' 
        });
        return;
      }

      setIsComplete(true);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({ 
        title: t('error'), 
        description: 'Failed to submit exam. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  // Handle section transition continue
  const handleContinueToSection = () => {
    setShowTransition(false);
  };

  if (loading || contentLoading) {
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

  // Handle section/question selection from navigation
  const handleSectionQuestionSelect = (sectionNumber: number, questionIndex: number) => {
    if (sectionNumber === state.currentSection) {
      handleQuestionSelect(questionIndex);
    }
  };

  return (
    <div className="exam-container flex flex-col h-screen">
      <ExamHeader
        sectionNumber={state.currentSection}
        questionNumber={state.currentQuestionIndex + 1}
        totalQuestions={sectionQuestions.length}
        examTitle={exam?.title || 'Exam'}
        userName={userName}
        timeRemaining={state.timeRemaining}
        onFinishSection={() => setShowFinishDialog(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Panel - Only for non-listening sections */}
        {!isListeningSection && exam && (
          <QuestionNavigation
            sections={exam.sections_json}
            questions={questions}
            currentSection={state.currentSection}
            currentQuestionIndex={state.currentQuestionIndex}
            answers={state.answers}
            flaggedQuestions={state.flaggedQuestions}
            sectionFinished={state.sectionFinished}
            onQuestionSelect={handleSectionQuestionSelect}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
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
