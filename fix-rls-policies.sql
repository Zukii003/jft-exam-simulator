-- Fix RLS Policies for Better Access
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active exams" ON exams;
DROP POLICY IF EXISTS "Anyone can view questions for active exams" ON questions;
DROP POLICY IF EXISTS "Users can manage own attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Users can view own assignments" ON user_exam_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON user_exam_assignments;

-- Create simpler policies
CREATE POLICY "Enable all access for profiles" ON profiles
  FOR ALL USING (true);

CREATE POLICY "Enable read access for exams" ON exams
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Enable all access for exam_attempts" ON exam_attempts
  FOR ALL USING (true);

CREATE POLICY "Enable all access for user_exam_assignments" ON user_exam_assignments
  FOR ALL USING (true);

-- Add unique constraint to prevent duplicate attempts
ALTER TABLE exam_attempts 
ADD CONSTRAINT unique_user_exam_active 
UNIQUE (user_id, exam_id, status) 
DEFERRABLE INITIALLY DEFERRED;
