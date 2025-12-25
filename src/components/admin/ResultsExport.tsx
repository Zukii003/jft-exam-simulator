import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Exam } from '@/types/exam';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ResultsExportProps {
  exams: Exam[];
}

interface ExportData {
  name: string;
  email: string;
  section_1: string;
  section_2: string;
  section_3: string;
  section_4: string;
  total_score: string;
  attempt_date: string;
}

// Escape CSV values to prevent formula injection attacks
const escapeCsv = (str: string): string => {
  // Prevent formula injection - prefix with single quote if starts with dangerous chars
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  
  // Escape quotes by doubling them and wrap in quotes if contains special chars
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export const ResultsExport: React.FC<ResultsExportProps> = ({ exams }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!selectedExamId) {
      toast({ title: t('error'), description: 'Please select an exam', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Fetch attempts for this exam
      const { data: attempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', selectedExamId)
        .not('submitted_at', 'is', null);

      if (attemptsError) throw attemptsError;

      if (!attempts || attempts.length === 0) {
        toast({ title: 'No results', description: 'No completed attempts for this exam', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Get user profiles
      const userIds = attempts.map(a => a.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Prepare export data
      const exportData: ExportData[] = attempts.map(attempt => {
        const profile = profileMap.get(attempt.user_id);
        const sectionScores = (attempt.score_section_json as Record<string, number>) || {};
        
        return {
          name: profile?.name || 'Unknown',
          email: profile?.email || 'Unknown',
          section_1: sectionScores['1'] !== undefined ? `${sectionScores['1'].toFixed(1)}%` : 'N/A',
          section_2: sectionScores['2'] !== undefined ? `${sectionScores['2'].toFixed(1)}%` : 'N/A',
          section_3: sectionScores['3'] !== undefined ? `${sectionScores['3'].toFixed(1)}%` : 'N/A',
          section_4: sectionScores['4'] !== undefined ? `${sectionScores['4'].toFixed(1)}%` : 'N/A',
          total_score: attempt.total_score_250 !== null ? String(Math.round(attempt.total_score_250)) : 'N/A',
          attempt_date: attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'N/A',
        };
      });

      // Generate CSV with formula injection protection
      const headers = ['Name', 'Email', 'Section 1 (%)', 'Section 2 (%)', 'Section 3 (%)', 'Section 4 (%)', 'Total Score (0-250)', 'Date'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => [
          escapeCsv(row.name),
          escapeCsv(row.email),
          row.section_1,
          row.section_2,
          row.section_3,
          row.section_4,
          row.total_score,
          row.attempt_date,
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const exam = exams.find(e => e.id === selectedExamId);
      link.download = `${exam?.title || 'exam'}_results_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({ title: t('success'), description: `Exported ${exportData.length} results` });
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('exportResults')}</h2>
        <p className="text-muted-foreground">Download exam results as CSV</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export to CSV
          </CardTitle>
          <CardDescription>
            Export completed exam attempts with user details and scores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExport} disabled={loading || !selectedExamId} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t('exportResults')}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>The export includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>User name and email</li>
              <li>Section 1-4 percentages</li>
              <li>Total score (0-250 scale)</li>
              <li>Attempt date</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
