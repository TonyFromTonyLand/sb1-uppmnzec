import { createClient } from '@supabase/supabase-js';
import { ScanRun } from '../types';

// Use environment variables or fallback to demo mode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a client even if env vars are missing (for demo mode)
export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co', 
  supabaseAnonKey || 'demo-key'
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://demo.supabase.co' && 
    supabaseAnonKey !== 'demo-key');
};

// Database types
export interface DatabaseWebsite {
  id: string;
  user_id: string;
  name: string;
  url: string;
  discovery_method: 'sitemap' | 'crawling';
  status: 'active' | 'paused' | 'error' | 'archived';
  last_scan: string;
  next_scan: string;
  total_pages: number;
  changed_pages: number;
  new_pages: number;
  removed_pages: number;
  created_at: string;
  archived_at: string | null;
  settings: any;
}

export interface DatabasePage {
  id: string;
  website_id: string;
  url: string;
  content_hash: string | null;
  status: 'active' | 'removed' | 'error';
  title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  response_code: number | null;
  load_time: number | null;
  last_seen: string;
  first_seen: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseScan {
  id: string;
  website_id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  total_pages: number;
  new_pages: number;
  changed_pages: number;
  removed_pages: number;
  error_pages: number;
  duration: number | null;
  discovery_method: 'sitemap' | 'crawling';
  settings: any;
  summary: any;
  error_message: string | null;
  scanned_urls: string[] | null;
  created_at: string;
}

export interface DatabaseScanComparison {
  id: string;
  website_id: string;
  base_scan_id: string;
  compare_scan_id: string;
  comparison_data: any;
  summary: any;
  created_at: string;
}

export interface DatabaseJob {
  id: string;
  website_id: string;
  type: 'discovery' | 'extraction' | 'comparison' | 'cleanup' | 'scan';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  scheduled_for: string | null;
  retry_count: number;
  max_retries: number;
  metadata: any;
  result: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabasePageSnapshot {
  id: string;
  scan_id: string;
  page_id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  breadcrumbs: string[] | null;
  headers: any;
  custom_data: any;
  content_hash: string | null;
  response_code: number | null;
  load_time: number | null;
  extraction_config_used: string | null;
  created_at: string;
}

// Helper function to get current user
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Don't throw for auth errors - just return null
      console.debug('No authenticated user:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.debug('Error getting current user:', error);
    return null;
  }
};

// Helper function to ensure user is authenticated
export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};

// Transform database scan to app scan run
export const transformDatabaseScan = (dbScan: DatabaseScan): ScanRun => ({
  id: dbScan.id,
  websiteId: dbScan.website_id,
  startedAt: new Date(dbScan.started_at),
  completedAt: dbScan.completed_at ? new Date(dbScan.completed_at) : undefined,
  status: dbScan.status,
  totalPages: dbScan.total_pages,
  newPages: dbScan.new_pages,
  changedPages: dbScan.changed_pages,
  removedPages: dbScan.removed_pages,
  errorPages: dbScan.error_pages,
  duration: dbScan.duration || undefined,
  discoveryMethod: dbScan.discovery_method,
  settings: dbScan.settings,
  error: dbScan.error_message || undefined,
  scannedUrls: dbScan.scanned_urls || [],
});

// Transform app scan run to database scan (for inserts/updates)
export const transformToDatabaseScan = (scanRun: Omit<ScanRun, 'id'>): Omit<DatabaseScan, 'id' | 'created_at'> => ({
  website_id: scanRun.websiteId,
  started_at: scanRun.startedAt.toISOString(),
  completed_at: scanRun.completedAt?.toISOString() || null,
  status: scanRun.status,
  total_pages: scanRun.totalPages,
  new_pages: scanRun.newPages,
  changed_pages: scanRun.changedPages,
  removed_pages: scanRun.removedPages,
  error_pages: scanRun.errorPages,
  duration: scanRun.duration || null,
  discovery_method: scanRun.discoveryMethod,
  settings: scanRun.settings,
  summary: {},
  error_message: scanRun.error || null,
  scanned_urls: scanRun.scannedUrls || null,
});

// Test database connection
export const testConnection = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('websites')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
};