import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  existingSignature?: string;
  label: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, existingSignature, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar el canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Configurar estilo de dibujo
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setContext(ctx);

    // Si hay una firma existente, cargarla
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <label className="label flex items-center">
          <PenTool className="w-4 h-4 mr-2 text-hospital-blue" />
          {label}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={clearSignature}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Limpiar firma"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={saveSignature}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Guardar firma"
            disabled={!hasSignature}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
        style={{ touchAction: 'none' }}
      />

      <p className="text-xs text-gray-500 mt-2 text-center">
        Dibuja tu firma en el espacio de arriba
      </p>
    </div>
  );
};

export default SignaturePad;


