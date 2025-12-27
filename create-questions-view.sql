-- Create public questions view (hides correct answers)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE VIEW questions_public AS
SELECT 
  id,
  exam_id,
  question_text,
  question_type,
  section_number,
  question_order,
  options,
  audio_url,
  image_url,
  created_at
FROM questions;

-- Grant access to authenticated users
GRANT SELECT ON questions_public TO authenticated;
GRANT SELECT ON questions_public TO anon;
