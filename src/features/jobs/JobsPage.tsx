import React, { useState, useCallback } from 'react';
import { useWebsites } from '../../hooks/useWebsites';
import { useBackgroundJobs } from '../../hooks/useBackgroundJobs';
import { WebsiteScanRuns } from '../scan-analysis/WebsiteScanRuns';
import { CurrentJobActivity } from './CurrentJobActivity';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { ScanRun, ScheduledJob } from '../../types';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Globe,
  Play,
  Pause,
  Settings,
  Trash2,
  Plus,
  ExternalLink,
  Database,
  AlertTriangle
} from 'lucide-react';

export function JobsPage() {
  const [activeTab, setActiveTab] = useState<'runs' | 'scheduled'>('runs');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allRuns, setAllRuns] = useState<ScanRun[]>([]);
  const [loadedWebsites, setLoadedWebsites] = useState<Set<string>>(new Set());

  const { websites, user } = useWebsites();
  const { jobs, isLoading: jobsLoading, error: jobsError } = useBackgroundJobs();

  // Mock scheduled jobs data
  const [scheduledJobs] = useState<ScheduledJob[]>([
    {
      id: '1',
      websiteId: '1',
      websiteName: 'E-commerce Store',
      websiteUrl: 'https://shop.example.com',
      enabled: true,
      frequency: 'daily',
      time: '02:00',
      timezone: 'UTC',
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
      retryAttempts: 3,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      websiteId: '2',
      websiteName: 'Corporate Blog',
      websiteUrl: 'https://blog.company.com',
      enabled: false,
      frequency: 'weekly',
      time: '03:30',
      timezone: 'UTC',
      lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      retryAttempts: 2,
      notifyOnSuccess: true,
      notifyOnFailure: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ]);

  const handleRunsLoaded = useCallback((websiteId: string, runs: ScanRun[]) => {
    setAllRuns(prevRuns => {
      // Remove existing runs for this website and add new ones
      const filteredRuns = prevRuns.filter(run => run.websiteId !== websiteId);
      return [...filteredRuns, ...runs].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    });
    
    setLoadedWebsites(prev => new Set([...prev, websiteId]));
  }, []);

  // Filter runs based on search and status
  const filteredRuns = allRuns.filter(run => {
    const website = websites.find(w => w.id === run.websiteId);
    const matchesSearch = searchQuery === '' || 
      (website?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       website?.url.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const runningJobs = allRuns.filter(run => run.status === 'running').length;
  const completedJobs = allRuns.filter(run => run.status === 'completed').length;
  const failedJobs = allRuns.filter(run => run.status === 'failed').length;
  const activeScheduledJobs = scheduledJobs.filter(job => job.enabled).length;

  const getStatusIcon = (status: ScanRun['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
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
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  };

  const isLoading = loadedWebsites.size < websites.length;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hidden components to load scan runs */}
      {websites.map(website => (
        <WebsiteScanRuns
          key={website.id}
          website={website}
          onRunsLoaded={handleRunsLoaded}
        />
      ))}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs & Scheduling</h1>
            <p className="text-gray-500">Monitor scan runs and manage automated scheduling</p>
            {!user && (
              <div className="flex items-center space-x-2 mt-1 text-sm text-amber-600">
                <Database className="h-4 w-4" />
                <span>Demo Mode - Sign in to save real job data</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jobs Error */}
      {jobsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Jobs Loading Error</h3>
              <p className="text-sm text-red-600">{jobsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Running Jobs</p>
              <p className="text-3xl font-bold">{runningJobs}</p>
            </div>
            <Loader2 className="h-8 w-8 text-blue-200 animate-spin" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Scheduled Jobs</p>
              <p className="text-3xl font-bold">{activeScheduledJobs}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Completed</p>
              <p className="text-3xl font-bold">{completedJobs}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Failed Jobs</p>
              <p className="text-3xl font-bold">{failedJobs}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Current Job Activity */}
      <div className="mb-8">
        <CurrentJobActivity jobs={jobs} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('runs')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'runs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>All Scan Runs</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {allRuns.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'scheduled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Scheduled Jobs</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {scheduledJobs.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* All Scan Runs Tab */}
      {activeTab === 'runs' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Scan Runs</h2>
              <div className="text-sm text-gray-500">
                {filteredRuns.length} of {allRuns.length} runs
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
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

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading scan runs from all websites...</p>
            </div>
          )}

          {/* Runs List */}
          {!isLoading && (
            <div className="bg-white rounded-xl border border-gray-200">
              {filteredRuns.length === 0 ? (
                <div className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scan runs found</h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'No scan runs have been executed yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredRuns.map((run) => {
                    const website = websites.find(w => w.id === run.websiteId);
                    if (!website) return null;

                    return (
                      <div key={run.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(run.status)}`}>
                              {getStatusIcon(run.status)}
                              <span className="capitalize">{run.status}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {website.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center space-x-2">
                                <Globe className="h-3 w-3" />
                                <span>{website.url}</span>
                                <a
                                  href={website.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>Scan #{run.id.slice(-6)}</div>
                            <div>{formatRelativeTime(run.startedAt)}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{run.totalPages.toLocaleString()}</div>
                            <div className="text-xs text-blue-600">Pages</div>
                          </div>
                          
                          {run.errorPages > 0 && (
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <div className="text-lg font-bold text-red-600">{run.errorPages}</div>
                              <div className="text-xs text-red-600">Errors</div>
                            </div>
                          )}
                          
                          {run.duration && (
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-lg font-bold text-gray-600">{formatDuration(run.duration)}</div>
                              <div className="text-xs text-gray-600">Duration</div>
                            </div>
                          )}
                          
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600 capitalize">{run.discoveryMethod}</div>
                            <div className="text-xs text-purple-600">Method</div>
                          </div>
                          
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">{run.startedAt.toLocaleDateString()}</div>
                            <div className="text-xs text-green-600">Started</div>
                          </div>
                        </div>

                        {run.error && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">Error Details</span>
                            </div>
                            <p className="text-sm text-red-600">{run.error}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Jobs Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Scheduled Jobs</h2>
                <p className="text-sm text-gray-500">Manage automated scanning schedules</p>
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </button>
            </div>
          </div>

          {/* Scheduled Jobs List */}
          <div className="bg-white rounded-xl border border-gray-200">
            {scheduledJobs.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled jobs</h3>
                <p className="text-gray-500 mb-6">Create automated scanning schedules for your websites</p>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Schedule
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {scheduledJobs.map((job) => (
                  <div key={job.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${job.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Calendar className={`h-5 w-5 ${job.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.websiteName}</h3>
                          <p className="text-sm text-gray-500">{job.websiteUrl}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.enabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.enabled ? 'Active' : 'Paused'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          {job.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600 capitalize">{job.frequency}</div>
                        <div className="text-xs text-blue-600">Frequency</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{job.time}</div>
                        <div className="text-xs text-purple-600">Time ({job.timezone})</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {job.lastRun ? formatRelativeTime(job.lastRun) : 'Never'}
                        </div>
                        <div className="text-xs text-green-600">Last Run</div>
                      </div>
                      
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-lg font-bold text-amber-600">
                          {job.enabled ? formatRelativeTime(new Date(Date.now() - (job.nextRun.getTime() - Date.now()))) : 'Paused'}
                        </div>
                        <div className="text-xs text-amber-600">Next Run</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>Retry attempts: {job.retryAttempts}</span>
                        <span>Notifications: {job.notifyOnSuccess || job.notifyOnFailure ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div>Created: {job.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}