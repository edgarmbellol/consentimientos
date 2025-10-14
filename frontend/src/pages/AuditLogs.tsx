import React, { useState, useEffect } from 'react';
import { auditAPI, AuditLog, AuditSummary } from '../services/api';
import { Activity, User, FileText, Calendar, Filter, RefreshCw } from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [limit, setLimit] = useState(50);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit };
      
      if (filterUsername) params.username = filterUsername;
      if (filterAction) params.action = filterAction;
      
      const [logsData, summaryData] = await Promise.all([
        auditAPI.getLogs(params),
        auditAPI.getSummary()
      ]);
      
      setLogs(logsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error al cargar logs:', error);
      alert('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleFilter = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilterUsername('');
    setFilterAction('');
    loadLogs();
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'login': 'Inicio de Sesión',
      'logout': 'Cierre de Sesión',
      'create_template': 'Creó Plantilla',
      'update_template': 'Actualizó Plantilla',
      'delete_template': 'Eliminó Plantilla',
      'view_template': 'Visualizó Plantilla',
      'create_form': 'Llenó Formulario',
      'view_form': 'Visualizó Formulario',
      'delete_form': 'Eliminó Formulario',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'create_template': 'bg-blue-100 text-blue-800',
      'update_template': 'bg-yellow-100 text-yellow-800',
      'delete_template': 'bg-red-100 text-red-800',
      'create_form': 'bg-purple-100 text-purple-800',
      'view_form': 'bg-indigo-100 text-indigo-800',
      'delete_form': 'bg-red-100 text-red-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando logs de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          Logs de Auditoría
        </h1>
        <p className="mt-2 text-gray-600">
          Registro de todas las acciones realizadas en el sistema
        </p>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Logs</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_logs}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">{summary.active_users_count}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Plantillas Creadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.actions_summary['create_template'] || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Formularios Llenados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.actions_summary['create_form'] || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={filterUsername}
              onChange={(e) => setFilterUsername(e.target.value)}
              placeholder="Filtrar por usuario..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acción
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las acciones</option>
              <option value="login">Inicio de Sesión</option>
              <option value="create_template">Crear Plantilla</option>
              <option value="update_template">Actualizar Plantilla</option>
              <option value="delete_template">Eliminar Plantilla</option>
              <option value="create_form">Llenar Formulario</option>
              <option value="view_form">Ver Formulario</option>
              <option value="delete_form">Eliminar Formulario</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="25">25 registros</option>
              <option value="50">50 registros</option>
              <option value="100">100 registros</option>
              <option value="200">200 registros</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={handleFilter}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros
          </button>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={loadLogs}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron logs con los filtros aplicados
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.username}
                          </div>
                          {log.user_name && (
                            <div className="text-xs text-gray-500">
                              {log.user_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.resource_type && (
                        <div>
                          <div className="font-medium text-gray-700">
                            {log.resource_type}
                          </div>
                          {log.resource_id && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {log.resource_id}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details && (
                        <div className="max-w-xs">
                          {log.details.title && (
                            <div className="text-xs">
                              <span className="font-medium">Título:</span> {log.details.title}
                            </div>
                          )}
                          {log.details.template_title && (
                            <div className="text-xs">
                              <span className="font-medium">Plantilla:</span> {log.details.template_title}
                            </div>
                          )}
                          {log.details.patient_name && (
                            <div className="text-xs">
                              <span className="font-medium">Paciente:</span> {log.details.patient_name}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Mostrando {logs.length} de {summary?.total_logs || 0} registros totales
      </div>
    </div>
  );
};

export default AuditLogs;

