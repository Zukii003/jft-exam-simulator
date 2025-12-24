import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ExamManager } from '@/components/admin/ExamManager';
import { QuestionManager } from '@/components/admin/QuestionManager';
import { ResultsExport } from '@/components/admin/ResultsExport';
import { BookOpen, LogOut, ArrowLeft, FileText, HelpCircle, Download } from 'lucide-react';
import { Exam } from '@/types/exam';

const Admin: React.FC = () => {
  const { user, signOut, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    if (user && isAdmin) {
      fetchExams();
    }
  }, [user, isAdmin, loading, navigate]);

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    if (data) {
      setExams(data.map(e => ({
        ...e,
        sections_json: e.sections_json as any,
        language_options: e.language_options as any
      })));
    }
    setLoadingExams(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading || loadingExams) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">{t('admin')} Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> {t('logout')}
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="exams" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('exams')}
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Download className="h-4 w-4" />
              {t('results')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="fade-in">
            <ExamManager
              exams={exams}
              onExamsChange={fetchExams}
              onSelectExam={setSelectedExam}
            />
          </TabsContent>

          <TabsContent value="questions" className="fade-in">
            <QuestionManager
              exams={exams}
              selectedExam={selectedExam}
              onSelectExam={setSelectedExam}
            />
          </TabsContent>

          <TabsContent value="results" className="fade-in">
            <ResultsExport exams={exams} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
