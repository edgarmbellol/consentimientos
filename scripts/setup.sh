#!/bin/bash

echo "🏥 Configurando Sistema de Consentimientos Informados..."

# Crear entornos virtuales
echo "📦 Creando entorno virtual para backend..."
python -m venv backend/venv

echo "📦 Instalando dependencias del backend..."
source backend/venv/bin/activate
pip install -r backend/requirements.txt
deactivate

echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

echo "✅ Configuración completada!"
echo ""
echo "Para ejecutar:"
echo "  Backend:  cd backend && source venv/bin/activate && python main.py"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "O con Docker: docker-compose up --build"


