import React, { useState } from 'react';
import { Website, PageComparisonResult, SingleRunDetails } from '../../types';
import { ArrowLeft, AlertTriangle, Loader2, List, Eye, ExternalLink, Globe, CheckCircle, Zap, Clock } from 'lucide-react';
import { useRunComparison } from '../../hooks/useRunComparison';
import { RunComparisonSummary } from './RunComparisonSummary';
import { RunChangesTable } from './RunChangesTable';
import { PageDetailsComparisonView } from './PageDetailsComparisonView';

interface RunComparisonProps {
  website: Website;
  runIds: string[];
  onBack: () => void;
}

export function RunComparison({ website, runIds, onBack }: RunComparisonProps) {
  const { comparison, singleRunDetails, isLoading } = useRunComparison(website.id, runIds);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState<PageComparisonResult | null>(null);
  const [expandedUrls, setExpandedUrls] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing data...</p>
        </div>
      </div>
    );
  }

  // Single Run Details View
  if (singleRunDetails && runIds.length === 1) {
    const run = singleRunDetails.run;
    const summary = singleRunDetails.summary;

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
                <h2 className="text-xl font-semibold text-gray-900">Scan Details</h2>
                <p className="text-sm text-gray-500">
                  Scan #{run.id.slice(-6)} - {run.startedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Started: {run.startedAt.toLocaleString()}</div>
              {run.completedAt && <div>Completed: {run.completedAt.toLocaleString()}</div>}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total Pages</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {summary.totalPages.toLocaleString()}
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Successful</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {summary.successfulPages.toLocaleString()}
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Errors</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {summary.errorPages.toLocaleString()}
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Avg Load Time</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {summary.averageLoadTime}ms
              </div>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Success Rate</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {Math.round((summary.successfulPages / summary.totalPages) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Scanned URLs */}
        {run.scannedUrls && run.scannedUrls.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <List className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Scanned URLs</h3>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {run.scannedUrls.length.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setExpandedUrls(!expandedUrls)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {expandedUrls ? 'Show Less' : 'Show All'}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {(expandedUrls ? run.scannedUrls : run.scannedUrls.slice(0, 20)).map((url, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-mono truncate flex-1">{url}</span>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        summary.urlsByStatus.error.includes(url)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {summary.urlsByStatus.error.includes(url) ? 'Error' : 'Success'}
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
                {!expandedUrls && run.scannedUrls.length > 20 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    ... and {(run.scannedUrls.length - 20).toLocaleString()} more URLs
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Snapshots Sample */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sample Page Data</h3>
            <p className="text-sm text-gray-500">Preview of extracted content from scanned pages</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {singleRunDetails.snapshots.slice(0, 5).map((snapshot) => (
                <div key={snapshot.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{snapshot.title}</h4>
                      <p className="text-sm text-gray-500 mb-2">{snapshot.url}</p>
                      {snapshot.metaDescription && (
                        <p className="text-sm text-gray-600 mb-2">{snapshot.metaDescription}</p>
                      )}
                    </div>
                    <a
                      href={snapshot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  {snapshot.breadcrumbs.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Navigation:</div>
                      <div className="flex items-center space-x-2 text-sm">
                        {snapshot.breadcrumbs.map((crumb, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <span className="text-gray-400">{">"}</span>}
                            <span className={index === snapshot.breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                              {crumb}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {snapshot.headers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Headers:</div>
                      <div className="space-y-1">
                        {snapshot.headers.slice(0, 3).map((header, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                              H{header.level}
                            </span>
                            <span className="text-sm text-gray-700">{header.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Response: {snapshot.responseCode}</span>
                    <span>Load time: {snapshot.loadTime}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Comparison View
  if (!comparison) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison data available</h3>
          <p className="text-gray-500">Please select valid scan runs to compare.</p>
        </div>
      </div>
    );
  }

  // Side-by-side page details view
  if (selectedPageForDetails) {
    return (
      <PageDetailsComparisonView
        selectedPage={selectedPageForDetails}
        baseRunId={comparison.baseRun.id}
        compareRunId={comparison.compareRun.id}
        onBack={() => setSelectedPageForDetails(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Run Comparison</h2>
          <p className="text-sm text-gray-500">
            Analyzing changes between scan runs
          </p>
        </div>
      </div>

      {/* Summary */}
      <RunComparisonSummary comparison={comparison} />

      {/* Changes Table */}
      <RunChangesTable 
        pageChanges={comparison.pageChanges}
        onPageSelect={setSelectedPageForDetails}
      />
    </div>
  );
}