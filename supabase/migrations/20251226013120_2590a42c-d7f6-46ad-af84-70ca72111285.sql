-- Create a secure view that hides correct_answer from non-admin users
CREATE OR REPLACE VIEW public.questions_public AS
SELECT 
  id,
  exam_id,
  section_number,
  question_order,
  type,
  category,
  content_text,
  options_json,
  image_url,
  audio_url,
  explanation,
  created_at,
  -- Only show correct_answer to admins
  CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN correct_answer ELSE NULL END as correct_answer
FROM public.questions;

-- Grant access to the view
GRANT SELECT ON public.questions_public TO authenticated;

-- Create a secure function to calculate and submit exam score server-side
CREATE OR REPLACE FUNCTION public.submit_exam_score(p_attempt_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exam_id uuid;
  v_answers jsonb;
  v_section_scores jsonb := '{}';
  v_total_correct int := 0;
  v_total_questions int := 0;
  v_section int;
  v_section_questions int;
  v_section_correct int;
  v_total_score numeric;
  v_question record;
BEGIN
  -- Get attempt details and verify ownership
  SELECT user_id, exam_id, answers_json
  INTO v_user_id, v_exam_id, v_answers
  FROM exam_attempts
  WHERE id = p_attempt_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  
  -- Verify the user owns this attempt
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only submit your own exam';
  END IF;
  
  -- Calculate scores for each section
  FOR v_section IN 1..4 LOOP
    v_section_questions := 0;
    v_section_correct := 0;
    
    FOR v_question IN 
      SELECT id, correct_answer 
      FROM questions 
      WHERE exam_id = v_exam_id AND section_number = v_section
    LOOP
      v_section_questions := v_section_questions + 1;
      
      -- Check if answer matches
      IF v_answers ? v_question.id::text AND 
         (v_answers ->> v_question.id::text) = v_question.correct_answer THEN
        v_section_correct := v_section_correct + 1;
      END IF;
    END LOOP;
    
    -- Calculate section percentage
    IF v_section_questions > 0 THEN
      v_section_scores := v_section_scores || 
        jsonb_build_object(v_section::text, ROUND((v_section_correct::numeric / v_section_questions) * 100, 2));
    ELSE
      v_section_scores := v_section_scores || jsonb_build_object(v_section::text, 0);
    END IF;
    
    v_total_correct := v_total_correct + v_section_correct;
    v_total_questions := v_total_questions + v_section_questions;
  END LOOP;
  
  -- Calculate total score (out of 250)
  IF v_total_questions > 0 THEN
    v_total_score := ROUND((v_total_correct::numeric / v_total_questions) * 250, 2);
  ELSE
    v_total_score := 0;
  END IF;
  
  -- Update the attempt with calculated scores
  UPDATE exam_attempts
  SET 
    section_finished_json = '{"1": true, "2": true, "3": true, "4": true}'::jsonb,
    score_section_json = v_section_scores,
    total_score_250 = v_total_score,
    submitted_at = now()
  WHERE id = p_attempt_id;
  
  RETURN json_build_object(
    'success', true,
    'section_scores', v_section_scores,
    'total_score', v_total_score
  );
END;
$$;