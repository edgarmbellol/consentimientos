# 📋 Implementación de Versionamiento y Control de Acceso

## ✅ Resumen de Implementación

Se ha implementado exitosamente un sistema completo de **versionamiento de consentimientos** y **control de acceso basado en roles** para el Sistema de Consentimientos Informados del Hospital Divino Salvador de Sopó.

---

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Roles y Permisos

#### Roles Definidos:
- **Administradores (admin y embl)**: Acceso completo
  - Crear, editar y eliminar plantillas
  - Ver y gestionar todas las versiones
  - Restaurar versiones anteriores
  - Acceso a logs de auditoría

- **Usuarios Regulares**: Acceso limitado
  - Visualizar plantillas disponibles
  - Completar formularios de consentimiento
  - Ver formularios completados
  - **NO** pueden modificar plantillas

#### Implementación Backend:
```python
# Funciones de autenticación
def is_admin(user: dict) -> bool:
    """Verifica si el usuario es administrador (admin o embl)"""
    username = user.get("username", "").upper()
    return username in ["ADMIN", "EMBL"]

async def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependencia que requiere que el usuario sea administrador"""
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción."
        )
    return current_user
```

#### Implementación Frontend:
```typescript
interface AuthContextType {
  user: UserData | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: () => boolean;
  canManageTemplates: () => boolean;
}
```

---

### 2. Sistema de Versionamiento

#### Características:
- ✅ **Versionamiento automático**: Cada edición crea una nueva versión
- ✅ **Versión actual marcada**: Solo una versión está activa por plantilla
- ✅ **Historial completo**: Todas las versiones se conservan
- ✅ **Restauración de versiones**: Los administradores pueden restaurar versiones anteriores
- ✅ **Trazabilidad**: Cada versión registra quién la creó y cuándo

#### Campos Agregados a la Base de Datos:
```python
class ConsentTemplateDB(Base):
    # ... campos existentes ...
    
    # Campos de versionamiento
    version_number = Column(Integer, default=1)
    is_current = Column(Boolean, default=True, index=True)
    parent_template_id = Column(String, index=True)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## 🔧 Cambios Técnicos Realizados

### Backend (FastAPI)

#### 1. Base de Datos (`database.py`)
- ✅ Agregados campos de versionamiento a `ConsentTemplateDB`
- ✅ Índices optimizados para consultas de versiones

#### 2. API Principal (`main.py`)
- ✅ Implementación de `is_admin()` y `require_admin()`
- ✅ Actualización de autenticación para incluir roles
- ✅ Función auxiliar `template_db_to_response()`

#### 3. Endpoints Actualizados:

**Plantillas:**
```python
# Solo administradores pueden crear
@app.post("/api/templates")
async def create_template(current_user: dict = Depends(require_admin))

# Solo administradores pueden editar (crea nueva versión)
@app.put("/api/templates/{template_id}")
async def update_template(current_user: dict = Depends(require_admin))

# Solo administradores pueden eliminar
@app.delete("/api/templates/{template_id}")
async def delete_template(current_user: dict = Depends(require_admin))

# Filtrado por versión actual
@app.get("/api/templates")
async def get_templates(include_all_versions: bool = False)
```

**Nuevos Endpoints de Versionamiento:**
```python
# Ver todas las versiones de una plantilla
@app.get("/api/templates/{template_id}/versions")
async def get_template_versions()

# Restaurar una versión anterior
@app.post("/api/templates/{template_id}/restore/{version_id}")
async def restore_template_version(current_user: dict = Depends(require_admin))
```

---

### Frontend (React/TypeScript)

#### 1. Contexto de Autenticación (`AuthContext.tsx`)
- ✅ Interfaz `UserData` con roles
- ✅ Funciones `isAdmin()` y `canManageTemplates()`
- ✅ Almacenamiento de información de usuario ampliado

#### 2. Servicios API (`services/api.ts`)
- ✅ Métodos `getVersions()` y `restoreVersion()`
- ✅ Parámetro `includeAllVersions` en `getAll()`

#### 3. Tipos (`types/index.ts`)
- ✅ Campos de versionamiento en `ConsentTemplate`:
  - `version_number?: number`
  - `is_current?: boolean`
  - `parent_template_id?: string`
  - `created_by?: string`

#### 4. Páginas Actualizadas:

**TemplateList.tsx:**
- ✅ Control de acceso visual (mostrar/ocultar botones según rol)
- ✅ Badge de versión en plantillas
- ✅ Botón "Ver versiones" para administradores
- ✅ Información del creador de la plantilla

**Nueva Página: TemplateVersions.tsx:**
- ✅ Visualización del historial completo de versiones
- ✅ Indicador de versión actual
- ✅ Botón de restauración para versiones anteriores
- ✅ Información detallada de cada versión (creador, fecha)
- ✅ Guía informativa sobre el versionamiento

**App.tsx:**
- ✅ Nueva ruta `/admin/templates/:templateId/versions`
- ✅ Uso de `AdminRoute` para proteger ruta de versiones

---

## 🚀 Funcionamiento del Sistema

### Flujo de Versionamiento:

1. **Creación Inicial:**
   - Administrador crea una plantilla
   - Se guarda como versión 1
   - `is_current = True`
   - `parent_template_id = None`

2. **Edición (Creación de Nueva Versión):**
   - Administrador edita la plantilla
   - La versión actual se marca como `is_current = False`
   - Se crea una nueva versión con:
     - `version_number = anterior + 1`
     - `is_current = True`
     - `parent_template_id = ID de la plantilla original`
     - `created_by = usuario que editó`

3. **Restauración:**
   - Administrador selecciona una versión anterior
   - Se crea una nueva versión basada en la seleccionada
   - El número de versión continúa incrementando
   - Se mantiene el historial completo

### Flujo de Control de Acceso:

```
Usuario Inicia Sesión
    ↓
¿Es admin o embl?
    ↓
   SÍ → Acceso completo
   │    - Crear plantillas
   │    - Editar plantillas (crea nueva versión)
   │    - Eliminar plantillas
   │    - Ver historial de versiones
   │    - Restaurar versiones
   │    - Completar formularios
   │
   NO → Acceso limitado
        - Solo visualizar plantillas
        - Completar formularios
        - Ver formularios completados
```

---

## 📊 Endpoints API Disponibles

### Autenticación
| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticado |

### Plantillas
| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/api/templates` | Listar plantillas (versiones actuales) | Autenticado |
| GET | `/api/templates?include_all_versions=true` | Listar todas las versiones | Autenticado |
| GET | `/api/templates/{id}` | Obtener plantilla | Autenticado |
| POST | `/api/templates` | Crear plantilla | **Solo Admin** |
| PUT | `/api/templates/{id}` | Actualizar (crea nueva versión) | **Solo Admin** |
| DELETE | `/api/templates/{id}` | Eliminar plantilla | **Solo Admin** |

### Versionamiento
| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/api/templates/{id}/versions` | Ver historial de versiones | Autenticado |
| POST | `/api/templates/{id}/restore/{version_id}` | Restaurar versión | **Solo Admin** |

### Formularios
| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/api/consent-forms` | Listar formularios | Autenticado |
| GET | `/api/consent-forms/{id}` | Ver formulario | Autenticado |
| POST | `/api/consent-forms` | Crear formulario | Autenticado |

### Pacientes
| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/api/patients/{documento}` | Buscar paciente | Autenticado |

### Auditoría
| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/api/audit-logs` | Ver logs de auditoría | **Solo Admin** |
| GET | `/api/audit-logs/summary` | Resumen de auditoría | **Solo Admin** |

---

## 🔒 Seguridad Implementada

### Backend:
1. ✅ Validación de roles en cada endpoint sensible
2. ✅ Dependencia `require_admin` para proteger operaciones
3. ✅ Registro de auditoría para todas las acciones
4. ✅ Mensajes de error claros sobre permisos

### Frontend:
1. ✅ Ocultación de botones según permisos
2. ✅ Rutas protegidas con `AdminRoute`
3. ✅ Mensajes informativos según rol de usuario
4. ✅ Validación de permisos antes de operaciones

---

## 📝 Registro de Auditoría

Todas las operaciones quedan registradas:
- **Creación de plantillas**: Quién creó, cuándo, título
- **Actualización de plantillas**: Versión anterior, nueva versión, quién actualizó
- **Eliminación de plantillas**: Quién eliminó, cuándo
- **Restauración de versiones**: Desde qué versión, quién restauró
- **Creación de formularios**: Datos del paciente, plantilla usada

---

## 🎨 Interfaz de Usuario

### Mejoras Visuales:
1. ✅ **Badges de versión** en tarjetas de plantillas
2. ✅ **Botón de historial** (ícono de reloj) para ver versiones
3. ✅ **Indicador de versión actual** con marca de verificación
4. ✅ **Información del creador** en cada plantilla
5. ✅ **Mensajes contextuales** según permisos del usuario
6. ✅ **Guía informativa** sobre el sistema de versionamiento

### Página de Versiones:
- Timeline de versiones ordenadas
- Versión actual destacada visualmente
- Botones de acción (Ver, Restaurar)
- Información detallada de cada versión
- Panel informativo sobre el funcionamiento

---

## 🧪 Pruebas Sugeridas

### 1. Pruebas de Roles:
- [ ] Iniciar sesión como **admin** o **embl**
  - Verificar que se muestren todos los botones de gestión
  - Crear una plantilla nueva
  - Editar una plantilla existente
  - Ver historial de versiones
  
- [ ] Iniciar sesión como **usuario regular**
  - Verificar que NO se muestren botones de gestión
  - Intentar acceder a rutas de administración (debe redirigir)
  - Verificar que puede completar formularios

### 2. Pruebas de Versionamiento:
- [ ] Crear una plantilla (versión 1)
- [ ] Editar la plantilla (debe crear versión 2)
- [ ] Ver historial de versiones
- [ ] Restaurar versión 1 (debe crear versión 3 basada en v1)
- [ ] Verificar que la versión actual es la restaurada

### 3. Pruebas de API:
```bash
# Probar endpoint sin permisos (debe fallar)
curl -X POST http://localhost:8000/api/templates \
  -H "Authorization: Bearer {token_usuario_regular}" \
  -H "Content-Type: application/json"
  
# Respuesta esperada: 403 Forbidden

# Probar endpoint con permisos (debe funcionar)
curl -X POST http://localhost:8000/api/templates \
  -H "Authorization: Bearer {token_admin}" \
  -H "Content-Type: application/json" \
  -d '{...}'
  
# Respuesta esperada: 200 OK con datos de la plantilla
```

---

## 📦 Archivos Modificados

### Backend:
- ✅ `backend/database.py` - Modelo de versionamiento
- ✅ `backend/main.py` - Control de acceso y endpoints

### Frontend:
- ✅ `frontend/src/contexts/AuthContext.tsx` - Sistema de roles
- ✅ `frontend/src/services/api.ts` - Endpoints de versionamiento
- ✅ `frontend/src/types/index.ts` - Tipos de versionamiento
- ✅ `frontend/src/pages/TemplateList.tsx` - Control de acceso visual
- ✅ `frontend/src/pages/TemplateVersions.tsx` - **NUEVA PÁGINA**
- ✅ `frontend/src/App.tsx` - Nueva ruta de versiones

---

## 🎉 Resultado Final

### Para Administradores (admin y embl):
✅ Control total sobre plantillas
✅ Historial completo de cambios
✅ Capacidad de restaurar versiones
✅ Trazabilidad de quién hizo qué y cuándo
✅ Interfaz intuitiva para gestión

### Para Usuarios Regulares:
✅ Acceso de solo lectura a plantillas
✅ Capacidad de completar formularios
✅ Sin posibilidad de modificar plantillas accidentalmente
✅ Interfaz clara sobre sus permisos

### Para el Sistema:
✅ Integridad de datos garantizada
✅ Historial completo preservado
✅ Auditoría completa de operaciones
✅ Escalable y mantenible

---

## 🔄 Próximas Mejoras Sugeridas

1. **Comparación de Versiones**: Vista lado a lado de dos versiones
2. **Comentarios en Versiones**: Permitir agregar notas de cambio
3. **Notificaciones**: Alertar cuando se crea una nueva versión
4. **Export/Import**: Exportar historial de versiones
5. **Permisos Granulares**: Roles intermedios (editor, revisor, etc.)

---

## 📞 Soporte

Para dudas o problemas:
- Revisar logs de auditoría en `/admin/audit-logs`
- Verificar logs del backend: `docker-compose logs backend`
- Verificar logs del frontend: `docker-compose logs frontend`

---

**Sistema de Consentimientos Informados v2.0**  
Hospital Divino Salvador de Sopó  
Implementación completada: Octubre 16, 2025

