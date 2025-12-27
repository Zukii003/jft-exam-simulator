-- Setup JFT-Basic CBT Database (Safe Version)
-- Run this script in Supabase SQL Editor

-- Create tables if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  section_number INTEGER DEFAULT 1,
  question_order INTEGER,
  options JSONB,
  correct_answer TEXT,
  audio_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress',
  score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  answers_json JSONB,
  current_section INTEGER DEFAULT 1,
  current_question_index INTEGER DEFAULT 0,
  audio_play_json JSONB DEFAULT '{}',
  section_finished_json JSONB DEFAULT '{}',
  section_times_json JSONB DEFAULT '{}',
  flagged_questions TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_exam_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  attempts_allowed INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS if not enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'exams' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'questions' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'exam_attempts' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'user_exam_assignments' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE user_exam_assignments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if not exists
DO $$
BEGIN
    -- Profiles policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    -- Exams policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'exams' 
        AND policyname = 'Anyone can view active exams'
    ) THEN
        CREATE POLICY "Anyone can view active exams" ON exams
          FOR SELECT USING (is_active = true);
    END IF;
    
    -- Questions policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'questions' 
        AND policyname = 'Anyone can view questions for active exams'
    ) THEN
        CREATE POLICY "Anyone can view questions for active exams" ON questions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM exams 
              WHERE exams.id = questions.exam_id 
              AND exams.is_active = true
            )
          );
    END IF;
    
    -- Exam attempts policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'exam_attempts' 
        AND policyname = 'Users can manage own attempts'
    ) THEN
        CREATE POLICY "Users can manage own attempts" ON exam_attempts
          FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- User exam assignments policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_exam_assignments' 
        AND policyname = 'Users can view own assignments'
    ) THEN
        CREATE POLICY "Users can view own assignments" ON user_exam_assignments
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_exam_assignments' 
        AND policyname = 'Admins can manage assignments'
    ) THEN
        CREATE POLICY "Admins can manage assignments" ON user_exam_assignments
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
            )
          );
    END IF;
END $$;

-- Insert sample exam if not exists
INSERT INTO exams (title, description, duration_minutes) 
SELECT 'JFT-Basic Practice Test', 'Japanese Language Proficiency Test Simulation', 120
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = 'JFT-Basic Practice Test'
);

-- Create function if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) THEN
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, name)
          VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
END $$;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE OR REPLACE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Create updated_at function if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Create updated_at trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON profiles
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
