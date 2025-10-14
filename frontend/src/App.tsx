import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import TemplateList from './pages/TemplateList';
import TemplateBuilder from './pages/TemplateBuilder';
import FormList from './pages/FormList';
import ConsentForm from './pages/ConsentForm';
import ConsentFormList from './pages/ConsentFormList';
import FormDetails from './pages/FormDetails';

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Componente para rutas de login (redirigir si ya está autenticado)
const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin/templates" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Ruta de login */}
            <Route 
              path="/login" 
              element={
                <LoginRoute>
                  <Login />
                </LoginRoute>
              } 
            />

            {/* Rutas protegidas */}
            <Route 
              path="/admin/templates" 
              element={
                <ProtectedRoute>
                  <TemplateList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/templates/create" 
              element={
                <ProtectedRoute>
                  <TemplateBuilder />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/templates/edit/:templateId" 
              element={
                <ProtectedRoute>
                  <TemplateBuilder />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/forms" 
              element={
                <ProtectedRoute>
                  <ConsentFormList />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/forms/:formId" 
              element={
                <ProtectedRoute>
                  <FormDetails />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/forms" 
              element={
                <ProtectedRoute>
                  <FormList />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/forms/:templateId" 
              element={
                <ProtectedRoute>
                  <ConsentForm />
                </ProtectedRoute>
              } 
            />

            {/* Ruta por defecto */}
            <Route path="/" element={<Navigate to="/admin/templates" replace />} />
            
            {/* Ruta de fallback */}
            <Route path="*" element={<Navigate to="/admin/templates" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;


