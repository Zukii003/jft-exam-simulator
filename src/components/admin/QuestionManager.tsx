import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Exam, Question, QuestionType } from '@/types/exam';
import { getSectionTitle } from '@/lib/i18n';
import { Plus, Pencil, Trash2, HelpCircle, Image, Volume2, FileText, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestionManagerProps {
  exams: Exam[];
  selectedExam: Exam | null;
  onSelectExam: (exam: Exam | null) => void;
}

const defaultFormData = {
  section_number: 1,
  category: '',
  type: 'text' as QuestionType,
  content_text: '',
  image_url: '',
  audio_url: '',
  options: ['', '', '', ''],
  correct_answer: '',
};

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  exams,
  selectedExam,
  onSelectExam,
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (selectedExam) {
      fetchQuestions();
    }
  }, [selectedExam]);

  const fetchQuestions = async () => {
    if (!selectedExam) return;
    setLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', selectedExam.id)
      .order('section_number')
      .order('question_order');

    if (data) {
      setQuestions(data.map(q => ({
        ...q,
        options_json: q.options_json as string[],
        type: q.type as QuestionType
      })));
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'audio') => {
    if (!selectedExam) return;
    
    setUploadingFile(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedExam.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('exam-assets')
      .upload(fileName, file);

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
      setUploadingFile(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('exam-assets')
      .getPublicUrl(fileName);

    if (type === 'image') {
      setFormData({ ...formData, image_url: publicUrl });
    } else {
      setFormData({ ...formData, audio_url: publicUrl });
    }
    setUploadingFile(false);
    toast({ title: t('success'), description: 'File uploaded successfully' });
  };

  const handleSave = async () => {
    if (!selectedExam || !formData.content_text.trim() || !formData.category.trim()) {
      toast({ title: t('error'), description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const validOptions = formData.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast({ title: t('error'), description: 'At least 2 options required', variant: 'destructive' });
      return;
    }

    if (!formData.correct_answer) {
      toast({ title: t('error'), description: 'Please select the correct answer', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const questionData = {
      exam_id: selectedExam.id,
      section_number: formData.section_number,
      category: formData.category,
      type: formData.type,
      content_text: formData.content_text,
      image_url: formData.type === 'image' ? formData.image_url : null,
      audio_url: formData.type === 'audio' ? formData.audio_url : null,
      options_json: validOptions,
      correct_answer: formData.correct_answer,
      question_order: editingQuestion ? editingQuestion.question_order : questions.filter(q => q.section_number === formData.section_number).length,
    };

    let error;
    if (editingQuestion) {
      ({ error } = await supabase.from('questions').update(questionData).eq('id', editingQuestion.id));
    } else {
      ({ error } = await supabase.from('questions').insert(questionData));
    }

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: editingQuestion ? 'Question updated' : 'Question created' });
      resetForm();
      fetchQuestions();
    }
    setLoading(false);
  };

  const handleDelete = async (questionId: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: 'Question deleted' });
      fetchQuestions();
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingQuestion(null);
    setIsDialogOpen(false);
  };

  const openEdit = (question: Question) => {
    setEditingQuestion(question);
    const opts = Array.isArray(question.options_json) ? question.options_json : [];
    setFormData({
      section_number: question.section_number,
      category: question.category,
      type: question.type,
      content_text: question.content_text,
      image_url: question.image_url || '',
      audio_url: question.audio_url || '',
      options: [...opts, '', '', '', ''].slice(0, 4),
      correct_answer: question.correct_answer,
    });
    setIsDialogOpen(true);
  };

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Volume2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const groupedQuestions = [1, 2, 3, 4].map(section => ({
    section,
    title: getSectionTitle(section, language),
    questions: questions.filter(q => q.section_number === section),
  }));

  if (!selectedExam) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Select an exam to manage questions</p>
          <Select onValueChange={(value) => {
            const exam = exams.find(e => e.id === value);
            if (exam) onSelectExam(exam);
          }}>
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
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{selectedExam.title}</h2>
            <Button variant="ghost" size="sm" onClick={() => onSelectExam(null)}>
              Change
            </Button>
          </div>
          <p className="text-muted-foreground">{questions.length} questions</p>
        </div>

        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addQuestion')}
        </Button>
      </div>

      {groupedQuestions.map(({ section, title, questions: sectionQuestions }) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="font-jp">{title}</span>
              <Badge variant="secondary">{sectionQuestions.length} questions</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sectionQuestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No questions in this section</p>
            ) : (
              <div className="space-y-2">
                {sectionQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      {index + 1}.
                    </span>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(question.type)}
                    </div>
                    <p className="flex-1 text-sm truncate font-jp">{question.content_text}</p>
                    <Badge variant="outline" className="text-xs">{question.category}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(question)}>
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
                          <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(question.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? t('editQuestion') : t('addQuestion')}</DialogTitle>
            <DialogDescription>Fill in the question details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('section')}</Label>
                <Select
                  value={String(formData.section_number)}
                  onValueChange={(v) => setFormData({ ...formData, section_number: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {getSectionTitle(n, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('questionType')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as QuestionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('category')}</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Kanji, Grammar, Vocabulary"
              />
            </div>

            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={formData.content_text}
                onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                placeholder="Enter the question text"
                rows={3}
                className="font-jp"
              />
            </div>

            {formData.type === 'image' && (
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={uploadingFile}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                  />
                </div>
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="max-h-32 rounded border" />
                )}
              </div>
            )}

            {formData.type === 'audio' && (
              <div className="space-y-2">
                <Label>Audio</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.audio_url}
                    onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                    placeholder="Audio URL"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={uploadingFile}
                    onClick={() => document.getElementById('audio-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'audio')}
                  />
                </div>
                {formData.audio_url && (
                  <audio src={formData.audio_url} controls className="w-full" />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('options')}</Label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-6 text-sm font-medium text-muted-foreground">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 font-jp"
                  />
                  <input
                    type="radio"
                    name="correct"
                    checked={formData.correct_answer === option && option !== ''}
                    onChange={() => setFormData({ ...formData, correct_answer: option })}
                    disabled={!option.trim()}
                    className="w-4 h-4"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? t('loading') : t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
