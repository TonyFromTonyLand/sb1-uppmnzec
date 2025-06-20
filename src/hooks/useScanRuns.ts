import { useState, useEffect } from 'react';
import { ScanRun } from '../types';
import { defaultSettings } from '../config/defaults';
import { 
  supabase, 
  getCurrentUser, 
  transformDatabaseScan, 
  transformToDatabaseScan,
  isSupabaseConfigured 
} from '../lib/supabase';

// Generate mock URLs for a website scan (used for simulation)
const generateMockUrls = (websiteId: string, totalPages: number): string[] => {
  const baseUrls = [
    '/',
    '/about',
    '/contact',
    '/products',
    '/services',
    '/blog',
    '/support',
    '/privacy',
    '/terms',
    '/sitemap',
    '/products/electronics',
    '/products/clothing',
    '/products/books',
    '/products/home-garden',
    '/products/sports',
    '/categories/new-arrivals',
    '/categories/sale',
    '/categories/featured',
    '/blog/latest-news',
    '/blog/product-updates',
    '/blog/company-news',
    '/blog/tutorials',
    '/support/faq',
    '/support/shipping',
    '/support/returns',
    '/support/contact',
    '/account/profile',
    '/account/orders',
    '/account/wishlist',
    '/checkout',
    '/search',
    '/newsletter',
  ];

  const urls: string[] = [];
  const baseUrl = 'https://example.com';

  // Add base URLs
  baseUrls.forEach(path => {
    urls.push(`${baseUrl}${path}`);
  });

  // Generate additional product/category pages
  for (let i = 1; i <= Math.max(0, totalPages - baseUrls.length); i++) {
    const categories = ['electronics', 'clothing', 'books', 'home-garden', 'sports'];
    const category = categories[i % categories.length];
    
    if (i % 3 === 0) {
      urls.push(`${baseUrl}/products/${category}/item-${i}`);
    } else if (i % 3 === 1) {
      urls.push(`${baseUrl}/blog/post-${i}`);
    } else {
      urls.push(`${baseUrl}/categories/${category}/page-${i}`);
    }
  }

  return urls.slice(0, totalPages);
};

// Generate mock scan runs for demo mode
const generateMockRuns = (websiteId: string): ScanRun[] => {
  const runs: ScanRun[] = [];
  const now = new Date();
  
  // Generate 10 mock runs over the past 30 days
  for (let i = 0; i < 10; i++) {
    const startDate = new Date(now.getTime() - (i * 3 + Math.random() * 2) * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 3600) + 300; // 5 minutes to 1 hour
    const completedAt = new Date(startDate.getTime() + duration * 1000);
    
    const totalPages = Math.floor(Math.random() * 50000) + 10000;
    const newPages = Math.floor(Math.random() * 100);
    const changedPages = Math.floor(Math.random() * 500);
    const removedPages = Math.floor(Math.random() * 50);
    const errorPages = Math.floor(Math.random() * 20);
    
    const scannedUrls = generateMockUrls(websiteId, Math.min(totalPages, 100));
    
    runs.push({
      id: `demo-run-${websiteId}-${i + 1}`,
      websiteId,
      startedAt: startDate,
      completedAt,
      status: i === 0 && Math.random() > 0.7 ? 'running' : 'completed',
      totalPages,
      newPages,
      changedPages,
      removedPages,
      errorPages,
      duration,
      discoveryMethod: Math.random() > 0.5 ? 'sitemap' : 'crawling',
      scannedUrls,
      settings: defaultSettings,
    });
  }
  
  return runs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
};

export function useScanRuns(websiteId: string) {
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load scan runs from database or fallback to demo data
  const loadScanRuns = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated and Supabase is configured
      const user = await getCurrentUser();
      
      if (user && isSupabaseConfigured()) {
        // Load from database
        const { data, error: supabaseError } = await supabase
          .from('scans')
          .select('*')
          .eq('website_id', websiteId)
          .order('started_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        const transformedRuns = (data || []).map(transformDatabaseScan);
        setRuns(transformedRuns);
      } else {
        // Fallback to demo data for unauthenticated users or when Supabase is not configured
        const demoRuns = generateMockRuns(websiteId);
        setRuns(demoRuns);
      }
    } catch (err) {
      console.error('Error loading scan runs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scan runs');
      
      // Fallback to demo data on error
      const fallbackRuns = generateMockRuns(websiteId);
      setRuns(fallbackRuns);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScanRuns();
  }, [websiteId]);

  const triggerScan = async () => {
    try {
      setError(null);
      
      // Check if user is authenticated and Supabase is configured
      const user = await getCurrentUser();
      
      if (!user || !isSupabaseConfigured()) {
        // Demo mode - simulate scan without database
        const newRun: ScanRun = {
          id: `demo-run-${websiteId}-${Date.now()}`,
          websiteId,
          startedAt: new Date(),
          status: 'running',
          totalPages: 0,
          newPages: 0,
          changedPages: 0,
          removedPages: 0,
          errorPages: 0,
          discoveryMethod: 'sitemap',
          scannedUrls: [],
          settings: defaultSettings,
        };

        setRuns(prev => [newRun, ...prev]);

        // Simulate scan completion after 30 seconds
        setTimeout(() => {
          const totalPages = Math.floor(Math.random() * 50000) + 10000;
          const scannedUrls = generateMockUrls(websiteId, Math.min(totalPages, 100));
          
          setRuns(prev => prev.map(run => 
            run.id === newRun.id 
              ? {
                  ...run,
                  status: 'completed' as const,
                  completedAt: new Date(),
                  duration: 30,
                  totalPages,
                  newPages: Math.floor(Math.random() * 100),
                  changedPages: Math.floor(Math.random() * 500),
                  removedPages: Math.floor(Math.random() * 50),
                  errorPages: Math.floor(Math.random() * 20),
                  scannedUrls,
                }
              : run
          ));
        }, 30000);
        
        return;
      }

      // Real scan with database integration - GCP Migration Compatible
      
      // 1. Get website details
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (websiteError) {
        throw new Error(`Failed to fetch website: ${websiteError.message}`);
      }

      if (!website) {
        throw new Error('Website not found');
      }

      // 2. Create a job entry - This will be picked up by GCP services
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          website_id: websiteId,
          type: 'scan',
          status: 'queued', // GCP job publisher will pick this up
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

      // 3. Create a scan entry (will be updated by GCP crawler service)
      const newScanData = transformToDatabaseScan({
        websiteId,
        startedAt: new Date(),
        status: 'running',
        totalPages: 0,
        newPages: 0,
        changedPages: 0,
        removedPages: 0,
        errorPages: 0,
        discoveryMethod: website.discovery_method,
        settings: website.settings,
        scannedUrls: [],
      });

      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert([newScanData])
        .select()
        .single();

      if (scanError) {
        throw new Error(`Failed to create scan: ${scanError.message}`);
      }

      const newRun = transformDatabaseScan(scan);
      setRuns(prev => [newRun, ...prev]);

      // Note: The actual processing will be handled by GCP services
      // The job will be picked up by the job publisher Cloud Function
      // and processed by the Cloud Run crawler service
      
      console.log(`Scan ${scan.id} queued for processing by GCP crawler service`);

    } catch (err) {
      console.error('Error triggering scan:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger scan');
      throw err;
    }
  };

  const deleteScan = async (scanId: string) => {
    try {
      setError(null);
      
      // Check if user is authenticated and Supabase is configured
      const user = await getCurrentUser();
      
      if (!user || !isSupabaseConfigured()) {
        // Demo mode - just remove from local state
        setRuns(prev => prev.filter(run => run.id !== scanId));
        return;
      }

      // Real deletion with database
      const { error: supabaseError } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Update local state
      setRuns(prev => prev.filter(run => run.id !== scanId));
    } catch (err) {
      console.error('Error deleting scan:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete scan');
      throw err;
    }
  };

  return {
    runs,
    isLoading,
    error,
    triggerScan,
    deleteScan,
    refreshRuns: loadScanRuns,
  };
}