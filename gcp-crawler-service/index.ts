import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CrawlJob {
  id: string
  website_id: string
  type: 'discovery' | 'extraction' | 'scan'
  status: 'queued' | 'running' | 'completed' | 'failed'
  metadata: {
    discovery_method: 'sitemap' | 'crawling'
    settings: any
    max_pages?: number
    max_depth?: number
  }
}

interface CrawlResult {
  url: string
  title?: string
  meta_description?: string
  canonical_url?: string
  breadcrumbs: string[]
  headers: Array<{ level: number; text: string }>
  custom_data: Record<string, any>
  response_code: number
  load_time: number
  content_hash: string
}

class RobustCrawler {
  private supabase: any
  private userAgent: string
  private maxConcurrency: number
  private crawlDelay: number
  private timeout: number
  private retryAttempts: number

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    this.userAgent = 'WebMonitor-Crawler/1.0 (+https://webmonitor.app)'
    this.maxConcurrency = parseInt(Deno.env.get('MAX_CONCURRENCY') ?? '20')
    this.crawlDelay = parseInt(Deno.env.get('CRAWL_DELAY') ?? '500')
    this.timeout = parseInt(Deno.env.get('REQUEST_TIMEOUT') ?? '30000')
    this.retryAttempts = parseInt(Deno.env.get('RETRY_ATTEMPTS') ?? '3')
  }

  async processJob(jobId: string): Promise<void> {
    console.log(`Processing job ${jobId}`)
    
    try {
      // Get job from database
      const { data: job, error: jobError } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new Error(`Job not found: ${jobError?.message}`)
      }

      // Update job status to running
      await this.updateJobStatus(jobId, 'running', 0)

      // Get website details
      const { data: website, error: websiteError } = await this.supabase
        .from('websites')
        .select('*')
        .eq('id', job.website_id)
        .single()

      if (websiteError || !website) {
        throw new Error(`Website not found: ${websiteError?.message}`)
      }

      // Create scan record
      const { data: scan, error: scanError } = await this.supabase
        .from('scans')
        .insert([{
          website_id: job.website_id,
          started_at: new Date().toISOString(),
          status: 'running',
          discovery_method: job.metadata.discovery_method,
          settings: job.metadata.settings
        }])
        .select()
        .single()

      if (scanError) {
        throw new Error(`Failed to create scan: ${scanError.message}`)
      }

      let urls: string[] = []

      // Discover URLs based on method
      if (job.metadata.discovery_method === 'sitemap') {
        urls = await this.discoverFromSitemap(website, job.metadata.settings)
      } else {
        urls = await this.discoverFromCrawling(website, job.metadata.settings)
      }

      console.log(`Discovered ${urls.length} URLs for ${website.url}`)
      
      // Update progress
      await this.updateJobStatus(jobId, 'running', 25)

      // Process URLs in batches
      const results = await this.processUrlsBatch(urls, job.metadata.settings, jobId, scan.id)
      
      // Update progress
      await this.updateJobStatus(jobId, 'running', 75)

      // Save results to database
      await this.saveResults(scan.id, website.id, results)

      // Update scan completion
      const duration = Math.floor((Date.now() - new Date(scan.started_at).getTime()) / 1000)
      await this.supabase
        .from('scans')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration,
          total_pages: results.length,
          new_pages: results.filter(r => r.response_code === 200).length,
          error_pages: results.filter(r => r.response_code >= 400).length,
          scanned_urls: urls.slice(0, 1000) // Limit stored URLs
        })
        .eq('id', scan.id)

      // Update website metrics
      await this.supabase
        .from('websites')
        .update({
          last_scan: new Date().toISOString(),
          total_pages: results.length,
          new_pages: results.filter(r => r.response_code === 200).length
        })
        .eq('id', website.id)

      // Complete job
      await this.updateJobStatus(jobId, 'completed', 100, {
        scan_id: scan.id,
        total_pages: results.length,
        duration
      })

      console.log(`Job ${jobId} completed successfully`)

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error)
      await this.updateJobStatus(jobId, 'failed', 0, null, error.message)
    }
  }

  private async discoverFromSitemap(website: any, settings: any): Promise<string[]> {
    const urls: string[] = []
    const sitemapSettings = settings.discovery?.sitemap || {}
    
    // Get sitemap URLs from settings
    const sitemapUrls = sitemapSettings.urls || []
    
    if (sitemapUrls.length === 0 && sitemapSettings.autoDetect) {
      // Try common sitemap locations
      const commonPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemaps.xml']
      for (const path of commonPaths) {
        sitemapUrls.push({
          url: new URL(path, website.url).toString(),
          enabled: true
        })
      }
    }

    for (const sitemapConfig of sitemapUrls) {
      if (!sitemapConfig.enabled) continue
      
      try {
        const sitemapUrls = await this.parseSitemap(sitemapConfig.url, sitemapSettings)
        urls.push(...sitemapUrls)
      } catch (error) {
        console.error(`Failed to parse sitemap ${sitemapConfig.url}:`, error)
      }
    }

    return [...new Set(urls)] // Remove duplicates
  }

  private async parseSitemap(sitemapUrl: string, settings: any): Promise<string[]> {
    const urls: string[] = []
    
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const content = await response.text()
      
      // Check if it's a sitemap index
      if (content.includes('<sitemapindex')) {
        if (settings.followSitemapIndex) {
          const sitemapMatches = content.matchAll(/<loc>(.*?)<\/loc>/g)
          for (const match of sitemapMatches) {
            const childSitemapUrls = await this.parseSitemap(match[1], settings)
            urls.push(...childSitemapUrls)
          }
        }
      } else {
        // Regular sitemap
        const urlMatches = content.matchAll(/<loc>(.*?)<\/loc>/g)
        for (const match of urlMatches) {
          urls.push(match[1])
        }
      }
    } catch (error) {
      console.error(`Error parsing sitemap ${sitemapUrl}:`, error)
    }

    return urls
  }

  private async discoverFromCrawling(website: any, settings: any): Promise<string[]> {
    const crawlSettings = settings.discovery?.crawling || {}
    const maxDepth = crawlSettings.maxDepth || 3
    const maxPages = crawlSettings.maxPages || 10000
    const includePatterns = crawlSettings.includePatterns || []
    const excludePatterns = crawlSettings.excludePatterns || []
    
    const discovered = new Set<string>()
    const queue: Array<{ url: string; depth: number }> = [{ url: website.url, depth: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0 && discovered.size < maxPages) {
      const batch = queue.splice(0, this.maxConcurrency)
      
      const promises = batch.map(async ({ url, depth }) => {
        if (visited.has(url) || depth > maxDepth) return []
        
        visited.add(url)
        
        try {
          // Check include/exclude patterns
          if (!this.matchesPatterns(url, includePatterns, excludePatterns)) {
            return []
          }

          const response = await fetch(url, {
            headers: { 'User-Agent': this.userAgent },
            signal: AbortSignal.timeout(this.timeout)
          })

          if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
            return []
          }

          discovered.add(url)
          
          if (depth < maxDepth) {
            const html = await response.text()
            const links = this.extractLinks(html, url)
            
            return links
              .filter(link => !visited.has(link))
              .map(link => ({ url: link, depth: depth + 1 }))
          }
        } catch (error) {
          console.error(`Error crawling ${url}:`, error)
        }
        
        return []
      })

      const results = await Promise.all(promises)
      for (const newUrls of results) {
        queue.push(...newUrls)
      }

      // Respect crawl delay
      if (crawlSettings.crawlDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, crawlSettings.crawlDelay))
      }
    }

    return Array.from(discovered)
  }

  private matchesPatterns(url: string, includePatterns: any[], excludePatterns: string[]): boolean {
    // Check exclude patterns first
    for (const pattern of excludePatterns) {
      if (this.matchesPattern(url, pattern)) {
        return false
      }
    }

    // If no include patterns, include by default
    if (includePatterns.length === 0) {
      return true
    }

    // Check include patterns
    for (const patternConfig of includePatterns) {
      if (patternConfig.enabled && this.matchesPattern(url, patternConfig.pattern)) {
        return true
      }
    }

    return false
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    return new RegExp(regexPattern).test(url)
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = []
    const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)
    
    for (const match of linkMatches) {
      try {
        const url = new URL(match[1], baseUrl).toString()
        links.push(url)
      } catch {
        // Invalid URL, skip
      }
    }

    return links
  }

  private async processUrlsBatch(
    urls: string[], 
    settings: any, 
    jobId: string, 
    scanId: string
  ): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []
    const total = urls.length
    let processed = 0

    // Process in batches to avoid overwhelming the target server
    for (let i = 0; i < urls.length; i += this.maxConcurrency) {
      const batch = urls.slice(i, i + this.maxConcurrency)
      
      const batchPromises = batch.map(url => this.processUrl(url, settings))
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value)
        }
        processed++
      }

      // Update progress
      const progress = Math.floor((processed / total) * 50) + 25 // 25-75% range
      await this.updateJobStatus(jobId, 'running', progress)

      // Respect crawl delay between batches
      if (i + this.maxConcurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, this.crawlDelay))
      }
    }

    return results
  }

  private async processUrl(url: string, settings: any): Promise<CrawlResult | null> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(url, {
        headers: { 
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      const loadTime = Date.now() - startTime
      
      if (!response.ok) {
        return {
          url,
          response_code: response.status,
          load_time: loadTime,
          breadcrumbs: [],
          headers: [],
          custom_data: {},
          content_hash: ''
        }
      }

      const html = await response.text()
      const contentHash = await this.generateContentHash(html)
      
      // Extract data based on extraction settings
      const extractionConfig = settings.extraction?.defaultConfig || {}
      
      return {
        url,
        title: extractionConfig.title ? this.extractTitle(html) : undefined,
        meta_description: extractionConfig.metaDescription ? this.extractMetaDescription(html) : undefined,
        canonical_url: extractionConfig.canonicalUrl ? this.extractCanonicalUrl(html) : undefined,
        breadcrumbs: extractionConfig.navigation?.breadcrumbs?.enabled ? this.extractBreadcrumbs(html) : [],
        headers: extractionConfig.headers?.enabled ? this.extractHeaders(html, extractionConfig.headers) : [],
        custom_data: this.extractCustomData(html, extractionConfig),
        response_code: response.status,
        load_time: loadTime,
        content_hash: contentHash
      }
    } catch (error) {
      console.error(`Error processing ${url}:`, error)
      return {
        url,
        response_code: 0,
        load_time: Date.now() - startTime,
        breadcrumbs: [],
        headers: [],
        custom_data: {},
        content_hash: ''
      }
    }
  }

  private async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>(.*?)<\/title>/i)
    return match ? match[1].trim() : undefined
  }

  private extractMetaDescription(html: string): string | undefined {
    const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    return match ? match[1].trim() : undefined
  }

  private extractCanonicalUrl(html: string): string | undefined {
    const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    return match ? match[1].trim() : undefined
  }

  private extractBreadcrumbs(html: string): string[] {
    const breadcrumbs: string[] = []
    
    // Try JSON-LD structured data first
    const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1])
        if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
          for (const item of data.itemListElement) {
            if (item.name) {
              breadcrumbs.push(item.name)
            }
          }
          if (breadcrumbs.length > 0) return breadcrumbs
        }
      } catch {
        // Invalid JSON, continue
      }
    }

    // Fallback to common breadcrumb selectors
    const selectors = [
      '.breadcrumb',
      '.breadcrumbs',
      '[aria-label="breadcrumb"]',
      '.nav-breadcrumb'
    ]

    for (const selector of selectors) {
      const regex = new RegExp(`<[^>]+class=["'][^"']*${selector.slice(1)}[^"']*["'][^>]*>(.*?)</[^>]+>`, 'is')
      const match = html.match(regex)
      if (match) {
        const textMatches = match[1].matchAll(/>([^<]+)</g)
        for (const textMatch of textMatches) {
          const text = textMatch[1].trim()
          if (text && !text.match(/^[>\s]*$/)) {
            breadcrumbs.push(text)
          }
        }
        if (breadcrumbs.length > 0) break
      }
    }

    return breadcrumbs
  }

  private extractHeaders(html: string, config: any): Array<{ level: number; text: string }> {
    const headers: Array<{ level: number; text: string }> = []
    const levels = config.levels || [1, 2, 3]
    const maxLength = config.maxLength || 200

    for (const level of levels) {
      const regex = new RegExp(`<h${level}[^>]*>(.*?)</h${level}>`, 'gi')
      const matches = html.matchAll(regex)
      
      for (const match of matches) {
        const text = match[1].replace(/<[^>]+>/g, '').trim()
        if (text) {
          headers.push({
            level,
            text: text.length > maxLength ? text.substring(0, maxLength) + '...' : text
          })
        }
      }
    }

    return headers.sort((a, b) => a.level - b.level)
  }

  private extractCustomData(html: string, config: any): Record<string, any> {
    const customData: Record<string, any> = {}
    
    // Extract e-commerce data if enabled
    if (config.ecommerce?.enabled && config.ecommerce?.products?.enabled) {
      const productConfig = config.ecommerce.products
      
      // Extract price
      if (productConfig.priceSelector) {
        const priceMatch = html.match(new RegExp(`<[^>]+class=["'][^"']*${productConfig.priceSelector.replace('.', '')}[^"']*["'][^>]*>([^<]+)`, 'i'))
        if (priceMatch) {
          customData.price = priceMatch[1].trim()
        }
      }

      // Extract stock status
      if (productConfig.stockSelector) {
        const stockMatch = html.match(new RegExp(`<[^>]+class=["'][^"']*${productConfig.stockSelector.replace('.', '')}[^"']*["'][^>]*>([^<]+)`, 'i'))
        if (stockMatch) {
          customData.stock = stockMatch[1].trim()
        }
      }
    }

    return customData
  }

  private async saveResults(scanId: string, websiteId: string, results: CrawlResult[]): Promise<void> {
    // Save pages and page snapshots in batches
    const batchSize = 100
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize)
      
      // Upsert pages
      const pageData = batch.map(result => ({
        website_id: websiteId,
        url: result.url,
        content_hash: result.content_hash,
        status: result.response_code >= 200 && result.response_code < 400 ? 'active' : 'error',
        title: result.title,
        meta_description: result.meta_description,
        canonical_url: result.canonical_url,
        response_code: result.response_code,
        load_time: result.load_time,
        last_seen: new Date().toISOString()
      }))

      const { data: pages, error: pagesError } = await this.supabase
        .from('pages')
        .upsert(pageData, { 
          onConflict: 'website_id,url',
          ignoreDuplicates: false 
        })
        .select()

      if (pagesError) {
        console.error('Error saving pages:', pagesError)
        continue
      }

      // Create page snapshots
      const snapshotData = batch.map((result, index) => ({
        scan_id: scanId,
        page_id: pages[index]?.id,
        url: result.url,
        title: result.title,
        meta_description: result.meta_description,
        canonical_url: result.canonical_url,
        breadcrumbs: result.breadcrumbs,
        headers: result.headers,
        custom_data: result.custom_data,
        content_hash: result.content_hash,
        response_code: result.response_code,
        load_time: result.load_time
      })).filter(snapshot => snapshot.page_id) // Only include if page was created

      if (snapshotData.length > 0) {
        const { error: snapshotsError } = await this.supabase
          .from('page_snapshots')
          .insert(snapshotData)

        if (snapshotsError) {
          console.error('Error saving page snapshots:', snapshotsError)
        }
      }
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: string, 
    progress: number, 
    result?: any, 
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status,
      progress,
      updated_at: new Date().toISOString()
    }

    if (status === 'running' && !await this.getJobStartTime(jobId)) {
      updates.started_at = new Date().toISOString()
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString()
    }

    if (result) {
      updates.result = result
    }

    if (errorMessage) {
      updates.error_message = errorMessage
    }

    await this.supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
  }

  private async getJobStartTime(jobId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('jobs')
      .select('started_at')
      .eq('id', jobId)
      .single()
    
    return data?.started_at || null
  }
}

// HTTP server for Cloud Run
const port = parseInt(Deno.env.get('PORT') ?? '8080')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const crawler = new RobustCrawler()
    
    if (req.method === 'POST') {
      // Handle Pub/Sub push messages
      const body = await req.text()
      let jobId: string
      
      try {
        // Parse Pub/Sub message
        const pubsubMessage = JSON.parse(body)
        const messageData = JSON.parse(atob(pubsubMessage.message.data))
        jobId = messageData.jobId
      } catch (parseError) {
        // Fallback to direct JSON payload
        const directPayload = JSON.parse(body)
        jobId = directPayload.jobId
      }

      if (!jobId) {
        throw new Error('No jobId provided in request')
      }

      console.log(`Received job processing request for job: ${jobId}`)
      
      // Process the job
      await crawler.processJob(jobId)
      
      return new Response(
        JSON.stringify({ success: true, message: 'Job processed successfully', jobId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Health check endpoint
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          service: 'gcp-crawler-service',
          version: '1.0.0'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Crawler service error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}, { port })

console.log(`GCP Crawler Service running on port ${port}`)