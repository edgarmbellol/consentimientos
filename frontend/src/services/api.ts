import axios from 'axios';
import { ConsentTemplate, ConsentFormData, ConsentFormResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },
};

export const templatesAPI = {
  getAll: async (): Promise<ConsentTemplate[]> => {
    const response = await api.get('/api/templates');
    return response.data;
  },

  getById: async (id: string): Promise<ConsentTemplate> => {
    const response = await api.get(`/api/templates/${id}`);
    return response.data;
  },

  create: async (template: Omit<ConsentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ConsentTemplate> => {
    const response = await api.post('/api/templates', template);
    return response.data;
  },

  update: async (id: string, template: Omit<ConsentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ConsentTemplate> => {
    const response = await api.put(`/api/templates/${id}`, template);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/templates/${id}`);
  },
};

export const consentFormsAPI = {
  getAll: async (): Promise<ConsentFormResponse[]> => {
    const response = await api.get('/api/consent-forms');
    return response.data;
  },

  getById: async (id: string): Promise<ConsentFormResponse> => {
    const response = await api.get(`/api/consent-forms/${id}`);
    return response.data;
  },

  create: async (formData: ConsentFormData): Promise<ConsentFormResponse> => {
    const response = await api.post('/api/consent-forms', formData);
    return response.data;
  },
};

export interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  user_name?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditSummary {
  actions_summary: Record<string, number>;
  active_users_count: number;
  total_logs: number;
  recent_activity: Array<{
    username: string;
    action: string;
    timestamp: string;
    resource_type?: string;
  }>;
}

export const auditAPI = {
  getLogs: async (params?: {
    limit?: number;
    offset?: number;
    username?: string;
    action?: string;
  }): Promise<AuditLog[]> => {
    const response = await api.get('/api/audit-logs', { params });
    return response.data;
  },

  getSummary: async (): Promise<AuditSummary> => {
    const response = await api.get('/api/audit-logs/summary');
    return response.data;
  },
};

export interface PatientInfo {
  documento: string;
  nombre: string;
  sexo: string;
  fecha_nacimiento?: string;
  edad?: number;
  telefono: string;
}

export const patientsAPI = {
  getByDocument: async (documento: string): Promise<PatientInfo> => {
    const response = await api.get(`/api/patients/${documento}`);
    return response.data;
  },
};

export default api;


