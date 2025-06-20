# GCP Crawler Service Deployment

This directory contains all the necessary files and scripts to deploy the WebMonitor crawler service to Google Cloud Platform (GCP), migrating from Supabase Edge Functions to a scalable, production-ready architecture.

## Architecture Overview

The GCP deployment consists of:

1. **Cloud Run Service**: Containerized Deno crawler that processes individual jobs
2. **Pub/Sub**: Message queue for job dispatching and decoupling
3. **Cloud Functions**: Job publisher and maintenance functions
4. **Cloud Scheduler**: Periodic triggers for job processing and cleanup
5. **Artifact Registry**: Docker image storage

## Prerequisites

- GCP Project with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed
- Terraform installed (for infrastructure-as-code deployment)
- Supabase project with the database schema deployed

## Quick Start

### 1. Set Environment Variables

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 2. Deploy with Script

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy using manual method (recommended for first deployment)
./scripts/deploy.sh manual

# Or deploy using Terraform (for infrastructure-as-code)
./scripts/deploy.sh terraform
```

### 3. Test the Deployment

```bash
./scripts/test-deployment.sh
```

## Deployment Methods

### Method 1: Automated Script (Recommended)

The `deploy.sh` script handles the entire deployment process:

```bash
./scripts/deploy.sh manual
```

This will:
- Enable required GCP APIs
- Create Artifact Registry repository
- Build and push Docker image
- Deploy Cloud Run service
- Create Pub/Sub topic and subscription
- Set up proper IAM permissions

### Method 2: Terraform (Infrastructure as Code)

For production environments, use Terraform:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform plan
terraform apply
```

### Method 3: Manual Deployment

Follow these steps for manual deployment:

#### 3.1 Enable APIs

```bash
gcloud services enable \
    run.googleapis.com \
    cloudfunctions.googleapis.com \
    cloudscheduler.googleapis.com \
    pubsub.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com
```

#### 3.2 Create Artifact Registry

```bash
gcloud artifacts repositories create crawler-service \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for crawler service"
```

#### 3.3 Build and Push Docker Image

```bash
# Configure Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push
cd gcp-crawler-service
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/crawler-service/crawler:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/crawler-service/crawler:latest
```

#### 3.4 Deploy Cloud Run Service

```bash
gcloud run deploy crawler-service \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/crawler-service/crawler:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --memory=4Gi \
    --cpu=2 \
    --max-instances=100 \
    --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
```

#### 3.5 Create Pub/Sub Resources

```bash
# Create topic
gcloud pubsub topics create crawl-jobs

# Create subscription
SERVICE_URL=$(gcloud run services describe crawler-service --region=$REGION --format="value(status.url)")
gcloud pubsub subscriptions create crawler-subscription \
    --topic=crawl-jobs \
    --push-endpoint="$SERVICE_URL/" \
    --ack-deadline=600
```

#### 3.6 Deploy Cloud Functions

```bash
# Deploy job publisher
cd gcp-cloud-functions/job-publisher
gcloud functions deploy job-publisher \
    --runtime=nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,PUBSUB_TOPIC=crawl-jobs"

# Deploy job maintenance
cd ../job-maintenance
gcloud functions deploy job-maintenance \
    --runtime=nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
```

#### 3.7 Set Up Cloud Scheduler

```bash
# Job publisher trigger (every 2 minutes)
PUBLISHER_URL=$(gcloud functions describe job-publisher --region=$REGION --format="value(httpsTrigger.url)")
gcloud scheduler jobs create http job-publisher-trigger \
    --schedule="*/2 * * * *" \
    --uri="$PUBLISHER_URL" \
    --http-method=POST \
    --location=$REGION

# Job maintenance trigger (every hour)
MAINTENANCE_URL=$(gcloud functions describe job-maintenance --region=$REGION --format="value(httpsTrigger.url)")
gcloud scheduler jobs create http job-maintenance-trigger \
    --schedule="0 * * * *" \
    --uri="$MAINTENANCE_URL" \
    --http-method=POST \
    --location=$REGION
```

## Configuration

### Environment Variables

The crawler service supports these environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `MAX_CONCURRENCY`: Maximum concurrent requests (default: 20)
- `CRAWL_DELAY`: Delay between requests in ms (default: 500)
- `REQUEST_TIMEOUT`: Request timeout in ms (default: 30000)
- `RETRY_ATTEMPTS`: Number of retry attempts (default: 3)

### Scaling Configuration

For high-volume crawling (200k+ URLs), adjust these settings:

```bash
# Cloud Run scaling
gcloud run services update crawler-service \
    --region=$REGION \
    --memory=8Gi \
    --cpu=4 \
    --max-instances=200 \
    --concurrency=1000

# Environment variables for performance
gcloud run services update crawler-service \
    --region=$REGION \
    --set-env-vars="MAX_CONCURRENCY=50,CRAWL_DELAY=100"
```

## Monitoring and Troubleshooting

### View Logs

```bash
# Cloud Run service logs
gcloud logs tail --follow --resource=cloud_run_revision \
    --filter="resource.labels.service_name=crawler-service"

# Cloud Function logs
gcloud logs tail --follow --resource=cloud_function \
    --filter="resource.labels.function_name=job-publisher"
```

### Monitor Pub/Sub

```bash
# Check topic and subscription status
gcloud pubsub topics list
gcloud pubsub subscriptions list

# Monitor message backlog
gcloud pubsub subscriptions describe crawler-subscription
```

### Health Checks

```bash
# Test crawler service health
SERVICE_URL=$(gcloud run services describe crawler-service --region=$REGION --format="value(status.url)")
curl "$SERVICE_URL"

# Test Cloud Functions
PUBLISHER_URL=$(gcloud functions describe job-publisher --region=$REGION --format="value(httpsTrigger.url)")
curl "$PUBLISHER_URL"
```

## Cost Optimization

### For Development/Testing

- Use smaller instance sizes: `--memory=1Gi --cpu=1`
- Reduce max instances: `--max-instances=10`
- Increase crawl delay: `CRAWL_DELAY=2000`

### For Production

- Enable CPU allocation only during requests: `--cpu-idle`
- Use committed use discounts for predictable workloads
- Set up budget alerts and monitoring

## Security

### IAM Best Practices

- Use least privilege principle for service accounts
- Regularly rotate service account keys
- Enable audit logging for all services

### Network Security

- Consider using VPC for internal communication
- Implement IP allowlisting if needed
- Use Cloud Armor for DDoS protection

## Backup and Disaster Recovery

- Database backups are handled by Supabase
- Container images are stored in Artifact Registry
- Infrastructure can be recreated using Terraform
- Consider multi-region deployment for high availability

## Migration from Supabase Edge Functions

The frontend code requires minimal changes:

1. Update `useScanRuns.ts` to continue creating jobs in Supabase
2. Remove direct calls to Supabase Edge Functions
3. The GCP services will automatically pick up queued jobs

The migration is designed to be seamless with zero downtime.

## Support

For issues and questions:

1. Check the logs using the commands above
2. Verify all environment variables are set correctly
3. Ensure Supabase connectivity from GCP
4. Test individual components using the test script

## Next Steps

After successful deployment:

1. Monitor performance and adjust scaling settings
2. Set up alerting for failed jobs and high queue depth
3. Implement BigQuery integration for analytics (Phase 2)
4. Consider multi-region deployment for global scale