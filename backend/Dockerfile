FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    unixodbc \
    unixodbc-dev \
    tdsodbc \
    freetds-bin \
    freetds-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar configuración de FreeTDS
COPY freetds.conf /etc/freetds/freetds.conf

# Copiar código de la aplicación
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando por defecto
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


