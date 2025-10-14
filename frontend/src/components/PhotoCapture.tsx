import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, Upload, X, CheckCircle } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (photo: string | null) => void;
  existingPhoto?: string;
  label?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ 
  onCapture, 
  existingPhoto,
  label = "Foto del Paciente"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photo, setPhoto] = useState<string | null>(existingPhoto || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Limpiar stream al desmontar el componente
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Asignar stream al video cuando esté disponible
  useEffect(() => {
    if (stream && videoRef.current && isCameraActive) {
      console.log('🎬 Asignando stream al video...');
      videoRef.current.srcObject = stream;
      
      // Asegurar que el video se reproduzca
      console.log('▶️ Intentando reproducir video...');
      videoRef.current.play().then(() => {
        console.log('✅ Video reproduciéndose correctamente');
      }).catch(err => {
        console.error('❌ Error al reproducir video:', err);
      });
    }
  }, [stream, isCameraActive]);

  const startCamera = async () => {
    try {
      console.log('🎥 Iniciando cámara...');
      setError('');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      console.log('📹 Stream obtenido:', mediaStream);
      console.log('📹 Tracks activos:', mediaStream.getTracks().length);
      
      // Primero activamos la cámara y guardamos el stream
      setStream(mediaStream);
      setIsCameraActive(true);
      setIsVideoReady(false);
      
      console.log('✅ Estado actualizado, esperando renderizado del video...');
    } catch (err) {
      console.error('❌ Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Configurar el tamaño del canvas al tamaño del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(photoData);
    onCapture(photoData);

    // Detener la cámara
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Leer el archivo
    const reader = new FileReader();
    reader.onload = (event) => {
      const photoData = event.target?.result as string;
      setPhoto(photoData);
      onCapture(photoData);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    onCapture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelCamera = () => {
    stopCamera();
  };

  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <label className="label flex items-center">
          <Camera className="w-4 h-4 mr-2 text-hospital-blue" />
          {label}
          <span className="ml-2 text-xs text-gray-500 font-normal">(Opcional)</span>
        </label>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {!photo && !isCameraActive && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={startCamera}
            className="w-full btn-primary flex items-center justify-center"
          >
            <Camera className="w-4 h-4 mr-2" />
            Tomar Foto con Cámara
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full btn-secondary flex items-center justify-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir desde Archivo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {isCameraActive && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
              style={{ transform: 'scaleX(-1)' }} // Espejo para selfie
              onLoadStart={() => console.log('🔄 Video: loadStart')}
              onLoadedMetadata={() => {
                console.log('📋 Video: loadedMetadata');
                console.log('📏 Dimensiones:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                // Asegurar que el video se reproduzca cuando esté listo
                if (videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onLoadedData={() => console.log('📊 Video: loadedData')}
              onCanPlay={() => console.log('▶️ Video: canPlay')}
              onPlaying={() => {
                console.log('🎬 Video: playing');
                setIsVideoReady(true);
              }}
              onError={(e) => console.error('❌ Video error:', e)}
            />
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              REC
            </div>
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-pulse">Iniciando cámara...</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capturar Foto
            </button>
            <button
              type="button"
              onClick={cancelCamera}
              className="btn-secondary flex items-center justify-center px-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Asegúrate de que tu rostro esté bien iluminado y centrado
          </p>
        </div>
      )}

      {photo && (
        <div className="space-y-4">
          {/* Preview de la foto capturada */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-700 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Foto Capturada
              </span>
            </div>
            
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 bg-white">
              <img 
                src={photo} 
                alt="Foto del paciente" 
                className="w-full h-auto object-contain"
                style={{ maxHeight: '400px' }}
              />
            </div>
            
            <p className="text-xs text-gray-600 mt-2 text-center">
              Revisa que la foto sea clara y el paciente sea identificable
            </p>
          </div>
          
          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="btn-primary flex items-center justify-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              Repetir Foto
            </button>
            <button
              type="button"
              onClick={removePhoto}
              className="btn-secondary flex items-center justify-center text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Canvas oculto para capturar la foto */}
      <canvas ref={canvasRef} className="hidden" />

      <p className="text-xs text-gray-500 mt-2 text-center">
        La foto del paciente es opcional y ayuda a identificar el documento
      </p>
    </div>
  );
};

export default PhotoCapture;

