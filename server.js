// JFT-Basic CBT Backend Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jft_cbt',
    password: 'password',
    port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = file.mimetype.startsWith('audio/') ? 'uploads/audio' : 'uploads/images';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// JWT Secret
const JWT_SECRET = 'your-jwt-secret-key';

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
            [name, email, passwordHash]
        );
        
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        
        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        
        res.json({ 
            user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
            token 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exam routes
app.get('/api/exams', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exams ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/exams', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, sections_json, language_options } = req.body;
        
        const result = await pool.query(
            'INSERT INTO exams (title, description, sections_json, language_options, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, JSON.stringify(sections_json), JSON.stringify(language_options), req.user.id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Question routes
app.get('/api/questions', async (req, res) => {
    try {
        const { section_number, exam_id } = req.query;
        
        let query = 'SELECT * FROM questions';
        let params = [];
        
        if (section_number) {
            query += ' WHERE section_number = $1';
            params.push(section_number);
        }
        
        query += ' ORDER BY section_number, created_at';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/questions', authenticateToken, requireAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), async (req, res) => {
    try {
        const { section_number, category, type, content_text, options_json, correct_answer, explanation } = req.body;
        
        const image_url = req.files.image ? `/uploads/images/${req.files.image[0].filename}` : null;
        const audio_url = req.files.audio ? `/uploads/audio/${req.files.audio[0].filename}` : null;
        
        const result = await pool.query(
            'INSERT INTO questions (section_number, category, type, content_text, image_url, audio_url, options_json, correct_answer, explanation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [section_number, category, type, content_text, image_url, audio_url, JSON.stringify(options_json), correct_answer, explanation]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exam attempt routes
app.post('/api/exam-attempts', authenticateToken, async (req, res) => {
    try {
        const { exam_id } = req.body;
        
        // Check if attempt already exists
        const existingAttempt = await pool.query(
            'SELECT id FROM exam_attempts WHERE exam_id = $1 AND user_id = $2',
            [exam_id, req.user.id]
        );
        
        if (existingAttempt.rows.length > 0) {
            return res.status(400).json({ error: 'Exam already attempted' });
        }
        
        const result = await pool.query(
            'INSERT INTO exam_attempts (exam_id, user_id) VALUES ($1, $2) RETURNING *',
            [exam_id, req.user.id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/exam-attempts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attempt not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/exam-attempts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { current_section, answers_json, audio_play_json, section_finished_json } = req.body;
        
        const result = await pool.query(
            'UPDATE exam_attempts SET current_section = $1, answers_json = $2, audio_play_json = $3, section_finished_json = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [current_section, JSON.stringify(answers_json), JSON.stringify(audio_play_json), JSON.stringify(section_finished_json), id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attempt not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/exam-attempts/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { answers_json } = req.body;
        
        // Calculate scores
        const questions = await pool.query('SELECT * FROM questions');
        const answers = JSON.parse(answers_json);
        
        let sectionScores = { 1: 0, 2: 0, 3: 0, 4: 0 };
        let sectionCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        let totalCorrect = 0;
        
        questions.rows.forEach(question => {
            sectionCounts[question.section_number]++;
            if (answers[question.id] === question.correct_answer) {
                sectionScores[question.section_number]++;
                totalCorrect++;
            }
        });
        
        const scoreSectionJson = {};
        for (let section = 1; section <= 4; section++) {
            scoreSectionJson[section] = sectionCounts[section] > 0 
                ? (sectionScores[section] / sectionCounts[section]) * 100 
                : 0;
        }
        
        const totalScore250 = (totalCorrect / questions.rows.length) * 250;
        
        const result = await pool.query(
            'UPDATE exam_attempts SET answers_json = $1, score_section_json = $2, total_score_250 = $3, submitted_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
            [answers_json, JSON.stringify(scoreSectionJson), totalScore250, id, req.user.id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin dashboard routes
app.get('/api/admin/attempts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ea.*, u.name, u.email, e.title 
            FROM exam_attempts ea 
            JOIN users u ON ea.user_id = u.id 
            JOIN exams e ON ea.exam_id = e.id 
            ORDER BY ea.started_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`JFT-Basic CBT Server running on port ${PORT}`);
});
