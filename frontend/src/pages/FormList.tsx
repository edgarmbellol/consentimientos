import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { ConsentTemplate } from '../types';
import { 
  FileText, 
  Calendar,
  User,
  Play,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

const FormList: React.FC = () => {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.document_metadata.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-hospital-darkBlue">
            Plantillas de Consentimiento
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Selecciona una plantilla para completar un consentimiento informado
          </p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="card mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Buscar por título, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-500 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {filteredTemplates.length} de {templates.length}
          </div>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron plantillas' : 'No hay plantillas disponibles'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'Contacta al administrador para crear plantillas'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="card hover:shadow-lg transition-all duration-200 sm:hover:scale-105">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-hospital-darkBlue mb-2">
                  {template.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  {template.description || 'Sin descripción'}
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Código: {template.document_metadata.code}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span>{template.patient_fields.length} campos de paciente</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span>Versión {template.document_metadata.version}</span>
                </div>
              </div>

              {/* Información del hospital */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4 mb-3 sm:mb-4">
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-700 truncate">{template.hospital_info.name}</p>
                  <p className="truncate">NIT: {template.hospital_info.nit}</p>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="flex">
                <Link
                  to={`/forms/${template.id}`}
                  className="flex-1 btn-primary flex items-center justify-center text-sm py-2.5"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Completar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormList;


