# Changelog - Implementación de Firmas Digitales y Captura de Fotos

## Fecha: Octubre 2024

### 🎯 Objetivo
Mejorar el sistema de consentimientos informados agregando:
1. **Firma digital con canvas** - Para firmar directamente en tablets/dispositivos
2. **Captura de foto del paciente** - Usando la cámara del dispositivo (opcional)

---

## ✨ Nuevas Funcionalidades

### 1. Componente SignaturePad (`frontend/src/components/SignaturePad.tsx`)

**Características:**
- Canvas HTML5 para dibujar firmas con dedo o stylus
- Soporte completo para touch (tablets) y mouse (desktop)
- Botones para limpiar y guardar firma
- Conversión automática a base64 (PNG)
- Carga de firmas existentes
- Prevención de scroll durante el dibujo (`touch-action: none`)

**Props:**
- `onSave: (signature: string) => void` - Callback al guardar firma
- `existingSignature?: string` - Firma existente en base64
- `label: string` - Etiqueta del campo

**Uso:**
```tsx
<SignaturePad
  label="FIRMA DIGITAL"
  onSave={(signatureData) => handleSignatureSave('usuario', signatureData)}
  existingSignature={signatures['usuario_signature']}
/>
```

---

### 2. Componente PhotoCapture (`frontend/src/components/PhotoCapture.tsx`)

**Características:**
- Acceso a cámara del dispositivo usando Media API
- Captura de foto directamente desde la cámara
- Opción alternativa de subir archivo desde galería
- Preview en tiempo real del video
- Conversión automática a base64 (JPEG)
- Manejo de permisos de cámara
- Campo opcional (no requerido)
- Botón para eliminar foto

**Props:**
- `onCapture: (photo: string | null) => void` - Callback al capturar/remover foto
- `existingPhoto?: string` - Foto existente en base64
- `label?: string` - Etiqueta del campo (default: "Foto del Paciente")

**Uso:**
```tsx
<PhotoCapture 
  onCapture={handlePhotoCapture}
  existingPhoto={patientPhoto || undefined}
  label="Foto del Paciente"
/>
```

---

## 🔧 Cambios en Backend (`backend/main.py`)

### Modelos Actualizados:

**ConsentFormData:**
```python
class ConsentFormData(BaseModel):
    template_id: str
    patient_data: Dict[str, Any]
    patient_photo: Optional[str] = None  # ← NUEVO: Base64 de la foto
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]
    filled_at: Optional[datetime] = None
```

**ConsentFormResponse:**
```python
class ConsentFormResponse(BaseModel):
    id: str
    template_id: str
    patient_data: Dict[str, Any]
    patient_photo: Optional[str] = None  # ← NUEVO: Base64 de la foto
    consent_responses: Dict[str, Any]
    signatures: Dict[str, str]
    filled_at: datetime
    template_title: str
```

**Cambios:**
- Se agregó campo `patient_photo` opcional en modelos
- Se actualiza el almacenamiento para guardar la foto
- Se retorna la foto en las respuestas de la API

---

## 📝 Cambios en Frontend

### Tipos TypeScript (`frontend/src/types/index.ts`)

Actualizados para incluir `patient_photo`:
```typescript
export interface ConsentFormData {
  template_id: string;
  patient_data: Record<string, any>;
  patient_photo?: string | null;  // ← NUEVO
  consent_responses: Record<string, any>;
  signatures: Record<string, string>;
  filled_at?: string;
}
```

### ConsentForm (`frontend/src/pages/ConsentForm.tsx`)

**Cambios principales:**
1. **Importación de componentes nuevos:**
   ```tsx
   import SignaturePad from '../components/SignaturePad';
   import PhotoCapture from '../components/PhotoCapture';
   ```

2. **Nuevos estados:**
   ```tsx
   const [patientPhoto, setPatientPhoto] = useState<string | null>(null);
   const [signatures, setSignatures] = useState<Record<string, string>>({});
   ```

3. **Handlers:**
   ```tsx
   const handleSignatureSave = (role: string, signatureData: string) => {
     setSignatures(prev => ({
       ...prev,
       [`${role}_signature`]: signatureData
     }));
   };

   const handlePhotoCapture = (photoData: string | null) => {
     setPatientPhoto(photoData);
   };
   ```

4. **Actualización del submit:**
   - Combina firmas del formulario con las del canvas
   - Incluye la foto del paciente en el payload

5. **Sección de Foto del Paciente:**
   - Se agregó antes de los datos del paciente
   - Permite tomar foto o subir archivo

6. **Sección de Firmas:**
   - Reemplazado el botón placeholder por componente SignaturePad
   - Permite firmar directamente en el canvas
   - Guarda automáticamente en formato base64

### FormDetails (`frontend/src/pages/FormDetails.tsx`)

**Cambios:**
1. **Sección de Foto del Paciente:**
   ```tsx
   {form.patient_photo && (
     <div className="card">
       <h2>FOTO DEL PACIENTE</h2>
       <img src={form.patient_photo} alt="Foto del paciente" />
     </div>
   )}
   ```

2. **Visualización de Firmas:**
   - Muestra firmas como imágenes (no como texto)
   - Renderiza el base64 directamente en `<img>`

---

## 🎨 Características Técnicas

### Formato de Datos

**Firmas:**
- Formato: PNG en base64
- Ejemplo: `data:image/png;base64,iVBORw0KGgoAAAANS...`
- Tamaño aproximado: 5-20 KB por firma

**Fotos:**
- Formato: JPEG en base64
- Calidad: 0.8 (80%)
- Resolución ideal: 640x480
- Tamaño aproximado: 30-100 KB por foto

### Compatibilidad

**Navegadores soportados:**
- ✅ Chrome/Edge (Desktop y Mobile)
- ✅ Firefox (Desktop y Mobile)
- ✅ Safari (Desktop y Mobile - iOS 11+)
- ✅ Samsung Internet
- ✅ Opera

**APIs utilizadas:**
- Canvas API (firmas)
- MediaDevices API (cámara)
- FileReader API (subir archivos)

### Seguridad

- ✅ Permisos de cámara solicitados al usuario
- ✅ Validación de tipos de archivo (solo imágenes)
- ✅ Datos almacenados en base64 (no archivos)
- ✅ Limpieza de stream de cámara al terminar
- ⚠️ **Nota:** En producción, considerar compresión de imágenes para reducir payload

---

## 📱 Experiencia de Usuario

### En Tablet (Uso Principal):
1. Usuario abre formulario de consentimiento
2. **Foto del Paciente:**
   - Toca "Tomar Foto con Cámara"
   - Se activa cámara frontal
   - Captura foto del paciente
   - Puede retomar si no quedó bien

3. **Firmas:**
   - Llena datos (nombre, documento)
   - Dibuja firma directamente en canvas con dedo/stylus
   - Puede limpiar y volver a firmar
   - Toca guardar firma
   - Repite para cada firmante (paciente, profesional, acompañante)

### En Desktop:
- Funciona igual pero con mouse para firmar
- Opción de subir foto desde archivo

---

## 🚀 Pruebas Recomendadas

### Manual Testing:

1. **Captura de Foto:**
   - [ ] Tomar foto con cámara en tablet
   - [ ] Tomar foto con cámara en smartphone
   - [ ] Subir foto desde archivo
   - [ ] Eliminar foto capturada
   - [ ] Enviar formulario sin foto (opcional)

2. **Firmas Digitales:**
   - [ ] Firmar con dedo en tablet
   - [ ] Firmar con stylus en tablet
   - [ ] Firmar con mouse en desktop
   - [ ] Limpiar y re-firmar
   - [ ] Verificar que se guarden todas las firmas

3. **Visualización:**
   - [ ] Ver formulario completado con foto
   - [ ] Ver formulario completado con firmas
   - [ ] Imprimir formulario (PDF)
   - [ ] Verificar que imágenes se muestren correctamente

---

## 🔄 Próximas Mejoras Sugeridas

1. **Compresión de Imágenes:**
   - Implementar compresión client-side con librería como `browser-image-compression`
   - Reducir tamaño de payloads

2. **Validación de Firmas:**
   - Detectar si el canvas está en blanco antes de guardar
   - Prevenir firmas accidentales (muy pequeñas)

3. **Mejoras UI:**
   - Agregar zoom para firmas pequeñas
   - Preview más grande de foto capturada
   - Guías visuales en el canvas de firma

4. **Almacenamiento:**
   - Migrar de memoria a base de datos
   - Considerar almacenamiento en S3/Cloud Storage para imágenes grandes
   - Implementar CDN para servir imágenes

5. **Accesibilidad:**
   - Agregar mensajes de voz para guiar el proceso
   - Mejorar contraste para personas con baja visión

---

## 📦 Dependencias Nuevas

**Ninguna** - Todo implementado con APIs nativas del navegador:
- Canvas API
- MediaDevices API  
- FileReader API

---

## 🐛 Problemas Conocidos

1. **iOS Safari < 11:** API de MediaDevices limitada
2. **Navegadores antiguos:** No soportan `getUserMedia()`
3. **Tamaño de payload:** Formularios con foto pueden ser >100KB

**Soluciones:**
- Detectar soporte de features y mostrar mensaje alternativo
- Fallback a subir archivo si cámara no disponible
- Implementar compresión de imágenes

---

## 👥 Autor
Sistema de Consentimientos Informados - Hospital Divino Salvador de Sopó

**Versión:** 1.1.0  
**Fecha:** Octubre 2024


