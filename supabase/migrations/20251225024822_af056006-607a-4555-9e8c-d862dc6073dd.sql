-- Create exam_assignments table to track which users can take which exams
CREATE TABLE public.exam_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE (user_id, exam_id)
);

-- Enable RLS
ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage assignments"
ON public.exam_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own assignments"
ON public.exam_assignments
FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to delete exam attempts (for reset functionality)
CREATE POLICY "Admins can delete attempts"
ON public.exam_attempts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));