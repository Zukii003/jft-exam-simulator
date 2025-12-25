import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Users, BookOpen, RefreshCw, UserPlus } from 'lucide-react';
import { Exam, Profile } from '@/types/exam';

interface ExamAssignment {
  id: string;
  user_id: string;
  exam_id: string;
  assigned_at: string;
}

interface ExamAttemptInfo {
  id: string;
  exam_id: string;
  user_id: string;
  submitted_at: string | null;
  total_score_250: number | null;
}

interface UserManagerProps {
  exams: Exam[];
}

export const UserManager: React.FC<UserManagerProps> = ({ exams }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [attempts, setAttempts] = useState<ExamAttemptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesData) {
      setUsers(profilesData);
    }

    // Fetch all assignments
    const { data: assignmentsData } = await supabase
      .from('exam_assignments')
      .select('*');
    
    if (assignmentsData) {
      setAssignments(assignmentsData);
    }

    // Fetch all attempts
    const { data: attemptsData } = await supabase
      .from('exam_attempts')
      .select('id, exam_id, user_id, submitted_at, total_score_250');
    
    if (attemptsData) {
      setAttempts(attemptsData);
    }

    setLoading(false);
  };

  const getUserAssignments = (userId: string) => {
    return assignments.filter(a => a.user_id === userId);
  };

  const getUserAttempts = (userId: string) => {
    return attempts.filter(a => a.user_id === userId);
  };

  const getExamTitle = (examId: string) => {
    return exams.find(e => e.id === examId)?.title || 'Unknown Exam';
  };

  const handleAssignExam = async () => {
    if (!selectedUser || !selectedExamId) return;

    const { error } = await supabase.from('exam_assignments').insert({
      user_id: selectedUser.user_id,
      exam_id: selectedExamId,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'User already assigned to this exam', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Success', description: 'Exam assigned successfully' });
    setAssignDialogOpen(false);
    setSelectedExamId('');
    fetchData();
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from('exam_assignments').delete().eq('id', assignmentId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Assignment removed' });
    fetchData();
  };

  const handleResetExam = async (userId: string, examId: string) => {
    // Delete the attempt
    const { error } = await supabase
      .from('exam_attempts')
      .delete()
      .eq('user_id', userId)
      .eq('exam_id', examId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Exam reset successfully. User can retake the exam.' });
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">{t('loading')}</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Registered Users ({users.length})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No registered users yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Assigned Exams</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userAssignments = getUserAssignments(user.user_id);
                const userAttempts = getUserAttempts(user.user_id);

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userAssignments.length === 0 ? (
                          <span className="text-muted-foreground text-sm">None</span>
                        ) : (
                          userAssignments.map((assignment) => (
                            <Badge 
                              key={assignment.id} 
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              title="Click to remove"
                            >
                              {getExamTitle(assignment.exam_id)} ×
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {userAttempts.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No attempts</span>
                        ) : (
                          userAttempts.map((attempt) => (
                            <div key={attempt.id} className="flex items-center gap-2">
                              <Badge variant={attempt.submitted_at ? 'default' : 'outline'}>
                                {getExamTitle(attempt.exam_id)}
                                {attempt.submitted_at && attempt.total_score_250 !== null && (
                                  <span className="ml-1">({attempt.total_score_250}/250)</span>
                                )}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-destructive"
                                onClick={() => handleResetExam(user.user_id, attempt.exam_id)}
                                title="Reset exam"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog open={assignDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setAssignDialogOpen(open);
                        if (open) setSelectedUser(user);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <UserPlus className="h-4 w-4" />
                            Assign Exam
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Exam to {user.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                              <SelectTrigger>
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
                            <Button 
                              onClick={handleAssignExam} 
                              className="w-full"
                              disabled={!selectedExamId}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Assign Exam
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
