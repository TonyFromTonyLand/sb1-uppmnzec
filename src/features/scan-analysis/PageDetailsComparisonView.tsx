import React from 'react';
import { PageComparisonResult } from '../../types';
import { ArrowLeft, ExternalLink, Plus, Minus, Home, ChevronRight } from 'lucide-react';

interface PageDetailsComparisonViewProps {
  selectedPage: PageComparisonResult;
  baseRunId: string;
  compareRunId: string;
  onBack: () => void;
}

export function PageDetailsComparisonView({ 
  selectedPage, 
  baseRunId, 
  compareRunId, 
  onBack 
}: PageDetailsComparisonViewProps) {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'removed':
        return 'bg-red-50 border-red-200';
      case 'modified':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-100';
      case 'medium':
        return 'text-amber-700 bg-amber-100';
      case 'low':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const renderBreadcrumbNavigation = (breadcrumbs: string[]) => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Home className="h-3 w-3 text-gray-400" />
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
            <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Page Details Comparison</h2>
              <p className="text-sm text-gray-500 truncate max-w-2xl">
                {selectedPage.url}
              </p>
            </div>
          </div>
          <a
            href={selectedPage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>

        {/* Change Summary */}
        <div className="flex items-center space-x-4 mb-4">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getChangeColor(selectedPage.changeType)}`}>
            {getChangeIcon(selectedPage.changeType)}
            <span className="capitalize">{selectedPage.changeType}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedPage.severity)}`}>
            {selectedPage.severity} impact
          </div>
          <div className="text-sm text-gray-500">
            {selectedPage.changes.length} field{selectedPage.changes.length !== 1 ? 's' : ''} changed
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Base Run */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <h3 className="font-medium text-gray-900">Base Run (Before)</h3>
            <p className="text-sm text-gray-500">
              Scan #{baseRunId.slice(-6)}
            </p>
          </div>
          <div className="p-6 space-y-6">
            {selectedPage.baseSnapshot ? (
              <>
                {/* Navigation from Breadcrumbs */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Navigation Path</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {renderBreadcrumbNavigation(selectedPage.baseSnapshot.breadcrumbs)}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Title</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{selectedPage.baseSnapshot.title}</p>
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Meta Description</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{selectedPage.baseSnapshot.metaDescription}</p>
                  </div>
                </div>

                {/* Headers */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Header Structure</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {selectedPage.baseSnapshot.headers.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                          H{header.level}
                        </span>
                        <span className="text-sm text-gray-900">{header.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Data */}
                {Object.keys(selectedPage.baseSnapshot.customData).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Data</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {Object.entries(selectedPage.baseSnapshot.customData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 capitalize">{key}:</span>
                          <span className="text-sm text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Minus className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p>Page did not exist in base run</p>
              </div>
            )}
          </div>
        </div>

        {/* Compare Run */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="font-medium text-gray-900">Compare Run (After)</h3>
            <p className="text-sm text-gray-500">
              Scan #{compareRunId.slice(-6)}
            </p>
          </div>
          <div className="p-6 space-y-6">
            {selectedPage.compareSnapshot ? (
              <>
                {/* Navigation from Breadcrumbs */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Navigation Path</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {renderBreadcrumbNavigation(selectedPage.compareSnapshot.breadcrumbs)}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Title</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{selectedPage.compareSnapshot.title}</p>
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Meta Description</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{selectedPage.compareSnapshot.metaDescription}</p>
                  </div>
                </div>

                {/* Headers */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Header Structure</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {selectedPage.compareSnapshot.headers.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                          H{header.level}
                        </span>
                        <span className="text-sm text-gray-900">{header.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Data */}
                {Object.keys(selectedPage.compareSnapshot.customData).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Data</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {Object.entries(selectedPage.compareSnapshot.customData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 capitalize">{key}:</span>
                          <span className="text-sm text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Plus className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Page was removed in compare run</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Changes */}
      {selectedPage.changes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Changes</h3>
          </div>
          <div className="p-6 space-y-4">
            {selectedPage.changes.map((fieldChange, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {fieldChange.field.charAt(0).toUpperCase() + fieldChange.field.slice(1)}
                  </div>
                  <div className={`text-xs font-medium ${
                    fieldChange.impact === 'high' ? 'text-red-600' :
                    fieldChange.impact === 'medium' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {fieldChange.impact} impact
                  </div>
                </div>
                
                {fieldChange.type === 'modified' && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-red-600">Before:</span>
                      <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 font-mono text-xs">
                        {fieldChange.oldValue || '(empty)'}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-green-600">After:</span>
                      <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-xs">
                        {fieldChange.newValue || '(empty)'}
                      </div>
                    </div>
                  </div>
                )}
                
                {fieldChange.type === 'added' && (
                  <div className="text-sm">
                    <span className="font-medium text-green-600">Added:</span>
                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-xs">
                      {fieldChange.newValue}
                    </div>
                  </div>
                )}
                
                {fieldChange.type === 'removed' && (
                  <div className="text-sm">
                    <span className="font-medium text-red-600">Removed:</span>
                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 font-mono text-xs">
                      {fieldChange.oldValue}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}