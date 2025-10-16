import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { ConsentTemplate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft,
  Clock,
  User,
  Calendar,
  CheckCircle,
  RotateCcw,
  Eye,
  AlertCircle
} from 'lucide-react';

const TemplateVersions: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { canManageTemplates } = useAuth();
  const [versions, setVersions] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!canManageTemplates()) {
      navigate('/admin/templates');
      return;
    }
    loadVersions();
  }, [templateId, canManageTemplates, navigate]);

  const loadVersions = async () => {
    if (!templateId) return;
    
    try {
      setLoading(true);
      const data = await templatesAPI.getVersions(templateId);
      setVersions(data);
      setError('');
    } catch (err) {
      setError('Error al cargar las versiones');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string, versionNumber: number) => {
    if (!templateId) return;
    
    if (window.confirm(`¿Estás seguro de que quieres restaurar la versión ${versionNumber}? Esto creará una nueva versión basada en esta.`)) {
      try {
        setRestoring(versionId);
        await templatesAPI.restoreVersion(templateId, versionId);
        await loadVersions();
        alert('Versión restaurada exitosamente');
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Error al restaurar la versión';
        alert(errorMessage);
        console.error('Error:', err);
      } finally {
        setRestoring(null);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando versiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  const currentVersion = versions.find(v => v.is_current);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to="/admin/templates"
          className="inline-flex items-center text-hospital-blue hover:text-hospital-darkBlue mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Plantillas
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-hospital-darkBlue mb-2">
            Historial de Versiones
          </h1>
          {currentVersion && (
            <p className="text-gray-600">
              {currentVersion.title} - {versions.length} versión{versions.length !== 1 ? 'es' : ''}
            </p>
          )}
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron versiones
          </h3>
          <p className="text-gray-500">
            Esta plantilla no tiene historial de versiones
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div 
              key={version.id} 
              className={`card ${version.is_current ? 'border-2 border-hospital-blue bg-blue-50' : 'hover:shadow-md'} transition-all`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-hospital-darkBlue">
                      Versión {version.version_number}
                    </h3>
                    {version.is_current && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hospital-blue text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actual
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    {version.created_by && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          Creado por: <span className="font-medium">{version.created_by}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formatDate(version.created_at)}</span>
                    </div>
                  </div>

                  {version.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {version.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/admin/templates/${version.id}`}
                    className="btn-secondary inline-flex items-center px-4 py-2 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Link>
                  
                  {!version.is_current && (
                    <button
                      onClick={() => handleRestore(version.id!, version.version_number!)}
                      disabled={restoring === version.id}
                      className="btn-primary inline-flex items-center px-4 py-2 text-sm disabled:opacity-50"
                    >
                      {restoring === version.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Restaurando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restaurar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-hospital-darkBlue mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Acerca del Versionamiento
        </h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-7">
          <li>• Cada edición de una plantilla crea una nueva versión automáticamente</li>
          <li>• La versión actual es la que se usa para crear nuevos consentimientos</li>
          <li>• Puedes restaurar cualquier versión anterior, creando una nueva versión basada en ella</li>
          <li>• Todas las versiones se conservan para mantener un historial completo</li>
        </ul>
      </div>
    </div>
  );
};

export default TemplateVersions;

