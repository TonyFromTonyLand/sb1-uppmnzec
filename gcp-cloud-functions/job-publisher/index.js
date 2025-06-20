const { createClient } = require('@supabase/supabase-js');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Pub/Sub client
const pubsub = new PubSub();
const topicName = process.env.PUBSUB_TOPIC || 'crawl-jobs';

/**
 * Cloud Function to publish queued jobs to Pub/Sub
 * Triggered by Cloud Scheduler
 */
exports.publishJobs = async (req, res) => {
  console.log('Job publisher function triggered');
  
  try {
    // Get queued jobs from Supabase
    const { data: queuedJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, website_id, type, metadata')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(50); // Process up to 50 jobs at once

    if (fetchError) {
      throw new Error(`Failed to fetch queued jobs: ${fetchError.message}`);
    }

    if (!queuedJobs || queuedJobs.length === 0) {
      console.log('No queued jobs found');
      return res.status(200).json({ 
        success: true, 
        message: 'No queued jobs to process',
        jobsProcessed: 0 
      });
    }

    console.log(`Found ${queuedJobs.length} queued jobs`);

    // Publish jobs to Pub/Sub and update their status
    const publishPromises = queuedJobs.map(async (job) => {
      try {
        // Publish to Pub/Sub
        const message = {
          jobId: job.id,
          websiteId: job.website_id,
          type: job.type,
          metadata: job.metadata,
          timestamp: new Date().toISOString()
        };

        const dataBuffer = Buffer.from(JSON.stringify(message));
        await pubsub.topic(topicName).publishMessage({ data: dataBuffer });

        // Update job status to running
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString(),
            progress: 0
          })
          .eq('id', job.id)
          .eq('status', 'queued'); // Only update if still queued

        if (updateError) {
          console.error(`Failed to update job ${job.id}:`, updateError);
          return { success: false, jobId: job.id, error: updateError.message };
        }

        console.log(`Published job ${job.id} to Pub/Sub`);
        return { success: true, jobId: job.id };

      } catch (error) {
        console.error(`Failed to publish job ${job.id}:`, error);
        return { success: false, jobId: job.id, error: error.message };
      }
    });

    const results = await Promise.all(publishPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Job publishing completed: ${successful} successful, ${failed} failed`);

    res.status(200).json({
      success: true,
      message: 'Job publishing completed',
      jobsProcessed: queuedJobs.length,
      successful,
      failed,
      results: results.filter(r => !r.success) // Only return failed jobs for debugging
    });

  } catch (error) {
    console.error('Job publisher error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

    // Test Pub/Sub connection
    const topic = pubsub.topic(topicName);
    const [exists] = await topic.exists();
    
    if (!exists) {
      throw new Error(`Pub/Sub topic ${topicName} does not exist`);
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'job-publisher',
      supabase: 'connected',
      pubsub: 'connected'
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