const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Cloud Function for job maintenance tasks
 * Triggered by Cloud Scheduler
 */
exports.maintainJobs = async (req, res) => {
  console.log('Job maintenance function triggered');
  
  try {
    const results = {
      stuckJobsReset: 0,
      oldJobsDeleted: 0,
      errors: []
    };

    // 1. Reset stuck jobs (running for more than 2 hours)
    try {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const { data: stuckJobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id')
        .eq('status', 'running')
        .lt('started_at', twoHoursAgo.toISOString());

      if (fetchError) {
        throw new Error(`Failed to fetch stuck jobs: ${fetchError.message}`);
      }

      if (stuckJobs && stuckJobs.length > 0) {
        console.log(`Found ${stuckJobs.length} stuck jobs, resetting...`);
        
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Job timed out after 2 hours'
          })
          .in('id', stuckJobs.map(job => job.id));

        if (updateError) {
          throw new Error(`Failed to reset stuck jobs: ${updateError.message}`);
        }

        results.stuckJobsReset = stuckJobs.length;
        console.log(`Reset ${stuckJobs.length} stuck jobs`);
      }
    } catch (error) {
      console.error('Error resetting stuck jobs:', error);
      results.errors.push(`Stuck jobs reset failed: ${error.message}`);
    }

    // 2. Delete old completed/failed jobs (older than 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: oldJobs, error: fetchOldError } = await supabase
        .from('jobs')
        .select('id')
        .in('status', ['completed', 'failed'])
        .lt('completed_at', thirtyDaysAgo.toISOString());

      if (fetchOldError) {
        throw new Error(`Failed to fetch old jobs: ${fetchOldError.message}`);
      }

      if (oldJobs && oldJobs.length > 0) {
        console.log(`Found ${oldJobs.length} old jobs, deleting...`);
        
        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .in('id', oldJobs.map(job => job.id));

        if (deleteError) {
          throw new Error(`Failed to delete old jobs: ${deleteError.message}`);
        }

        results.oldJobsDeleted = oldJobs.length;
        console.log(`Deleted ${oldJobs.length} old jobs`);
      }
    } catch (error) {
      console.error('Error deleting old jobs:', error);
      results.errors.push(`Old jobs cleanup failed: ${error.message}`);
    }

    // 3. Update website statistics (refresh materialized view if exists)
    try {
      const { error: refreshError } = await supabase.rpc('refresh_website_stats');
      if (refreshError && !refreshError.message.includes('does not exist')) {
        console.error('Failed to refresh website stats:', refreshError);
        results.errors.push(`Website stats refresh failed: ${refreshError.message}`);
      } else if (!refreshError) {
        console.log('Website statistics refreshed');
      }
    } catch (error) {
      console.error('Error refreshing website stats:', error);
      results.errors.push(`Website stats refresh failed: ${error.message}`);
    }

    console.log('Job maintenance completed:', results);

    res.status(200).json({
      success: true,
      message: 'Job maintenance completed',
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Job maintenance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Health check endpoint
 */
exports.healthCheck = async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'job-maintenance',
      supabase: 'connected'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};