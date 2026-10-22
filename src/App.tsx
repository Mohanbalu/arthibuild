import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { PMDashboard } from './pages/dashboards/PMDashboard';
import { CoordinatorDashboard } from './pages/dashboards/CoordinatorDashboard';
import { CustomerPortal } from './pages/CustomerPortal';
import { Projects } from './pages/Projects';
import { BuildingExplorer } from './pages/BuildingExplorer';
import { Properties } from './pages/Properties';
import { PropertyDetails } from './pages/PropertyDetails';
import { TaskBoard } from './pages/TaskBoard';
import { TaskTimeline } from './pages/TaskTimeline';
import { SiteUpdate } from './pages/SiteUpdate';
import { PhotoGallery } from './pages/PhotoGallery';
import { DeliverySchedule } from './pages/DeliverySchedule';
import { CustomizationRequests } from './pages/CustomizationRequests';
import { QualityInspections } from './pages/QualityInspections';
import { HandoverManagement } from './pages/HandoverManagement';
import { CustomersPage } from './pages/CustomersPage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { SiteMapView } from './components/location/SiteMapView';
import { AccessDenied } from './components/common/AccessDenied';
import { hasViewPermission, getDefaultDashboardForRole } from './services/permissions';

function MainApp() {
  const { currentUser, isAuthenticated } = useAuth();
  // By default, open to public Home / Portfolio page
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('PROP-EH-A301');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-01');

  const handleNavigate = (view: string, id?: string) => {
    if (id) {
      if (view === 'property-detail') setSelectedPropertyId(id);
      if (view === 'project-detail') setSelectedProjectId(id);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Public Home & Portfolio view (accessible by anyone)
  if (currentView === 'home') {
    return (
      <HomePage
        onNavigate={handleNavigate}
        onLoginClick={() => setCurrentView('login')}
      />
    );
  }

  // 2. Explicit Login page view
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(userRole) => {
          const targetDashboard = getDefaultDashboardForRole(userRole);
          setCurrentView(targetDashboard);
        }}
        onBackToHome={() => setCurrentView('home')}
      />
    );
  }

  // 3. Unauthenticated users attempting to access protected routes are redirected to login
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(userRole) => {
          const targetDashboard = getDefaultDashboardForRole(userRole);
          setCurrentView(targetDashboard);
        }}
        onBackToHome={() => setCurrentView('home')}
      />
    );
  }

  // Centralized Route Protection: Check if current role has permission to access currentView
  const isAllowed = hasViewPermission(currentUser.role, currentView);

  const renderContent = () => {
    if (!isAllowed) {
      return <AccessDenied requestedView={currentView} onNavigate={handleNavigate} />;
    }

    switch (currentView) {
      // Role-specific primary dashboards
      case 'admin-dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'pm-dashboard':
        return <PMDashboard onNavigate={handleNavigate} />;
      case 'coordinator-dashboard':
        return <CoordinatorDashboard onNavigate={handleNavigate} />;
      case 'customer-portal':
        return <CustomerPortal onNavigate={handleNavigate} />;

      // Generic dashboard alias - redirects seamlessly to the role's assigned portal
      case 'dashboard':
        if (currentUser.role === 'project_manager') return <PMDashboard onNavigate={handleNavigate} />;
        if (currentUser.role === 'site_coordinator') return <CoordinatorDashboard onNavigate={handleNavigate} />;
        if (currentUser.role === 'customer') return <CustomerPortal onNavigate={handleNavigate} />;
        return <Dashboard onNavigate={handleNavigate} />;

      // Core Portfolio & Location Hierarchy
      case 'map-view':
      case 'hierarchy':
        return <SiteMapView onNavigate={handleNavigate} initialProjectId={selectedProjectId} />;
      case 'projects':
      case 'project-detail':
        return (
          <Projects
            onNavigate={handleNavigate}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setCurrentView('buildings');
            }}
            initialInspectingProjectId={currentView === 'project-detail' ? selectedProjectId : undefined}
          />
        );
      case 'buildings':
        return (
          <BuildingExplorer
            onNavigate={handleNavigate}
            onSelectProperty={(id) => {
              setSelectedPropertyId(id);
              setCurrentView('property-detail');
            }}
          />
        );
      case 'properties':
        return (
          <Properties
            onNavigate={handleNavigate}
            onSelectProperty={(id) => {
              setSelectedPropertyId(id);
              setCurrentView('property-detail');
            }}
          />
        );
      case 'property-detail':
        return (
          <PropertyDetails
            propertyId={selectedPropertyId}
            onNavigate={handleNavigate}
          />
        );

      // Operations & Field Progress
      case 'tasks':
        return <TaskBoard onNavigate={handleNavigate} />;
      case 'timeline':
        return <TaskTimeline onNavigate={handleNavigate} />;
      case 'site-update':
        return <SiteUpdate onNavigate={handleNavigate} />;
      case 'gallery':
        return <PhotoGallery onNavigate={handleNavigate} />;

      // Delivery, Quality & Handover
      case 'delivery':
        return (
          <DeliverySchedule
            onNavigate={handleNavigate}
            onSelectProperty={(id) => {
              setSelectedPropertyId(id);
              setCurrentView('property-detail');
            }}
          />
        );
      case 'customizations':
        return <CustomizationRequests onNavigate={handleNavigate} />;
      case 'inspections':
        return <QualityInspections onNavigate={handleNavigate} />;
      case 'handovers':
        return <HandoverManagement onNavigate={handleNavigate} />;

      // Administration & Reports
      case 'customers':
        return (
          <CustomersPage
            onNavigate={handleNavigate}
            onSelectProperty={(id) => {
              setSelectedPropertyId(id);
              setCurrentView('property-detail');
            }}
          />
        );
      case 'users':
        return <UsersPage onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout currentView={currentView} onNavigate={handleNavigate}>
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
