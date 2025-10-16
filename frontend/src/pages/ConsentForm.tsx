import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { templatesAPI, consentFormsAPI, patientsAPI } from '../services/api';
import { ConsentTemplate, TemplateField } from '../types';
import SignaturePad from '../components/SignaturePad';
import PhotoCapture from '../components/PhotoCapture';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle,
  AlertCircle,
  Shield,
  FileText,
  User,
  Calendar
} from 'lucide-react';

interface FormData {
  patient_data: Record<string, any>;
  consent_responses: Record<string, any>;
  signatures: Record<string, string>;
}

const ConsentForm: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      patient_data: {},
      consent_responses: {},
      signatures: {}
    }
  });

  const [template, setTemplate] = useState<ConsentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientFound, setPatientFound] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await templatesAPI.getById(templateId!);
      setTemplate(data);
      setError('');
    } catch (err) {
      setError('Error al cargar la plantilla');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchPatient = async (documento: string) => {
    if (!documento || documento.trim().length === 0) {
      return;
    }

    try {
      setSearchingPatient(true);
      setPatientFound(false);
      
      const patientInfo = await patientsAPI.getByDocument(documento.trim());
      
      // Llenar automáticamente los campos del paciente
      if (patientInfo) {
        // Buscar el campo de nombre y llenarlo
        const nombreField = template?.patient_fields.find(f => 
          f.label.toLowerCase().includes('nombre')
        );
        if (nombreField) {
          setValue(`patient_data.${nombreField.id}`, patientInfo.nombre);
        }

        // Buscar el campo de sexo y llenarlo
        const sexoField = template?.patient_fields.find(f => 
          f.label.toLowerCase().includes('sexo')
        );
        if (sexoField) {
          setValue(`patient_data.${sexoField.id}`, patientInfo.sexo);
        }

        // Buscar el campo de fecha de nacimiento y llenarlo
        const fechaNacField = template?.patient_fields.find(f => 
          f.label.toLowerCase().includes('fecha') && f.label.toLowerCase().includes('nacimiento')
        );
        if (fechaNacField && patientInfo.fecha_nacimiento) {
          setValue(`patient_data.${fechaNacField.id}`, patientInfo.fecha_nacimiento);
        }

        // Buscar el campo de edad y llenarlo
        const edadField = template?.patient_fields.find(f => 
          f.label.toLowerCase().includes('edad')
        );
        if (edadField && patientInfo.edad) {
          setValue(`patient_data.${edadField.id}`, patientInfo.edad.toString());
        }

        // Buscar el campo de teléfono y llenarlo
        const telefonoField = template?.patient_fields.find(f => 
          f.label.toLowerCase().includes('telefono') || f.label.toLowerCase().includes('teléfono')
        );
        if (telefonoField && patientInfo.telefono) {
          setValue(`patient_data.${telefonoField.id}`, patientInfo.telefono);
        }

        setPatientFound(true);
        console.log('✅ Datos del paciente cargados:', patientInfo);
      }
    } catch (err: any) {
      console.error('Error buscando paciente:', err);
      if (err.response?.status === 404) {
        alert('Paciente no encontrado en el sistema. Por favor, ingrese los datos manualmente.');
      } else {
        alert('Error al buscar el paciente. Por favor, intente nuevamente.');
      }
      setPatientFound(false);
    } finally {
      setSearchingPatient(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const fieldName = `patient_data.${field.id}` as any;
    
    // Campo especial para N° DE IDENTIFICACIÓN con búsqueda automática
    const isDocumentoField = field.label.toLowerCase().includes('identificación') || 
                             field.label.toLowerCase().includes('identificacion');
    
    // Campo especial para TIPO REGIMEN como select
    const isTipoRegimenField = field.label.toLowerCase().includes('tipo') && 
                                field.label.toLowerCase().includes('regimen');
    
    switch (field.type) {
      case 'text':
        if (isDocumentoField) {
          return (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                {...register(fieldName, { 
                  required: field.required ? `${field.label} es requerido` : false 
                })}
                className="input-field flex-1"
                placeholder={field.placeholder}
                onBlur={(e) => searchPatient(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const documento = watch(fieldName);
                    searchPatient(documento);
                  }}
                  disabled={searchingPatient}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap flex-1 sm:flex-none justify-center text-sm sm:text-base"
                >
                  {searchingPatient ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 h-3.5 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      🔍 Buscar
                    </>
                  )}
                </button>
                {patientFound && (
                  <div className="flex items-center text-green-600 flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        if (isTipoRegimenField) {
          return (
            <select
              {...register(fieldName, { 
                required: field.required ? `${field.label} es requerido` : false 
              })}
              className="input-field"
            >
              <option value="">Seleccione...</option>
              <option value="Contributivo">Contributivo</option>
              <option value="Subsidiado">Subsidiado</option>
            </select>
          );
        }
        
        return (
          <input
            {...register(fieldName, { 
              required: field.required ? `${field.label} es requerido` : false 
            })}
            className="input-field"
            placeholder={field.placeholder}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            {...register(fieldName, { 
              required: field.required ? `${field.label} es requerido` : false 
            })}
            className="input-field"
            rows={3}
            placeholder={field.placeholder}
          />
        );
      
      case 'date':
        return (
          <input
            {...register(fieldName, { 
              required: field.required ? `${field.label} es requerido` : false 
            })}
            type="date"
            className="input-field"
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              {...register(fieldName)}
              type="checkbox"
              className="rounded border-gray-300 text-hospital-blue focus:ring-hospital-blue"
            />
            <label className="text-sm text-gray-700">Sí</label>
          </div>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  {...register(fieldName, { 
                    required: field.required ? `${field.label} es requerido` : false 
                  })}
                  type="radio"
                  value={option}
                  className="border-gray-300 text-hospital-blue focus:ring-hospital-blue"
                />
                <label className="text-sm text-gray-700">{option}</label>
              </div>
            ))}
          </div>
        );
      
      case 'signature':
        // Las firmas se manejan en la sección de "Firmas del Consentimiento" con SignaturePad
        return (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-300 text-center">
            <p className="text-sm text-gray-600">
              Las firmas se completan al final del formulario
            </p>
          </div>
        );
      
      default:
        return (
          <input
            {...register(fieldName, { 
              required: field.required ? `${field.label} es requerido` : false 
            })}
            className="input-field"
            placeholder={field.placeholder}
          />
        );
    }
  };

  const handleSignatureSave = (role: string, signatureData: string) => {
    setSignatures(prev => ({
      ...prev,
      [`${role}_signature`]: signatureData
    }));
  };

  const handlePhotoCapture = (photoData: string | null) => {
    setPatientPhoto(photoData);
  };

  const onSubmit = async (data: FormData) => {
    if (!template) return;
    
    // Debug: mostrar qué firmas tenemos
    console.log('Debug firmas al enviar:', {
      formSignatures: data.signatures,
      canvasSignatures: signatures,
      combinedSignatures: {
        ...data.signatures,
        ...signatures
      }
    });
    
    // Combinar las firmas del formulario con las del canvas
    const allSignatures = {
      ...data.signatures,
      ...signatures
    };
    
    try {
      setSubmitting(true);
      await consentFormsAPI.create({
        template_id: template.id!,
        patient_data: data.patient_data,
        patient_photo: patientPhoto,
        consent_responses: data.consent_responses,
        signatures: allSignatures
      });
      
      alert('Consentimiento guardado exitosamente');
      navigate('/admin/forms');
    } catch (err) {
      alert('Error al guardar el consentimiento');
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="card">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error || 'Plantilla no encontrada'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/forms')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-hospital-darkBlue truncate">
              {template.title}
            </h1>
            <p className="text-xs sm:text-base text-gray-600 truncate">
              Consentimiento Informado - {template.hospital_info.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-8">
        {/* Header del Hospital */}
        <div className="card bg-gradient-to-r from-hospital-blue to-hospital-darkBlue text-white">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4">
            <div className="flex items-center mb-3 sm:mb-0">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">{template.hospital_info.name}</h2>
                <p className="text-blue-100 text-sm sm:text-base">NIT: {template.hospital_info.nit}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Código: {template.document_metadata.code}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Versión: {template.document_metadata.version}</span>
            </div>
          </div>
        </div>

        {/* Foto del Paciente */}
        <div className="card">
          <PhotoCapture 
            onCapture={handlePhotoCapture}
            existingPhoto={patientPhoto || undefined}
            label="Foto del Paciente"
          />
        </div>

        {/* Datos del Paciente */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            DATOS DEL PACIENTE
          </h2>
          
          {/* Mensaje informativo */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Búsqueda Automática:</strong> Ingrese el número de identificación del paciente 
              y los demás datos se cargarán automáticamente desde el sistema.
            </p>
          </div>

          {/* Mensaje de éxito cuando se encuentra el paciente */}
          {patientFound && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">
                <strong>✅ Paciente encontrado:</strong> Los datos han sido cargados automáticamente.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.patient_fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="label">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {errors.patient_data?.[field.id] && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.patient_data[field.id]?.message || '')}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Declaración de Consentimiento */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            CONSENTIMIENTO INFORMADO
          </h2>
          
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed">
              {template.consent_statement}
            </p>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                {...register('consent_responses.consent', { 
                  required: 'Debe seleccionar una opción' 
                })}
                type="radio"
                value="si"
                className="border-gray-300 text-hospital-blue focus:ring-hospital-blue"
              />
              <span className="ml-2 text-green-600 font-medium">SÍ</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('consent_responses.consent', { 
                  required: 'Debe seleccionar una opción' 
                })}
                type="radio"
                value="no"
                className="border-gray-300 text-hospital-blue focus:ring-hospital-blue"
              />
              <span className="ml-2 text-red-600 font-medium">NO</span>
            </label>
          </div>
          {errors.consent_responses?.consent && (
            <p className="text-red-500 text-sm">{String(errors.consent_responses.consent.message || '')}</p>
          )}
        </div>

        {/* Autorización Digital */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            AUTORIZACIÓN DIGITAL
          </h2>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                {...register('consent_responses.digital_authorization', { 
                  required: 'Debe seleccionar una opción' 
                })}
                type="radio"
                value="si"
                className="border-gray-300 text-hospital-blue focus:ring-hospital-blue"
              />
              <span className="ml-2 text-green-600 font-medium">SÍ</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('consent_responses.digital_authorization', { 
                  required: 'Debe seleccionar una opción' 
                })}
                type="radio"
                value="no"
                className="border-gray-300 text-hospital-blue focus:ring-hospital-blue"
              />
              <span className="ml-2 text-red-600 font-medium">NO</span>
            </label>
          </div>
          {errors.consent_responses?.digital_authorization && (
            <p className="text-red-500 text-sm">{String(errors.consent_responses.digital_authorization.message || '')}</p>
          )}
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

        {/* Firmas */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            FIRMAS DEL CONSENTIMIENTO INFORMADO
          </h2>
          
          <div className="space-y-6">
            {template.signature_blocks.map((block, index) => {
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
                      <label className="label">
                        NOMBRE Y APELLIDO
                        {!isOptional && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        {...register(`signatures.${block.role}_name`, { 
                          required: isOptional ? false : `${block.label} - Nombre es requerido` 
                        })}
                        className="input-field"
                        placeholder="Nombre completo"
                      />
                      {errors.signatures?.[`${block.role}_name`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {String(errors.signatures[`${block.role}_name`]?.message || '')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label">
                        DOCUMENTO DE IDENTIDAD
                        {!isOptional && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        {...register(`signatures.${block.role}_document`, { 
                          required: isOptional ? false : `${block.label} - Documento es requerido` 
                        })}
                        className="input-field"
                        placeholder="Número de documento"
                      />
                      {errors.signatures?.[`${block.role}_document`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {String(errors.signatures[`${block.role}_document`]?.message || '')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <SignaturePad
                      label={isOptional ? "FIRMA DIGITAL (Opcional)" : "FIRMA DIGITAL"}
                      onSave={(signatureData) => handleSignatureSave(block.role, signatureData)}
                      existingSignature={signatures[`${block.role}_signature`]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revocación */}
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

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/forms')}
            className="btn-secondary w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center justify-center w-full sm:w-auto order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? 'Guardando...' : 'Guardar Consentimiento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsentForm;


