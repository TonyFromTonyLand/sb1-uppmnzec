import React, { useState } from 'react';
import { X, Database, Eye, Hash, Navigation, FileText, ShoppingCart, Code, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Website, WebsiteSettings, ExtractionConfig, CustomSelector } from '../types';

interface DataExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: Website;
  onSave: (websiteId: string, settings: WebsiteSettings) => void;
}

interface PresetConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: Partial<ExtractionConfig>;
}

const EXTRACTION_PRESETS: PresetConfig[] = [
  {
    id: 'basic',
    name: 'Basic Content',
    description: 'Essential page metadata and structure',
    icon: <FileText className="h-5 w-5" />,
    config: {
      title: true,
      metaDescription: true,
      canonicalUrl: true,
      headers: {
        enabled: true,
        levels: [1, 2, 3],
        includeText: true,
        includeStructure: true,
        includeIds: false,
        includeClasses: false,
        maxLength: 200,
      },
      navigation: {
        enabled: true,
        mainNavSelector: 'nav, .navigation, .main-nav, #navigation',
        footerNavSelector: 'footer nav, .footer-nav, .footer-navigation',
        sidebarNavSelector: '.sidebar nav, .sidebar-nav, aside nav',
        extractText: true,
        extractUrls: true,
        maxDepth: 3,
        breadcrumbs: {
          enabled: true,
          preset: 'schema',
          selectors: [],
          separator: '>',
          removeHome: false,
          maxDepth: 10,
        },
      },
    }
  },
  {
    id: 'seo',
    name: 'SEO Focused',
    description: 'Complete SEO metadata and social sharing',
    icon: <Eye className="h-5 w-5" />,
    config: {
      title: true,
      metaDescription: true,
      canonicalUrl: true,
      metaKeywords: true,
      openGraph: {
        enabled: true,
        extractTitle: true,
        extractDescription: true,
        extractImage: true,
        extractUrl: true,
        extractType: true,
      },
      headers: {
        enabled: true,
        levels: [1, 2, 3, 4],
        includeText: true,
        includeStructure: true,
        includeIds: true,
        includeClasses: false,
        maxLength: 300,
      },
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Product data, prices, and inventory',
    icon: <ShoppingCart className="h-5 w-5" />,
    config: {
      title: true,
      metaDescription: true,
      ecommerce: {
        enabled: true,
        products: {
          enabled: true,
          containerSelector: '.product, .product-item, [data-product]',
          titleSelector: '.product-title, .product-name, h1, h2',
          priceSelector: '.price, .product-price, .current-price',
          descriptionSelector: '.product-description, .description',
          imageSelector: '.product-image img, .product-photo img',
          skuSelector: '.sku, .product-sku, [data-sku]',
          stockSelector: '.stock, .availability, [data-stock]',
          ratingSelector: '.rating, .stars, .review-rating',
          reviewCountSelector: '.review-count, .reviews-count',
          brandSelector: '.brand, .product-brand',
          categorySelector: '.category, .product-category',
          urlSelector: 'a[href]',
          availabilitySelector: '.availability, .in-stock, .out-of-stock',
          saleSelector: '.sale, .on-sale, .discount',
          originalPriceSelector: '.original-price, .was-price, .old-price',
          extractVariants: true,
          variantSelector: '.variant, .product-variant, .option',
          trackInventory: true,
          trackPriceChanges: true,
        },
        categories: {
          enabled: true,
          containerSelector: '.category, .category-item, [data-category]',
          nameSelector: '.category-name, .category-title, h1, h2',
          descriptionSelector: '.category-description, .description',
          imageSelector: '.category-image img, .category-photo img',
          urlSelector: 'a[href]',
          productCountSelector: '.product-count, .count',
          subcategorySelector: '.subcategory, .child-category',
          parentCategorySelector: '.parent-category, .breadcrumb',
          extractHierarchy: true,
          maxDepth: 5,
        },
      },
    }
  },
  {
    id: 'content',
    name: 'Content Rich',
    description: 'Full content extraction with media',
    icon: <Database className="h-5 w-5" />,
    config: {
      title: true,
      metaDescription: true,
      canonicalUrl: true,
      headers: {
        enabled: true,
        levels: [1, 2, 3, 4, 5, 6],
        includeText: true,
        includeStructure: true,
        includeIds: true,
        includeClasses: true,
        maxLength: 500,
      },
      content: {
        enabled: true,
        mainContentSelector: 'main, .content, .main-content, #content, article',
        excludeSelectors: ['nav', 'header', 'footer', '.sidebar', '.advertisement'],
        includeImages: true,
        includeLinks: true,
        maxLength: 10000,
        preserveFormatting: true,
      },
      navigation: {
        enabled: true,
        mainNavSelector: 'nav, .navigation, .main-nav, #navigation',
        footerNavSelector: 'footer nav, .footer-nav, .footer-navigation',
        sidebarNavSelector: '.sidebar nav, .sidebar-nav, aside nav',
        extractText: true,
        extractUrls: true,
        maxDepth: 5,
        breadcrumbs: {
          enabled: true,
          preset: 'schema',
          selectors: [],
          separator: '>',
          removeHome: false,
          maxDepth: 10,
        },
      },
    }
  }
];

const BREADCRUMB_PRESETS = [
  {
    id: 'schema',
    name: 'Schema.org Microdata',
    description: 'Standard structured data breadcrumbs',
    selectors: ['[itemtype="http://schema.org/BreadcrumbList"] [itemprop="name"]', '.breadcrumb [itemscope] [itemprop="name"]']
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    description: 'Bootstrap framework breadcrumbs',
    selectors: ['.breadcrumb .breadcrumb-item', '.breadcrumb li']
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Foundation framework breadcrumbs',
    selectors: ['.breadcrumbs li', '.breadcrumbs a']
  },
  {
    id: 'bulma',
    name: 'Bulma',
    description: 'Bulma CSS framework breadcrumbs',
    selectors: ['.breadcrumb li', '.breadcrumb a']
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Common Tailwind breadcrumb patterns',
    selectors: ['nav[aria-label="breadcrumb"] a', '.breadcrumb-nav a', '[role="navigation"] .breadcrumb-item']
  },
  {
    id: 'material',
    name: 'Material Design',
    description: 'Material Design breadcrumbs',
    selectors: ['.mdc-breadcrumb__item', '.mat-breadcrumb-item', '.breadcrumb-item']
  },
  {
    id: 'custom',
    name: 'Custom Selectors',
    description: 'Define your own CSS selectors',
    selectors: []
  }
];

export function DataExtractionModal({ isOpen, onClose, website, onSave }: DataExtractionModalProps) {
  const [settings, setSettings] = useState<WebsiteSettings>(website.settings);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const handleSave = () => {
    onSave(website.id, settings);
    onClose();
  };

  const applyPreset = (preset: PresetConfig) => {
    setSettings(prev => ({
      ...prev,
      extraction: {
        ...prev.extraction,
        defaultConfig: {
          ...prev.extraction.defaultConfig,
          ...preset.config
        }
      }
    }));
  };

  const updateExtractionConfig = (updates: Partial<ExtractionConfig>) => {
    setSettings(prev => ({
      ...prev,
      extraction: {
        ...prev.extraction,
        defaultConfig: {
          ...prev.extraction.defaultConfig,
          ...updates
        }
      }
    }));
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addCustomSelector = () => {
    const newSelector: CustomSelector = {
      id: Date.now().toString(),
      name: '',
      selector: '',
      enabled: true,
      dataType: 'text',
      required: false,
    };
    
    updateExtractionConfig({
      customSelectors: [...settings.extraction.defaultConfig.customSelectors, newSelector]
    });
  };

  const updateCustomSelector = (id: string, updates: Partial<CustomSelector>) => {
    updateExtractionConfig({
      customSelectors: settings.extraction.defaultConfig.customSelectors.map(selector =>
        selector.id === id ? { ...selector, ...updates } : selector
      )
    });
  };

  const removeCustomSelector = (id: string) => {
    updateExtractionConfig({
      customSelectors: settings.extraction.defaultConfig.customSelectors.filter(selector => selector.id !== id)
    });
  };

  const updateBreadcrumbPreset = (preset: string) => {
    const presetConfig = BREADCRUMB_PRESETS.find(p => p.id === preset);
    updateExtractionConfig({
      navigation: {
        ...settings.extraction.defaultConfig.navigation,
        breadcrumbs: {
          ...settings.extraction.defaultConfig.navigation.breadcrumbs,
          preset: preset as any,
          selectors: presetConfig?.selectors || []
        }
      }
    });
  };

  if (!isOpen) return null;

  const config = settings.extraction.defaultConfig;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Extraction Settings</h2>
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
            {/* Presets */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Setup Presets</h3>
              </div>
              <p className="text-sm text-gray-600">Choose a preset to quickly configure extraction settings for your use case</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {EXTRACTION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-4 border-2 border-gray-200 rounded-xl text-left hover:border-purple-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        {preset.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Metadata */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('basic')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Basic Metadata</h4>
                  </div>
                  {expandedSections.has('basic') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('basic') && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.title}
                        onChange={(e) => updateExtractionConfig({ title: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">Page Title</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.metaDescription}
                        onChange={(e) => updateExtractionConfig({ metaDescription: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">Meta Description</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.canonicalUrl}
                        onChange={(e) => updateExtractionConfig({ canonicalUrl: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">Canonical URL</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.metaKeywords}
                        onChange={(e) => updateExtractionConfig({ metaKeywords: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">Meta Keywords</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Open Graph */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('opengraph')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Open Graph & Social Media</h4>
                  </div>
                  {expandedSections.has('opengraph') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('opengraph') && (
                <div className="p-6 space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.openGraph.enabled}
                      onChange={(e) => updateExtractionConfig({
                        openGraph: { ...config.openGraph, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">Enable Open Graph extraction</span>
                  </label>

                  {config.openGraph.enabled && (
                    <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.openGraph.extractTitle}
                          onChange={(e) => updateExtractionConfig({
                            openGraph: { ...config.openGraph, extractTitle: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">OG Title</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.openGraph.extractDescription}
                          onChange={(e) => updateExtractionConfig({
                            openGraph: { ...config.openGraph, extractDescription: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">OG Description</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.openGraph.extractImage}
                          onChange={(e) => updateExtractionConfig({
                            openGraph: { ...config.openGraph, extractImage: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">OG Image</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.openGraph.extractUrl}
                          onChange={(e) => updateExtractionConfig({
                            openGraph: { ...config.openGraph, extractUrl: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">OG URL</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.openGraph.extractType}
                          onChange={(e) => updateExtractionConfig({
                            openGraph: { ...config.openGraph, extractType: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">OG Type</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Headers */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('headers')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Header Structure (H1-H6)</h4>
                  </div>
                  {expandedSections.has('headers') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('headers') && (
                <div className="p-6 space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.headers.enabled}
                      onChange={(e) => updateExtractionConfig({
                        headers: { ...config.headers, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">Enable header extraction</span>
                  </label>

                  {config.headers.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Header Levels to Extract
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {[1, 2, 3, 4, 5, 6].map(level => (
                            <label key={level} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={config.headers.levels.includes(level)}
                                onChange={(e) => {
                                  const levels = e.target.checked
                                    ? [...config.headers.levels, level]
                                    : config.headers.levels.filter(l => l !== level);
                                  updateExtractionConfig({
                                    headers: { ...config.headers, levels }
                                  });
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-900">H{level}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.headers.includeText}
                            onChange={(e) => updateExtractionConfig({
                              headers: { ...config.headers, includeText: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Include Text</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.headers.includeStructure}
                            onChange={(e) => updateExtractionConfig({
                              headers: { ...config.headers, includeStructure: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Include Structure</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.headers.includeIds}
                            onChange={(e) => updateExtractionConfig({
                              headers: { ...config.headers, includeIds: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Include IDs</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.headers.includeClasses}
                            onChange={(e) => updateExtractionConfig({
                              headers: { ...config.headers, includeClasses: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Include Classes</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Text Length
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="1000"
                          value={config.headers.maxLength}
                          onChange={(e) => updateExtractionConfig({
                            headers: { ...config.headers, maxLength: parseInt(e.target.value) }
                          })}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation & Breadcrumbs */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('navigation')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold text-gray-900">Navigation & Breadcrumbs</h4>
                  </div>
                  {expandedSections.has('navigation') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('navigation') && (
                <div className="p-6 space-y-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.navigation.enabled}
                      onChange={(e) => updateExtractionConfig({
                        navigation: { ...config.navigation, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">Enable navigation extraction</span>
                  </label>

                  {config.navigation.enabled && (
                    <div className="space-y-6">
                      {/* Navigation Selectors */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Main Navigation Selector
                          </label>
                          <input
                            type="text"
                            value={config.navigation.mainNavSelector}
                            onChange={(e) => updateExtractionConfig({
                              navigation: { ...config.navigation, mainNavSelector: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="nav, .navigation"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Footer Navigation Selector
                          </label>
                          <input
                            type="text"
                            value={config.navigation.footerNavSelector}
                            onChange={(e) => updateExtractionConfig({
                              navigation: { ...config.navigation, footerNavSelector: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="footer nav"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sidebar Navigation Selector
                          </label>
                          <input
                            type="text"
                            value={config.navigation.sidebarNavSelector}
                            onChange={(e) => updateExtractionConfig({
                              navigation: { ...config.navigation, sidebarNavSelector: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder=".sidebar nav"
                          />
                        </div>
                      </div>

                      {/* Navigation Options */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.navigation.extractText}
                            onChange={(e) => updateExtractionConfig({
                              navigation: { ...config.navigation, extractText: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Extract Text</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.navigation.extractUrls}
                            onChange={(e) => updateExtractionConfig({
                              navigation: { ...config.navigation, extractUrls: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Extract URLs</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Depth
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={config.navigation.maxDepth}
                            onChange={(e) => updateExtractionConfig({
                              navigation: { ...config.navigation, maxDepth: parseInt(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Breadcrumbs */}
                      <div className="bg-indigo-50 rounded-xl p-6 space-y-4">
                        <div className="flex items-center space-x-3">
                          <Navigation className="h-5 w-5 text-indigo-600" />
                          <h5 className="font-semibold text-gray-900">Breadcrumb Navigation</h5>
                        </div>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.navigation.breadcrumbs.enabled}
                            onChange={(e) => updateExtractionConfig({
                              navigation: {
                                ...config.navigation,
                                breadcrumbs: { ...config.navigation.breadcrumbs, enabled: e.target.checked }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">Enable breadcrumb extraction</span>
                        </label>

                        {config.navigation.breadcrumbs.enabled && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Breadcrumb Preset
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {BREADCRUMB_PRESETS.map((preset) => (
                                  <button
                                    key={preset.id}
                                    onClick={() => updateBreadcrumbPreset(preset.id)}
                                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                                      config.navigation.breadcrumbs.preset === preset.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="font-medium text-gray-900 mb-1">{preset.name}</div>
                                    <div className="text-xs text-gray-600">{preset.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {config.navigation.breadcrumbs.preset === 'custom' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Custom CSS Selectors (one per line)
                                </label>
                                <textarea
                                  value={config.navigation.breadcrumbs.selectors.join('\n')}
                                  onChange={(e) => updateExtractionConfig({
                                    navigation: {
                                      ...config.navigation,
                                      breadcrumbs: {
                                        ...config.navigation.breadcrumbs,
                                        selectors: e.target.value.split('\n').filter(s => s.trim())
                                      }
                                    }
                                  })}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=".breadcrumb a&#10;.breadcrumb-item&#10;[aria-label='breadcrumb'] a"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Separator
                                </label>
                                <input
                                  type="text"
                                  value={config.navigation.breadcrumbs.separator}
                                  onChange={(e) => updateExtractionConfig({
                                    navigation: {
                                      ...config.navigation,
                                      breadcrumbs: { ...config.navigation.breadcrumbs, separator: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=">"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Max Depth
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={config.navigation.breadcrumbs.maxDepth}
                                  onChange={(e) => updateExtractionConfig({
                                    navigation: {
                                      ...config.navigation,
                                      breadcrumbs: { ...config.navigation.breadcrumbs, maxDepth: parseInt(e.target.value) }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center">
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={config.navigation.breadcrumbs.removeHome}
                                    onChange={(e) => updateExtractionConfig({
                                      navigation: {
                                        ...config.navigation,
                                        breadcrumbs: { ...config.navigation.breadcrumbs, removeHome: e.target.checked }
                                      }
                                    })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-900">Remove "Home"</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content Extraction */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('content')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-900">Main Content Extraction</h4>
                  </div>
                  {expandedSections.has('content') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('content') && (
                <div className="p-6 space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.content.enabled}
                      onChange={(e) => updateExtractionConfig({
                        content: { ...config.content, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">Enable content extraction</span>
                  </label>

                  {config.content.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Main Content Selector
                          </label>
                          <input
                            type="text"
                            value={config.content.mainContentSelector}
                            onChange={(e) => updateExtractionConfig({
                              content: { ...config.content, mainContentSelector: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="main, .content, article"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Content Length
                          </label>
                          <input
                            type="number"
                            min="100"
                            max="50000"
                            value={config.content.maxLength}
                            onChange={(e) => updateExtractionConfig({
                              content: { ...config.content, maxLength: parseInt(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exclude Selectors (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={config.content.excludeSelectors.join(', ')}
                          onChange={(e) => updateExtractionConfig({
                            content: { 
                              ...config.content, 
                              excludeSelectors: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="nav, header, footer, .sidebar"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.content.includeImages}
                            onChange={(e) => updateExtractionConfig({
                              content: { ...config.content, includeImages: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Include Images</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.content.includeLinks}
                            onChange={(e) => updateExtractionConfig({
                              content: { ...config.content, includeLinks: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Include Links</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.content.preserveFormatting}
                            onChange={(e) => updateExtractionConfig({
                              content: { ...config.content, preserveFormatting: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">Preserve Formatting</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* E-commerce */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('ecommerce')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900">E-commerce Data</h4>
                  </div>
                  {expandedSections.has('ecommerce') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('ecommerce') && (
                <div className="p-6 space-y-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.ecommerce.enabled}
                      onChange={(e) => updateExtractionConfig({
                        ecommerce: { ...config.ecommerce, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">Enable e-commerce data extraction</span>
                  </label>

                  {config.ecommerce.enabled && (
                    <div className="space-y-6">
                      {/* Product Settings */}
                      <div className="bg-emerald-50 rounded-xl p-6 space-y-4">
                        <div className="flex items-center space-x-3">
                          <ShoppingCart className="h-5 w-5 text-emerald-600" />
                          <h5 className="font-semibold text-gray-900">Product Extraction</h5>
                        </div>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.ecommerce.products.enabled}
                            onChange={(e) => updateExtractionConfig({
                              ecommerce: {
                                ...config.ecommerce,
                                products: { ...config.ecommerce.products, enabled: e.target.checked }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">Enable product extraction</span>
                        </label>

                        {config.ecommerce.products.enabled && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Product Container Selector
                                </label>
                                <input
                                  type="text"
                                  value={config.ecommerce.products.containerSelector}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, containerSelector: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=".product, .product-item"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Product Title Selector
                                </label>
                                <input
                                  type="text"
                                  value={config.ecommerce.products.titleSelector}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, titleSelector: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=".product-title, h1, h2"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Price Selector
                                </label>
                                <input
                                  type="text"
                                  value={config.ecommerce.products.priceSelector}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, priceSelector: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=".price, .product-price"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Image Selector
                                </label>
                                <input
                                  type="text"
                                  value={config.ecommerce.products.imageSelector}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, imageSelector: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder=".product-image img"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <label className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.ecommerce.products.extractVariants}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, extractVariants: e.target.checked }
                                    }
                                  })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Extract Variants</span>
                              </label>

                              <label className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.ecommerce.products.trackInventory}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, trackInventory: e.target.checked }
                                    }
                                  })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Track Inventory</span>
                              </label>

                              <label className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.ecommerce.products.trackPriceChanges}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      products: { ...config.ecommerce.products, trackPriceChanges: e.target.checked }
                                    }
                                  })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Track Price Changes</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Category Settings */}
                      <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                        <div className="flex items-center space-x-3">
                          <Database className="h-5 w-5 text-blue-600" />
                          <h5 className="font-semibold text-gray-900">Category Extraction</h5>
                        </div>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.ecommerce.categories.enabled}
                            onChange={(e) => updateExtractionConfig({
                              ecommerce: {
                                ...config.ecommerce,
                                categories: { ...config.ecommerce.categories, enabled: e.target.checked }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">Enable category extraction</span>
                        </label>

                        {config.ecommerce.categories.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Container Selector
                              </label>
                              <input
                                type="text"
                                value={config.ecommerce.categories.containerSelector}
                                onChange={(e) => updateExtractionConfig({
                                  ecommerce: {
                                    ...config.ecommerce,
                                    categories: { ...config.ecommerce.categories, containerSelector: e.target.value }
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder=".category, .category-item"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Name Selector
                              </label>
                              <input
                                type="text"
                                value={config.ecommerce.categories.nameSelector}
                                onChange={(e) => updateExtractionConfig({
                                  ecommerce: {
                                    ...config.ecommerce,
                                    categories: { ...config.ecommerce.categories, nameSelector: e.target.value }
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder=".category-name, h1, h2"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Hierarchy Depth
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={config.ecommerce.categories.maxDepth}
                                onChange={(e) => updateExtractionConfig({
                                  ecommerce: {
                                    ...config.ecommerce,
                                    categories: { ...config.ecommerce.categories, maxDepth: parseInt(e.target.value) }
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div className="flex items-center">
                              <label className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.ecommerce.categories.extractHierarchy}
                                  onChange={(e) => updateExtractionConfig({
                                    ecommerce: {
                                      ...config.ecommerce,
                                      categories: { ...config.ecommerce.categories, extractHierarchy: e.target.checked }
                                    }
                                  })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Extract Hierarchy</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Selectors */}
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => toggleSection('custom')}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Code className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Custom Selectors</h4>
                  </div>
                  {expandedSections.has('custom') ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('custom') && (
                <div className="p-6 space-y-4">
                  {config.customSelectors.length > 0 && (
                    <div className="space-y-3">
                      {config.customSelectors.map((selector) => (
                        <div key={selector.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selector.enabled}
                              onChange={(e) => updateCustomSelector(selector.id, { enabled: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <input
                                  type="text"
                                  value={selector.name}
                                  onChange={(e) => updateCustomSelector(selector.id, { name: e.target.value })}
                                  placeholder="Selector name..."
                                  className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                                />
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  selector.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {selector.dataType}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={selector.selector}
                                onChange={(e) => updateCustomSelector(selector.id, { selector: e.target.value })}
                                placeholder="CSS selector..."
                                className="text-sm text-gray-600 bg-transparent border-none p-0 focus:ring-0 w-full font-mono"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeCustomSelector(selector.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={addCustomSelector}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Code className="h-4 w-4" />
                    <span>Add Custom Selector</span>
                  </button>

                  {config.customSelectors.length === 0 && (
                    <div className="text-center p-6 text-gray-500">
                      <div className="mb-2">No custom selectors configured</div>
                      <div className="text-sm">Add custom CSS selectors to extract specific data from pages</div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Save Extraction Settings
          </button>
        </div>
      </div>
    </div>
  );
}