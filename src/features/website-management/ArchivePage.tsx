import React, { useState } from 'react';
import { Website } from '../../types';
import { WebsiteCard } from './WebsiteCard';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { Archive, AlertTriangle } from 'lucide-react';

interface ArchivePageProps {
  websites: Website[];
  onUnarchiveWebsite: (id: string) => void;
  onDeleteWebsite: (id: string) => void;
  getDaysUntilDeletion: (website: Website) => number | null;
}

export function ArchivePage({ 
  websites, 
  onUnarchiveWebsite, 
  onDeleteWebsite, 
  getDaysUntilDeletion 
}: ArchivePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('archivedDate');

  const archivedWebsites = websites.filter(website => website.status === 'archived');
  
  const filteredWebsites = archivedWebsites.filter(website =>
    website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedWebsites = [...filteredWebsites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'archivedDate':
        if (!a.archivedAt || !b.archivedAt) return 0;
        return b.archivedAt.getTime() - a.archivedAt.getTime();
      case 'deletionDate':
        const aDays = getDaysUntilDeletion(a) ?? 999;
        const bDays = getDaysUntilDeletion(b) ?? 999;
        return aDays - bDays;
      default:
        return 0;
    }
  });

  const criticalDeletionWebsites = archivedWebsites.filter(website => {
    const days = getDaysUntilDeletion(website);
    return days !== null && days <= 3;
  });

  const sortOptions = [
    { value: 'archivedDate', label: 'Archive Date' },
    { value: 'name', label: 'Name' },
    { value: 'deletionDate', label: 'Deletion Date' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Archive className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archived Websites</h1>
            <p className="text-gray-500">Manage archived websites and their retention policies</p>
          </div>
        </div>
      </div>

      {/* Critical Deletion Warning */}
      {criticalDeletionWebsites.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Critical Deletion Warning</h3>
              <p className="text-sm text-red-700">
                {criticalDeletionWebsites.length} website{criticalDeletionWebsites.length > 1 ? 's' : ''} will be permanently deleted within 3 days
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {criticalDeletionWebsites.map(website => {
              const days = getDaysUntilDeletion(website);
              return (
                <div key={website.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-900">{website.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({website.url})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-red-600">
                      {days === 0 ? 'Deleting soon' : `${days} day${days > 1 ? 's' : ''} left`}
                    </span>
                    <button
                      onClick={() => onUnarchiveWebsite(website.id)}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Archived Websites</h2>
          <div className="text-sm text-gray-500">
            {filteredWebsites.length} of {archivedWebsites.length} websites
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            placeholder="Search archived websites..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
          />
          
          <FilterDropdown
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      {/* Archived Websites List */}
      {sortedWebsites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {archivedWebsites.length === 0 ? 'No archived websites' : 'No websites found'}
          </h3>
          <p className="text-gray-500">
            {archivedWebsites.length === 0
              ? 'Websites will appear here when archived from the dashboard'
              : 'Try adjusting your search query to find specific websites'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sortedWebsites.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              onUnarchive={onUnarchiveWebsite}
              onDelete={onDeleteWebsite}
              daysUntilDeletion={getDaysUntilDeletion(website)}
            />
          ))}
        </div>
      )}
    </div>
  );
}