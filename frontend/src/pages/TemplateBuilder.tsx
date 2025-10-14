import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { templatesAPI } from '../services/api';
import { ConsentTemplate, TemplateField } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  Text,
  Type,
  CheckSquare,
  Circle,
  Calendar,
  PenTool
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TemplateFormData {
  title: string;
  description: string;
  hospital_name: string;
  hospital_nit: string;
  hospital_address: string;
  hospital_phone: string;
  hospital_email: string;
  hospital_website: string;
  document_type: string;
  subprocess: string;
  code: string;
  version: string;
  revision_date: string;
  procedure_description: string;
  benefits: string[];
  risks: string[];
  alternatives: string[];
  implications: string;
  recommendations: string;
  consent_statement: string;
  revocation_statement: string;
}

const TemplateBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TemplateFormData>({
    defaultValues: {
      hospital_name: 'E.S.E. HOSPITAL DIVINO SALVADOR DE SOPO',
      hospital_nit: '860.023.878-9',
      hospital_address: 'Carrera 4 #5-80',
      hospital_phone: '8571313 Ext.115',
      hospital_email: 'hospitalsopo@hospitalsopo.com',
      hospital_website: 'www.esehospitalsopo-cundinamarca.gov.co',
      document_type: 'FORMATO',
      subprocess: 'ODONTOLOGIA',
      code: 'CG-F-1',
      version: '01',
      revision_date: new Date().toLocaleDateString('es-CO'),
      benefits: [''],
      risks: [''],
      alternatives: ['']
    }
  });

  const [patientFields, setPatientFields] = useState<TemplateField[]>([
    {
      id: '1',
      type: 'text',
      label: 'N° DE IDENTIFICACIÓN',
      placeholder: 'Número de documento',
      required: true,
      order: 1
    },
    {
      id: '2',
      type: 'text',
      label: 'NOMBRE',
      placeholder: 'Nombre completo',
      required: true,
      order: 2
    },
    {
      id: '3',
      type: 'text',
      label: 'SEXO',
      placeholder: 'M/F',
      required: true,
      order: 3
    },
    {
      id: '4',
      type: 'date',
      label: 'FECHA DE NACIMIENTO',
      required: true,
      order: 4
    },
    {
      id: '5',
      type: 'text',
      label: 'EDAD',
      placeholder: 'Edad en años',
      required: true,
      order: 5
    },
    {
      id: '6',
      type: 'text',
      label: 'TELEFONO',
      placeholder: 'Número de teléfono',
      required: true,
      order: 6
    },
    {
      id: '7',
      type: 'text',
      label: 'TIPO REGIMEN',
      placeholder: 'Contributivo/Subsidiado',
      required: true,
      order: 7
    },
    {
      id: '8',
      type: 'text',
      label: 'ASEGURADORA',
      placeholder: 'Nombre de la EPS',
      required: true,
      order: 8
    }
  ]);

  const [signatureBlocks, setSignatureBlocks] = useState([
    { role: 'usuario', label: 'FIRMA DEL USUARIO O PERSONA RESPONSABLE' },
    { role: 'profesional', label: 'FIRMA DE QUIEN REALIZA EL PROCEDIMIENTO' },
    { role: 'acompanante', label: 'FIRMA DEL ACOMPANANTE' }
  ]);

  const fieldTypes = [
    { value: 'text', label: 'Texto', icon: Text },
    { value: 'textarea', label: 'Área de texto', icon: Type },
    { value: 'checkbox', label: 'Casilla de verificación', icon: CheckSquare },
    { value: 'radio', label: 'Botón de radio', icon: Circle },
    { value: 'date', label: 'Fecha', icon: Calendar },
    { value: 'signature', label: 'Firma', icon: PenTool }
  ];

  const addPatientField = () => {
    const newField: TemplateField = {
      id: Date.now().toString(),
      type: 'text',
      label: '',
      placeholder: '',
      required: true,
      order: patientFields.length + 1
    };
    setPatientFields([...patientFields, newField]);
  };

  const updatePatientField = (id: string, updates: Partial<TemplateField>) => {
    setPatientFields(patientFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removePatientField = (id: string) => {
    setPatientFields(patientFields.filter(field => field.id !== id));
  };

  const addArrayItem = (field: keyof Pick<TemplateFormData, 'benefits' | 'risks' | 'alternatives'>) => {
    const current = watch(field) || [];
    setValue(field, [...current, '']);
  };

  const updateArrayItem = (field: keyof Pick<TemplateFormData, 'benefits' | 'risks' | 'alternatives'>, index: number, value: string) => {
    const current = watch(field) || [];
    const updated = [...current];
    updated[index] = value;
    setValue(field, updated);
  };

  const removeArrayItem = (field: keyof Pick<TemplateFormData, 'benefits' | 'risks' | 'alternatives'>, index: number) => {
    const current = watch(field) || [];
    const updated = current.filter((_, i) => i !== index);
    setValue(field, updated);
  };

  const onSubmit = async (data: TemplateFormData) => {
    try {
      const template: Omit<ConsentTemplate, 'id' | 'created_at' | 'updated_at'> = {
        title: data.title,
        description: data.description,
        hospital_info: {
          name: data.hospital_name,
          nit: data.hospital_nit,
          address: data.hospital_address,
          phone: data.hospital_phone,
          email: data.hospital_email,
          website: data.hospital_website
        },
        document_metadata: {
          type: data.document_type,
          subprocess: data.subprocess,
          code: data.code,
          version: data.version,
          revision_date: data.revision_date
        },
        patient_fields: patientFields,
        procedure_description: data.procedure_description,
        benefits_risks_alternatives: {
          benefits: data.benefits.filter(b => b.trim() !== ''),
          risks: data.risks.filter(r => r.trim() !== ''),
          alternatives: data.alternatives.filter(a => a.trim() !== '')
        },
        implications: data.implications,
        recommendations: data.recommendations,
        consent_statement: data.consent_statement,
        revocation_statement: data.revocation_statement,
        signature_blocks: signatureBlocks
      };

      await templatesAPI.create(template);
      navigate('/admin/templates');
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      alert('Error al crear la plantilla');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/admin/templates')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-hospital-darkBlue">
          Crear Nueva Plantilla
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Información General */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Información General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Título del Consentimiento</label>
              <input
                {...register('title', { required: 'El título es requerido' })}
                className="input-field"
                placeholder="Ej: Aplicación de Barniz de Fluor"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="label">Descripción</label>
              <input
                {...register('description')}
                className="input-field"
                placeholder="Descripción breve del procedimiento"
              />
            </div>
          </div>
        </div>

        {/* Información del Hospital */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Información del Hospital
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del Hospital</label>
              <input
                {...register('hospital_name', { required: 'El nombre del hospital es requerido' })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">NIT</label>
              <input
                {...register('hospital_nit', { required: 'El NIT es requerido' })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input
                {...register('hospital_address')}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                {...register('hospital_phone')}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                {...register('hospital_email')}
                className="input-field"
                type="email"
              />
            </div>
            <div>
              <label className="label">Sitio Web</label>
              <input
                {...register('hospital_website')}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Metadatos del Documento */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Metadatos del Documento
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Tipo de Documento</label>
              <input
                {...register('document_type')}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Subproceso</label>
              <input
                {...register('subprocess')}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Código</label>
              <input
                {...register('code')}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Versión</label>
              <input
                {...register('version')}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Fecha de Revisión</label>
              <input
                {...register('revision_date')}
                className="input-field"
                type="date"
              />
            </div>
          </div>
        </div>

        {/* Campos del Paciente */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-hospital-darkBlue">
              Campos de Datos del Paciente
            </h2>
            <button
              type="button"
              onClick={addPatientField}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Campo
            </button>
          </div>
          
          <div className="space-y-4">
            {patientFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Tipo de Campo</label>
                    <select
                      value={field.type}
                      onChange={(e) => updatePatientField(field.id, { type: e.target.value as any })}
                      className="input-field"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Etiqueta</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updatePatientField(field.id, { label: e.target.value })}
                      className="input-field"
                      placeholder="Ej: Nombre"
                    />
                  </div>
                  <div>
                    <label className="label">Placeholder</label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updatePatientField(field.id, { placeholder: e.target.value })}
                      className="input-field"
                      placeholder="Texto de ayuda"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updatePatientField(field.id, { required: e.target.checked })}
                        className="mr-2"
                      />
                      Requerido
                    </label>
                    <button
                      type="button"
                      onClick={() => removePatientField(field.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Descripción del Procedimiento */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Descripción del Procedimiento
          </h2>
          <textarea
            {...register('procedure_description', { required: 'La descripción es requerida' })}
            className="input-field"
            rows={6}
            placeholder="Describe detalladamente el procedimiento..."
          />
          {errors.procedure_description && (
            <p className="text-red-500 text-sm mt-1">{errors.procedure_description.message}</p>
          )}
        </div>

        {/* Beneficios, Riesgos y Alternativas */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Beneficios, Riesgos y Alternativas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Beneficios */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-hospital-green">Beneficios</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('benefits')}
                  className="text-hospital-green hover:text-green-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {watch('benefits')?.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateArrayItem('benefits', index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Beneficio del procedimiento"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('benefits', index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Riesgos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-red-600">Riesgos</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('risks')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {watch('risks')?.map((risk, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={risk}
                      onChange={(e) => updateArrayItem('risks', index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Riesgo del procedimiento"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('risks', index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternativas */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-hospital-blue">Alternativas</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('alternatives')}
                  className="text-hospital-blue hover:text-hospital-darkBlue"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {watch('alternatives')?.map((alternative, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={alternative}
                      onChange={(e) => updateArrayItem('alternatives', index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Alternativa al procedimiento"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('alternatives', index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Implicaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Implicaciones
          </h2>
          <textarea
            {...register('implications', { required: 'Las implicaciones son requeridas' })}
            className="input-field"
            rows={6}
            placeholder="Describe las implicaciones del procedimiento..."
          />
          {errors.implications && (
            <p className="text-red-500 text-sm mt-1">{errors.implications.message}</p>
          )}
        </div>

        {/* Recomendaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Recomendaciones
          </h2>
          <textarea
            {...register('recommendations', { required: 'Las recomendaciones son requeridas' })}
            className="input-field"
            rows={4}
            placeholder="Describe las recomendaciones post-procedimiento..."
          />
          {errors.recommendations && (
            <p className="text-red-500 text-sm mt-1">{errors.recommendations.message}</p>
          )}
        </div>

        {/* Declaración de Consentimiento */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Declaración de Consentimiento
          </h2>
          <textarea
            {...register('consent_statement', { required: 'La declaración de consentimiento es requerida' })}
            className="input-field"
            rows={4}
            placeholder="Texto de la declaración de consentimiento..."
          />
          {errors.consent_statement && (
            <p className="text-red-500 text-sm mt-1">{errors.consent_statement.message}</p>
          )}
        </div>

        {/* Declaración de Revocación */}
        <div className="card">
          <h2 className="text-xl font-semibold text-hospital-darkBlue mb-4">
            Declaración de Revocación
          </h2>
          <textarea
            {...register('revocation_statement', { required: 'La declaración de revocación es requerida' })}
            className="input-field"
            rows={4}
            placeholder="Texto sobre el derecho a revocar el consentimiento..."
          />
          {errors.revocation_statement && (
            <p className="text-red-500 text-sm mt-1">{errors.revocation_statement.message}</p>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/templates')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Plantilla
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateBuilder;


