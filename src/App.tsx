import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './features/website-management/Dashboard';
import { WebsiteDetails } from './features/website-management/WebsiteDetails';
import { JobsPage } from './features/jobs/JobsPage';
import { ArchivePage } from './features/website-management/ArchivePage';
import { AddWebsiteModal } from './features/website-management/AddWebsiteModal';
import { useWebsites } from './hooks/useWebsites';
import { Website, WebsiteSettings } from './types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type View = 'dashboard' | 'website-details' | 'jobs' | 'archive';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { 
    websites, 
    isLoading, 
    error,
    addWebsite, 
    archiveWebsite, 
    unarchiveWebsite, 
    deleteWebsite,
    updateWebsiteSettings,
    getDaysUntilDeletion,
    refreshWebsites
  } = useWebsites();

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    if (view !== 'website-details') {
      setSelectedWebsite(null);
    }
  };

  const handleViewWebsite = (website: Website) => {
    setSelectedWebsite(website);
    setCurrentView('website-details');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedWebsite(null);
  };

  const handleUpdateWebsiteSettings = async (websiteId: string, settings: WebsiteSettings) => {
    try {
      await updateWebsiteSettings(websiteId, settings);
    } catch (err) {
      console.error('Failed to update website settings:', err);
    }
  };

  const handleAddWebsite = async (websiteData: Omit<Website, 'id' | 'createdAt' | 'settings'>) => {
    try {
      await addWebsite(websiteData);
    } catch (err) {
      console.error('Failed to add website:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddWebsite={() => setIsAddModalOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
      />
      
      {/* Database Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Database Connection Issue</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={refreshWebsites}
              className="inline-flex items-center px-3 py-1 text-sm text-red-700 hover:text-red-900 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}
      
      <main>
        {currentView === 'dashboard' && (
          <Dashboard
            websites={websites}
            onViewWebsite={handleViewWebsite}
            onArchiveWebsite={archiveWebsite}
            onUnarchiveWebsite={unarchiveWebsite}
            onDeleteWebsite={deleteWebsite}
            onUpdateWebsiteSettings={handleUpdateWebsiteSettings}
            getDaysUntilDeletion={getDaysUntilDeletion}
          />
        )}
        
        {currentView === 'jobs' && (
          <JobsPage />
        )}
        
        {currentView === 'archive' && (
          <ArchivePage
            websites={websites}
            onUnarchiveWebsite={unarchiveWebsite}
            onDeleteWebsite={deleteWebsite}
            getDaysUntilDeletion={getDaysUntilDeletion}
          />
        )}
        
        {currentView === 'website-details' && selectedWebsite && (
          <WebsiteDetails
            website={selectedWebsite}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
      
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWebsite}
      />
    </div>
  );
}

export default App;