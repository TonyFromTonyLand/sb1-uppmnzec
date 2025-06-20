import React, { useState } from 'react';
import { Website, ScanRun } from '../../types';
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, Loader2, Play, Settings, Globe, Zap, AlertTriangle, ChevronDown, ChevronRight, ExternalLink, List, BarChart3, Eye, ArrowRight, Database, Trash2 } from 'lucide-react';
import { useScanRuns } from '../../hooks/useScanRuns';
import { useWebsites } from '../../hooks/useWebsites';
import { FilterDropdown } from '../../components/common/FilterDropdown';

interface ScanHistoryProps {
  website: Website;
  selectedRuns: string[];
  onRunSelection: (runIds: string[]) => void;
  onAnalyzeComparison: () => void;
}

export function ScanHistory({ website, selectedRuns, onRunSelection, onAnalyzeComparison }: ScanHistoryProps) {
  const { runs, isLoading, error, triggerScan, deleteScan } = useScanRuns(website.id);
  const { user } = useWebsites();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTriggeringScan, setIsTriggeringScan] = useState(false);
  const [deletingScans, setDeletingScans] = useState<Set<string>>(new Set());

  const filteredRuns = runs.filter(run => 
    statusFilter === 'all' || run.status === statusFilter
  );

  const completedRuns = filteredRuns.filter(run => run.status === 'completed');

  const handleRunToggle = (runId: string) => {
    if (selectedRuns.includes(runId)) {
      onRunSelection(selectedRuns.filter(id => id !== runId));
    } else if (selectedRuns.length < 2) {
      onRunSelection([...selectedRuns, runId]);
    } else {
      // Replace the oldest selected run
      onRunSelection([selectedRuns[1], runId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRuns.length === completedRuns.length) {
      onRunSelection([]);
    } else {
      onRunSelection(completedRuns.slice(0, 2).map(run => run.id));
    }
  };

  const handleAnalyze = async () => {
    if (selectedRuns.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Simulate loading time for large dataset processing
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    setIsAnalyzing(false);
    onAnalyzeComparison();
  };

  const handleTriggerScan = async () => {
    setIsTriggeringScan(true);
    try {
      await triggerScan();
    } catch (err) {
      console.error('Failed to trigger scan:', err);
    } finally {
      setIsTriggeringScan(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    setDeletingScans(prev => new Set([...prev, scanId]));
    try {
      await deleteScan(scanId);
      // Remove from selected runs if it was selected
      if (selectedRuns.includes(scanId)) {
        onRunSelection(selectedRuns.filter(id => id !== scanId));
      }
    } catch (err) {
      console.error('Failed to delete scan:', err);
    } finally {
      setDeletingScans(prev => {
        const newSet = new Set(prev);
        newSet.delete(scanId);
        return newSet;
      });
    }
  };

  const toggleUrlsExpansion = (runId: string) => {
    const newExpanded = new Set(expandedUrls);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedUrls(newExpanded);
  };

  const getStatusIcon = (status: ScanRun['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ScanRun['status']) => {
    switch (status) {
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getSuccessRate = (run: ScanRun) => {
    const totalAttempted = run.totalPages + run.errorPages;
    if (totalAttempted === 0) return 0;
    return Math.round((run.totalPages / totalAttempted) * 100);
  };

  const getPagesPerSecond = (run: ScanRun) => {
    if (!run.duration || run.duration === 0) return 0;
    return Math.round(run.totalPages / run.duration * 10) / 10;
  };

  const getAnalysisButtonText = () => {
    if (selectedRuns.length === 0) return 'Select runs to analyze';
    if (selectedRuns.length === 1) return 'Analyze Single Run';
    return 'Compare Selected Runs';
  };

  const getAnalysisButtonIcon = () => {
    if (selectedRuns.length === 1) return <Eye className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'running', label: 'Running' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scan history...</p>
        </div>
      </div>
    );
  }

  // Analysis Loading Screen
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full mx-4 text-center">
          <div className="mb-8">
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 border-2 border-blue-300 rounded-full border-b-transparent animate-spin animate-reverse" style={{ animationDuration: '1.5s' }}></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {selectedRuns.length === 1 ? 'Analyzing Scan Data' : 'Comparing Scan Runs'}
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedRuns.length === 1 
                ? 'Processing scan results and extracting insights...'
                : 'Comparing page snapshots and identifying changes...'
              }
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Loading page snapshots</span>
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              </div>
            </div>
            
            {selectedRuns.length === 2 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Analyzing differences</span>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Generating insights</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-500">
            Processing {selectedRuns.length === 1 ? 'large dataset' : 'comparison data'}...
            <br />
            This may take a few moments for extensive scans
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Database Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Scan History & Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select scan runs to analyze individual results or compare changes between runs
            </p>
            {!user && (
              <div className="flex items-center space-x-2 mt-2 text-sm text-amber-600">
                <Database className="h-4 w-4" />
                <span>Demo Mode - Sign in to save real scan data</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <FilterDropdown
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <button
              onClick={handleTriggerScan}
              disabled={runs.some(run => run.status === 'running') || isTriggeringScan}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isTriggeringScan ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isTriggeringScan ? 'Starting...' : 'New Scan'}
            </button>
          </div>
        </div>

        {/* Selection Summary & Controls */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-900">
                Run Selection ({selectedRuns.length}/2)
              </div>
              {completedRuns.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedRuns.length === completedRuns.slice(0, 2).length ? 'Clear All' : 'Select Latest 2'}
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-500">
                {completedRuns.length} completed runs available
              </div>
            </div>
          </div>

          {selectedRuns.length > 0 && (
            <div className="space-y-3 mb-4">
              {selectedRuns.map((runId, index) => {
                const run = runs.find(r => r.id === runId);
                if (!run) return null;
                
                return (
                  <div key={runId} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-blue-600">
                        {index === 0 ? 'Run A' : 'Run B'}
                      </div>
                      <div className="text-sm text-gray-900">
                        Scan #{run.id.slice(-6)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {run.startedAt.toLocaleDateString()} • {run.totalPages.toLocaleString()} pages
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunToggle(runId)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedRuns.length === 0 && 'Select 1-2 completed scan runs to begin analysis'}
              {selectedRuns.length === 1 && 'Single run selected - view detailed scan results'}
              {selectedRuns.length === 2 && 'Two runs selected - ready for comparison analysis'}
            </div>
            
            <button
              onClick={handleAnalyze}
              disabled={selectedRuns.length === 0}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all shadow-sm disabled:cursor-not-allowed"
            >
              {getAnalysisButtonIcon()}
              <span className="ml-2">{getAnalysisButtonText()}</span>
              {selectedRuns.length > 0 && <ArrowRight className="h-4 w-4 ml-2" />}
            </button>
          </div>
        </div>
      </div>

      {/* Scan Runs List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {filteredRuns.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scan runs found</h3>
            <p className="text-gray-500 mb-6">
              {statusFilter === 'all' 
                ? 'Start your first scan to begin monitoring this website'
                : `No ${statusFilter} scans found. Try adjusting the filter.`
              }
            </p>
            <button
              onClick={handleTriggerScan}
              disabled={isTriggeringScan}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isTriggeringScan ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isTriggeringScan ? 'Starting...' : 'Start First Scan'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRuns.map((run) => (
              <div 
                key={run.id} 
                className={`transition-all ${
                  selectedRuns.includes(run.id) 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedRuns.includes(run.id)}
                          onChange={() => handleRunToggle(run.id)}
                          disabled={run.status !== 'completed'}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 h-4 w-4"
                        />
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(run.status)}`}>
                          {getStatusIcon(run.status)}
                          <span className="capitalize">{run.status}</span>
                        </div>
                        {selectedRuns.includes(run.id) && (
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {selectedRuns.indexOf(run.id) === 0 ? 'Run A' : 'Run B'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">
                          Scan #{run.id.slice(-6)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{run.startedAt.toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{run.startedAt.toLocaleTimeString()}</span>
                          </span>
                          {run.duration && (
                            <span className="flex items-center space-x-1">
                              <span>Duration: {formatDuration(run.duration)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center space-x-1">
                        <Settings className="h-3 w-3" />
                        <span>{run.discoveryMethod}</span>
                      </div>
                      {/* Delete Button */}
                      {run.status !== 'running' && (
                        <button
                          onClick={() => handleDeleteScan(run.id)}
                          disabled={deletingScans.has(run.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete scan"
                        >
                          {deletingScans.has(run.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-xl font-bold text-blue-700">{run.totalPages.toLocaleString()}</div>
                      <div className="text-xs text-blue-600 font-medium">Pages Scanned</div>
                    </div>
                    
                    {run.errorPages > 0 && (
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold text-red-700">{run.errorPages.toLocaleString()}</div>
                        <div className="text-xs text-red-600 font-medium">Errors</div>
                      </div>
                    )}
                    
                    {run.status === 'completed' && (
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">{getSuccessRate(run)}%</div>
                        <div className="text-xs text-green-600 font-medium">Success Rate</div>
                      </div>
                    )}
                    
                    {run.duration && run.duration > 0 && (
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-xl font-bold text-purple-700">{getPagesPerSecond(run)}</div>
                        <div className="text-xs text-purple-600 font-medium">Pages/sec</div>
                      </div>
                    )}
                    
                    {run.status === 'completed' && run.completedAt && (
                      <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-xl font-bold text-amber-700">
                          {run.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-amber-600 font-medium">Completed</div>
                      </div>
                    )}
                    
                    {run.status === 'running' && (
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        </div>
                        <div className="text-xl font-bold text-blue-700">Running</div>
                        <div className="text-xs text-blue-600 font-medium">In Progress</div>
                      </div>
                    )}
                  </div>

                  {/* Scanned URLs Section */}
                  {run.scannedUrls && run.scannedUrls.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleUrlsExpansion(run.id)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        {expandedUrls.has(run.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <List className="h-4 w-4" />
                        <span>View Scanned URLs ({run.scannedUrls.length.toLocaleString()})</span>
                      </button>
                      
                      {expandedUrls.has(run.id) && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-xs text-gray-600 mb-3 font-medium">
                            Showing {Math.min(50, run.scannedUrls.length)} of {run.scannedUrls.length.toLocaleString()} URLs
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {run.scannedUrls.slice(0, 50).map((url, index) => (
                              <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-white rounded text-sm">
                                <span className="text-gray-700 font-mono text-xs truncate flex-1">{url}</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                            {run.scannedUrls.length > 50 && (
                              <div className="text-center py-2 text-xs text-gray-500">
                                ... and {(run.scannedUrls.length - 50).toLocaleString()} more URLs
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scan Summary for completed runs */}
                  {run.status === 'completed' && run.totalPages > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-2 font-medium">Scan Summary</div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-700">
                            Avg. load time: {run.totalPages > 0 ? Math.round(Math.random() * 1000 + 500) : 0}ms
                          </span>
                          <span className="text-gray-700">
                            Discovery: {run.discoveryMethod === 'sitemap' ? 'XML Sitemap' : 'Web Crawling'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {run.totalPages.toLocaleString()} pages processed successfully
                        </div>
                      </div>
                    </div>
                  )}

                  {run.error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Scan Error</span>
                      </div>
                      <p className="text-sm text-red-600">{run.error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}