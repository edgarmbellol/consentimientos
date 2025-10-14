import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { templatesAPI, consentFormsAPI } from '../services/api';
import { ConsentTemplate, TemplateField } from '../types';
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

  const renderField = (field: TemplateField) => {
    const fieldName = `patient_data.${field.id}` as any;
    
    switch (field.type) {
      case 'text':
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
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Área de firma digital</p>
            <button
              type="button"
              onClick={() => handleSignature(field.id)}
              className="mt-2 text-hospital-blue hover:text-hospital-darkBlue text-sm font-medium"
            >
              Agregar firma
            </button>
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

  const handleSignature = (fieldId: string) => {
    // En una implementación real, aquí se integraría una librería de firma digital
    const signature = prompt('Ingresa tu nombre para la firma digital:');
    if (signature) {
      setValue(`signatures.${fieldId}`, signature);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!template) return;
    
    try {
      setSubmitting(true);
      await consentFormsAPI.create({
        template_id: template.id!,
        patient_data: data.patient_data,
        consent_responses: data.consent_responses,
        signatures: data.signatures
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
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/forms')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-hospital-darkBlue">
            {template.title}
          </h1>
          <p className="text-gray-600">
            Consentimiento Informado - {template.hospital_info.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header del Hospital */}
        <div className="card bg-gradient-to-r from-hospital-blue to-hospital-darkBlue text-white">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-xl font-bold">{template.hospital_info.name}</h2>
              <p className="text-blue-100">NIT: {template.hospital_info.nit}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              <span>Código: {template.document_metadata.code}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Versión: {template.document_metadata.version}</span>
            </div>
          </div>
        </div>

        {/* Datos del Paciente */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            DATOS DEL PACIENTE
          </h2>
          
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
            {template.signature_blocks.map((block, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">{block.label}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">NOMBRE Y APELLIDO</label>
                    <input
                      {...register(`signatures.${block.role}_name`, { 
                        required: `${block.label} - Nombre es requerido` 
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
                    <label className="label">DOCUMENTO DE IDENTIDAD</label>
                    <input
                      {...register(`signatures.${block.role}_document`, { 
                        required: `${block.label} - Documento es requerido` 
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
                  <label className="label">FIRMA DIGITAL</label>
                  <button
                    type="button"
                    onClick={() => handleSignature(`${block.role}_signature`)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-hospital-blue transition-colors"
                  >
                    <div className="text-gray-500 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">
                      {watch(`signatures.${block.role}_signature`) || 'Haz clic para agregar firma'}
                    </p>
                  </button>
                </div>
              </div>
            ))}
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
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/forms')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center"
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


