import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Plus, 
  LogOut, 
  Shield, 
  User,
  ClipboardList,
  Settings,
  Activity
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const baseNavigation = [
    {
      name: 'Crear Plantillas',
      href: '/admin/templates',
      icon: Plus,
      description: 'Administrar plantillas de consentimientos'
    },
    {
      name: 'Llenar Formularios',
      href: '/forms',
      icon: ClipboardList,
      description: 'Completar consentimientos informados'
    },
    {
      name: 'Ver Formularios',
      href: '/admin/forms',
      icon: FileText,
      description: 'Revisar formularios completados'
    },
  ];

  // Solo agregar Auditoría si el usuario es admin (EMBL)
  const navigation = isAdmin() 
    ? [
        ...baseNavigation,
        {
          name: 'Auditoría',
          href: '/admin/audit-logs',
          icon: Activity,
          description: 'Ver registro de actividades'
        },
      ]
    : baseNavigation;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-hospital-gray">
      {/* Header */}
      <header className="no-print bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-hospital-blue rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-hospital-darkBlue truncate">
                    Consentimientos Informados
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    Hospital Divino Salvador de Sopó
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden sm:flex items-center text-sm text-gray-700">
                <User className="w-4 h-4 mr-2" />
                <span className="truncate max-w-24">{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors p-1 sm:p-2"
                title="Salir"
              >
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="no-print bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-1 sm:flex-none justify-center sm:justify-start ${
                    isActive(item.href)
                      ? 'border-hospital-blue text-hospital-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;


