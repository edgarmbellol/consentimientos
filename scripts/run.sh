#!/bin/bash

echo "🚀 Iniciando Sistema de Consentimientos Informados..."

# Verificar si Docker está disponible
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Ejecutando con Docker..."
    docker-compose up --build
else
    echo "📦 Ejecutando con entornos virtuales..."
    
    # Iniciar backend en background
    echo "Iniciando backend..."
    cd backend
    source venv/bin/activate
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # Esperar un poco para que el backend inicie
    sleep 3
    
    # Iniciar frontend
    echo "Iniciando frontend..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo "✅ Aplicación iniciada!"
    echo "   Backend: http://localhost:8000"
    echo "   Frontend: http://localhost:3000"
    echo ""
    echo "Presiona Ctrl+C para detener ambos servicios"
    
    # Esperar a que el usuario presione Ctrl+C
    wait $BACKEND_PID $FRONTEND_PID
fi


