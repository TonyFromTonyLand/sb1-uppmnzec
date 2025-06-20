# WebMonitor - Large-Scale Website Crawler & Change Tracker

A robust, production-ready website monitoring system capable of handling 200,000+ URLs with real-time change detection and comprehensive data extraction. Now featuring **Google Cloud Platform (GCP) integration** for enterprise-scale crawling.

## 🚀 Features

- **Massive Scale**: Handle 200k+ URLs efficiently with intelligent batching and concurrency control
- **Dual Discovery Methods**: XML Sitemap parsing and intelligent web crawling
- **Real-time Processing**: Background job queue with live progress tracking
- **Change Detection**: Advanced comparison algorithms to detect structural changes
- **Data Extraction**: Comprehensive extraction of metadata, content, navigation, and e-commerce data
- **User Management**: Secure authentication with Supabase Auth
- **Production Ready**: Built with TypeScript, React, and Supabase for enterprise-grade reliability
- **GCP Integration**: Scalable cloud infrastructure with Cloud Run, Pub/Sub, and Cloud Functions

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Dashboard**: Website management and monitoring overview
- **Scan Analysis**: Detailed comparison views and change tracking
- **Job Management**: Real-time job queue monitoring and control
- **Settings**: Comprehensive configuration for discovery and extraction

### Backend Options

#### Option 1: Supabase Edge Functions (Default)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Crawler Service**: Robust crawling engine with retry logic and error handling
- **Job Processor**: Queue management and job orchestration
- **Real-time Updates**: WebSocket connections for live status updates

#### Option 2: Google Cloud Platform (Enterprise Scale)
- **Cloud Run**: Containerized crawler service with auto-scaling
- **Pub/Sub**: Message queue for job dispatching and decoupling
- **Cloud Functions**: Job publisher and maintenance functions
- **Cloud Scheduler**: Periodic triggers for job processing and cleanup
- **Artifact Registry**: Docker image storage and versioning

## 🛠️ Deployment Guide

### Prerequisites
- Supabase account and project
- Node.js 18+ for local development
- Git for version control
- For GCP: Google Cloud account with billing enabled

### 1. Supabase Setup

#### Create a new Supabase project:
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

#### Deploy the database schema:
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the database migrations
supabase db push
```

### 2. Choose Your Backend Architecture

#### Option A: Supabase Edge Functions (Recommended for most use cases)

Deploy Edge Functions:
```bash
# Deploy the crawler service
supabase functions deploy crawler-service

# Deploy the job processor
supabase functions deploy job-processor
```

#### Option B: Google Cloud Platform (For enterprise scale)

See the [GCP Deployment Guide](./gcp-deployment/README.md) for detailed instructions.

Quick GCP deployment:
```bash
# Set environment variables
export PROJECT_ID="your-gcp-project-id"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Deploy to GCP
cd gcp-deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh manual
```

### 3. Environment Configuration

Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Frontend Deployment

#### Option A: Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

#### Option B: Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the Vite configuration
3. Add environment variables in Vercel dashboard

#### Option C: Self-hosted
```bash
# Build the application
npm run build

# Serve the dist folder with any static file server
# Example with nginx, Apache, or a CDN
```

## 🔧 Configuration

### Discovery Methods

#### XML Sitemap:
```typescript
{
  method: 'sitemap',
  sitemap: {
    urls: [
      {
        url: 'https://example.com/sitemap.xml',
        enabled: true,
        name: 'Main Sitemap'
      }
    ],
    autoDetect: true,
    followSitemapIndex: true,
    validateUrls: true
  }
}
```

#### Web Crawling:
```typescript
{
  method: 'crawling',
  crawling: {
    maxDepth: 3,
    maxPages: 10000,
    respectRobotsTxt: true,
    crawlDelay: 1000,
    includePatterns: ['/products/*', '/blog/*'],
    excludePatterns: ['/admin/*', '*.pdf']
  }
}
```

### Data Extraction:
```typescript
{
  extraction: {
    title: true,
    metaDescription: true,
    headers: { enabled: true, levels: [1, 2, 3] },
    navigation: { breadcrumbs: { enabled: true } },
    ecommerce: {
      enabled: true,
      products: { enabled: true, trackPriceChanges: true }
    }
  }
}
```

## 📊 Scaling for 200k+ URLs

### Performance Optimizations

#### Database Optimizations:
```sql
-- Add additional indexes for large datasets
CREATE INDEX CONCURRENTLY idx_pages_content_hash ON pages(content_hash);
CREATE INDEX CONCURRENTLY idx_page_snapshots_created_at ON page_snapshots(created_at);

-- Partition large tables by date (for 1M+ records)
CREATE TABLE pages_y2024m01 PARTITION OF pages
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

#### Crawler Configuration for Scale:
```typescript
// For Supabase Edge Functions
{
  maxConcurrency: 20,        // Balanced for Edge Functions
  crawlDelay: 500,          // Moderate delay
  timeout: 30000,           // 30 second timeout
  retryAttempts: 3,         // Standard retry count
  batchSize: 100           // Smaller batches for Edge Functions
}

// For GCP Cloud Run
{
  maxConcurrency: 50,        // Higher concurrency
  crawlDelay: 100,          // Faster processing
  timeout: 15000,           // Shorter timeout
  retryAttempts: 2,         // Fewer retries for speed
  batchSize: 1000          // Larger batches for efficiency
}
```

### Architecture Comparison

| Feature | Supabase Edge Functions | Google Cloud Platform |
|---------|------------------------|----------------------|
| **Max Concurrency** | 20-30 requests | 50-100+ requests |
| **Scaling** | Automatic | Auto-scaling + manual tuning |
| **Cost** | Pay-per-execution | Pay-per-use + infrastructure |
| **Complexity** | Low | Medium |
| **Best For** | Small to medium scale | Enterprise scale |
| **Max URLs** | 50k-100k efficiently | 200k+ URLs |

### Performance Targets:
- **Crawl Speed**: 100-500 URLs per minute (depending on target sites)
- **Data Processing**: 1000+ pages per minute for extraction
- **Storage**: Efficient compression and archival of historical data
- **Response Time**: Sub-second API responses for dashboard updates

## 🔒 Security

- **Row Level Security**: All data isolated by user
- **API Authentication**: Secure Supabase Auth integration
- **Rate Limiting**: Prevent abuse and respect target sites
- **Data Encryption**: All data encrypted at rest and in transit
- **Access Control**: Granular permissions for different user roles

## 📊 Monitoring & Maintenance

### Health Checks:
- Crawler service health endpoint
- Database connection monitoring
- Job queue depth alerts
- Error rate tracking

### Maintenance Tasks:
- Automatic cleanup of old jobs (30+ days)
- Reset stuck jobs (2+ hours)
- Archive old scan data
- Optimize database indexes

### Performance Monitoring:
- Track crawl success rates
- Monitor average response times
- Alert on queue backlog
- Database performance metrics

## 🚀 Getting Started

1. **Clone the repository**
2. **Set up Supabase** following the deployment guide
3. **Choose your backend architecture** (Supabase Edge Functions or GCP)
4. **Configure environment variables**
5. **Deploy the services**
6. **Start monitoring your first website**

The system is designed to scale from small personal projects to enterprise-level monitoring of hundreds of thousands of URLs.

## 🔄 Migration from Edge Functions to GCP

The migration is designed to be seamless:

1. **Frontend remains unchanged** - continues creating jobs in Supabase
2. **Database schema unchanged** - same data structure
3. **Zero downtime migration** - GCP services pick up existing queued jobs
4. **Gradual transition** - can run both systems in parallel

See the [GCP Migration Guide](./gcp-deployment/README.md) for detailed migration instructions.

## 📈 Roadmap

- [ ] **BigQuery Integration**: Stream crawl data for advanced analytics
- [ ] **Multi-region Deployment**: Global scale with regional crawlers
- [ ] **AI-powered Change Detection**: Machine learning for intelligent change classification
- [ ] **API Rate Limiting**: Advanced rate limiting per target domain
- [ ] **Custom Webhooks**: Real-time notifications for detected changes
- [ ] **Kubernetes Support**: Container orchestration for maximum scale

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.