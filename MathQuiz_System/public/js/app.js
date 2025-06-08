// MathQuiz Pro - Application JavaScript Principale
// Fonctionnalités communes et utilitaires

class MathQuizApp {
    constructor() {
        this.currentUser = null;
        this.theme = localStorage.getItem('mathquiz-theme') || 'light';
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupGlobalEventListeners();
        this.setupMathRendering();
        this.detectDevice();
    }

    // ===== GESTION DES THÈMES =====
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('mathquiz-theme', this.theme);
    }

    // ===== RENDU MATHÉMATIQUE =====
    setupMathRendering() {
        // Configuration pour le rendu des formules mathématiques
        if (window.MathJax) {
            MathJax.typesetPromise = MathJax.typesetPromise || MathJax.Hub.Queue;
        }
    }

    renderMath(element) {
        if (window.MathJax && element) {
            MathJax.typesetPromise([element]).catch((err) => {
                console.warn('Erreur de rendu MathJax:', err);
            });
        }
    }

    // ===== DÉTECTION D'APPAREIL =====
    detectDevice() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet);
        document.body.classList.toggle('desktop', !isMobile && !isTablet);
    }

    // ===== GESTION DES ÉVÉNEMENTS GLOBAUX =====
    setupGlobalEventListeners() {
        // Redimensionnement de fenêtre
        window.addEventListener('resize', () => {
            this.detectDevice();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Gestion de la connectivité
        window.addEventListener('online', () => {
            this.showConnectionStatus('Connexion rétablie', 'success');
        });

        window.addEventListener('offline', () => {
            this.showConnectionStatus('Connexion perdue', 'warning');
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K pour la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('[data-search]');
            if (searchInput) searchInput.focus();
        }

        // Échap pour fermer les modales
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Navigation avec flèches dans les quiz
        if (document.querySelector('.quiz-screen:not(.hidden)')) {
            this.handleQuizKeyboard(e);
        }
    }

    handleQuizKeyboard(e) {
        const answers = document.querySelectorAll('.answer-option:not(:disabled)');
        
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            if (answers[index]) {
                answers[index].click();
            }
        }
    }

    // ===== GESTION DES MODALES =====
    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            // Focus sur le premier élément focusable
            const focusable = modal.querySelector('input, button, textarea, select');
            if (focusable) focusable.focus();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotificationElement(message, type);
        document.body.appendChild(notification);

        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Suppression automatique
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        return notification;
    }

    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return notification;
    }

    showConnectionStatus(message, type) {
        this.showNotification(message, type, 3000);
    }

    // ===== UTILITAIRES =====
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatScore(score) {
        return score.toLocaleString('fr-FR');
    }

    formatPercentage(value, total) {
        return Math.round((value / total) * 100);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== STOCKAGE LOCAL =====
    saveToStorage(key, data) {
        try {
            localStorage.setItem(`mathquiz-${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('Erreur de sauvegarde locale:', error);
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`mathquiz-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Erreur de chargement local:', error);
            return null;
        }
    }

    clearStorage(key) {
        try {
            localStorage.removeItem(`mathquiz-${key}`);
        } catch (error) {
            console.warn('Erreur de suppression locale:', error);
        }
    }

    // ===== VALIDATION =====
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateQuizCode(code) {
        return /^[A-Z0-9]{6}$/.test(code);
    }

    validateStudentName(name) {
        return name.trim().length >= 2 && name.trim().length <= 30;
    }

    // ===== ANIMATIONS =====
    animateElement(element, animation, duration = 500) {
        return new Promise((resolve) => {
            element.style.animationDuration = `${duration}ms`;
            element.classList.add(animation);
            
            const handleAnimationEnd = () => {
                element.classList.remove(animation);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
        });
    }

    // ===== ANALYTICS (VERSION SIMPLIFIÉE) =====
    trackEvent(event, data = {}) {
        console.log('Event tracked:', event, data);
        // Ici vous pourriez intégrer Google Analytics, Matomo, etc.
    }

    trackQuizStart(quizId, level, chapter) {
        this.trackEvent('quiz_start', { quizId, level, chapter });
    }

    trackQuizComplete(quizId, score, accuracy) {
        this.trackEvent('quiz_complete', { quizId, score, accuracy });
    }

    trackAnswerSubmitted(questionId, isCorrect, timeToAnswer) {
        this.trackEvent('answer_submitted', { questionId, isCorrect, timeToAnswer });
    }

    // ===== EXPORT DE DONNÉES =====
    exportToCSV(data, filename) {
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, filename, 'text/csv');
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvData = data.map(row => 
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(',')
        );

        return [csvHeaders, ...csvData].join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
    }

    // ===== FORMATAGE MATHÉMATIQUE =====
    formatMathExpression(expression) {
        // Conversion de notation mathématique simple vers format LaTeX
        return expression
            .replace(/\^([0-9]+)/g, '^{$1}')
            .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
            .replace(/frac\(([^,]+),([^)]+)\)/g, '\\frac{$1}{$2}')
            .replace(/pi/g, '\\pi')
            .replace(/infinity/g, '\\infty');
    }

    // ===== GESTION D'ERREURS =====
    handleError(error, context = '') {
        console.error(`Erreur ${context}:`, error);
        
        let userMessage = 'Une erreur inattendue s\'est produite.';
        
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            userMessage = 'Problème de connexion réseau. Vérifiez votre connexion.';
        } else if (error.message?.includes('timeout')) {
            userMessage = 'La requête a pris trop de temps. Réessayez.';
        }
        
        this.showNotification(userMessage, 'error');
    }

    // ===== PERFORMANCE =====
    measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        
        console.log(`Performance ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// ===== INITIALISATION GLOBALE =====
let mathQuizApp;

document.addEventListener('DOMContentLoaded', () => {
    mathQuizApp = new MathQuizApp();
    
    // Rendre l'instance globalement accessible
    window.mathQuizApp = mathQuizApp;
});

// ===== FONCTIONS UTILITAIRES GLOBALES =====
window.showNotification = function(message, type, duration) {
    if (window.mathQuizApp) {
        return window.mathQuizApp.showNotification(message, type, duration);
    }
};

window.openModal = function(modalId) {
    if (window.mathQuizApp) {
        window.mathQuizApp.openModal(modalId);
    }
};

window.closeModal = function(modalId) {
    if (window.mathQuizApp) {
        window.mathQuizApp.closeModal(modalId);
    }
};

// ===== STYLES CSS POUR LES NOTIFICATIONS =====
const globalStyles = `
<style>
/* Notifications */
.notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    min-width: 300px;
    max-width: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 4px solid var(--primary-color);
}

.notification.show {
    transform: translateX(0);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
}

.notification-content i {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.notification-message {
    flex: 1;
    font-weight: 500;
    color: var(--text-primary);
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: var(--text-secondary);
    border-radius: 4px;
    transition: background-color 0.2s;
}

.notification-close:hover {
    background: rgba(0,0,0,0.1);
}

.notification-success {
    border-left-color: var(--success-color);
}

.notification-success .notification-content i {
    color: var(--success-color);
}

.notification-error {
    border-left-color: var(--danger-color);
}

.notification-error .notification-content i {
    color: var(--danger-color);
}

.notification-warning {
    border-left-color: var(--warning-color);
}

.notification-warning .notification-content i {
    color: var(--warning-color);
}

.notification-info {
    border-left-color: var(--info-color);
}

.notification-info .notification-content i {
    color: var(--info-color);
}

/* Animations */
@keyframes slideInRight {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(100%);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
    }
    40%, 43% {
        transform: translate3d(0, -30px, 0);
    }
    70% {
        transform: translate3d(0, -15px, 0);
    }
    90% {
        transform: translate3d(0, -4px, 0);
    }
}

.fade-in { animation: fadeIn 0.5s ease-in; }
.slide-in-up { animation: slideInUp 0.6s ease-out; }
.bounce { animation: bounce 1s; }

/* Responsive pour notifications */
@media (max-width: 768px) {
    .notification {
        right: 1rem;
        left: 1rem;
        min-width: auto;
        max-width: none;
    }
    
    .notification-content {
        padding: 1rem;
    }
}

/* Mode sombre */
[data-theme="dark"] .notification {
    background: #2d3748;
    color: white;
}

[data-theme="dark"] .notification-message {
    color: white;
}

[data-theme="dark"] .notification-close {
    color: #a0aec0;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', globalStyles);