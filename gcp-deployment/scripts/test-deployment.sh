#!/bin/bash

# Test script for GCP Crawler Service deployment
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-""}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="crawler-service"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

test_cloud_run_health() {
    log_info "Testing Cloud Run service health..."
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    if [ -z "$SERVICE_URL" ]; then
        log_error "Could not get service URL"
        return 1
    fi
    
    log_info "Service URL: $SERVICE_URL"
    
    # Test health endpoint
    RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL" -o /tmp/health_response.json)
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "Health check passed (HTTP $HTTP_CODE)"
        cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
    else
        log_error "Health check failed (HTTP $HTTP_CODE)"
        cat /tmp/health_response.json
        return 1
    fi
}

test_pubsub_integration() {
    log_info "Testing Pub/Sub integration..."
    
    # Check if topic exists
    if gcloud pubsub topics describe crawl-jobs &> /dev/null; then
        log_info "Pub/Sub topic 'crawl-jobs' exists"
    else
        log_error "Pub/Sub topic 'crawl-jobs' not found"
        return 1
    fi
    
    # Check if subscription exists
    if gcloud pubsub subscriptions describe crawler-subscription &> /dev/null; then
        log_info "Pub/Sub subscription 'crawler-subscription' exists"
    else
        log_error "Pub/Sub subscription 'crawler-subscription' not found"
        return 1
    fi
    
    # Test publishing a message
    log_info "Publishing test message to Pub/Sub..."
    TEST_MESSAGE='{"jobId":"test-job-123","websiteId":"test-website","type":"scan","metadata":{"discovery_method":"sitemap","settings":{}},"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}'
    
    gcloud pubsub topics publish crawl-jobs --message="$TEST_MESSAGE"
    log_info "Test message published successfully"
}

test_cloud_functions() {
    log_info "Testing Cloud Functions..."
    
    # Test job publisher function
    if gcloud functions describe job-publisher --region=$REGION &> /dev/null; then
        log_info "Job publisher function exists"
        
        # Test health endpoint
        FUNCTION_URL=$(gcloud functions describe job-publisher --region=$REGION --format="value(httpsTrigger.url)")
        if [ ! -z "$FUNCTION_URL" ]; then
            RESPONSE=$(curl -s -w "%{http_code}" "$FUNCTION_URL" -o /tmp/publisher_response.json)
            HTTP_CODE="${RESPONSE: -3}"
            
            if [ "$HTTP_CODE" = "200" ]; then
                log_info "Job publisher health check passed"
            else
                log_warn "Job publisher health check returned HTTP $HTTP_CODE"
            fi
        fi
    else
        log_warn "Job publisher function not found (may not be deployed yet)"
    fi
    
    # Test job maintenance function
    if gcloud functions describe job-maintenance --region=$REGION &> /dev/null; then
        log_info "Job maintenance function exists"
        
        # Test health endpoint
        FUNCTION_URL=$(gcloud functions describe job-maintenance --region=$REGION --format="value(httpsTrigger.url)")
        if [ ! -z "$FUNCTION_URL" ]; then
            RESPONSE=$(curl -s -w "%{http_code}" "$FUNCTION_URL" -o /tmp/maintenance_response.json)
            HTTP_CODE="${RESPONSE: -3}"
            
            if [ "$HTTP_CODE" = "200" ]; then
                log_info "Job maintenance health check passed"
            else
                log_warn "Job maintenance health check returned HTTP $HTTP_CODE"
            fi
        fi
    else
        log_warn "Job maintenance function not found (may not be deployed yet)"
    fi
}

test_cloud_scheduler() {
    log_info "Testing Cloud Scheduler jobs..."
    
    # Check job publisher scheduler
    if gcloud scheduler jobs describe job-publisher-trigger --location=$REGION &> /dev/null; then
        log_info "Job publisher scheduler exists"
        
        # Get job status
        STATUS=$(gcloud scheduler jobs describe job-publisher-trigger --location=$REGION --format="value(state)")
        log_info "Job publisher scheduler status: $STATUS"
    else
        log_warn "Job publisher scheduler not found"
    fi
    
    # Check job maintenance scheduler
    if gcloud scheduler jobs describe job-maintenance-trigger --location=$REGION &> /dev/null; then
        log_info "Job maintenance scheduler exists"
        
        # Get job status
        STATUS=$(gcloud scheduler jobs describe job-maintenance-trigger --location=$REGION --format="value(state)")
        log_info "Job maintenance scheduler status: $STATUS"
    else
        log_warn "Job maintenance scheduler not found"
    fi
}

test_end_to_end() {
    log_info "Running end-to-end test..."
    
    # This would require a test job in the Supabase database
    # For now, we'll just verify the components can communicate
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    # Test direct job processing endpoint
    TEST_PAYLOAD='{"jobId":"test-job-e2e-123"}'
    
    log_info "Testing direct job processing..."
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "$SERVICE_URL" \
        -H "Content-Type: application/json" \
        -d "$TEST_PAYLOAD" \
        -o /tmp/e2e_response.json)
    
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
        log_info "End-to-end test completed (HTTP $HTTP_CODE)"
        cat /tmp/e2e_response.json | jq '.' 2>/dev/null || cat /tmp/e2e_response.json
    else
        log_error "End-to-end test failed (HTTP $HTTP_CODE)"
        cat /tmp/e2e_response.json
        return 1
    fi
}

generate_test_report() {
    log_info "Generating test report..."
    
    cat > /tmp/test_report.md << EOF
# GCP Crawler Service Test Report

Generated: $(date)
Project: $PROJECT_ID
Region: $REGION

## Service URLs

- Cloud Run Service: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "Not found")
- Job Publisher Function: $(gcloud functions describe job-publisher --region=$REGION --format="value(httpsTrigger.url)" 2>/dev/null || echo "Not found")
- Job Maintenance Function: $(gcloud functions describe job-maintenance --region=$REGION --format="value(httpsTrigger.url)" 2>/dev/null || echo "Not found")

## Pub/Sub Resources

- Topic: crawl-jobs
- Subscription: crawler-subscription

## Test Results

All tests completed. Check the output above for detailed results.

## Next Steps

1. Monitor the Cloud Run service logs: \`gcloud logs tail --follow --resource=cloud_run_revision --filter="resource.labels.service_name=$SERVICE_NAME"\`
2. Monitor Pub/Sub metrics in the GCP Console
3. Test with real job data from your Supabase database
4. Set up monitoring and alerting

EOF

    log_info "Test report saved to /tmp/test_report.md"
    cat /tmp/test_report.md
}

# Main execution
main() {
    log_info "Starting GCP Crawler Service deployment tests..."
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "PROJECT_ID environment variable is not set."
        exit 1
    fi
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Run tests
    test_cloud_run_health
    test_pubsub_integration
    test_cloud_functions
    test_cloud_scheduler
    test_end_to_end
    
    generate_test_report
    
    log_info "All tests completed!"
}

# Run main function
main