-- Fix Database Schema
-- Run this in Supabase SQL Editor

-- Add missing columns to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS sections_json JSONB DEFAULT '{"sections": [{"name": "Characters & Vocabulary", "time": 25, "questions": 25}, {"name": "Conversation & Expression", "time": 30, "questions": 25}, {"name": "Listening", "time": 30, "questions": 25}, {"name": "Reading", "time": 35, "questions": 25}]}',
ADD COLUMN IF NOT EXISTS language_options JSONB DEFAULT '{"default": "en", "available": ["en", "id", "ja"]}';

-- Add missing column to exam_attempts table
ALTER TABLE exam_attempts 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Update existing exam with sample data
UPDATE exams 
SET 
  sections_json = '{"sections": [{"name": "Characters & Vocabulary", "time": 25, "questions": 25}, {"name": "Conversation & Expression", "time": 30, "questions": 25}, {"name": "Listening", "time": 30, "questions": 25}, {"name": "Reading", "time": 35, "questions": 25}]}',
  language_options = '{"default": "en", "available": ["en", "id", "ja"]}'
WHERE title = 'JFT-Basic Practice Test';

-- Insert sample questions for the exam
INSERT INTO questions (exam_id, question_text, question_type, section_number, question_order, options, correct_answer)
SELECT 
  id,
  'What is the Japanese character for "water"?',
  'multiple_choice',
  1,
  1,
  '["水", "火", "木", "金"]',
  '水'
FROM exams 
WHERE title = 'JFT-Basic Practice Test'
AND NOT EXISTS (
  SELECT 1 FROM questions 
  WHERE exam_id = (SELECT id FROM exams WHERE title = 'JFT-Basic Practice Test')
  LIMIT 1
);
