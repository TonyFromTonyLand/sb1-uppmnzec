import React, { useState } from 'react';
import { X, Settings, Search, Database } from 'lucide-react';
import { Website, WebsiteSettings } from '../types';
import { PageDiscoveryModal } from './PageDiscoveryModal';
import { DataExtractionModal } from './DataExtractionModal';

interface WebsiteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: Website;
  onSave: (websiteId: string, settings: WebsiteSettings) => void;
}

export function WebsiteSettingsModal({ isOpen, onClose, website, onSave }: WebsiteSettingsModalProps) {
  const [activeModal, setActiveModal] = useState<'discovery' | 'extraction' | null>(null);

  const handleModalClose = () => {
    setActiveModal(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Settings Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Website Settings</h2>
                <p className="text-sm text-gray-500">{website.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Website Monitoring</h3>
              <p className="text-gray-600">Choose which settings you'd like to configure for this website</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Page Discovery */}
              <button
                onClick={() => setActiveModal('discovery')}
                className="p-8 border-2 border-gray-200 rounded-2xl text-left hover:border-blue-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Page Discovery</h4>
                    <p className="text-sm text-gray-500">How to find pages</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>XML Sitemap configuration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Web crawling settings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Include/exclude patterns</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-blue-600 font-medium">
                  Current: {website.settings.discovery.method === 'sitemap' ? 'XML Sitemap' : 'Web Crawling'}
                </div>
              </button>

              {/* Data Extraction */}
              <button
                onClick={() => setActiveModal('extraction')}
                className="p-8 border-2 border-gray-200 rounded-2xl text-left hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Database className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Data Extraction</h4>
                    <p className="text-sm text-gray-500">What data to extract</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Metadata & SEO data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Content & navigation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>E-commerce & custom data</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-purple-600 font-medium">
                  {website.settings.extraction.defaultConfig.title ? 'Configured' : 'Not configured'}
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <PageDiscoveryModal
        isOpen={activeModal === 'discovery'}
        onClose={handleModalClose}
        website={website}
        onSave={onSave}
      />

      <DataExtractionModal
        isOpen={activeModal === 'extraction'}
        onClose={handleModalClose}
        website={website}
        onSave={onSave}
      />
    </>
  );
}