/*
  # Complete Database Schema for Website Monitoring System

  1. Tables
    - websites: Website metadata linked to users
    - pages: Individual pages of websites
    - scans: Scan runs for websites
    - scan_comparisons: Comparisons between scan results
    - jobs: Background tasks and jobs

  2. Security
    - Row Level Security (RLS) enabled on all tables
    - Policies enforce user ownership via auth.uid()
    - Users managed by Supabase Auth
*/

-- Drop existing websites table if it exists
DROP TABLE IF EXISTS websites CASCADE;

-- Create websites table with user ownership
CREATE TABLE IF NOT EXISTS websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  discovery_method text NOT NULL CHECK (discovery_method IN ('sitemap', 'crawling')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'archived')),
  last_scan timestamptz NOT NULL DEFAULT now(),
  next_scan timestamptz NOT NULL DEFAULT now() + interval '6 hours',
  total_pages integer NOT NULL DEFAULT 0,
  changed_pages integer NOT NULL DEFAULT 0,
  new_pages integer NOT NULL DEFAULT 0,
  removed_pages integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  content_hash text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed', 'error')),
  title text,
  meta_description text,
  canonical_url text,
  response_code integer,
  load_time integer, -- in milliseconds
  last_seen timestamptz NOT NULL DEFAULT now(),
  first_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique URL per website
  UNIQUE(website_id, url)
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  total_pages integer NOT NULL DEFAULT 0,
  new_pages integer NOT NULL DEFAULT 0,
  changed_pages integer NOT NULL DEFAULT 0,
  removed_pages integer NOT NULL DEFAULT 0,
  error_pages integer NOT NULL DEFAULT 0,
  duration integer, -- in seconds
  discovery_method text NOT NULL CHECK (discovery_method IN ('sitemap', 'crawling')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb DEFAULT '{}'::jsonb,
  error_message text,
  scanned_urls text[], -- Array of URLs that were scanned
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create scan_comparisons table
CREATE TABLE IF NOT EXISTS scan_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  base_scan_id uuid REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  compare_scan_id uuid REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  comparison_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique comparison pairs
  UNIQUE(base_scan_id, compare_scan_id)
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('discovery', 'extraction', 'comparison', 'cleanup', 'scan')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  priority integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  scheduled_for timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  metadata jsonb DEFAULT '{}'::jsonb,
  result jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create page_snapshots table for detailed page data
CREATE TABLE IF NOT EXISTS page_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text,
  meta_description text,
  canonical_url text,
  breadcrumbs text[],
  headers jsonb DEFAULT '[]'::jsonb,
  custom_data jsonb DEFAULT '{}'::jsonb,
  content_hash text,
  response_code integer,
  load_time integer, -- in milliseconds
  extraction_config_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_next_scan ON websites(next_scan);

CREATE INDEX IF NOT EXISTS idx_pages_website_id ON pages(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_url ON pages(url);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_last_seen ON pages(last_seen);

CREATE INDEX IF NOT EXISTS idx_scans_website_id ON scans(website_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_started_at ON scans(started_at);

CREATE INDEX IF NOT EXISTS idx_scan_comparisons_website_id ON scan_comparisons(website_id);
CREATE INDEX IF NOT EXISTS idx_scan_comparisons_base_scan ON scan_comparisons(base_scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_comparisons_compare_scan ON scan_comparisons(compare_scan_id);

CREATE INDEX IF NOT EXISTS idx_jobs_website_id ON jobs(website_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_for ON jobs(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_page_snapshots_scan_id ON page_snapshots(scan_id);
CREATE INDEX IF NOT EXISTS idx_page_snapshots_page_id ON page_snapshots(page_id);

-- Enable Row Level Security on all tables
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for websites table
CREATE POLICY "Users can view own websites"
  ON websites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own websites"
  ON websites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites"
  ON websites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites"
  ON websites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for pages table
CREATE POLICY "Users can view pages of own websites"
  ON pages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = pages.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages for own websites"
  ON pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = pages.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages of own websites"
  ON pages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = pages.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = pages.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages of own websites"
  ON pages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = pages.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- RLS Policies for scans table
CREATE POLICY "Users can view scans of own websites"
  ON scans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scans.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scans for own websites"
  ON scans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scans.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scans of own websites"
  ON scans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scans.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scans.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scans of own websites"
  ON scans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scans.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_comparisons table
CREATE POLICY "Users can view comparisons of own websites"
  ON scan_comparisons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scan_comparisons.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comparisons for own websites"
  ON scan_comparisons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scan_comparisons.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update comparisons of own websites"
  ON scan_comparisons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scan_comparisons.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scan_comparisons.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete comparisons of own websites"
  ON scan_comparisons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = scan_comparisons.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- RLS Policies for jobs table
CREATE POLICY "Users can view jobs of own websites"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = jobs.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert jobs for own websites"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = jobs.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update jobs of own websites"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = jobs.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = jobs.website_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete jobs of own websites"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = jobs.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- RLS Policies for page_snapshots table
CREATE POLICY "Users can view snapshots of own websites"
  ON page_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN websites ON websites.id = scans.website_id
      WHERE scans.id = page_snapshots.scan_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert snapshots for own websites"
  ON page_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN websites ON websites.id = scans.website_id
      WHERE scans.id = page_snapshots.scan_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update snapshots of own websites"
  ON page_snapshots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN websites ON websites.id = scans.website_id
      WHERE scans.id = page_snapshots.scan_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN websites ON websites.id = scans.website_id
      WHERE scans.id = page_snapshots.scan_id 
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete snapshots of own websites"
  ON page_snapshots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN websites ON websites.id = scans.website_id
      WHERE scans.id = page_snapshots.scan_id 
      AND websites.user_id = auth.uid()
    )
  );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set user_id on website insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically set user_id
CREATE TRIGGER set_website_user_id 
  BEFORE INSERT ON websites 
  FOR EACH ROW 
  EXECUTE FUNCTION set_user_id();