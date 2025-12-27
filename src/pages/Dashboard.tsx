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
  const { user, signOut, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<string[]>([]);

  const fetchExams = async () => {
    try {
      // Only fetch exams first
      const { data: examData, error: examError } = await supabase.from('exams').select('*');
      if (examError) {
        console.error('Exam fetch error:', examError);
        return;
      }
      
      if (examData) {
        console.log('Exam data:', examData);
        setExams(examData as any[]);
      }

      // Skip assignments and attempts for now
      console.log('User:', user);
      
    } catch (error) {
      console.error('Fetch exams error:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchExams();
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JFT-Basic CBT</h1>
                <p className="text-sm text-gray-600">Megono Jepun</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2 border-gray-300 hover:bg-gray-50">
                  <Settings className="h-4 w-4" /> {t('admin')}
                </Button>
              )}
              <Button variant="ghost" onClick={handleLogout} className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <LogOut className="h-4 w-4" /> {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('exams')}</h2>
          <p className="text-gray-600">Practice for your Japanese Language Proficiency Test with our realistic CBT simulation</p>
        </div>
        
        {exams.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">{t('noExams')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const isAssigned = isAdmin || assignments.includes(exam.id);
              const hasAttempted = attempts[exam.id];
              
              return (
                <Card key={exam.id} className={`hover:shadow-lg transition-shadow duration-200 ${!isAssigned ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-900 mb-2">{exam.title}</CardTitle>
                        <CardDescription className="text-gray-600 line-clamp-2">{exam.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!isAssigned ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="h-6 w-6 text-yellow-600" />
                        </div>
                        <p className="text-sm text-yellow-700 font-medium">Not assigned by admin</p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        disabled={hasAttempted}
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
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

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg text-blue-900">4 Test Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                Characters & Vocabulary, Conversation & Expression, Listening, and Reading
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg text-green-900">Realistic Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                Practice with authentic test format and timing
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg text-purple-900">Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700">
                Get your scores immediately after completion
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <PoweredByFooter />
    </div>
  );
};

export default Dashboard;
