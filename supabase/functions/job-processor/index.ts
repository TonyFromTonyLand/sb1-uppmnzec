import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

class JobProcessor {
  private isProcessing = false
  private maxConcurrentJobs = 3
  private activeJobs = new Set<string>()

  async processQueuedJobs(): Promise<void> {
    if (this.isProcessing) {
      console.log('Job processing already in progress')
      return
    }

    this.isProcessing = true
    console.log('Starting job queue processing...')

    try {
      while (this.activeJobs.size < this.maxConcurrentJobs) {
        // Get next queued job
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'queued')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1)

        if (error) {
          console.error('Error fetching jobs:', error)
          break
        }

        if (!jobs || jobs.length === 0) {
          console.log('No queued jobs found')
          break
        }

        const job = jobs[0]
        
        // Mark job as running
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString(),
            progress: 0
          })
          .eq('id', job.id)

        if (updateError) {
          console.error('Error updating job status:', updateError)
          continue
        }

        // Process job asynchronously
        this.processJobAsync(job)
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async processJobAsync(job: any): Promise<void> {
    this.activeJobs.add(job.id)
    console.log(`Processing job ${job.id} of type ${job.type}`)

    try {
      // Call the crawler service
      const crawlerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crawler-service`
      
      const response = await fetch(crawlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          action: 'process_job',
          jobId: job.id
        })
      })

      if (!response.ok) {
        throw new Error(`Crawler service responded with ${response.status}`)
      }

      const result = await response.json()
      console.log(`Job ${job.id} completed successfully:`, result)

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      
      // Update job as failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', job.id)
    } finally {
      this.activeJobs.delete(job.id)
    }
  }

  async cleanupOldJobs(): Promise<void> {
    console.log('Cleaning up old completed jobs...')
    
    try {
      // Delete completed jobs older than 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('completed_at', thirtyDaysAgo.toISOString())

      if (error) {
        console.error('Error cleaning up old jobs:', error)
      } else {
        console.log('Old jobs cleaned up successfully')
      }
    } catch (error) {
      console.error('Error during job cleanup:', error)
    }
  }

  async resetStuckJobs(): Promise<void> {
    console.log('Checking for stuck jobs...')
    
    try {
      // Reset jobs that have been running for more than 2 hours
      const twoHoursAgo = new Date()
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

      const { data: stuckJobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id')
        .eq('status', 'running')
        .lt('started_at', twoHoursAgo.toISOString())

      if (fetchError) {
        console.error('Error fetching stuck jobs:', fetchError)
        return
      }

      if (stuckJobs && stuckJobs.length > 0) {
        console.log(`Found ${stuckJobs.length} stuck jobs, resetting...`)
        
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Job timed out after 2 hours'
          })
          .in('id', stuckJobs.map(job => job.id))

        if (updateError) {
          console.error('Error resetting stuck jobs:', updateError)
        } else {
          console.log('Stuck jobs reset successfully')
        }
      }
    } catch (error) {
      console.error('Error during stuck job reset:', error)
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const processor = new JobProcessor()
    
    if (req.method === 'POST') {
      const { action } = await req.json()
      
      switch (action) {
        case 'process_queue':
          await processor.processQueuedJobs()
          return new Response(
            JSON.stringify({ success: true, message: 'Job queue processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
          
        case 'cleanup':
          await processor.cleanupOldJobs()
          return new Response(
            JSON.stringify({ success: true, message: 'Cleanup completed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
          
        case 'reset_stuck':
          await processor.resetStuckJobs()
          return new Response(
            JSON.stringify({ success: true, message: 'Stuck jobs reset' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
          
        default:
          return new Response(
            JSON.stringify({ error: 'Unknown action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    if (req.method === 'GET') {
      // Health check and status endpoint
      const { data: queuedJobs } = await supabase
        .from('jobs')
        .select('count')
        .eq('status', 'queued')

      const { data: runningJobs } = await supabase
        .from('jobs')
        .select('count')
        .eq('status', 'running')

      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'job-processor',
          queue_stats: {
            queued: queuedJobs?.[0]?.count || 0,
            running: runningJobs?.[0]?.count || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Job processor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})