import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Exam } from '@/types/exam';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';

interface ExamManagerProps {
  exams: Exam[];
  onExamsChange: () => void;
  onSelectExam: (exam: Exam) => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  onExamsChange,
  onSelectExam,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: t('error'), description: 'Title is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('exams').insert({
      title: formData.title,
      description: formData.description || null,
    });

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: 'Exam created successfully' });
      setFormData({ title: '', description: '' });
      setIsCreateOpen(false);
      onExamsChange();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingExam || !formData.title.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('exams')
      .update({ title: formData.title, description: formData.description || null })
      .eq('id', editingExam.id);

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: 'Exam updated successfully' });
      setEditingExam(null);
      setFormData({ title: '', description: '' });
      onExamsChange();
    }
    setLoading(false);
  };

  const handleDelete = async (examId: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', examId);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: 'Exam deleted successfully' });
      onExamsChange();
    }
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({ title: exam.title, description: exam.description || '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('exams')}</h2>
          <p className="text-muted-foreground">Manage your exams and their settings</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('createExam')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createExam')}</DialogTitle>
              <DialogDescription>Create a new exam with 4 sections</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('examTitle')}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="JFT-Basic Practice Test 1"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Practice test for Japanese Language Proficiency"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? t('loading') : t('createExam')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noExams')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="admin-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{exam.title}</span>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {exam.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectExam(exam)}
                    className="flex-1"
                  >
                    Manage Questions
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(exam)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the exam and all its questions. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(exam.id)}>
                          {t('deleteExam')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingExam} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editExam')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('examTitle')}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              {loading ? t('loading') : t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
