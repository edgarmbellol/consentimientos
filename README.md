# Sistema de Consentimientos Informados 🏥

Sistema digital para la gestión de consentimientos informados del Hospital Divino Salvador de Sopó.

**Repositorio:** [https://github.com/edgarmbellol/consentimientos.git](https://github.com/edgarmbellol/consentimientos.git)

## Características

- **Autenticación segura** con credenciales administrativas
- **Creación de plantillas** de consentimientos informados de forma intuitiva
- **Formularios digitales** para completar consentimientos
- **Gestión completa** de formularios completados
- **Interfaz moderna** basada en los colores del hospital
- **Diseño responsive** para diferentes dispositivos

## Tecnologías Utilizadas

### Backend
- **FastAPI** - Framework web moderno y rápido para Python
- **Pydantic** - Validación de datos y serialización
- **Python 3.8+** - Lenguaje de programación

### Frontend
- **React 18** - Biblioteca para interfaces de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework de CSS utilitario
- **React Router** - Enrutamiento para aplicaciones React
- **React Hook Form** - Manejo de formularios
- **Lucide React** - Iconos modernos

## Instalación y Configuración

### Prerrequisitos
- Python 3.8 o superior
- Node.js 16 o superior
- npm o yarn
- Docker y Docker Compose (recomendado)

### Clonar el Repositorio

```bash
git clone https://github.com/edgarmbellol/consentimientos.git
cd consentimientos
```

### Backend

1. Navega al directorio del backend:
```bash
cd backend
```

2. Crea un entorno virtual:
```bash
python -m venv venv
```

3. Activa el entorno virtual:
```bash
# En Windows
venv\Scripts\activate

# En macOS/Linux
source venv/bin/activate
```

4. Instala las dependencias:
```bash
pip install -r requirements.txt
```

5. Ejecuta el servidor:
```bash
python main.py
```

El backend estará disponible en `http://localhost:8000`

### Frontend

1. Navega al directorio del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la aplicación:
```bash
npm start
```

El frontend estará disponible en `http://localhost:3000`

## Uso del Sistema

### Credenciales de Acceso
- **Usuario:** admin
- **Contraseña:** admin123

### Funcionalidades Principales

#### 1. Gestión de Plantillas (Administrador)
- Crear nuevas plantillas de consentimientos
- Editar plantillas existentes
- Eliminar plantillas no utilizadas
- Configurar campos personalizados para cada plantilla

#### 2. Completar Consentimientos
- Seleccionar plantilla disponible
- Llenar datos del paciente
- Responder preguntas de consentimiento
- Agregar firmas digitales
- Guardar formulario completado

#### 3. Revisión de Formularios
- Ver todos los consentimientos completados
- Filtrar y buscar por paciente o tipo
- Visualizar detalles completos
- Imprimir o descargar como PDF

## Estructura del Proyecto

```
├── backend/
│   ├── main.py              # Servidor FastAPI principal
│   └── requirements.txt     # Dependencias de Python
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # Componentes React reutilizables
│   │   ├── contexts/        # Contextos de React (Auth)
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios de API
│   │   ├── types/          # Definiciones de TypeScript
│   │   ├── App.tsx         # Componente principal
│   │   └── index.tsx       # Punto de entrada
│   ├── package.json        # Dependencias de Node.js
│   └── tailwind.config.js  # Configuración de Tailwind
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Plantillas
- `GET /api/templates` - Obtener todas las plantillas
- `GET /api/templates/{id}` - Obtener plantilla específica
- `POST /api/templates` - Crear nueva plantilla
- `PUT /api/templates/{id}` - Actualizar plantilla
- `DELETE /api/templates/{id}` - Eliminar plantilla

### Formularios de Consentimiento
- `GET /api/consent-forms` - Obtener todos los formularios
- `GET /api/consent-forms/{id}` - Obtener formulario específico
- `POST /api/consent-forms` - Crear nuevo formulario

## Diseño y Colores

El sistema utiliza una paleta de colores basada en el logo del hospital:
- **Azul Principal:** #4A90E2
- **Azul Oscuro:** #2C5282
- **Verde:** #38A169
- **Verde Claro:** #68D391

## Características de Seguridad

- Autenticación basada en tokens
- Validación de datos en backend y frontend
- Protección de rutas sensibles
- Manejo seguro de información médica

## Próximas Mejoras

- [ ] Integración con base de datos persistente
- [ ] Generación de PDFs automática
- [ ] Firma digital avanzada
- [ ] Notificaciones por email
- [ ] Dashboard de estadísticas
- [ ] Backup automático de datos

## Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Hospital Divino Salvador de Sopó**  
Sistema de Consentimientos Informados v1.0.0


