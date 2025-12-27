// JFT-Basic CBT Simulator - Static Version

// Sample questions data
const questions = [
    {
        id: 1,
        question: "これは何ですか？",
        options: ["これはペンです", "これは本です", "これは机です", "これは椅子です"],
        correct: 0
    },
    {
        id: 2,
        question: "こんにちは",
        options: ["Goodbye", "Hello", "Thank you", "Sorry"],
        correct: 1
    },
    {
        id: 3,
        question: "私は学生です。",
        options: ["I am a teacher", "I am a student", "I am a doctor", "I am a worker"],
        correct: 1
    },
    {
        id: 4,
        question: "今日は何曜日ですか？",
        options: ["月曜日です", "火曜日です", "水曜日です", "木曜日です"],
        correct: 0
    },
    {
        id: 5,
        question: "図書館",
        options: ["Hospital", "School", "Library", "Restaurant"],
        correct: 2
    },
    {
        id: 6,
        question: "おはようございます",
        options: ["Good morning", "Good afternoon", "Good evening", "Good night"],
        correct: 0
    },
    {
        id: 7,
        question: "私は日本人です。",
        options: ["I am Chinese", "I am Korean", "I am Japanese", "I am American"],
        correct: 2
    },
    {
        id: 8,
        question: "これはいくらですか？",
        options: ["What time is it?", "What is this?", "How much is this?", "Where is this?"],
        correct: 2
    },
    {
        id: 9,
        question: "学校",
        options: ["Home", "Hospital", "School", "Office"],
        correct: 2
    },
    {
        id: 10,
        question: "ありがとうございます",
        options: ["Hello", "Goodbye", "Sorry", "Thank you"],
        correct: 3
    }
];

// Global variables
let currentQuestionIndex = 0;
let score = 0;
let answers = [];
let timer = null;
let seconds = 0;

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Start exam
function startExam() {
    currentQuestionIndex = 0;
    score = 0;
    answers = [];
    seconds = 0;
    
    showScreen('exam-screen');
    displayQuestion();
    startTimer();
}

// Display current question
function displayQuestion() {
    const question = questions[currentQuestionIndex];
    
    document.getElementById('question-number').textContent = 
        `Pertanyaan ${currentQuestionIndex + 1} dari ${questions.length}`;
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionDiv);
    });
    
    // Restore selected answer if exists
    if (answers[currentQuestionIndex] !== undefined) {
        const options = document.querySelectorAll('.option');
        options[answers[currentQuestionIndex]].classList.add('selected');
    }
}

// Select option
function selectOption(optionIndex) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
    document.querySelectorAll('.option')[optionIndex].classList.add('selected');
    
    // Save answer
    answers[currentQuestionIndex] = optionIndex;
}

// Timer functions
function startTimer() {
    seconds = 3600; // 60 minutes in seconds
    timer = setInterval(() => {
        if (seconds > 0) {
            seconds--;
            updateTimerDisplay();
        } else {
            stopTimer();
            finishExam(); // Auto finish when time is up
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const display = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    document.getElementById('timer').textContent = display;
}

function stopTimer() {
    clearInterval(timer);
}

// Navigation functions
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function finishExam() {
    stopTimer();
    calculateScore();
    showResults();
}

function calculateScore() {
    score = 0;
    questions.forEach((question, index) => {
        if (answers[index] === question.correct) {
            score++;
        }
    });
}

function showResults() {
    showScreen('results-screen');
    
    const percentage = (score / questions.length) * 100;
    document.getElementById('score-display').textContent = `Score: ${score}/${questions.length}`;
    
    let message = '';
    if (percentage >= 80) {
        message = 'Excellent! You did great!';
    } else if (percentage >= 60) {
        message = 'Good job! Keep practicing!';
    } else if (percentage >= 40) {
        message = 'Not bad! You can do better!';
    } else {
        message = 'Keep practicing! You will improve!';
    }
    
    document.getElementById('result-message').textContent = message;
}

function restartExam() {
    showScreen('welcome-screen');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    showScreen('welcome-screen');
});