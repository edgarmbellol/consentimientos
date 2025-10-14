export interface TemplateField {
  id: string;
  type: 'text' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'signature';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface ConsentTemplate {
  id?: string;
  title: string;
  description: string;
  hospital_info: {
    name: string;
    nit: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  document_metadata: {
    type: string;
    subprocess: string;
    code: string;
    version: string;
    revision_date: string;
  };
  patient_fields: TemplateField[];
  procedure_description: string;
  benefits_risks_alternatives: {
    benefits: string[];
    risks: string[];
    alternatives: string[];
  };
  implications: string;
  recommendations: string;
  consent_statement: string;
  revocation_statement: string;
  signature_blocks: Array<{
    role: string;
    label: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface ConsentFormData {
  template_id: string;
  patient_data: Record<string, any>;
  patient_photo?: string | null;
  consent_responses: Record<string, any>;
  signatures: Record<string, string>;
  filled_at?: string;
}

export interface ConsentFormResponse {
  id: string;
  template_id: string;
  patient_data: Record<string, any>;
  patient_photo?: string | null;
  consent_responses: Record<string, any>;
  signatures: Record<string, string>;
  filled_at: string;
  template_title: string;
}

export interface User {
  username: string;
  token: string;
}


