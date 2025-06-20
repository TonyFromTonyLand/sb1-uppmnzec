import React from 'react';
import { BackgroundJob } from '../../types';
import { Clock, CheckCircle, AlertCircle, Loader2, XCircle, RotateCcw } from 'lucide-react';
import { useCrawlerService } from '../../hooks/useCrawlerService';

interface CurrentJobActivityProps {
  jobs: BackgroundJob[];
}

export function CurrentJobActivity({ jobs }: CurrentJobActivityProps) {
  const { cancelJob, retryJob } = useCrawlerService();

  const getStatusIcon = (status: BackgroundJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-amber-500" />;
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

  const getJobTypeLabel = (type: BackgroundJob['type']) => {
    switch (type) {
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

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryJob(jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
        <p className="text-gray-500">No background jobs are currently running.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Current Job Activity</h2>
        <p className="text-sm text-gray-500">Monitor processing tasks and their progress</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {jobs.map((job) => (
          <div key={job.id} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(job.status)}
                <div>
                  <h3 className="font-medium text-gray-900">{getJobTypeLabel(job.type)}</h3>
                  <p className="text-sm text-gray-500">Website ID: {job.websiteId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {job.status}
                  </div>
                  {job.startedAt && (
                    <div className="text-xs text-gray-500">
                      Started {job.startedAt.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-1">
                  {job.status === 'running' && (
                    <button
                      onClick={() => handleCancelJob(job.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Cancel job"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  
                  {job.status === 'failed' && (
                    <button
                      onClick={() => handleRetryJob(job.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Retry job"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {job.status === 'running' && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(job.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {job.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{job.error}</p>
                <div className="mt-2 text-xs text-red-500">
                  Job failed and can be retried using the retry button above
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}