import { supabase } from './supabase';

export class CrawlerService {
  private static instance: CrawlerService;
  
  static getInstance(): CrawlerService {
    if (!CrawlerService.instance) {
      CrawlerService.instance = new CrawlerService();
    }
    return CrawlerService.instance;
  }

  async triggerCrawl(websiteId: string): Promise<string> {
    try {
      // Get website details
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (websiteError || !website) {
        throw new Error(`Website not found: ${websiteError?.message}`);
      }

      // Create a job entry - GCP services will pick this up automatically
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          website_id: websiteId,
          type: 'scan',
          status: 'queued',
          priority: 0,
          progress: 0,
          metadata: {
            discovery_method: website.discovery_method,
            settings: website.settings,
            max_pages: website.settings?.discovery?.crawling?.maxPages || 10000,
            max_depth: website.settings?.discovery?.crawling?.maxDepth || 3
          }
        }])
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      console.log(`Created job ${job.id} for website ${websiteId} - will be processed by GCP services`);
      return job.id;
    } catch (error) {
      console.error('Error triggering crawl:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw new Error(`Failed to get job status: ${error.message}`);
      }

      return job;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .in('status', ['queued', 'running']);

      if (error) {
        throw new Error(`Failed to cancel job: ${error.message}`);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  async getActiveJobs(websiteId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          websites!inner(name, url)
        `)
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false });

      if (websiteId) {
        query = query.eq('website_id', websiteId);
      }

      const { data: jobs, error } = await query;

      if (error) {
        throw new Error(`Failed to get active jobs: ${error.message}`);
      }

      return jobs || [];
    } catch (error) {
      console.error('Error getting active jobs:', error);
      throw error;
    }
  }

  async retryFailedJob(jobId: string): Promise<void> {
    try {
      // Get current retry count
      const { data: currentJob, error: fetchError } = await supabase
        .from('jobs')
        .select('retry_count, max_retries')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch job: ${fetchError.message}`);
      }

      if (currentJob.retry_count >= currentJob.max_retries) {
        throw new Error('Maximum retry attempts exceeded');
      }

      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'queued',
          retry_count: currentJob.retry_count + 1,
          error_message: null,
          started_at: null,
          completed_at: null,
          progress: 0
        })
        .eq('id', jobId)
        .eq('status', 'failed');

      if (error) {
        throw new Error(`Failed to retry job: ${error.message}`);
      }

      console.log(`Job ${jobId} queued for retry (attempt ${currentJob.retry_count + 1}/${currentJob.max_retries})`);
    } catch (error) {
      console.error('Error retrying job:', error);
      throw error;
    }
  }

  async getJobStatsFromDB(): Promise<{ queued: number; running: number; failed: number }> {
    try {
      const { data: stats, error } = await supabase
        .from('jobs')
        .select('status')
        .in('status', ['queued', 'running', 'failed']);

      if (error) {
        throw new Error(`Failed to get job stats: ${error.message}`);
      }

      const counts = { queued: 0, running: 0, failed: 0 };
      
      for (const job of stats || []) {
        counts[job.status as keyof typeof counts]++;
      }

      return counts;
    } catch (error) {
      console.error('Error getting job stats from DB:', error);
      return { queued: 0, running: 0, failed: 0 };
    }
  }
}

export const crawlerService = CrawlerService.getInstance();