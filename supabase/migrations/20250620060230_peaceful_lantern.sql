-- Add function to increment retry count
CREATE OR REPLACE FUNCTION increment_retry_count(job_id uuid)
RETURNS integer AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT retry_count INTO current_count
  FROM jobs
  WHERE id = job_id;
  
  RETURN COALESCE(current_count, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better job queue performance
CREATE INDEX IF NOT EXISTS idx_jobs_queue_order ON jobs(status, priority DESC, created_at ASC) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_jobs_running ON jobs(status, started_at) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_jobs_cleanup ON jobs(status, completed_at) WHERE status IN ('completed', 'failed');

-- Add function to get job queue statistics
CREATE OR REPLACE FUNCTION get_job_queue_stats()
RETURNS TABLE(
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT j.status, COUNT(*)
  FROM jobs j
  WHERE j.status IN ('queued', 'running', 'failed')
  GROUP BY j.status;
END;
$$ LANGUAGE plpgsql;

-- Add function to clean up old jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs(days_old integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add function to reset stuck jobs
CREATE OR REPLACE FUNCTION reset_stuck_jobs(hours_stuck integer DEFAULT 2)
RETURNS integer AS $$
DECLARE
  reset_count integer;
BEGIN
  UPDATE jobs
  SET status = 'failed',
      completed_at = NOW(),
      error_message = 'Job timed out after ' || hours_stuck || ' hours'
  WHERE status = 'running'
    AND started_at < NOW() - (hours_stuck || ' hours')::interval;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update website next_scan time
CREATE OR REPLACE FUNCTION update_website_next_scan()
RETURNS TRIGGER AS $$
BEGIN
  -- Update next_scan to 6 hours from now when a scan completes
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE websites
    SET next_scan = NOW() + interval '6 hours'
    WHERE id = NEW.website_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_next_scan_trigger
  AFTER UPDATE ON scans
  FOR EACH ROW
  EXECUTE FUNCTION update_website_next_scan();

-- Add materialized view for website statistics (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS website_stats AS
SELECT 
  w.id,
  w.name,
  w.url,
  w.status,
  COUNT(DISTINCT s.id) as total_scans,
  COUNT(DISTINCT p.id) as total_pages,
  MAX(s.completed_at) as last_completed_scan,
  AVG(s.duration) as avg_scan_duration,
  SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as successful_scans,
  SUM(CASE WHEN s.status = 'failed' THEN 1 ELSE 0 END) as failed_scans
FROM websites w
LEFT JOIN scans s ON w.id = s.website_id
LEFT JOIN pages p ON w.id = p.website_id
GROUP BY w.id, w.name, w.url, w.status;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_website_stats_id ON website_stats(id);

-- Add function to refresh website stats
CREATE OR REPLACE FUNCTION refresh_website_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY website_stats;
END;
$$ LANGUAGE plpgsql;