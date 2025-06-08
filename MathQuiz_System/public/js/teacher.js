// Interface Enseignant - MathQuiz Pro
class TeacherInterface {
    constructor() {
        this.socket = io();
        this.currentQuiz = null;
        this.participants = new Map();
        this.questionTimer = null;
        
        this.initializeEventListeners();
        this.setupSocketEvents();
    }

    initializeEventListeners() {
        // Navigation entre onglets
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = e.currentTarget.id;
                this.switchTab(targetTab);
            });
        });

        // Formulaire de création de quiz
        document.getElementById('createQuizForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createQuiz();
        });

        // Contrôles de quiz
        document.getElementById('startQuizBtn')?.addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('nextQuestionBtn')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('endQuizBtn')?.addEventListener('click', () => {
            this.endQuiz();
        });

        // Mise à jour automatique des chapitres selon le niveau
        document.getElementById('quizLevel').addEventListener('change', (e) => {
            this.updateChapterOptions(e.target.value);
        });
    }

    setupSocketEvents() {
        this.socket.on('participant-joined', (data) => {
            this.addParticipant(data.participant);
            this.updateParticipantCount(data.totalParticipants);
        });

        this.socket.on('participant-left', (data) => {
            this.removeParticipant(data.participantId);
            this.updateParticipantCount(data.totalParticipants);
        });

        this.socket.on('quiz-ended', (data) => {
            this.displayQuizResults(data.results);
        });
    }

    switchTab(tabId) {
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        // Afficher la section correspondante
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const sectionMap = {
            'createTab': 'createSection',
            'manageTab': 'manageSection',
            'statisticsTab': 'statisticsSection'
        };

        const targetSection = sectionMap[tabId];
        if (targetSection) {
            document.getElementById(targetSection).classList.add('active');
        }
    }

    updateChapterOptions(level) {
        const chapterSelect = document.getElementById('quizChapter');
        
        // Chapitres par niveau (adaptés à votre structure)
        const chaptersByLevel = {
            '6ème': ['Nombres_et_calculs', 'Géométrie', 'Stats_et_probabilités'],
            '5ème': ['Nombres_et_calculs', 'Géométrie', 'Stats_et_probabilités'],
            '4ème': ['Nombres_et_calculs', 'Géométrie', 'Stats_et_probabilités'],
            '3ème': ['Nombres_et_calculs', 'Géométrie', 'Fonctions', 'Stats_et_probabilités', 'Algorithmique'],
            'Seconde': ['Nombres_et_calculs', 'Géométrie', 'Fonctions', 'Stats_et_probabilités', 'Algorithmique'],
            'Première_Spé': ['Fonctions', 'Géométrie', 'Stats_et_probabilités', 'Algorithmique'],
            'Terminale_Spé': ['Fonctions', 'Géométrie', 'Stats_et_probabilités', 'Algorithmique']
        };

        // Vider les options existantes
        chapterSelect.innerHTML = '<option value="">Sélectionner un chapitre</option>';

        // Ajouter les chapitres pour le niveau sélectionné
        if (chaptersByLevel[level]) {
            chaptersByLevel[level].forEach(chapter => {
                const option = document.createElement('option');
                option.value = chapter;
                option.textContent = this.formatChapterName(chapter);
                chapterSelect.appendChild(option);
            });
        }
    }

    formatChapterName(chapter) {
        return chapter.replace(/_/g, ' ').replace(/et/g, '&');
    }

    async previewQuestions() {
        const form = document.getElementById('createQuizForm');
        const formData = new FormData(form);
        
        const level = formData.get('level');
        const chapter = formData.get('chapter');
        const questionCount = formData.get('questionCount');

        if (!level || !chapter) {
            this.showError('Veuillez sélectionner un niveau et un chapitre');
            return;
        }

        try {
            const response = await fetch(`/api/questions?level=${level}&chapter=${chapter}`);
            const questions = await response.json();

            if (questions.length === 0) {
                this.showError('Aucune question disponible pour cette combinaison niveau/chapitre');
                return;
            }

            this.displayQuestionsPreview(questions.slice(0, questionCount), level, chapter);
        } catch (error) {
            this.showError('Erreur lors du chargement des questions');
        }
    }

    displayQuestionsPreview(questions, level, chapter) {
        const previewContainer = document.getElementById('questionsPreview');
        
        previewContainer.innerHTML = `
            <div class="preview-header">
                <h4>Aperçu des Questions</h4>
                <p><strong>Niveau:</strong> ${level} • <strong>Chapitre:</strong> ${this.formatChapterName(chapter)}</p>
                <p><strong>Nombre de questions:</strong> ${questions.length}</p>
            </div>
        `;

        questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'preview-question';
            questionElement.innerHTML = `
                <div class="question-header">
                    <strong>Question ${index + 1}:</strong>
                    <span class="difficulty-badge difficulty-${question.difficulty || 'medium'}">
                        ${question.difficulty || 'Medium'}
                    </span>
                </div>
                <div class="question-text">${question.question}</div>
                <div class="question-options">
                    ${question.options.map((option, i) => `
                        <div class="option ${i === question.correct ? 'correct-option' : ''}">
                            ${String.fromCharCode(65 + i)}. ${option}
                        </div>
                    `).join('')}
                </div>
            `;
            previewContainer.appendChild(questionElement);
        });

        document.getElementById('previewModal').classList.add('show');
    }

    closePreviewModal() {
        document.getElementById('previewModal').classList.remove('show');
    }

    createQuizFromPreview() {
        this.closePreviewModal();
        this.createQuiz();
    }

    async createQuiz() {
        const form = document.getElementById('createQuizForm');
        const formData = new FormData(form);
        
        const quizData = {
            title: formData.get('title'),
            level: formData.get('level'),
            chapter: formData.get('chapter'),
            questionCount: formData.get('questionCount'),
            timePerQuestion: formData.get('timePerQuestion'),
            description: formData.get('description')
        };

        // Validation
        if (!quizData.title || !quizData.level || !quizData.chapter) {
            this.showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            const response = await fetch('/api/quiz/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quizData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentQuiz = result.quiz;
                this.setupQuizManager(result.quiz);
                this.switchTab('manageTab');
                this.showSuccess(`Quiz créé avec succès ! Code: ${result.quizId}`);
            } else {
                this.showError('Erreur lors de la création du quiz');
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    }

    setupQuizManager(quiz) {
        // Cacher le message "aucun quiz"
        document.getElementById('noActiveQuiz').classList.add('hidden');
        document.getElementById('activeQuizManager').classList.remove('hidden');

        // Mettre à jour les informations du quiz
        document.getElementById('activeQuizTitle').textContent = quiz.title;
        document.getElementById('quizCode').textContent = quiz.id;
        
        // Réinitialiser les contrôles
        document.getElementById('startQuizBtn').classList.remove('hidden');
        document.getElementById('nextQuestionBtn').classList.add('hidden');
        document.getElementById('endQuizBtn').classList.add('hidden');
        
        // Vider la liste des participants
        this.participants.clear();
        this.updateParticipantsList();
        this.updateParticipantCount(0);
    }

    startQuiz() {
        if (!this.currentQuiz) return;
        
        this.socket.emit('start-quiz', this.currentQuiz.id);
        
        // Mettre à jour l'interface
        document.getElementById('startQuizBtn').classList.add('hidden');
        document.getElementById('nextQuestionBtn').classList.remove('hidden');
        document.getElementById('endQuizBtn').classList.remove('hidden');
        
        this.showSuccess('Quiz démarré !');
        this.updateCurrentQuestion(1);
        this.startQuestionTimer();
    }

    nextQuestion() {
        if (!this.currentQuiz) return;
        
        this.socket.emit('next-question', this.currentQuiz.id);
        this.updateCurrentQuestion(this.currentQuiz.currentQuestion + 1);
        this.startQuestionTimer();
    }

    endQuiz() {
        if (!this.currentQuiz) return;
        
        if (confirm('Êtes-vous sûr de vouloir terminer le quiz ?')) {
            this.socket.emit('end-quiz', this.currentQuiz.id);
            this.resetQuizManager();
            this.showSuccess('Quiz terminé !');
        }
    }

    startQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
        
        let timeLeft = this.currentQuiz.timePerQuestion;
        document.getElementById('timeRemaining').textContent = timeLeft + 's';
        
        this.questionTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('timeRemaining').textContent = timeLeft + 's';
            
            if (timeLeft <= 0) {
                clearInterval(this.questionTimer);
                document.getElementById('timeRemaining').textContent = 'Terminé';
            }
        }, 1000);
    }

    updateCurrentQuestion(questionNum) {
        document.getElementById('currentQuestionNum').textContent = questionNum;
        
        if (this.currentQuiz && this.currentQuiz.questions) {
            const question = this.currentQuiz.questions[questionNum - 1];
            if (question) {
                document.getElementById('currentQuestionText').textContent = question.question;
            }
        }
    }

    addParticipant(participant) {
        this.participants.set(participant.id, participant);
        this.updateParticipantsList();
    }

    removeParticipant(participantId) {
        this.participants.delete(participantId);
        this.updateParticipantsList();
    }

    updateParticipantsList() {
        const container = document.getElementById('participantsList');
        
        if (this.participants.size === 0) {
            container.innerHTML = '<div class="no-participants">Aucun participant connecté</div>';
            return;
        }

        container.innerHTML = Array.from(this.participants.values())
            .map(participant => `
                <div class="participant-card">
                    <div class="participant-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="participant-info">
                        <span class="participant-name">${participant.name}</span>
                        <span class="participant-score">${participant.score || 0} pts</span>
                    </div>
                    <div class="participant-status online">
                        <i class="fas fa-circle"></i>
                    </div>
                </div>
            `).join('');
    }

    updateParticipantCount(count) {
        document.getElementById('participantCount').textContent = count;
    }

    resetQuizManager() {
        document.getElementById('noActiveQuiz').classList.remove('hidden');
        document.getElementById('activeQuizManager').classList.add('hidden');
        
        this.currentQuiz = null;
        this.participants.clear();
        
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
    }

    displayQuizResults(results) {
        // Afficher les résultats dans la section statistiques
        this.switchTab('statisticsTab');
        
        // Mettre à jour le tableau des résultats
        // Cette fonctionnalité sera étendue selon vos besoins
        console.log('Résultats du quiz:', results);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Suppression automatique
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 4000);
    }
}

// Fonctions globales pour les événements onclick
window.switchTab = function(tabId) {
    teacher.switchTab(tabId);
};

window.previewQuestions = function() {
    teacher.previewQuestions();
};

window.closePreviewModal = function() {
    teacher.closePreviewModal();
};

window.createQuizFromPreview = function() {
    teacher.createQuizFromPreview();
};

// Initialisation
const teacher = new TeacherInterface();

// Styles CSS additionnels pour les notifications
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    background: linear-gradient(135deg, #48bb78, #38a169);
}

.notification-error {
    background: linear-gradient(135deg, #f56565, #e53e3e);
}

.notification-info {
    background: linear-gradient(135deg, #4299e1, #3182ce);
}

.teacher-nav {
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.nav-links {
    display: flex;
    gap: 2rem;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: var(--text-secondary);
    border-radius: 8px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.nav-link:hover {
    background: var(--light-bg);
    color: var(--primary-color);
}

.nav-link.active {
    background: var(--primary-color);
    color: white;
}

.teacher-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.section {
    display: none;
}

.section.active {
    display: block;
}

.section-header {
    text-align: center;
    margin-bottom: 3rem;
}

.section-header h2 {
    font-size: 2.5rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.section-header p {
    font-size: 1.2rem;
    color: var(--text-secondary);
}

.quiz-form {
    background: white;
    border-radius: var(--border-radius);
    padding: 3rem;
    box-shadow: var(--shadow-lg);
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.modal.show {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: white;
    border-radius: var(--border-radius);
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    width: 90%;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    border-bottom: 1px solid #e2e8f0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.modal-body {
    padding: 2rem;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 2rem;
    border-top: 1px solid #e2e8f0;
}

.preview-question {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.difficulty-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.difficulty-easy { background: #c6f6d5; color: #22543d; }
.difficulty-medium { background: #fed7aa; color: #9c4221; }
.difficulty-hard { background: #fecaca; color: #991b1b; }

.question-options {
    margin-top: 1rem;
}

.option {
    padding: 0.75rem;
    margin: 0.5rem 0;
    border-radius: 6px;
    background: #f8f9fa;
}

.correct-option {
    background: #c6f6d5;
    color: #22543d;
    font-weight: 600;
}

.no-quiz-message {
    text-align: center;
    padding: 4rem 2rem;
}

.empty-state {
    background: white;
    border-radius: var(--border-radius);
    padding: 3rem;
    box-shadow: var(--shadow-md);
}

.empty-state i {
    font-size: 4rem;
    color: var(--text-light);
    margin-bottom: 1rem;
}

.quiz-info-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: var(--shadow-md);
}

.quiz-header-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.quiz-meta {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.quiz-code {
    background: var(--light-bg);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-family: monospace;
}

.quiz-controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.live-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: var(--shadow-sm);
}

.stat-card i {
    font-size: 2rem;
    color: var(--primary-color);
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.participants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.participant-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
}

.participant-avatar {
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.participant-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.participant-name {
    font-weight: 600;
    color: var(--text-primary);
}

.participant-score {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.participant-status {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.participant-status.online {
    color: var(--success-color);
}

@media (max-width: 768px) {
    .nav-container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-links {
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .quiz-header-info {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .quiz-meta {
        flex-direction: column;
        gap: 1rem;
    }
    
    .quiz-controls {
        flex-direction: column;
    }
}
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);