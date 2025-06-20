import React, { useState } from 'react';
import { Website } from '../../types';
import { WebsiteCard } from './WebsiteCard';
import { WebsiteSettingsModal } from '../../components/WebsiteSettingsModal';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { Search, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  websites: Website[];
  onViewWebsite: (website: Website) => void;
  onArchiveWebsite: (id: string) => void;
  onUnarchiveWebsite: (id: string) => void;
  onDeleteWebsite: (id: string) => void;
  onUpdateWebsiteSettings: (id: string, settings: any) => void;
  getDaysUntilDeletion: (website: Website) => number | null;
}

export function Dashboard({ 
  websites, 
  onViewWebsite, 
  onArchiveWebsite, 
  onUnarchiveWebsite, 
  onDeleteWebsite,
  onUpdateWebsiteSettings,
  getDaysUntilDeletion 
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWebsiteForSettings, setSelectedWebsiteForSettings] = useState<Website | null>(null);

  // Filter to show only active websites (not archived)
  const activeWebsites = websites.filter(website => website.status !== 'archived');
  
  const filteredWebsites = activeWebsites.filter(website => {
    const matchesSearch = website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         website.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || website.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const errorWebsites = activeWebsites.filter(site => site.status === 'error').length;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'error', label: 'Error' },
    { value: 'paused', label: 'Paused' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Error Alert */}
      {errorWebsites > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Attention Required</h3>
              <p className="text-sm text-red-700">
                {errorWebsites} website{errorWebsites > 1 ? 's have' : ' has'} scanning errors that need attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Websites Section */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Monitored Websites</h2>
            <div className="text-sm text-gray-500">
              {filteredWebsites.length} of {activeWebsites.length} websites
            </div>
          </div>
          
          <div className="flex space-x-4">
            <SearchBar
              placeholder="Search websites..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1"
            />
            
            <FilterDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </div>

      {filteredWebsites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No websites found</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Add your first website to start monitoring'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredWebsites.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              onViewDetails={onViewWebsite}
              onArchive={onArchiveWebsite}
              onUnarchive={onUnarchiveWebsite}
              onDelete={onDeleteWebsite}
              onSettings={setSelectedWebsiteForSettings}
              daysUntilDeletion={getDaysUntilDeletion(website)}
            />
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {selectedWebsiteForSettings && (
        <WebsiteSettingsModal
          isOpen={true}
          onClose={() => setSelectedWebsiteForSettings(null)}
          website={selectedWebsiteForSettings}
          onSave={onUpdateWebsiteSettings}
        />
      )}
    </div>
  );
}