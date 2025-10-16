import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { consentFormsAPI } from '../services/api';
import { ConsentFormResponse } from '../types';
import { 
  FileText, 
  Calendar,
  User,
  Eye,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

const ConsentFormList: React.FC = () => {
  const [forms, setForms] = useState<ConsentFormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await consentFormsAPI.getAll();
      setForms(data);
      setError('');
    } catch (err) {
      setError('Error al cargar los formularios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredForms = forms.filter(form => 
    form.template_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.patient_data.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.patient_data['N° DE IDENTIFICACIÓN']?.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formularios...</p>
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
            Formularios de Consentimiento
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Revisa los consentimientos informados completados
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
              placeholder="Buscar por paciente, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-500 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {filteredForms.length} de {forms.length}
          </div>
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron formularios' : 'No hay formularios completados'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'Los consentimientos completados aparecerán aquí'
            }
          </p>
          {!searchTerm && (
            <Link
              to="/forms"
              className="btn-primary inline-flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Plantillas Disponibles
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredForms.map((form) => (
            <div key={form.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-hospital-darkBlue">
                      {form.template_title}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                      Completado
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center min-w-0">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="font-medium">Paciente:</strong> {form.patient_data.nombre || form.patient_data['NOMBRE'] || 'No especificado'}
                      </span>
                    </div>
                    <div className="flex items-center min-w-0">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="font-medium">Doc:</strong> {form.patient_data['N° DE IDENTIFICACIÓN'] || 'No especificado'}
                      </span>
                    </div>
                    <div className="flex items-center min-w-0">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="font-medium">Fecha:</strong> {formatDate(form.filled_at)}
                      </span>
                    </div>
                  </div>

                  {/* Estado del consentimiento */}
                  <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center">
                      <span className="text-xs sm:text-sm text-gray-600 mr-1.5 sm:mr-2 flex-shrink-0">Consentimiento:</span>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        form.consent_responses.consent === 'si' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {form.consent_responses.consent === 'si' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs sm:text-sm text-gray-600 mr-1.5 sm:mr-2 flex-shrink-0">Aut. Digital:</span>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        form.consent_responses.digital_authorization === 'si' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.consent_responses.digital_authorization === 'si' ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link
                    to={`/admin/forms/${form.id}`}
                    className="btn-secondary flex items-center justify-center w-full sm:w-auto text-xs sm:text-sm py-2"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Ver Detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsentFormList;


