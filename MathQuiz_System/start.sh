#!/bin/bash

# Script de démarrage MathQuiz Pro
# À utiliser sur Linux/Mac - Pour Windows, voir start.bat

echo "🎯 Démarrage de MathQuiz Pro..."
echo "=================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    echo "   Téléchargez-le depuis : https://nodejs.org/"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    echo "   Installez Node.js qui inclut npm : https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js détecté : $(node --version)"
echo "✅ npm détecté : $(npm --version)"

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    fi
    
    echo "✅ Dépendances installées avec succès"
else
    echo "✅ Dépendances déjà installées"
fi

# Obtenir l'adresse IP locale
IP_ADDRESS=$(hostname -I | awk '{print $1}' 2>/dev/null || ifconfig | grep -E "inet ([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo ""
echo "🚀 Démarrage du serveur..."
echo "=================================="

# Démarrer le serveur
npm start &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 3

echo ""
echo "🎉 MathQuiz Pro est en cours d'exécution !"
echo "=========================================="
echo ""
echo "📱 Accès local (sur cet ordinateur) :"
echo "   http://localhost:3000"
echo ""
echo "🌐 Accès réseau (pour vos élèves) :"
if [ ! -z "$IP_ADDRESS" ]; then
    echo "   http://$IP_ADDRESS:3000"
else
    echo "   http://[VOTRE_IP]:3000"
    echo "   (Trouvez votre IP avec la commande 'ifconfig' ou 'ipconfig')"
fi
echo ""
echo "👨‍🏫 Interface Enseignant :"
echo "   http://localhost:3000/teacher"
echo ""
echo "👨‍🎓 Interface Élève :"
echo "   http://localhost:3000/student"
echo ""
echo "⏹️  Pour arrêter le serveur : Ctrl+C"
echo ""

# Attendre l'arrêt du serveur
wait $SERVER_PID