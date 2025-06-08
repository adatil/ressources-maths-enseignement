const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Stockage en mémoire (remplacer par une base de données en production)
let quizzes = new Map();
let activeQuiz = null;
let participants = new Map();
let questions = [];
let currentQuestionIndex = 0;
let questionStartTime = 0;

// Charger les questions depuis les fichiers JSON
function loadQuestions() {
    const questionsDir = path.join(__dirname, '../questions');
    const questionFiles = fs.readdirSync(questionsDir).filter(file => file.endsWith('.json'));
    
    for (const file of questionFiles) {
        const filePath = path.join(questionsDir, file);
        const questionsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        questions.push(...questionsData.questions);
    }
    
    console.log(`Chargé ${questions.length} questions`);
}

// Routes principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/teacher.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/student.html'));
});

app.get('/quiz/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/quiz.html'));
});

// API Routes
app.post('/api/quiz/create', (req, res) => {
    const { title, level, chapter, questionCount, timePerQuestion } = req.body;
    
    const quizId = crypto.randomBytes(6).toString('hex').toUpperCase();
    const quiz = {
        id: quizId,
        title,
        level,
        chapter,
        questionCount: parseInt(questionCount),
        timePerQuestion: parseInt(timePerQuestion),
        questions: selectRandomQuestions(level, chapter, questionCount),
        participants: new Map(),
        isActive: false,
        currentQuestion: 0,
        startTime: null
    };
    
    quizzes.set(quizId, quiz);
    activeQuiz = quiz;
    
    res.json({ success: true, quizId, quiz });
});

app.get('/api/quiz/:id', (req, res) => {
    const quiz = quizzes.get(req.params.id);
    if (!quiz) {
        return res.status(404).json({ error: 'Quiz non trouvé' });
    }
    res.json(quiz);
});

app.get('/api/questions', (req, res) => {
    const { level, chapter } = req.query;
    const filteredQuestions = questions.filter(q => 
        (!level || q.level === level) && 
        (!chapter || q.chapter === chapter)
    );
    res.json(filteredQuestions);
});

function selectRandomQuestions(level, chapter, count) {
    const filtered = questions.filter(q => 
        q.level === level && q.chapter === chapter
    );
    
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Socket.IO pour la communication temps réel
io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté:', socket.id);
    
    // Rejoindre un quiz (étudiant)
    socket.on('join-quiz', (data) => {
        const { quizId, studentName } = data;
        const quiz = quizzes.get(quizId);
        
        if (!quiz) {
            socket.emit('error', { message: 'Quiz non trouvé' });
            return;
        }
        
        socket.join(quizId);
        socket.quizId = quizId;
        socket.studentName = studentName;
        
        const participant = {
            id: socket.id,
            name: studentName,
            score: 0,
            answers: []
        };
        
        quiz.participants.set(socket.id, participant);
        participants.set(socket.id, participant);
        
        socket.emit('quiz-joined', { quiz, participant });
        
        // Informer l'enseignant
        io.to(quizId).emit('participant-joined', {
            participant,
            totalParticipants: quiz.participants.size
        });
    });
    
    // Commencer le quiz (enseignant)
    socket.on('start-quiz', (quizId) => {
        const quiz = quizzes.get(quizId);
        if (!quiz) return;
        
        quiz.isActive = true;
        quiz.currentQuestion = 0;
        quiz.startTime = Date.now();
        
        // Envoyer la première question
        sendQuestion(quiz);
    });
    
    // Réponse d'un étudiant
    socket.on('submit-answer', (data) => {
        const { answer, timeToAnswer } = data;
        const participant = participants.get(socket.id);
        const quiz = quizzes.get(socket.quizId);
        
        if (!participant || !quiz) return;
        
        const currentQuestion = quiz.questions[quiz.currentQuestion];
        const isCorrect = answer === currentQuestion.correct;
        
        // Calculer le score (bonus pour la rapidité)
        let points = 0;
        if (isCorrect) {
            const timeBonus = Math.max(0, (quiz.timePerQuestion - timeToAnswer) / quiz.timePerQuestion);
            points = Math.round(1000 + (timeBonus * 500));
        }
        
        participant.score += points;
        participant.answers.push({
            questionIndex: quiz.currentQuestion,
            answer,
            isCorrect,
            points,
            timeToAnswer
        });
        
        socket.emit('answer-result', {
            isCorrect,
            points,
            totalScore: participant.score,
            correctAnswer: currentQuestion.correct
        });
    });
    
    // Question suivante (enseignant)
    socket.on('next-question', (quizId) => {
        const quiz = quizzes.get(quizId);
        if (!quiz) return;
        
        quiz.currentQuestion++;
        
        if (quiz.currentQuestion >= quiz.questions.length) {
            // Quiz terminé
            endQuiz(quiz);
        } else {
            sendQuestion(quiz);
        }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        if (socket.quizId && socket.studentName) {
            const quiz = quizzes.get(socket.quizId);
            if (quiz) {
                quiz.participants.delete(socket.id);
                participants.delete(socket.id);
                
                io.to(socket.quizId).emit('participant-left', {
                    participantId: socket.id,
                    totalParticipants: quiz.participants.size
                });
            }
        }
    });
});

function sendQuestion(quiz) {
    const question = quiz.questions[quiz.currentQuestion];
    const questionData = {
        questionNumber: quiz.currentQuestion + 1,
        totalQuestions: quiz.questions.length,
        question: question.question,
        options: question.options,
        timeLimit: quiz.timePerQuestion
    };
    
    questionStartTime = Date.now();
    
    io.to(quiz.id).emit('new-question', questionData);
}

function endQuiz(quiz) {
    const results = Array.from(quiz.participants.values())
        .sort((a, b) => b.score - a.score);
    
    io.to(quiz.id).emit('quiz-ended', { results });
    quiz.isActive = false;
}

// Initialisation
loadQuestions();

server.listen(PORT, () => {
    console.log(`🎯 MathQuiz Pro démarré sur http://localhost:${PORT}`);
    console.log(`📚 Interface enseignant: http://localhost:${PORT}/teacher`);
    console.log(`👨‍🎓 Interface élève: http://localhost:${PORT}/student`);
});

module.exports = app;