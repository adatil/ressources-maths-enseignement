# 🎯 MathQuiz Pro

**Système de quiz interactif de mathématiques - Version "Kahoot" pour l'enseignement**

Développé via MCP (Model Context Protocol) pour l'enseignement des mathématiques du collège au lycée.

## 📚 Vue d'ensemble

MathQuiz Pro est une plateforme de quiz interactifs en temps réel spécialement conçue pour l'enseignement des mathématiques. Inspiré de Kahoot, ce système permet aux enseignants de créer et animer des sessions de quiz dynamiques avec leurs élèves.

### ✨ Fonctionnalités principales

#### 👨‍🏫 Pour les Enseignants
- **Création de quiz personnalisés** par niveau et chapitre
- **Interface de gestion en temps réel** avec tableau de bord
- **Suivi des participants** et de leurs réponses instantanément
- **Statistiques détaillées** et analyses de performance
- **Questions adaptées** aux programmes officiels (6ème à Terminale)

#### 👨‍🎓 Pour les Élèves  
- **Interface ludique et moderne** type jeu vidéo
- **Système de points** avec bonus de rapidité
- **Classement en temps réel** et compétition saine
- **Feedback immédiat** sur les réponses
- **Compatible** ordinateur, tablette, smartphone

#### 🚀 Fonctionnalités techniques
- **Temps réel** via WebSockets (Socket.io)
- **Questions mathématiques** intégrées par niveau/chapitre
- **Design responsive** pour tous les appareils
- **Code de session** simple à 6 caractères
- **Exportation des résultats** en CSV

## 🏗️ Architecture du Système

```
MathQuiz_System/
├── server/
│   └── app.js              # Serveur Node.js + Socket.io
├── public/
│   ├── index.html          # Page d'accueil
│   ├── teacher.html        # Interface enseignant
│   ├── student.html        # Interface élève
│   ├── css/
│   │   └── style.css       # Styles CSS complets
│   └── js/
│       ├── app.js          # Fonctionnalités communes
│       ├── teacher.js      # Logic enseignant
│       └── student.js      # Logic élève
├── questions/
│   ├── seconde_fonctions.json     # Questions Fonctions 2nde
│   ├── 4eme_geometrie.json        # Questions Géométrie 4ème
│   └── seconde_stats.json         # Questions Stats 2nde
├── data/                   # Données et résultats
├── package.json           # Dépendances Node.js
└── README.md             # Ce fichier
```

## 🛠️ Installation et Configuration

### Prérequis
- **Node.js** (version 14 ou supérieure)
- **npm** (généralement inclus avec Node.js)
- **Navigateur web moderne** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Ouvrir un terminal** dans le dossier MathQuiz_System

2. **Installer les dépendances** :
```bash
npm install
```

3. **Démarrer le serveur** :
```bash
npm start
```

4. **Accéder à l'application** :
   - Ouvrir votre navigateur
   - Aller à : `http://localhost:3000`

### 📱 Accès depuis d'autres appareils

Pour que vos élèves puissent se connecter depuis leurs appareils :

1. **Trouver l'adresse IP** de votre ordinateur :
   - Windows : `ipconfig` dans le terminal
   - Mac/Linux : `ifconfig` dans le terminal
   - Cherchez une adresse comme `192.168.x.x`

2. **Partager l'adresse** avec vos élèves :
   - Format : `http://[VOTRE_IP]:3000`
   - Exemple : `http://192.168.1.100:3000`

## 🎮 Guide d'Utilisation

### 👨‍🏫 Interface Enseignant

#### 1. Créer un Quiz
1. Accéder à `/teacher` ou cliquer sur "Interface Enseignant"
2. Remplir le formulaire de création :
   - **Titre** : Nom de votre quiz
   - **Niveau** : 6ème à Terminale Spé
   - **Chapitre** : Domaine mathématique
   - **Nombre de questions** : 5 à 25
   - **Temps par question** : 15 à 60 secondes
3. Optionnel : Aperçu des questions avant création
4. Cliquer sur "Créer et Lancer le Quiz"

#### 2. Gérer le Quiz
1. **Code de session** généré automatiquement (6 caractères)
2. **Partager le code** avec vos élèves
3. **Surveiller les connexions** en temps réel
4. **Démarrer le quiz** quand tous sont connectés
5. **Passer aux questions suivantes** à votre rythme
6. **Voir les résultats** instantanément

#### 3. Statistiques
- **Taux de réussite** par question
- **Temps de réponse moyen** des élèves
- **Classement final** avec scores
- **Export des données** pour analyse

### 👨‍🎓 Interface Élève

#### 1. Rejoindre un Quiz
1. Accéder à `/student` ou cliquer sur "Rejoindre un Quiz"
2. Saisir le **code à 6 caractères** donné par le professeur
3. Entrer votre **prénom**
4. Attendre que le professeur démarre

#### 2. Participer au Quiz
1. **Lire la question** affichée
2. **Cliquer sur votre réponse** (A, B, C, ou D)
3. **Voir votre résultat** immédiatement
4. **Suivre votre score** et classement
5. **Découvrir le classement final** à la fin

#### 3. Système de Points
- **Points de base** : 1000 pour une bonne réponse
- **Bonus de rapidité** : jusqu'à 500 points supplémentaires
- **Pas de points** pour les mauvaises réponses
- **Classement** basé sur le score total

## 📚 Questions Intégrées

Le système inclut des questions adaptées aux programmes officiels :

### Niveaux Collège
- **6ème** : Nombres, Géométrie, Statistiques
- **5ème** : Nombres, Géométrie, Statistiques  
- **4ème** : Nombres, Géométrie (Pythagore), Statistiques
- **3ème** : Nombres, Géométrie, Fonctions, Stats, Algorithmique

### Niveaux Lycée
- **Seconde** : Nombres, Géométrie, Fonctions, Stats, Algorithmique
- **Première Spé** : Fonctions, Géométrie, Stats, Algorithmique
- **Terminale Spé** : Fonctions, Géométrie, Stats, Algorithmique

### 📝 Ajouter Vos Questions

Créez un fichier JSON dans `/questions/` :

```json
{
  "level": "Seconde",
  "chapter": "Fonctions",
  "description": "Description du chapitre",
  "questions": [
    {
      "id": "unique_id",
      "question": "Votre question ?",
      "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      "correct": 0,
      "difficulty": "easy",
      "explanation": "Explication de la réponse"
    }
  ]
}
```

## 🎨 Personnalisation

### Modifier l'Apparence
- **CSS** : Éditer `/public/css/style.css`
- **Couleurs** : Variables CSS dans `:root`
- **Logo** : Remplacer les icônes FontAwesome

### Ajouter des Fonctionnalités
- **Serveur** : Modifier `/server/app.js`
- **Interface** : Éditer les fichiers HTML et JS
- **Questions** : Ajouter des fichiers JSON

## 🔧 Configuration Avancée

### Variables d'Environnement
Créer un fichier `.env` :
```
PORT=3000
NODE_ENV=production
```

### Mode Développement
```bash
npm run dev
```
(Nécessite nodemon : `npm install -g nodemon`)

### Déploiement
Pour un usage en classe, le système peut tourner sur :
- **Ordinateur local** (le plus simple)
- **Serveur d'établissement**
- **Cloud** (Heroku, AWS, etc.)

## 📊 Données et Résultats

### Export des Résultats
- **Format CSV** pour Excel/Calc
- **Données par quiz** : participants, scores, réponses
- **Statistiques globales** par chapitre/niveau

### Analyse des Données
Les résultats permettent d'identifier :
- **Questions difficiles** (faible taux de réussite)
- **Élèves en difficulté** (scores faibles)
- **Temps de réponse** par notion
- **Progression** sur plusieurs quiz

## 🛟 Support et Dépannage

### Problèmes Courants

#### "Impossible de se connecter"
- Vérifier que le serveur est démarré
- Contrôler l'adresse IP et le port
- Vérifier la connexion réseau

#### "Code quiz invalide"
- Le code fait exactement 6 caractères
- Respecter majuscules/minuscules
- Vérifier que le quiz est actif

#### "Questions ne s'affichent pas"
- Vérifier les fichiers JSON dans `/questions/`
- Contrôler la syntaxe JSON
- Redémarrer le serveur

### Debug Mode
Pour plus d'informations de debug :
```bash
DEBUG=* npm start
```

## 🔒 Sécurité et Confidentialité

### Données Collectées
- **Prénoms** des élèves (temporaire)
- **Réponses** aux questions
- **Temps de réponse**
- **Scores** calculés

### Protection
- **Aucune donnée personnelle** stockée de façon permanente
- **Connexions chiffrées** (HTTPS recommandé)
- **Codes de session** temporaires et aléatoires

## 🤝 Contribution et Développement

### Structure du Code
- **Serveur** : Node.js + Express + Socket.io
- **Frontend** : HTML5 + CSS3 + JavaScript ES6+
- **Temps réel** : WebSockets pour la synchronisation
- **Style** : CSS moderne avec variables et animations

### Ajouter des Fonctionnalités
1. **Forker** le projet
2. **Créer une branche** pour votre fonctionnalité
3. **Développer** et tester
4. **Documenter** vos changements
5. **Proposer** vos améliorations

## 📄 Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer pour l'enseignement.

## 🙏 Remerciements

Développé spécialement pour les enseignants de mathématiques avec :
- **Inspiration** : Kahoot, Socrative, Plickers
- **Technologies** : Node.js, Socket.io, CSS modernes
- **Pédagogie** : Quiz interactifs et gamification

---

## 📞 Contact et Support

Pour toute question ou suggestion d'amélioration, n'hésitez pas à :
- **Documenter** les bugs rencontrés
- **Partager** vos retours d'usage en classe
- **Proposer** de nouvelles fonctionnalités
- **Contribuer** avec vos questions mathématiques

**Bon enseignement avec MathQuiz Pro ! 🎓📐**
