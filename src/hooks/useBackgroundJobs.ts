import { useState, useEffect } from 'react';
import { BackgroundJob } from '../types';
import { supabase, getCurrentUser, isSupabaseConfigured } from '../lib/supabase';

// Transform database job to app background job
const transformDatabaseJob = (dbJob: any): BackgroundJob => ({
  id: dbJob.id,
  websiteId: dbJob.website_id,
  type: dbJob.type,
  status: dbJob.status,
  progress: dbJob.progress,
  startedAt: dbJob.started_at ? new Date(dbJob.started_at) : undefined,
  completedAt: dbJob.completed_at ? new Date(dbJob.completed_at) : undefined,
  error: dbJob.error_message || undefined,
});

// Mock jobs for demo mode
const mockJobs: BackgroundJob[] = [
  {
    id: 'demo-1',
    websiteId: 'demo-1',
    type: 'extraction',
    status: 'running',
    progress: 65,
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'demo-2',
    websiteId: 'demo-2',
    type: 'discovery',
    status: 'queued',
    progress: 0,
  },
  {
    id: 'demo-3',
    websiteId: 'demo-1',
    type: 'comparison',
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 90 * 60 * 1000),
  },
];

export function useBackgroundJobs() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load jobs from database or fallback to demo data
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated and Supabase is configured
      const user = await getCurrentUser();
      
      if (user && isSupabaseConfigured()) {
        // Load from database - get jobs for user's websites
        const { data, error: supabaseError } = await supabase
          .from('jobs')
          .select(`
            *,
            websites!inner(user_id)
          `)
          .eq('websites.user_id', user.id)
          .in('status', ['queued', 'running'])
          .order('created_at', { ascending: false })
          .limit(20);

        if (supabaseError) {
          throw supabaseError;
        }

        const transformedJobs = (data || []).map(transformDatabaseJob);
        setJobs(transformedJobs);
      } else {
        // Fallback to demo data for unauthenticated users
        setJobs(mockJobs);
      }
    } catch (err) {
      console.error('Error loading background jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      
      // Fallback to demo data on error
      setJobs(mockJobs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();

    // Set up real-time subscription for job updates if authenticated
    const setupSubscription = async () => {
      const user = await getCurrentUser();
      
      if (user && isSupabaseConfigured()) {
        const subscription = supabase
          .channel('jobs_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'jobs',
            },
            (payload) => {
              console.log('Job update received:', payload);
              loadJobs(); // Reload jobs when changes occur
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    const unsubscribe = setupSubscription();

    // Simulate progress updates for demo mode
    const interval = setInterval(() => {
      setJobs(currentJobs => 
        currentJobs.map(job => {
          if (job.status === 'running' && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 5, 100);
            if (newProgress >= 100) {
              return {
                ...job,
                status: 'completed' as const,
                progress: 100,
                completedAt: new Date(),
              };
            }
            return { ...job, progress: newProgress };
          }
          return job;
        })
      );
    }, 3000);

    return () => {
      clearInterval(interval);
      unsubscribe?.then(cleanup => cleanup?.());
    };
  }, []);

  return { 
    jobs, 
    isLoading, 
    error,
    refreshJobs: loadJobs 
  };
}