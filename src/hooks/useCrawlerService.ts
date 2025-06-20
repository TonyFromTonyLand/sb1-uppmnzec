import { useState, useEffect } from 'react';
import { crawlerService } from '../lib/crawlerService';

export function useCrawlerService() {
  const [queueStats, setQueueStats] = useState({ queued: 0, running: 0, failed: 0 });
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueueStats = async () => {
    try {
      const stats = await crawlerService.getJobStatsFromDB();
      setQueueStats(stats);
    } catch (error) {
      console.error('Failed to load job stats from DB:', error);
    }
  };

  const loadActiveJobs = async () => {
    try {
      const jobs = await crawlerService.getActiveJobs();
      setActiveJobs(jobs);
    } catch (error) {
      console.error('Failed to load active jobs:', error);
    }
  };

  const triggerCrawl = async (websiteId: string): Promise<string> => {
    try {
      const jobId = await crawlerService.triggerCrawl(websiteId);
      // Refresh data after triggering
      await Promise.all([loadQueueStats(), loadActiveJobs()]);
      return jobId;
    } catch (error) {
      console.error('Failed to trigger crawl:', error);
      throw error;
    }
  };

  const cancelJob = async (jobId: string): Promise<void> => {
    try {
      await crawlerService.cancelJob(jobId);
      // Refresh data after cancelling
      await Promise.all([loadQueueStats(), loadActiveJobs()]);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  };

  const retryJob = async (jobId: string): Promise<void> => {
    try {
      await crawlerService.retryFailedJob(jobId);
      // Refresh data after retrying
      await Promise.all([loadQueueStats(), loadActiveJobs()]);
    } catch (error) {
      console.error('Failed to retry job:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadQueueStats(),
        loadActiveJobs()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Set up periodic refresh every 10 seconds
    const interval = setInterval(() => {
      loadQueueStats();
      loadActiveJobs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    queueStats,
    activeJobs,
    isLoading,
    triggerCrawl,
    cancelJob,
    retryJob,
    refreshData
  };
}