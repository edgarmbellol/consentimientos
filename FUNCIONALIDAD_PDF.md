# 📄 Funcionalidad de Descarga de PDF - Consentimientos Informados

## ✅ Implementación Completada

Se ha implementado exitosamente la funcionalidad de **generación y descarga de PDFs** para los formularios de consentimiento informado utilizando **ReportLab**.

---

## 🎯 Características del PDF Generado

### ✨ **Documento Profesional y Completo**

El PDF generado incluye:

1. **Header con Logo del Hospital**
   - Logo corporativo
   - Nombre del hospital
   - NIT, dirección y contacto
   - Código y versión del documento

2. **Datos del Paciente**
   - Tabla profesional con todos los campos
   - Fotografía del paciente (si fue aceptado el consentimiento)
   - Formato organizado y legible

3. **Información del Procedimiento**
   - Descripción detallada
   - Beneficios, riesgos y alternativas en tabla de 3 columnas
   - Implicaciones
   - Recomendaciones

4. **Declaración de Consentimiento**
   - Lista numerada bien formateada
   - Respuesta del paciente (SÍ ACEPTO / NO ACEPTO)
   - Respuesta de autorización de datos

5. **Revocatoria (Condicional)**
   - Solo aparece cuando el consentimiento fue rechazado
   - Se muestra antes de las firmas

6. **Firmas Digitales**
   - Nombres, documentos y firmas digitales
   - Diferentes campos según si fue aceptado o rechazado
   - Imágenes de firmas en alta calidad

7. **Footer Legal**
   - Información de contacto del hospital
   - Texto de cumplimiento legal
   - Fecha y hora de generación del documento

---

## 🔧 Implementación Técnica

### **Backend (Python/FastAPI)**

#### **1. Nuevas Dependencias**
```python
# requirements.txt
reportlab==4.0.7  # Generación de PDFs
pillow==10.1.0    # Procesamiento de imágenes
```

#### **2. Módulo de Generación (`pdf_generator.py`)**
- **Clase**: `ConsentFormPDFGenerator`
- **Funcionalidades**:
  - Estilos personalizados con colores del hospital
  - Procesamiento de imágenes base64
  - Tablas profesionales
  - Formato de listas numeradas
  - Manejo de firmas digitales
  - Diseño responsive

#### **3. Nuevo Endpoint**
```python
GET /api/consent-forms/{form_id}/pdf
```

**Características:**
- Autenticación requerida
- Genera PDF dinámicamente
- Nombre de archivo descriptivo
- Registro en auditoría
- Manejo de errores robusto

**Respuesta:**
- Tipo: `application/pdf`
- Descarga automática
- Nombre: `Consentimiento_[Nombre]_[Documento]_[ID].pdf`

---

### **Frontend (React/TypeScript)**

#### **Función de Descarga**
```typescript
const handleDownloadPDF = async () => {
  // Realiza petición al endpoint
  // Descarga el archivo automáticamente
  // Maneja errores
}
```

#### **Botón en Interfaz**
- Ubicación: Vista de detalles del formulario
- Diseño: Botón principal con ícono de descarga
- Comportamiento: Descarga inmediata del PDF

---

## 🎨 Diseño del PDF

### **Paleta de Colores**
- **Azul Oscuro** (#2C5282): Títulos y encabezados
- **Azul Principal** (#4A90E2): Tablas y elementos destacados
- **Verde** (#38A169): Consentimiento aceptado
- **Rojo** (#E53E3E): Consentimiento rechazado
- **Gris**: Bordes y fondo de tablas

### **Tipografía**
- **Helvetica-Bold**: Títulos y etiquetas
- **Helvetica**: Texto normal
- Tamaños: 8pt (footer) a 16pt (título principal)

### **Espaciado y Márgenes**
- Márgenes: 0.75 pulgadas en todos los lados
- Espaciado entre secciones: Óptimo para lectura
- Alineación: Justificada para párrafos largos

---

## 📊 Lógica Condicional del PDF

### **Cuando el Consentimiento fue ACEPTADO:**
```
✅ Datos del paciente
✅ Fotografía del paciente
✅ Descripción del procedimiento
✅ Beneficios, riesgos, alternativas
✅ Implicaciones
✅ Recomendaciones
✅ Declaración de consentimiento
✅ Respuesta: ✓ SÍ ACEPTO (verde)
✅ Firmas completas (todas las configuradas)
❌ Revocatoria (no aparece)
```

### **Cuando el Consentimiento fue RECHAZADO:**
```
✅ Datos del paciente
❌ Fotografía del paciente (no aparece)
✅ Descripción del procedimiento
✅ Beneficios, riesgos, alternativas
✅ Implicaciones
✅ Recomendaciones
✅ Declaración de consentimiento
✅ Respuesta: ✗ NO ACEPTO (rojo)
✅ Revocatoria del consentimiento
✅ Firmas de rechazo (responsable + acompañante)
```

---

## 🚀 Cómo Usar

### **1. Desde la Vista de Formularios:**

1. Ve a **"Formularios"** o **"Ver Formularios"**
2. Haz clic en **"Ver"** en cualquier formulario
3. En la vista de detalles, haz clic en **"Descargar PDF"**
4. El PDF se descargará automáticamente

### **2. Nombre del Archivo:**
```
Consentimiento_[Nombre_Paciente]_[Documento]_[ID].pdf

Ejemplo:
Consentimiento_Edgar_Bello_1070012680_ae65ce8a.pdf
```

### **3. Contenido del PDF:**
- Todas las secciones del formulario
- Formato profesional y legible
- Listo para imprimir o archivar
- Cumple con normativas legales

---

## 🔐 Seguridad y Auditoría

### **Seguridad:**
- ✅ Requiere autenticación
- ✅ Solo usuarios autenticados pueden descargar
- ✅ Validación de permisos en backend
- ✅ Datos sensibles protegidos

### **Auditoría:**
Cada descarga de PDF queda registrada con:
- Usuario que descargó
- Fecha y hora
- ID del formulario
- Nombre del paciente
- Plantilla utilizada

---

## 📋 Ventajas de Usar ReportLab

### **¿Por qué ReportLab?**

✅ **Generación del lado del servidor**: Mayor seguridad y control  
✅ **PDFs profesionales**: Diseño personalizable al 100%  
✅ **Soporte de imágenes**: Logos, fotos y firmas digitales  
✅ **Formato consistente**: Mismo diseño siempre  
✅ **Compatible**: Funciona en cualquier plataforma  
✅ **Open Source**: Sin costos de licencia  
✅ **Ampliamente usado**: Biblioteca madura y confiable

---

## 🎨 Características Visuales

### **Elementos Destacados:**

- **Logo del Hospital**: Aparece en el header
- **Códigos de Color**: Verde para aceptado, rojo para rechazado
- **Tablas Organizadas**: Grid profesional para datos
- **Firmas Digitales**: Imágenes incrustadas en el PDF
- **Fotografía del Paciente**: Centrada y bien dimensionada
- **Listas Numeradas**: Declaraciones formateadas correctamente

### **Optimizaciones:**

- Imágenes optimizadas (máximo 2x1.5 pulgadas)
- Firmas a escala apropiada
- Texto justificado para párrafos largos
- Espaciado consistente entre secciones

---

## 🧪 Pruebas Recomendadas

### **1. PDF con Consentimiento Aceptado:**
```bash
1. Completa un formulario aceptando el consentimiento
2. Firma con todos los campos (usuario, profesional, acompañante)
3. Toma la foto del paciente
4. Guarda el formulario
5. Ve a "Ver Formularios" → Selecciona el formulario
6. Haz clic en "Descargar PDF"
7. Verifica el PDF generado
```

### **2. PDF con Consentimiento Rechazado:**
```bash
1. Completa un formulario rechazando el consentimiento
2. Firma solo con responsable y acompañante
3. Guarda el formulario
4. Ve a "Ver Formularios" → Selecciona el formulario
5. Haz clic en "Descargar PDF"
6. Verifica que incluya la revocatoria y firmas correctas
```

### **3. Elementos a Verificar en el PDF:**
- [ ] Logo del hospital visible
- [ ] Datos del paciente completos
- [ ] Fotografía (solo si aceptó)
- [ ] Procedimiento, riesgos, beneficios
- [ ] Lista numerada bien formateada
- [ ] Respuesta de consentimiento marcada
- [ ] Firmas digitales visibles
- [ ] Revocatoria (solo si rechazó)
- [ ] Footer con información legal

---

## 📁 Archivos Creados/Modificados

### **Backend:**
- ✅ `backend/requirements.txt` - Dependencias agregadas
- ✅ `backend/pdf_generator.py` - Generador de PDFs (NUEVO)
- ✅ `backend/main.py` - Endpoint de descarga agregado
- ✅ `backend/logo.png` - Logo copiado para PDFs

### **Frontend:**
- ✅ `frontend/src/pages/FormDetails.tsx` - Función de descarga implementada

### **Configuración:**
- ✅ `docker-compose.yml` - Puertos actualizados (8001, 3001)

---

## 🔄 Flujo Completo

```
Usuario hace clic en "Descargar PDF"
         ↓
Frontend hace petición a:
GET /api/consent-forms/{id}/pdf
         ↓
Backend obtiene datos del formulario y plantilla
         ↓
pdf_generator.py procesa toda la información
         ↓
Se genera el PDF con ReportLab
         ↓
Backend retorna el archivo PDF
         ↓
Frontend descarga automáticamente
         ↓
Acción registrada en auditoría
         ✓
Usuario tiene el PDF guardado
```

---

## 🎉 Resultado Final

### **Archivo PDF Generado:**
```
📄 Consentimiento_Edgar_Bello_1070012680_ae65ce8a.pdf
```

### **Contenido:**
- Documento profesional listo para archivar
- Todas las secciones bien formateadas
- Firmas digitales incluidas
- Cumplimiento legal garantizado
- Formato imprimible

---

## 💡 Próximas Mejoras Sugeridas

1. **Marca de Agua**: Agregar "ORIGINAL" o "COPIA"
2. **QR Code**: Código QR para verificación digital
3. **Numeración de Páginas**: "Página X de Y"
4. **Encriptación**: PDF protegido con contraseña
5. **Envío por Email**: Enviar PDF automáticamente al paciente
6. **Almacenamiento**: Guardar PDFs generados en el servidor
7. **Múltiples Idiomas**: Soporte para otros idiomas

---

## 📞 Soporte

### **Solución de Problemas:**

**Error: "Error al generar el PDF"**
- Verifica que las firmas sean válidas
- Revisa los logs del backend: `docker-compose logs backend`

**Error: "Error al descargar el PDF"**
- Verifica tu conexión
- Asegúrate de estar autenticado
- Revisa la consola del navegador

**PDF vacío o mal formateado:**
- Verifica que el formulario tenga todos los datos
- Revisa que las firmas sean imágenes base64 válidas

---

## ✅ Estado de la Implementación

```
✅ ReportLab instalado
✅ Pillow instalado  
✅ Generador de PDF creado
✅ Endpoint de descarga implementado
✅ Botón en frontend funcional
✅ Logo incluido en PDFs
✅ Auditoría de descargas
✅ Formato profesional
✅ Lógica condicional (aceptado/rechazado)
✅ Servicios corriendo en puertos 8001 y 3001
```

---

**Sistema de Consentimientos Informados v2.0**  
Hospital Divino Salvador de Sopó  
Funcionalidad PDF implementada: Octubre 17, 2025

