import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BookOpen, LogOut, Play, Settings } from 'lucide-react';
import { Exam } from '@/types/exam';
import PoweredByFooter from '@/components/PoweredByFooter';

const Dashboard: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchExams();
  }, [user, navigate]);

  const fetchExams = async () => {
    const { data: examData } = await supabase.from('exams').select('*');
    if (examData) {
      setExams(examData.map(e => ({
        ...e,
        sections_json: e.sections_json as any,
        language_options: e.language_options as any
      })));
    }

    if (user) {
      // Fetch user's exam assignments
      const { data: assignmentData } = await supabase
        .from('exam_assignments')
        .select('exam_id')
        .eq('user_id', user.id);
      
      if (assignmentData) {
        setAssignments(assignmentData.map(a => a.exam_id));
      }

      // Fetch user's attempts
      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .select('exam_id, submitted_at')
        .eq('user_id', user.id);
      
      if (attemptData) {
        const attemptMap: Record<string, boolean> = {};
        attemptData.forEach(a => { attemptMap[a.exam_id] = !!a.submitted_at; });
        setAttempts(attemptMap);
      }
    }
    setLoading(false);
  };

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">JFT-Basic CBT (Uji Coba)</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2">
              <Settings className="h-4 w-4" /> {t('admin')}
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> {t('logout')}
          </Button>
        </div>
      </header>

      <main className="container py-8 flex-1">
        <h2 className="text-2xl font-bold mb-6">{t('exams')}</h2>
        
        {exams.length === 0 ? (
          <p className="text-muted-foreground">{t('noExams')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const isAssigned = isAdmin || assignments.includes(exam.id);
              const hasAttempted = attempts[exam.id];
              
              return (
                <Card key={exam.id} className={!isAssigned ? 'opacity-60' : ''}>
                  <CardHeader>
                    <CardTitle>{exam.title}</CardTitle>
                    <CardDescription>{exam.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isAssigned ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Not assigned by admin
                      </p>
                    ) : (
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        disabled={hasAttempted}
                        className="w-full gap-2"
                      >
                        <Play className="h-4 w-4" />
                        {hasAttempted ? t('alreadyAttempted') : t('startExam')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <PoweredByFooter />
    </div>
  );
};

export default Dashboard;
