import React, { useState } from 'react';
import { X, Search, FileText, Globe, Plus, Trash2, Edit3, Settings } from 'lucide-react';
import { Website, WebsiteSettings, SitemapUrlConfig, CrawlingPatternConfig } from '../types';
import { PatternListEditor } from './common/PatternListEditor';

interface PageDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: Website;
  onSave: (websiteId: string, settings: WebsiteSettings) => void;
}

export function PageDiscoveryModal({ isOpen, onClose, website, onSave }: PageDiscoveryModalProps) {
  const [settings, setSettings] = useState<WebsiteSettings>(website.settings);

  const handleSave = () => {
    onSave(website.id, settings);
    onClose();
  };

  const updateDiscoveryMethod = (method: 'sitemap' | 'crawling') => {
    setSettings(prev => ({
      ...prev,
      discovery: {
        ...prev.discovery,
        method
      }
    }));
  };

  const updateSitemapSettings = (updates: Partial<typeof settings.discovery.sitemap>) => {
    setSettings(prev => ({
      ...prev,
      discovery: {
        ...prev.discovery,
        sitemap: {
          ...prev.discovery.sitemap,
          ...updates
        }
      }
    }));
  };

  const updateCrawlingSettings = (updates: Partial<typeof settings.discovery.crawling>) => {
    setSettings(prev => ({
      ...prev,
      discovery: {
        ...prev.discovery,
        crawling: {
          ...prev.discovery.crawling,
          ...updates
        }
      }
    }));
  };

  // Sitemap URL management
  const addSitemapUrl = (urlData: Omit<SitemapUrlConfig, 'id'>) => {
    const newUrl: SitemapUrlConfig = {
      ...urlData,
      id: Date.now().toString(),
    };
    updateSitemapSettings({
      urls: [...settings.discovery.sitemap.urls, newUrl]
    });
  };

  const updateSitemapUrl = (id: string, updates: Partial<SitemapUrlConfig>) => {
    updateSitemapSettings({
      urls: settings.discovery.sitemap.urls.map(url => 
        url.id === id ? { ...url, ...updates } : url
      )
    });
  };

  const removeSitemapUrl = (id: string) => {
    updateSitemapSettings({
      urls: settings.discovery.sitemap.urls.filter(url => url.id !== id)
    });
  };

  // Crawling pattern management
  const addCrawlingPattern = (patternData: Omit<CrawlingPatternConfig, 'id'>) => {
    const newPattern: CrawlingPatternConfig = {
      ...patternData,
      id: Date.now().toString(),
    };
    updateCrawlingSettings({
      includePatterns: [...settings.discovery.crawling.includePatterns, newPattern]
    });
  };

  const updateCrawlingPattern = (id: string, updates: Partial<CrawlingPatternConfig>) => {
    updateCrawlingSettings({
      includePatterns: settings.discovery.crawling.includePatterns.map(pattern => 
        pattern.id === id ? { ...pattern, ...updates } : pattern
      )
    });
  };

  const removeCrawlingPattern = (id: string) => {
    updateCrawlingSettings({
      includePatterns: settings.discovery.crawling.includePatterns.filter(pattern => pattern.id !== id)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Page Discovery Settings</h2>
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Discovery Method Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Discovery Method</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => updateDiscoveryMethod('sitemap')}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    settings.discovery.method === 'sitemap'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">XML Sitemap</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Use XML sitemaps to discover pages efficiently and reliably
                  </p>
                  <div className="text-xs text-gray-500">
                    ✓ Fast discovery • ✓ Structured data • ✓ SEO optimized
                  </div>
                </button>
                
                <button
                  onClick={() => updateDiscoveryMethod('crawling')}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    settings.discovery.method === 'crawling'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Search className="h-6 w-6 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Web Crawling</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Intelligently crawl and discover pages by following links
                  </p>
                  <div className="text-xs text-gray-500">
                    ✓ Comprehensive • ✓ Dynamic discovery • ✓ Link following
                  </div>
                </button>
              </div>
            </div>

            {/* Sitemap Settings */}
            {settings.discovery.method === 'sitemap' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Sitemap Configuration</span>
                </h3>

                {/* Sitemap URLs */}
                <PatternListEditor
                  items={settings.discovery.sitemap.urls.map(url => ({
                    id: url.id,
                    url: url.url,
                    name: url.name,
                    description: url.description,
                    enabled: url.enabled
                  }))}
                  onAddItem={addSitemapUrl}
                  onUpdateItem={updateSitemapUrl}
                  onRemoveItem={removeSitemapUrl}
                  title="Sitemap URLs"
                  description="Configure XML sitemap URLs to discover pages from"
                  itemTypeLabel="Sitemap"
                  patternLabel="URL"
                  placeholder="https://example.com/sitemap.xml"
                  icon={<Globe className="h-5 w-5" />}
                />

                {/* Sitemap Options */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h4 className="font-medium text-gray-900">Sitemap Options</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.discovery.sitemap.autoDetect}
                          onChange={(e) => updateSitemapSettings({ autoDetect: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Auto-detect sitemaps</span>
                          <p className="text-sm text-gray-500">Automatically find sitemap.xml files</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.discovery.sitemap.followSitemapIndex}
                          onChange={(e) => updateSitemapSettings({ followSitemapIndex: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Follow sitemap index</span>
                          <p className="text-sm text-gray-500">Process sitemap index files</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.discovery.sitemap.validateUrls}
                          onChange={(e) => updateSitemapSettings({ validateUrls: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Validate URLs</span>
                          <p className="text-sm text-gray-500">Check URL accessibility before processing</p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Request Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={settings.discovery.sitemap.timeout}
                          onChange={(e) => updateSitemapSettings({ timeout: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Agent
                        </label>
                        <input
                          type="text"
                          value={settings.discovery.sitemap.userAgent}
                          onChange={(e) => updateSitemapSettings({ userAgent: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="WebMonitor/1.0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Crawling Settings */}
            {settings.discovery.method === 'crawling' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span>Crawling Configuration</span>
                </h3>

                {/* Include Patterns */}
                <PatternListEditor
                  items={settings.discovery.crawling.includePatterns.map(pattern => ({
                    id: pattern.id,
                    pattern: pattern.pattern,
                    name: pattern.name,
                    description: pattern.description,
                    enabled: pattern.enabled
                  }))}
                  onAddItem={addCrawlingPattern}
                  onUpdateItem={updateCrawlingPattern}
                  onRemoveItem={removeCrawlingPattern}
                  title="Include Patterns"
                  description="URL patterns to include during crawling"
                  itemTypeLabel="Pattern"
                  patternLabel="Pattern"
                  placeholder="/products/*"
                  icon={<Plus className="h-5 w-5" />}
                />

                {/* Exclude Patterns */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Exclude Patterns</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL patterns to exclude (one per line)
                    </label>
                    <textarea
                      value={settings.discovery.crawling.excludePatterns.join('\n')}
                      onChange={(e) => updateCrawlingSettings({ 
                        excludePatterns: e.target.value.split('\n').filter(p => p.trim()) 
                      })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/admin/*&#10;/login&#10;*.pdf&#10;*.jpg"
                    />
                  </div>
                </div>

                {/* Crawling Options */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                  <h4 className="font-medium text-gray-900">Crawling Options</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Depth
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.discovery.crawling.maxDepth}
                          onChange={(e) => updateCrawlingSettings({ maxDepth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Pages
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100000"
                          value={settings.discovery.crawling.maxPages}
                          onChange={(e) => updateCrawlingSettings({ maxPages: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Crawl Delay (ms)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={settings.discovery.crawling.crawlDelay}
                          onChange={(e) => updateCrawlingSettings({ crawlDelay: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Concurrency
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.discovery.crawling.maxConcurrency}
                          onChange={(e) => updateCrawlingSettings({ maxConcurrency: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={settings.discovery.crawling.timeout}
                          onChange={(e) => updateCrawlingSettings({ timeout: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Agent
                        </label>
                        <input
                          type="text"
                          value={settings.discovery.crawling.userAgent}
                          onChange={(e) => updateCrawlingSettings({ userAgent: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="WebMonitor/1.0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.discovery.crawling.respectRobotsTxt}
                        onChange={(e) => updateCrawlingSettings({ respectRobotsTxt: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Respect robots.txt</span>
                        <p className="text-sm text-gray-500">Follow robots.txt directives</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.discovery.crawling.followExternalLinks}
                        onChange={(e) => updateCrawlingSettings({ followExternalLinks: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Follow external links</span>
                        <p className="text-sm text-gray-500">Crawl links to external domains</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.discovery.crawling.followRedirects}
                        onChange={(e) => updateCrawlingSettings({ followRedirects: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Follow redirects</span>
                        <p className="text-sm text-gray-500">Follow HTTP redirects automatically</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Save Discovery Settings
          </button>
        </div>
      </div>
    </div>
  );
}