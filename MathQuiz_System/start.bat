@echo off
REM Script de démarrage MathQuiz Pro pour Windows

echo 🎯 Démarrage de MathQuiz Pro...
echo ==================================

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé.
    echo    Téléchargez-le depuis : https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si npm est installé
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installé.
    echo    Installez Node.js qui inclut npm : https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js détecté : %NODE_VERSION%
echo ✅ npm détecté : %NPM_VERSION%

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    call npm install
    
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
    
    echo ✅ Dépendances installées avec succès
) else (
    echo ✅ Dépendances déjà installées
)

REM Obtenir l'adresse IP locale
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set IP_ADDRESS=%%j
        goto :found_ip
    )
)
:found_ip

echo.
echo 🚀 Démarrage du serveur...
echo ==================================

REM Démarrer le serveur
start /b npm start

REM Attendre que le serveur démarre
timeout /t 3 /nobreak >nul

echo.
echo 🎉 MathQuiz Pro est en cours d'exécution !
echo ==========================================
echo.
echo 📱 Accès local (sur cet ordinateur) :
echo    http://localhost:3000
echo.
echo 🌐 Accès réseau (pour vos élèves) :
if defined IP_ADDRESS (
    echo    http://%IP_ADDRESS%:3000
) else (
    echo    http://[VOTRE_IP]:3000
    echo    (Trouvez votre IP avec la commande 'ipconfig')
)
echo.
echo 👨‍🏫 Interface Enseignant :
echo    http://localhost:3000/teacher
echo.
echo 👨‍🎓 Interface Élève :
echo    http://localhost:3000/student
echo.
echo ⏹️  Pour arrêter le serveur : Fermez cette fenêtre ou Ctrl+C
echo.
echo 🌐 Ouverture automatique dans le navigateur...

REM Ouvrir automatiquement dans le navigateur
start http://localhost:3000

echo.
echo Appuyez sur une touche pour fermer cette fenêtre et arrêter le serveur...
pause >nul