-- Disable RLS for Development
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_assignments DISABLE ROW LEVEL SECURITY;

-- Remove unique constraint that might cause conflicts
ALTER TABLE exam_attempts DROP CONSTRAINT IF EXISTS unique_user_exam_active;
