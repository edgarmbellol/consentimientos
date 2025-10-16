# 📘 Guía de Usuario - Sistema de Versionamiento y Roles

## 🎯 ¿Qué es el Versionamiento?

El sistema de versionamiento te permite mantener un **historial completo de cambios** en las plantillas de consentimientos informados. Cada vez que se edita una plantilla, se crea una nueva versión automáticamente, preservando todas las versiones anteriores.

---

## 👥 Roles de Usuario

### 🔑 Administradores (admin y embl)

**Pueden hacer TODO:**
- ✅ Crear nuevas plantillas
- ✅ Editar plantillas existentes
- ✅ Ver historial de versiones
- ✅ Restaurar versiones anteriores
- ✅ Eliminar plantillas
- ✅ Completar formularios
- ✅ Ver logs de auditoría

### 👤 Usuarios Regulares

**Pueden hacer:**
- ✅ Ver plantillas disponibles
- ✅ Completar formularios de consentimiento
- ✅ Ver formularios completados

**NO pueden hacer:**
- ❌ Crear o editar plantillas
- ❌ Eliminar plantillas
- ❌ Ver historial de versiones
- ❌ Restaurar versiones

---

## 🚀 Cómo Usar el Sistema (Administradores)

### 1️⃣ Crear una Nueva Plantilla

1. Inicia sesión como **admin** o **embl**
2. Ve a **"Plantillas de Consentimientos"**
3. Haz clic en **"Nueva Plantilla"**
4. Completa toda la información requerida
5. Haz clic en **"Crear Plantilla"**

**Resultado:** Se crea la plantilla como **Versión 1**

---

### 2️⃣ Editar una Plantilla (Crear Nueva Versión)

1. En la lista de plantillas, haz clic en el ícono de **lápiz (✏️)**
2. Modifica los campos que necesites
3. Haz clic en **"Actualizar Plantilla"**

**Resultado:** 
- La versión anterior se guarda en el historial
- Se crea una nueva versión automáticamente
- La nueva versión se marca como **actual**
- Tu nombre queda registrado como creador de esta versión

**Ejemplo:**
```
Versión 1 (creada por: admin) → [EDITAS] → Versión 2 (creada por: embl) → [ACTUAL]
```

---

### 3️⃣ Ver Historial de Versiones

1. En la lista de plantillas, haz clic en el ícono de **reloj (🕐)**
2. Verás una lista con todas las versiones:
   - **Versión actual** destacada con marca azul ✓
   - Versiones anteriores en orden descendente
   - Información de quién y cuándo creó cada versión

**Elementos en el historial:**
- **Número de versión**: v1, v2, v3, etc.
- **Creador**: Usuario que creó esta versión
- **Fecha y hora**: Cuándo se creó
- **Estado**: Actual o histórica

---

### 4️⃣ Restaurar una Versión Anterior

**¿Cuándo usar esto?**
- Si cometiste un error en la última edición
- Si quieres volver a una versión anterior
- Si necesitas recuperar información eliminada

**Pasos:**
1. Ve al **historial de versiones** (ícono de reloj)
2. Encuentra la versión que quieres restaurar
3. Haz clic en **"Restaurar"**
4. Confirma la acción

**⚠️ Importante:**
- NO se eliminan las versiones intermedias
- Se crea una NUEVA versión basada en la que restauraste
- El historial completo se mantiene intacto

**Ejemplo:**
```
Antes:
V1 → V2 → V3 [ACTUAL] ❌ (versión con error)

Después de restaurar V1:
V1 → V2 → V3 → V4 [ACTUAL] ✅ (V4 es una copia de V1)
```

---

### 5️⃣ Visualizar una Versión Específica

1. En el historial de versiones
2. Haz clic en **"Ver"** junto a la versión que quieres ver
3. Se abrirá la plantilla en modo solo lectura
4. Puedes revisar todo su contenido

---

## 📋 Información Visible en las Plantillas

Cuando veas la lista de plantillas, verás:

### Para Administradores:
```
┌─────────────────────────────────────┐
│ TÍTULO DE LA PLANTILLA      v2 🔵  │
│                                      │
│ Descripción de la plantilla...      │
│                                      │
│ Creado por: embl                    │
│                                      │
│ 📄 Código: CONS-001                 │
│ 👤 8 campos                          │
│ 📅 Creado: 15 Oct 2025              │
│                                      │
│ [🕐] [✏️] [🗑️] [Usar Plantilla]    │
└─────────────────────────────────────┘
    ↓     ↓    ↓
Versiones Editar Eliminar
```

### Para Usuarios Regulares:
```
┌─────────────────────────────────────┐
│ TÍTULO DE LA PLANTILLA      v2 🔵  │
│                                      │
│ Descripción de la plantilla...      │
│                                      │
│ Creado por: embl                    │
│                                      │
│ 📄 Código: CONS-001                 │
│ 👤 8 campos                          │
│ 📅 Creado: 15 Oct 2025              │
│                                      │
│          [Usar Plantilla]            │
└─────────────────────────────────────┘
```

---

## 🔍 Ejemplo Práctico Completo

### Escenario:
El Dr. García creó una plantilla de consentimiento para cirugía. Después, la Dra. López necesita actualizar los riesgos descritos. Más tarde, se dan cuenta de que la versión original era mejor.

### Paso a Paso:

#### Día 1 - Creación Inicial
```
🏥 Dr. García (admin):
   - Crea plantilla "Consentimiento Cirugía General"
   - Sistema: Versión 1 creada ✅
```

#### Día 5 - Primera Edición
```
🏥 Dra. López (embl):
   - Edita la plantilla (actualiza sección de riesgos)
   - Sistema: Versión 2 creada automáticamente ✅
   - V1 se guarda en el historial
   - V2 se marca como ACTUAL
```

#### Día 10 - Restauración
```
🏥 Dr. García (admin):
   - Revisa el historial de versiones
   - Ve: V1 (Dr. García) → V2 (Dra. López) [ACTUAL]
   - Decide restaurar V1
   - Sistema: Versión 3 creada (copia de V1) ✅
   
Resultado final:
V1 (Dr. García) → V2 (Dra. López) → V3 (Dr. García) [ACTUAL]
                                      ↑
                                (copia de V1)
```

---

## ❓ Preguntas Frecuentes

### 1. ¿Se pierden las versiones anteriores cuando edito?
**No.** Todas las versiones se guardan permanentemente en el historial.

### 2. ¿Qué versión se usa para nuevos consentimientos?
Siempre la versión marcada como **ACTUAL** (la más reciente).

### 3. ¿Puedo eliminar una versión específica?
**No.** Solo se puede eliminar la plantilla completa (todas sus versiones). Esto garantiza la integridad del historial.

### 4. ¿Qué pasa con los consentimientos ya completados?
Los consentimientos completados mantienen la información de la versión con la que fueron creados. No se ven afectados por cambios posteriores.

### 5. ¿Cuántas versiones puedo tener?
**Ilimitadas.** El sistema no tiene límite de versiones.

### 6. ¿Puedo ver quién hizo cada cambio?
**Sí.** Cada versión muestra quién la creó y cuándo.

### 7. Como usuario regular, ¿por qué no veo los botones de edición?
Por seguridad. Solo los administradores pueden modificar plantillas para evitar cambios accidentales o no autorizados.

### 8. ¿Cómo sé si una plantilla tiene múltiples versiones?
Verás un **badge azul** (ej: v2, v3) en la tarjeta de la plantilla si tiene más de una versión.

---

## 🎨 Códigos de Color

### Versión Actual
```
🔵 Fondo azul claro + marca de verificación ✓
   "Esta es la versión que se está usando ahora"
```

### Versiones Anteriores
```
⚪ Fondo blanco + número de versión
   "Estas son versiones históricas"
```

### Badge de Versión
```
🔵 v2  → Versión 2 o superior (se muestra el número)
       → Si es v1, no se muestra badge
```

---

## 📞 Soporte y Ayuda

Si tienes dudas o problemas:

1. **Consulta esta guía** - Está diseñada para responder las preguntas más comunes

2. **Revisa el panel informativo** - En la página de versiones hay una sección con información útil

3. **Contacta a tu administrador** - admin o embl pueden ayudarte

4. **Logs de Auditoría** - Los administradores pueden revisar todas las acciones en el sistema

---

## ✅ Buenas Prácticas

### Para Administradores:

✅ **Revisa antes de editar** - Asegúrate de que realmente necesitas hacer cambios

✅ **Usa nombres descriptivos** - Títulos claros facilitan encontrar plantillas

✅ **Revisa el historial** - Antes de restaurar, verifica qué contiene cada versión

✅ **Comunica los cambios** - Informa al equipo cuando hagas cambios importantes

✅ **No elimines a la ligera** - La eliminación es permanente para todas las versiones

### Para Usuarios Regulares:

✅ **Usa la versión actual** - Siempre usa la plantilla más reciente disponible

✅ **Completa todos los campos** - La información debe ser precisa y completa

✅ **Reporta problemas** - Si ves algo incorrecto en una plantilla, infórmalo

---

## 🎉 Beneficios del Sistema

### Para el Hospital:
- 📋 **Trazabilidad completa** de cambios
- 🔒 **Seguridad** mejorada con control de acceso
- 📊 **Auditoría** de todas las modificaciones
- ⏮️ **Recuperación** fácil de versiones anteriores

### Para Administradores:
- ⚡ **Confianza** al hacer cambios (pueden revertir)
- 📈 **Historial** visible de evolución de plantillas
- 👥 **Colaboración** sin miedo a perder información

### Para Usuarios:
- ✅ **Plantillas actualizadas** siempre
- 🎯 **Simplicidad** - Solo ven lo que necesitan
- 🔐 **Seguridad** - No pueden modificar accidentalmente

---

**Sistema de Consentimientos Informados v2.0**  
Hospital Divino Salvador de Sopó  

_¿Preguntas? Contacta a tu administrador del sistema._

