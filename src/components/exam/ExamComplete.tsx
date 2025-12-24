import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSectionTitle } from '@/lib/i18n';
import { Trophy, Home, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ExamCompleteProps {
  attemptId: string;
}

interface AttemptData {
  score_section_json: Record<string, number>;
  total_score_250: number;
}

export const ExamComplete: React.FC<ExamCompleteProps> = ({ attemptId }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    const { data } = await supabase
      .from('exam_attempts')
      .select('score_section_json, total_score_250')
      .eq('id', attemptId)
      .single();

    if (data) {
      setAttempt({
        score_section_json: data.score_section_json as Record<string, number>,
        total_score_250: data.total_score_250 as number,
      });
    }
    setLoading(false);
  };

  if (loading || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalScore = Math.round(attempt.total_score_250);
  const passed = totalScore >= 125; // 50% passing threshold

  const sectionData = [1, 2, 3, 4].map(section => ({
    name: `S${section}`,
    fullName: getSectionTitle(section, language),
    score: Math.round(attempt.score_section_json[section] || 0),
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--primary))';
    if (score >= 40) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-success/10' : 'bg-destructive/10'
          }`}>
            <Trophy className={`h-10 w-10 ${passed ? 'text-success' : 'text-destructive'}`} />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('examCompleted')}</h1>
          <p className="text-muted-foreground">
            {passed ? 'Congratulations! You passed the exam.' : 'Keep practicing and try again.'}
          </p>
        </div>

        {/* Total Score Card */}
        <Card className="result-card">
          <CardHeader className="text-center">
            <CardTitle>{t('totalScore')}</CardTitle>
            <CardDescription>Scale: 0 - 250</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="score-circle mb-6">
              <span className="text-4xl font-bold">{totalScore}</span>
              <span className="text-sm opacity-80">/ 250</span>
            </div>
            <div className={`px-6 py-2 rounded-full text-sm font-medium ${
              passed 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {passed ? t('passed') : t('failed')}
            </div>
          </CardContent>
        </Card>

        {/* Section Scores */}
        <div className="grid gap-4 md:grid-cols-2">
          {sectionData.map((section, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium font-jp">{section.fullName}</span>
                  <span className="text-sm font-bold" style={{ color: getScoreColor(section.score) }}>
                    {section.score}%
                  </span>
                </div>
                <Progress 
                  value={section.score} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('sectionScore')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                    labelFormatter={(label) => sectionData.find(s => s.name === label)?.fullName || label}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {sectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center">
          <Button onClick={() => navigate('/dashboard')} size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            {t('dashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
};
