-- JFT-Basic CBT Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sections_json JSONB NOT NULL,
    language_options JSONB DEFAULT '["id", "en"]',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 4),
    category VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image', 'audio')),
    content_text TEXT,
    image_url VARCHAR(500),
    audio_url VARCHAR(500),
    options_json JSONB NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam attempts table
CREATE TABLE exam_attempts (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    current_section INTEGER DEFAULT 1 CHECK (current_section BETWEEN 1 AND 5),
    answers_json JSONB DEFAULT '{}',
    audio_play_json JSONB DEFAULT '{}',
    section_finished_json JSONB DEFAULT '{}',
    score_section_json JSONB DEFAULT '{}',
    total_score_250 DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    UNIQUE(exam_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_exam_attempts_user_exam ON exam_attempts(user_id, exam_id);
CREATE INDEX idx_questions_section ON questions(section_number);
CREATE INDEX idx_questions_type ON questions(type);

-- RLS Policies (for Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Exams policies
CREATE POLICY "Anyone can view exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Admins can manage exams" ON exams FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Questions policies
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Exam attempts policies
CREATE POLICY "Users can view own attempts" ON exam_attempts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own attempts" ON exam_attempts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own attempts" ON exam_attempts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all attempts" ON exam_attempts FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
