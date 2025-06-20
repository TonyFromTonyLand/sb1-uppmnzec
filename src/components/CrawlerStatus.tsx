import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  RefreshCw,
  XCircle,
  RotateCcw,
  Cloud,
  Database
} from 'lucide-react';
import { useCrawlerService } from '../hooks/useCrawlerService';

interface CrawlerStatusProps {
  websiteId?: string;
  compact?: boolean;
}

export function CrawlerStatus({ websiteId, compact = false }: CrawlerStatusProps) {
  const { 
    queueStats, 
    activeJobs, 
    isLoading, 
    cancelJob, 
    retryJob, 
    refreshData
  } = useCrawlerService();

  const filteredJobs = websiteId 
    ? activeJobs.filter(job => job.website_id === websiteId)
    : activeJobs;

  // Check for potential Cloud Run issues
  const hasQueuedJobs = queueStats.queued > 0;
  const hasRunningJobs = queueStats.running > 0;
  const totalActiveJobs = hasQueuedJobs + hasRunningJobs;
  const potentialCloudRunIssue = totalActiveJobs > 0 && !hasRunningJobs && hasQueuedJobs;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'scan':
        return 'Full Scan';
      case 'discovery':
        return 'Page Discovery';
      case 'extraction':
        return 'Data Extraction';
      case 'comparison':
        return 'Change Comparison';
      default:
        return type;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        {/* GCP Service Status */}
        <div className="flex items-center space-x-2">
          <Cloud className={`h-4 w-4 ${potentialCloudRunIssue ? 'text-amber-500' : 'text-blue-500'}`} />
          <span className={`text-sm ${potentialCloudRunIssue ? 'text-amber-600' : 'text-gray-600'}`}>
            {potentialCloudRunIssue ? 'GCP Services (Check Status)' : 'GCP Services Active'}
          </span>
        </div>

        {/* Queue Stats */}
        {(queueStats.queued > 0 || queueStats.running > 0) && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            {queueStats.running > 0 && (
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-blue-500" />
                <span>{queueStats.running} running</span>
              </div>
            )}
            {queueStats.queued > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>{queueStats.queued} queued</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Job Processing Status</h3>
              <p className="text-sm text-gray-500">Real-time job queue monitoring via GCP services</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh job status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2">
              <Cloud className={`h-4 w-4 ${potentialCloudRunIssue ? 'text-amber-500' : 'text-blue-500'}`} />
              <span className={`text-sm font-medium ${potentialCloudRunIssue ? 'text-amber-600' : 'text-blue-600'}`}>
                GCP Services
              </span>
            </div>
          </div>
        </div>

        {/* Potential Cloud Run Issue Warning */}
        {potentialCloudRunIssue && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Potential Processing Delay</span>
            </div>
            <div className="text-xs text-amber-700 space-y-1">
              <div>• Jobs are queued but not processing - Cloud Run or Pub/Sub may be experiencing issues</div>
              <div>• Jobs will automatically process when services recover</div>
              <div>• Check GCP Console for Cloud Run and Pub/Sub status if delays persist</div>
            </div>
          </div>
        )}

        {/* Service Architecture Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Architecture</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Jobs queued in Supabase → Cloud Scheduler → Pub/Sub → Cloud Run</div>
            <div>• Auto-scaling crawler instances process jobs independently</div>
            <div>• Results stored back to Supabase for real-time UI updates</div>
          </div>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{queueStats.running}</div>
            <div className="text-sm text-blue-600">Running</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${potentialCloudRunIssue ? 'bg-amber-50' : 'bg-amber-50'}`}>
            <div className={`text-2xl font-bold ${potentialCloudRunIssue ? 'text-amber-700' : 'text-amber-600'}`}>
              {queueStats.queued}
            </div>
            <div className={`text-sm ${potentialCloudRunIssue ? 'text-amber-700' : 'text-amber-600'}`}>
              Queued
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="p-6">
        {filteredJobs.length > 0 ? (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              {websiteId ? 'Website Jobs' : 'Active Jobs'}
            </h4>
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {getJobTypeLabel(job.type)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.websites?.name || `Website ${job.website_id.slice(-6)}`}
                      </div>
                      {job.status === 'failed' && job.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {job.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {job.status === 'running' && (
                      <div className="text-sm text-gray-600">
                        {job.progress}%
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      {job.status === 'running' && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Cancel job"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {job.status === 'failed' && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Retry job"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No active crawling jobs</p>
            <p className="text-sm mt-1">Jobs will appear here when triggered</p>
          </div>
        )}
      </div>
    </div>
  );
}