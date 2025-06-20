import { useState, useEffect } from 'react';
import { Website, WebsiteSettings } from '../types';
import { defaultSettings } from '../config/defaults';
import { ARCHIVE_RETENTION_DAYS } from '../config/constants';
import { deepMerge } from '../utils/deepMerge';
import { supabase, DatabaseWebsite, getCurrentUser } from '../lib/supabase';

// Transform database website to app website
const transformDatabaseWebsite = (dbWebsite: DatabaseWebsite): Website => ({
  id: dbWebsite.id,
  name: dbWebsite.name,
  url: dbWebsite.url,
  discoveryMethod: dbWebsite.discovery_method,
  status: dbWebsite.status,
  lastScan: new Date(dbWebsite.last_scan),
  nextScan: new Date(dbWebsite.next_scan),
  totalPages: dbWebsite.total_pages,
  changedPages: dbWebsite.changed_pages,
  newPages: dbWebsite.new_pages,
  removedPages: dbWebsite.removed_pages,
  createdAt: new Date(dbWebsite.created_at),
  archivedAt: dbWebsite.archived_at ? new Date(dbWebsite.archived_at) : undefined,
  settings: deepMerge(defaultSettings, dbWebsite.settings || {}),
});

// Transform app website to database website (excluding user_id as it's set by trigger)
const transformToDatabase = (website: Omit<Website, 'id' | 'createdAt'>): Omit<DatabaseWebsite, 'id' | 'created_at' | 'user_id'> => ({
  name: website.name,
  url: website.url,
  discovery_method: website.discoveryMethod,
  status: website.status,
  last_scan: website.lastScan.toISOString(),
  next_scan: website.nextScan.toISOString(),
  total_pages: website.totalPages,
  changed_pages: website.changedPages,
  new_pages: website.newPages,
  removed_pages: website.removedPages,
  archived_at: website.archivedAt?.toISOString() || null,
  settings: website.settings,
});

export function useWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.log('User not authenticated, using demo mode');
        setUser(null);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadWebsites(); // Reload websites when user logs in
        } else {
          setUser(null);
          loadWebsites(); // Load demo data when user logs out
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load websites from Supabase or fallback to demo data
  const loadWebsites = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If user is authenticated, load from database
      if (user) {
        const { data, error: supabaseError } = await supabase
          .from('websites')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        const transformedWebsites = (data || []).map(transformDatabaseWebsite);
        setWebsites(transformedWebsites);
      } else {
        // Fallback to demo data for unauthenticated users
        const demoWebsites: Website[] = [
          {
            id: 'demo-1',
            name: 'E-commerce Store (Demo)',
            url: 'https://shop.example.com',
            discoveryMethod: 'sitemap',
            status: 'active',
            lastScan: new Date(Date.now() - 2 * 60 * 60 * 1000),
            nextScan: new Date(Date.now() + 4 * 60 * 60 * 1000),
            totalPages: 45620,
            changedPages: 234,
            newPages: 18,
            removedPages: 5,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            settings: defaultSettings,
          },
          {
            id: 'demo-2',
            name: 'Corporate Blog (Demo)',
            url: 'https://blog.company.com',
            discoveryMethod: 'crawling',
            status: 'active',
            lastScan: new Date(Date.now() - 6 * 60 * 60 * 1000),
            nextScan: new Date(Date.now() + 18 * 60 * 60 * 1000),
            totalPages: 8943,
            changedPages: 12,
            newPages: 3,
            removedPages: 0,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            settings: defaultSettings,
          },
        ];
        setWebsites(demoWebsites);
      }
    } catch (err) {
      console.error('Error loading websites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load websites');
      
      // Fallback to demo data on error
      const fallbackWebsites: Website[] = [
        {
          id: 'fallback-1',
          name: 'E-commerce Store (Offline)',
          url: 'https://shop.example.com',
          discoveryMethod: 'sitemap',
          status: 'error',
          lastScan: new Date(Date.now() - 2 * 60 * 60 * 1000),
          nextScan: new Date(Date.now() + 4 * 60 * 60 * 1000),
          totalPages: 45620,
          changedPages: 0,
          newPages: 0,
          removedPages: 0,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          settings: defaultSettings,
        },
      ];
      setWebsites(fallbackWebsites);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWebsites();
  }, [user]);

  // Auto-delete archived websites after retention period (only for authenticated users)
  useEffect(() => {
    if (!user) return;

    const checkForExpiredArchives = async () => {
      try {
        const retentionThreshold = new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        
        const { error: deleteError } = await supabase
          .from('websites')
          .delete()
          .eq('status', 'archived')
          .lt('archived_at', retentionThreshold.toISOString());

        if (deleteError) {
          console.error('Error deleting expired archives:', deleteError);
        } else {
          // Reload websites to reflect deletions
          loadWebsites();
        }
      } catch (err) {
        console.error('Error checking for expired archives:', err);
      }
    };

    const interval = setInterval(checkForExpiredArchives, 60 * 60 * 1000); // Check every hour
    checkForExpiredArchives(); // Check immediately

    return () => clearInterval(interval);
  }, [user]);

  const addWebsite = async (website: Omit<Website, 'id' | 'createdAt' | 'settings'>) => {
    try {
      setError(null);
      
      // If not authenticated, show demo behavior
      if (!user) {
        const demoWebsite: Website = {
          ...website,
          id: `demo-${Date.now()}`,
          createdAt: new Date(),
          settings: {
            ...defaultSettings,
            discovery: {
              ...defaultSettings.discovery,
              method: website.discoveryMethod,
            },
          },
        };
        setWebsites(prev => [demoWebsite, ...prev]);
        return demoWebsite;
      }
      
      const newWebsite = {
        ...transformToDatabase({
          ...website,
          settings: {
            ...defaultSettings,
            discovery: {
              ...defaultSettings.discovery,
              method: website.discoveryMethod,
            },
          },
        }),
      };

      const { data, error: supabaseError } = await supabase
        .from('websites')
        .insert([newWebsite])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const transformedWebsite = transformDatabaseWebsite(data);
      setWebsites(prev => [transformedWebsite, ...prev]);
      
      return transformedWebsite;
    } catch (err) {
      console.error('Error adding website:', err);
      setError(err instanceof Error ? err.message : 'Failed to add website');
      throw err;
    }
  };

  const updateWebsite = async (id: string, updates: Partial<Website>) => {
    try {
      setError(null);
      
      // If not authenticated, show demo behavior
      if (!user) {
        setWebsites(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        return;
      }
      
      // Transform updates to database format
      const dbUpdates: Partial<Omit<DatabaseWebsite, 'id' | 'created_at' | 'user_id'>> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.url !== undefined) dbUpdates.url = updates.url;
      if (updates.discoveryMethod !== undefined) dbUpdates.discovery_method = updates.discoveryMethod;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.lastScan !== undefined) dbUpdates.last_scan = updates.lastScan.toISOString();
      if (updates.nextScan !== undefined) dbUpdates.next_scan = updates.nextScan.toISOString();
      if (updates.totalPages !== undefined) dbUpdates.total_pages = updates.totalPages;
      if (updates.changedPages !== undefined) dbUpdates.changed_pages = updates.changedPages;
      if (updates.newPages !== undefined) dbUpdates.new_pages = updates.newPages;
      if (updates.removedPages !== undefined) dbUpdates.removed_pages = updates.removedPages;
      if (updates.archivedAt !== undefined) dbUpdates.archived_at = updates.archivedAt?.toISOString() || null;
      if (updates.settings !== undefined) dbUpdates.settings = updates.settings;

      const { data, error: supabaseError } = await supabase
        .from('websites')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const transformedWebsite = transformDatabaseWebsite(data);
      setWebsites(prev => prev.map(w => w.id === id ? transformedWebsite : w));
      
      return transformedWebsite;
    } catch (err) {
      console.error('Error updating website:', err);
      setError(err instanceof Error ? err.message : 'Failed to update website');
      throw err;
    }
  };

  const updateWebsiteSettings = async (id: string, settings: WebsiteSettings) => {
    return updateWebsite(id, { 
      settings,
      discoveryMethod: settings.discovery.method // Keep discoveryMethod in sync
    });
  };

  const archiveWebsite = async (id: string) => {
    return updateWebsite(id, { 
      status: 'archived', 
      archivedAt: new Date() 
    });
  };

  const unarchiveWebsite = async (id: string) => {
    return updateWebsite(id, { 
      status: 'active', 
      archivedAt: undefined 
    });
  };

  const deleteWebsite = async (id: string) => {
    try {
      setError(null);
      
      // If not authenticated, show demo behavior
      if (!user) {
        setWebsites(prev => prev.filter(w => w.id !== id));
        return;
      }
      
      // Real deletion with database - this will cascade delete all related data
      // due to the foreign key constraints with ON DELETE CASCADE
      const { error: supabaseError } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      // Update local state
      setWebsites(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Error deleting website:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete website');
      throw err;
    }
  };

  const getDaysUntilDeletion = (website: Website): number | null => {
    if (website.status !== 'archived' || !website.archivedAt) return null;
    
    const now = new Date();
    const archiveDate = new Date(website.archivedAt);
    const deletionDate = new Date(archiveDate.getTime() + ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    return Math.max(0, daysLeft);
  };

  return {
    websites,
    isLoading,
    error,
    user,
    addWebsite,
    updateWebsite,
    updateWebsiteSettings,
    archiveWebsite,
    unarchiveWebsite,
    deleteWebsite,
    getDaysUntilDeletion,
    refreshWebsites: loadWebsites,
  };
}