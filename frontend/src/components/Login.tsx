import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hospital-blue to-hospital-darkBlue flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-hospital-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Sistema de Consentimientos
          </h1>
          <p className="text-blue-100">
            Hospital Divino Salvador de Sopó
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">
                <User className="inline w-4 h-4 mr-2" />
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Ingresa tu usuario"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="label">
                <Lock className="inline w-4 h-4 mr-2" />
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Ingresa tu contraseña"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg font-medium"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2 font-medium">
              Credenciales de prueba:
            </p>
            <p className="text-sm text-gray-500">
              Usuario: <span className="font-mono bg-white px-2 py-1 rounded">admin</span>
            </p>
            <p className="text-sm text-gray-500">
              Contraseña: <span className="font-mono bg-white px-2 py-1 rounded">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


