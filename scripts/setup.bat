@echo off
echo 🏥 Configurando Sistema de Consentimientos Informados...

echo 📦 Creando entorno virtual para backend...
python -m venv backend\venv

echo 📦 Instalando dependencias del backend...
call backend\venv\Scripts\activate
pip install -r backend\requirements.txt
call deactivate

echo 📦 Instalando dependencias del frontend...
cd frontend
npm install
cd ..

echo ✅ Configuración completada!
echo.
echo Para ejecutar:
echo   Backend:  cd backend ^&^& venv\Scripts\activate ^&^& python main.py
echo   Frontend: cd frontend ^&^& npm start
echo.
echo O con Docker: docker-compose up --build
pause


