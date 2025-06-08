// Interface Élève - MathQuiz Pro
class StudentInterface {
    constructor() {
        this.socket = io();
        this.currentQuiz = null;
        this.currentQuestion = null;
        this.playerData = {
            name: '',
            score: 0,
            answers: [],
            correctAnswers: 0,
            totalTime: 0
        };
        this.questionStartTime = 0;
        this.timer = null;
        
        this.initializeEventListeners();
        this.setupSocketEvents();
    }

    initializeEventListeners() {
        // Formulaire de connexion au quiz
        document.getElementById('joinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinQuiz();
        });

        // Formatage automatique du code quiz
        document.getElementById('quizCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }

    setupSocketEvents() {
        this.socket.on('quiz-joined', (data) => {
            this.currentQuiz = data.quiz;
            this.playerData.name = data.participant.name;
            this.showWaitingScreen();
        });

        this.socket.on('participant-joined', (data) => {
            this.updateParticipantCount(data.totalParticipants);
        });

        this.socket.on('participant-left', (data) => {
            this.updateParticipantCount(data.totalParticipants);
        });

        this.socket.on('new-question', (data) => {
            this.displayQuestion(data);
        });

        this.socket.on('answer-result', (data) => {
            this.showAnswerResult(data);
        });

        this.socket.on('quiz-ended', (data) => {
            this.showFinalResults(data.results);
        });

        this.socket.on('error', (data) => {
            this.showError(data.message);
        });
    }

    joinQuiz() {
        const quizCode = document.getElementById('quizCode').value.trim();
        const studentName = document.getElementById('studentName').value.trim();

        if (!quizCode || !studentName) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        if (quizCode.length !== 6) {
            this.showError('Le code doit contenir 6 caractères');
            return;
        }

        // Tentative de connexion
        this.socket.emit('join-quiz', {
            quizId: quizCode,
            studentName: studentName
        });

        // Afficher un indicateur de chargement
        this.showLoadingState();
    }

    showLoadingState() {
        const joinBtn = document.querySelector('.join-btn');
        joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        joinBtn.disabled = true;
    }

    showWaitingScreen() {
        document.getElementById('joinScreen').classList.add('hidden');
        document.getElementById('waitingScreen').classList.remove('hidden');

        // Mettre à jour les informations du quiz
        document.getElementById('waitingQuizTitle').textContent = this.currentQuiz.title;
        document.getElementById('waitingQuizLevel').textContent = this.currentQuiz.level;
        document.getElementById('waitingQuizChapter').textContent = this.formatChapterName(this.currentQuiz.chapter);
        document.getElementById('waitingQuestionCount').textContent = `${this.currentQuiz.questionCount} questions`;

        this.startWaitingAnimation();
    }

    startWaitingAnimation() {
        // Animation des anneaux de pulse
        const rings = document.querySelectorAll('.pulse-ring');
        rings.forEach((ring, index) => {
            ring.style.animationDelay = `${index * 0.3}s`;
        });
    }

    displayQuestion(questionData) {
        this.currentQuestion = questionData;
        this.questionStartTime = Date.now();

        // Cacher l'écran d'attente et afficher le quiz
        document.getElementById('waitingScreen').classList.add('hidden');
        document.getElementById('answerResultScreen').classList.add('hidden');
        document.getElementById('quizScreen').classList.remove('hidden');

        // Mettre à jour la progression
        document.getElementById('questionNumber').textContent = `Question ${questionData.questionNumber}`;
        document.getElementById('totalQuestions').textContent = `/ ${questionData.totalQuestions}`;
        
        const progress = (questionData.questionNumber - 1) / questionData.totalQuestions * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        // Afficher la question
        document.getElementById('questionText').textContent = questionData.question;

        // Créer les options de réponse
        this.createAnswerOptions(questionData.options);

        // Démarrer le timer
        this.startTimer(questionData.timeLimit);

        // Mettre à jour le score actuel
        document.getElementById('currentScore').textContent = this.playerData.score;
    }

    createAnswerOptions(options) {
        const container = document.getElementById('answersGrid');
        container.innerHTML = '';

        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-option';
            button.innerHTML = `
                <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;
            
            button.addEventListener('click', () => {
                this.selectAnswer(index, button);
            });

            container.appendChild(button);
        });
    }

    selectAnswer(answerIndex, buttonElement) {
        // Désactiver tous les boutons
        document.querySelectorAll('.answer-option').forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('selected');
        });

        // Marquer la réponse sélectionnée
        buttonElement.classList.add('selected');

        // Calculer le temps de réponse
        const timeToAnswer = (Date.now() - this.questionStartTime) / 1000;

        // Envoyer la réponse
        this.socket.emit('submit-answer', {
            answer: answerIndex,
            timeToAnswer: timeToAnswer
        });

        // Arrêter le timer
        this.stopTimer();
    }

    startTimer(timeLimit) {
        let timeLeft = timeLimit;
        const timerElement = document.getElementById('timer');
        
        timerElement.textContent = timeLeft;
        timerElement.className = 'timer';

        this.timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;

            // Changer la couleur selon le temps restant
            if (timeLeft <= 5) {
                timerElement.className = 'timer danger';
            } else if (timeLeft <= 10) {
                timerElement.className = 'timer warning';
            }

            if (timeLeft <= 0) {
                this.stopTimer();
                this.timeUp();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    timeUp() {
        // Désactiver toutes les réponses
        document.querySelectorAll('.answer-option').forEach(btn => {
            btn.disabled = true;
        });

        // Envoyer une réponse vide
        this.socket.emit('submit-answer', {
            answer: -1, // Pas de réponse
            timeToAnswer: this.currentQuestion.timeLimit
        });
    }

    showAnswerResult(result) {
        document.getElementById('quizScreen').classList.add('hidden');
        document.getElementById('answerResultScreen').classList.remove('hidden');

        const resultIcon = document.getElementById('resultIcon');
        const resultMessage = document.getElementById('resultMessage');
        const pointsEarned = document.getElementById('pointsEarned');
        const totalScore = document.getElementById('resultTotalScore');

        if (result.isCorrect) {
            resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            resultIcon.className = 'result-icon correct';
            resultMessage.textContent = 'Excellente réponse !';
            resultMessage.className = 'result-message correct';
        } else {
            resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            resultIcon.className = 'result-icon incorrect';
            resultMessage.textContent = 'Pas cette fois...';
            resultMessage.className = 'result-message incorrect';
        }

        pointsEarned.textContent = `+${result.points}`;
        this.playerData.score = result.totalScore;
        totalScore.textContent = result.totalScore;

        // Afficher la bonne réponse si nécessaire
        if (!result.isCorrect) {
            const correctAnswerDisplay = document.getElementById('correctAnswerDisplay');
            correctAnswerDisplay.innerHTML = `
                <div class="correct-answer-info">
                    <i class="fas fa-lightbulb"></i>
                    <span>La bonne réponse était: ${String.fromCharCode(65 + result.correctAnswer)}</span>
                </div>
            `;
            correctAnswerDisplay.style.display = 'block';
        } else {
            document.getElementById('correctAnswerDisplay').style.display = 'none';
        }

        // Mettre à jour les statistiques
        this.updatePlayerStats(result);

        // Cacher automatiquement après 3 secondes
        setTimeout(() => {
            document.getElementById('answerResultScreen').classList.add('hidden');
        }, 3000);
    }

    updatePlayerStats(result) {
        this.playerData.answers.push(result);
        
        if (result.isCorrect) {
            this.playerData.correctAnswers++;
        }

        // Calculer les statistiques
        const totalAnswers = this.playerData.answers.length;
        const accuracy = Math.round((this.playerData.correctAnswers / totalAnswers) * 100);
        const avgTime = Math.round(
            this.playerData.answers.reduce((sum, answer) => sum + (answer.timeToAnswer || 0), 0) / totalAnswers
        );

        // Mettre à jour l'affichage
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('avgTime').textContent = avgTime;
    }

    showFinalResults(results) {
        document.getElementById('quizScreen').classList.add('hidden');
        document.getElementById('answerResultScreen').classList.add('hidden');
        document.getElementById('endScreen').classList.remove('hidden');

        // Trouver la position de l'élève
        const playerRank = results.findIndex(player => player.name === this.playerData.name) + 1;

        // Afficher le score final
        document.getElementById('finalScore').textContent = this.playerData.score;
        
        // Afficher les statistiques finales
        const totalAnswers = this.playerData.answers.length;
        const accuracy = Math.round((this.playerData.correctAnswers / totalAnswers) * 100);
        const avgTime = Math.round(
            this.playerData.answers.reduce((sum, answer) => sum + (answer.timeToAnswer || 0), 0) / totalAnswers
        );

        document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
        document.getElementById('finalAvgTime').textContent = `${avgTime}s`;
        document.getElementById('finalRank').textContent = `#${playerRank}`;

        // Afficher le classement
        this.displayLeaderboard(results, playerRank);

        // Animation du score
        this.animateScore();
    }

    displayLeaderboard(results, playerRank) {
        const leaderboardContainer = document.getElementById('leaderboardList');
        
        leaderboardContainer.innerHTML = results.slice(0, 10).map((player, index) => {
            const rank = index + 1;
            const isCurrentPlayer = player.name === this.playerData.name;
            
            return `
                <div class="leaderboard-item ${isCurrentPlayer ? 'current-player' : ''}">
                    <div class="rank">
                        ${rank <= 3 ? this.getRankIcon(rank) : `#${rank}`}
                    </div>
                    <div class="player-info">
                        <span class="player-name">${player.name}</span>
                        ${isCurrentPlayer ? '<span class="you-indicator">Vous</span>' : ''}
                    </div>
                    <div class="player-score">
                        <span class="score">${player.score}</span>
                        <span class="score-label">pts</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    getRankIcon(rank) {
        const icons = {
            1: '<i class="fas fa-trophy" style="color: #ffd700;"></i>',
            2: '<i class="fas fa-medal" style="color: #c0c0c0;"></i>',
            3: '<i class="fas fa-medal" style="color: #cd7f32;"></i>'
        };
        return icons[rank] || `#${rank}`;
    }

    animateScore() {
        const scoreElement = document.getElementById('finalScore');
        const finalScore = this.playerData.score;
        let currentScore = 0;
        const increment = Math.ceil(finalScore / 50);
        
        const animation = setInterval(() => {
            currentScore += increment;
            if (currentScore >= finalScore) {
                currentScore = finalScore;
                clearInterval(animation);
            }
            scoreElement.textContent = currentScore;
        }, 30);
    }

    updateParticipantCount(count) {
        const countElement = document.getElementById('waitingParticipantCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    formatChapterName(chapter) {
        return chapter.replace(/_/g, ' ').replace(/et/g, '&');
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);

        // Réinitialiser le bouton de connexion
        const joinBtn = document.querySelector('.join-btn');
        if (joinBtn) {
            joinBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Rejoindre le Quiz';
            joinBtn.disabled = false;
        }
    }
}

// Initialisation
const student = new StudentInterface();

// Styles CSS additionnels pour l'interface élève
const studentStyles = `
<style>
.student-container {
    min-height: 100vh;
    background: var(--gradient-primary);
    position: relative;
}

.join-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
}

.join-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: var(--border-radius);
    padding: 3rem;
    max-width: 500px;
    width: 100%;
    box-shadow: var(--shadow-xl);
    backdrop-filter: blur(10px);
}

.join-header {
    text-align: center;
    margin-bottom: 2rem;
}

.join-header .logo {
    margin-bottom: 1rem;
}

.join-header .logo h1 {
    font-size: 2.5rem;
    background: var(--gradient-primary);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.join-subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
}

.join-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.join-form .form-group {
    display: flex;
    flex-direction: column;
}

.join-form label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
}

.join-form input {
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1.1rem;
    text-align: center;
    transition: border-color 0.3s ease;
}

.join-form input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.join-form input[name="quizCode"] {
    font-family: monospace;
    font-size: 1.5rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
}

.join-btn {
    padding: 1.25rem;
    font-size: 1.1rem;
}

.join-help {
    margin-top: 1.5rem;
    text-align: center;
    color: var(--text-secondary);
}

.waiting-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    color: white;
}

.waiting-content {
    text-align: center;
    max-width: 600px;
}

.waiting-animation {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 2rem;
}

.waiting-animation i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    color: white;
    z-index: 10;
}

.pulse-ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    animation: pulse 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.5);
        opacity: 1;
    }
    100% {
        transform: scale(1.3);
        opacity: 0;
    }
}

.quiz-info {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius);
    padding: 2rem;
    margin: 2rem 0;
    backdrop-filter: blur(10px);
}

.quiz-info h3 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
}

.quiz-details {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 1rem;
}

.detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.participants-waiting {
    margin: 2rem 0;
}

.participants-avatars {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
}

.waiting-tips {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    text-align: left;
    backdrop-filter: blur(10px);
}

.waiting-tips ul {
    list-style: none;
    margin-top: 1rem;
}

.waiting-tips li {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.waiting-tips li:before {
    content: "✓";
    color: #48bb78;
    font-weight: bold;
}

.quiz-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--light-bg);
}

.quiz-header {
    background: white;
    padding: 1rem 2rem;
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
}

.quiz-progress {
    display: flex;
    align-items: center;
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
}

.progress-info {
    font-weight: 600;
    color: var(--text-primary);
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--gradient-primary);
    transition: width 0.5s ease;
}

.score-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: var(--primary-color);
    font-size: 1.1rem;
}

.question-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.question-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 3rem 2rem;
    max-width: 800px;
    width: 100%;
    box-shadow: var(--shadow-lg);
    text-align: center;
}

.question-text {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: var(--text-primary);
    line-height: 1.4;
}

.answers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.answer-option {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    cursor: pointer;
    transition: var(--transition);
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
}

.option-letter {
    background: var(--primary-color);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
}

.option-text {
    flex: 1;
}

.answer-option:hover:not(:disabled) {
    background: #e9ecef;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.answer-option.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.answer-option.selected .option-letter {
    background: white;
    color: var(--primary-color);
}

.answer-option:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.quiz-footer {
    background: white;
    padding: 1rem 2rem;
    border-top: 1px solid #e2e8f0;
}

.quiz-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
}

.stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
}

.answer-result-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
    color: white;
}

.result-content {
    text-align: center;
    max-width: 500px;
    padding: 2rem;
}

.result-icon {
    font-size: 5rem;
    margin-bottom: 1rem;
}

.result-icon.correct {
    color: #48bb78;
}

.result-icon.incorrect {
    color: #f56565;
}

.result-message {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 2rem;
}

.points-earned {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1rem;
    backdrop-filter: blur(10px);
}

.points-text {
    display: block;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.points-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: #48bb78;
}

.total-score {
    font-size: 1.2rem;
    opacity: 0.9;
}

.correct-answer-info {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    backdrop-filter: blur(10px);
}

.end-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
    padding: 2rem;
}

.end-content {
    background: rgba(255, 255, 255, 0.95);
    border-radius: var(--border-radius);
    padding: 3rem;
    max-width: 600px;
    width: 100%;
    backdrop-filter: blur(10px);
    box-shadow: var(--shadow-xl);
}

.final-score {
    text-align: center;
    margin-bottom: 3rem;
}

.score-animation {
    font-size: 4rem;
    color: #ffd700;
    margin-bottom: 1rem;
}

.final-score h2 {
    font-size: 2.5rem;
    color: var(--text-primary);
    margin-bottom: 1rem;
}

.final-score-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.final-score-display #finalScore {
    font-size: 3rem;
    font-weight: 700;
    color: var(--primary-color);
}

.score-label {
    font-size: 1.2rem;
    color: var(--text-secondary);
}

.performance-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 3rem;
}

.summary-stat {
    text-align: center;
    padding: 1.5rem;
    background: var(--light-bg);
    border-radius: 8px;
}

.summary-stat i {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.leaderboard {
    margin-bottom: 2rem;
}

.leaderboard h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
}

.leaderboard-list {
    max-height: 300px;
    overflow-y: auto;
}

.leaderboard-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: var(--light-bg);
    border-radius: 8px;
    transition: var(--transition);
}

.leaderboard-item.current-player {
    background: var(--primary-color);
    color: white;
}

.rank {
    width: 50px;
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
}

.player-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.player-name {
    font-weight: 600;
}

.you-indicator {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
}

.player-score {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.score {
    font-weight: 700;
    font-size: 1.1rem;
}

.score-label {
    font-size: 0.8rem;
    opacity: 0.8;
}

.end-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.error-message {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--danger-color);
    color: white;
    padding: 1rem 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    transition: var(--transition);
}

.error-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

@media (max-width: 768px) {
    .join-card {
        padding: 2rem 1.5rem;
    }
    
    .waiting-content {
        padding: 1rem;
    }
    
    .quiz-details {
        flex-direction: column;
        align-items: center;
    }
    
    .quiz-progress {
        flex-direction: column;
        gap: 1rem;
    }
    
    .question-card {
        padding: 2rem 1rem;
    }
    
    .question-text {
        font-size: 1.2rem;
    }
    
    .answers-grid {
        grid-template-columns: 1fr;
    }
    
    .quiz-stats {
        flex-direction: column;
        gap: 1rem;
    }
    
    .performance-summary {
        grid-template-columns: 1fr;
    }
    
    .end-actions {
        flex-direction: column;
    }
    
    .final-score-display #finalScore {
        font-size: 2rem;
    }
}
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', studentStyles);