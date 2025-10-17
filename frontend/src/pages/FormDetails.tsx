import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consentFormsAPI, templatesAPI } from '../services/api';
import { ConsentFormResponse, ConsentTemplate } from '../types';
import { 
  ArrowLeft, 
  Download,
  Printer,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const FormDetails: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ConsentFormResponse | null>(null);
  const [template, setTemplate] = useState<ConsentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formId) {
      loadFormDetails();
    }
  }, [formId]);

  const loadFormDetails = async () => {
    try {
      setLoading(true);
      const formData = await consentFormsAPI.getById(formId!);
      setForm(formData);
      
      const templateData = await templatesAPI.getById(formData.template_id);
      setTemplate(templateData);
      
      setError('');
    } catch (err) {
      setError('Error al cargar los detalles del formulario');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8001/api/consent-forms/${formId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al descargar el PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Consentimiento_${form?.patient_data['2']?.replace(' ', '_') || 'formulario'}_${formId?.substring(0, 8) || 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF. Por favor, inténtalo nuevamente.');
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !form || !template) {
    return (
      <div className="card">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error || 'Formulario no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/forms')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-hospital-darkBlue truncate">
                {form.template_title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                Consentimiento Informado - {formatDate(form.filled_at)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center justify-center w-full sm:w-auto"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn-primary flex items-center justify-center w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Título para impresión */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-hospital-darkBlue mb-2">
          {form.template_title}
        </h1>
        <p className="text-gray-600">
          Fecha: {formatDate(form.filled_at)}
        </p>
      </div>

      {/* Header del Hospital */}
      <div className="card bg-gradient-to-r from-hospital-blue to-hospital-darkBlue text-white print:bg-hospital-blue">
        <div className="flex flex-col sm:flex-row sm:items-center mb-4">
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 mr-3 flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo Hospital" 
                className="w-full h-full object-contain filter brightness-0 invert"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate">{template.hospital_info.name}</h2>
              <p className="text-blue-100 text-sm sm:text-base">NIT: {template.hospital_info.nit}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Código: {template.document_metadata.code}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Versión: {template.document_metadata.version}</span>
          </div>
          <div className="flex items-center sm:col-span-2 lg:col-span-1">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Fecha: {formatDate(form.filled_at)}</span>
          </div>
        </div>
      </div>

      {/* Foto del Paciente */}
      {form.patient_photo && (
        <div className="card">
          <h2 className="text-lg sm:text-xl font-semibold text-hospital-darkBlue mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 flex-shrink-0" />
            FOTO DEL PACIENTE
          </h2>
          <div className="flex justify-center">
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 w-full max-w-sm sm:max-w-md">
              <img 
                src={form.patient_photo} 
                alt="Foto del paciente" 
                className="patient-photo-print w-full h-auto object-contain"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Fotografía tomada al momento de firmar el consentimiento
          </p>
        </div>
      )}

      {/* Datos del Paciente */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-semibold text-hospital-darkBlue mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 flex-shrink-0" />
          DATOS DEL PACIENTE
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {template.patient_fields
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              const value = form.patient_data[field.id];
              return (
                <div key={field.id}>
                  <label className="label text-gray-700">
                    {field.label}
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900">
                      {value || 'No especificado'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Estado del Consentimiento */}
      <div className="card">
        <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
          ESTADO DEL CONSENTIMIENTO
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center p-4 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-4">
              {form.consent_responses.consent === 'si' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Consentimiento</h3>
              <p className={`text-sm font-medium ${
                form.consent_responses.consent === 'si' ? 'text-green-600' : 'text-red-600'
              }`}>
                {form.consent_responses.consent === 'si' ? 'APROBADO' : 'RECHAZADO'}
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-4">
              {form.consent_responses.digital_authorization === 'si' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Autorización Digital</h3>
              <p className={`text-sm font-medium ${
                form.consent_responses.digital_authorization === 'si' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {form.consent_responses.digital_authorization === 'si' ? 'AUTORIZADO' : 'NO AUTORIZADO'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción del Procedimiento */}
      <div className="card">
        <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
          DESCRIPCIÓN DEL PROCEDIMIENTO
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {template.procedure_description}
          </p>
        </div>
      </div>

      {/* Beneficios, Riesgos y Alternativas */}
      <div className="card">
        <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
          BENEFICIOS, RIESGOS Y ALTERNATIVAS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-hospital-green mb-2">Beneficios</h3>
            <ul className="space-y-1">
              {template.benefits_risks_alternatives.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-red-600 mb-2">Riesgos</h3>
            <ul className="space-y-1">
              {template.benefits_risks_alternatives.risks.map((risk, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-hospital-blue mb-2">Alternativas</h3>
            <ul className="space-y-1">
              {template.benefits_risks_alternatives.alternatives.map((alternative, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="w-4 h-4 bg-hospital-blue text-white rounded-full flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  {alternative}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Implicaciones */}
      <div className="card">
        <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
          IMPLICACIONES
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {template.implications}
          </p>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="card">
        <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
          RECOMENDACIONES
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {template.recommendations}
          </p>
        </div>
      </div>

      {/* Revocación - Solo cuando se rechazó el consentimiento */}
      {form.consent_responses.consent === 'no' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            REVOCATORIA DEL CONSENTIMIENTO
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {template.revocation_statement}
            </p>
          </div>
        </div>
      )}

      {/* Firmas */}
      <div className="card">
        <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
          {form.consent_responses.consent === 'no' ? 'FIRMAS - RECHAZO DEL CONSENTIMIENTO' : 'FIRMAS DEL CONSENTIMIENTO INFORMADO'}
        </h2>
        
        <div className="space-y-6">
          {form.consent_responses.consent === 'no' ? (
            // Firmas para cuando se rechaza el consentimiento
            <>
              {/* Persona Responsable o Usuario */}
              {(form.signatures.responsable_name || form.signatures.responsable_signature) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">
                    PERSONA RESPONSABLE O USUARIO
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label text-gray-700">NOMBRE Y APELLIDO</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {form.signatures.responsable_name || 'No especificado'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="label text-gray-700">DOCUMENTO DE IDENTIDAD</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {form.signatures.responsable_document || 'No especificado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="label text-gray-700">FIRMA DIGITAL</label>
                    {(() => {
                      const signatureData = form.signatures.responsable_signature;
                      if (signatureData && signatureData.trim() !== '' && signatureData !== 'null' && signatureData !== 'undefined') {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <img 
                              src={signatureData} 
                              alt="Firma de Persona Responsable"
                              className="signature-print max-h-32 mx-auto"
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border border-dashed">
                            <span className="text-gray-500">Firma no disponible</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Acompañante (Opcional) */}
              {(form.signatures.acompanante_name || form.signatures.acompanante_signature) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">
                    ACOMPAÑANTE
                    <span className="ml-2 text-sm text-gray-500 font-normal">(Opcional)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label text-gray-700">NOMBRE Y APELLIDO</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {form.signatures.acompanante_name || 'No especificado'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="label text-gray-700">DOCUMENTO DE IDENTIDAD</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {form.signatures.acompanante_document || 'No especificado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="label text-gray-700">FIRMA DIGITAL (Opcional)</label>
                    {(() => {
                      const signatureData = form.signatures.acompanante_signature;
                      if (signatureData && signatureData.trim() !== '' && signatureData !== 'null' && signatureData !== 'undefined') {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <img 
                              src={signatureData} 
                              alt="Firma de Acompañante"
                              className="signature-print max-h-32 mx-auto"
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border border-dashed">
                            <span className="text-gray-500">Sin firma (opcional)</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Firmas normales cuando se acepta el consentimiento
            template.signature_blocks.map((block, index) => {
            const isOptional = block.role === 'acompanante';
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">
                  {block.label}
                  {isOptional && (
                    <span className="ml-2 text-sm text-gray-500 font-normal">(Opcional)</span>
                  )}
                </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label text-gray-700">NOMBRE Y APELLIDO</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900">
                      {form.signatures[`${block.role}_name`] || 'No especificado'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="label text-gray-700">DOCUMENTO DE IDENTIDAD</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900">
                      {form.signatures[`${block.role}_document`] || 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="label text-gray-700">FIRMA DIGITAL</label>
                {(() => {
                  const signatureKey = `${block.role}_signature`;
                  const signatureData = form.signatures[signatureKey];
                  
                  // Debug: mostrar información de la firma
                  console.log('Signature debug:', {
                    role: block.role,
                    signatureKey,
                    signatureData: signatureData ? 'Presente' : 'Ausente',
                    signatureLength: signatureData ? signatureData.length : 0,
                    allSignatures: Object.keys(form.signatures),
                    formSignatures: form.signatures
                  });
                  
                  if (signatureData && signatureData.trim() !== '' && signatureData !== 'null' && signatureData !== 'undefined') {
                    return (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <img 
                          src={signatureData} 
                          alt={`Firma de ${block.label}`}
                          className="signature-print max-h-32 mx-auto"
                          onError={(e) => {
                            console.error('Error cargando imagen de firma:', e);
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const nextElement = target.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'block';
                            }
                          }}
                        />
                        <div style={{display: 'none'}} className="text-red-500 text-sm">
                          Error cargando la imagen de firma
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 bg-gray-50 rounded-lg border border-dashed">
                        <span className="text-gray-500">
                          {isOptional ? 'Sin firma (opcional)' : 'Firma no disponible'}
                        </span>
                        <div className="text-xs text-gray-400 mt-2">
                          Debug: Clave: {signatureKey} | Valor: {signatureData || 'undefined'}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="card bg-gray-50 text-center">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Dirección:</strong> {template.hospital_info.address}
          </p>
          <p className="mb-2">
            <strong>Teléfono:</strong> {template.hospital_info.phone} | 
            <strong> Email:</strong> {template.hospital_info.email}
          </p>
          <p>
            <strong>Sitio Web:</strong> {template.hospital_info.website}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Este documento cumple con la Ley 1581 de 2012, Decreto 1377, Decreto 1074 de 2015 
            y demás normativas vigentes sobre protección de datos personales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormDetails;


