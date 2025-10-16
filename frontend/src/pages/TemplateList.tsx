import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { ConsentTemplate } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';

const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesAPI.getAll();
      setTemplates(data);
      setError('');
    } catch (err) {
      setError('Error al cargar las plantillas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la plantilla "${title}"?`)) {
      try {
        await templatesAPI.delete(id);
        setTemplates(templates.filter(t => t.id !== id));
      } catch (err) {
        alert('Error al eliminar la plantilla');
        console.error('Error:', err);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-hospital-darkBlue">
            Plantillas de Consentimientos
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Administra las plantillas de consentimientos informados
          </p>
        </div>
        <Link
          to="/admin/templates/create"
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay plantillas creadas
          </h3>
          <p className="text-gray-500 mb-6">
            Crea tu primera plantilla de consentimiento informado
          </p>
          <Link
            to="/admin/templates/create"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Plantilla
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-hospital-darkBlue pr-2 flex-1">
                    {template.title}
                  </h3>
                  <div className="flex space-x-1 flex-shrink-0">
                    <Link
                      to={`/admin/templates/edit/${template.id}`}
                      className="p-1.5 sm:p-2 text-hospital-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar plantilla"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id!, template.title)}
                      className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  {template.description || 'Sin descripción'}
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2 mb-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{template.document_metadata.code}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>{template.patient_fields.length} campos</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Creado: {formatDate(template.created_at)}</span>
                </div>
              </div>

              <div className="flex">
                <Link
                  to={`/forms/${template.id}`}
                  className="flex-1 btn-secondary text-center text-xs sm:text-sm py-2"
                >
                  Usar Plantilla
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateList;


