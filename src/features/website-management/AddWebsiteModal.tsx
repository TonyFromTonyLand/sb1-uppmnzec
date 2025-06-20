import React, { useState } from 'react';
import { X, Globe, FileText, Search } from 'lucide-react';
import { Website } from '../../types';

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (website: Omit<Website, 'id' | 'createdAt' | 'settings'>) => void;
}

export function AddWebsiteModal({ isOpen, onClose, onAdd }: AddWebsiteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    discoveryMethod: 'sitemap' as 'sitemap' | 'crawling',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Website name is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'Website URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newWebsite: Omit<Website, 'id' | 'createdAt' | 'settings'> = {
      ...formData,
      status: 'active',
      lastScan: new Date(),
      nextScan: new Date(Date.now() + 6 * 60 * 60 * 1000),
      totalPages: 0,
      changedPages: 0,
      newPages: 0,
      removedPages: 0,
    };

    onAdd(newWebsite);
    setFormData({ name: '', url: '', discoveryMethod: 'sitemap' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Website</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website Name
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., My E-commerce Store"
              />
            </div>
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.url ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {errors.url && <p className="text-sm text-red-600 mt-1">{errors.url}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Page Discovery Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discoveryMethod: 'sitemap' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.discoveryMethod === 'sitemap'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Sitemap</div>
                <div className="text-sm text-gray-500">Use XML sitemaps</div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discoveryMethod: 'crawling' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.discoveryMethod === 'crawling'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Search className="h-5 w-5 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Crawling</div>
                <div className="text-sm text-gray-500">Intelligent crawling</div>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can configure detailed settings after adding the website
            </p>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Add Website
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}