#!/bin/bash

# GCP Crawler Service Deployment Script
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

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if project ID is set
    if [ -z "$PROJECT_ID" ]; then
        log_error "PROJECT_ID environment variable is not set."
        exit 1
    fi
    
    log_info "All requirements satisfied."
}

setup_gcp() {
    log_info "Setting up GCP project..."
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    log_info "Enabling required APIs..."
    gcloud services enable \
        run.googleapis.com \
        cloudfunctions.googleapis.com \
        cloudscheduler.googleapis.com \
        pubsub.googleapis.com \
        cloudbuild.googleapis.com \
        artifactregistry.googleapis.com
    
    log_info "GCP setup completed."
}

build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Create Artifact Registry repository if it doesn't exist
    if ! gcloud artifacts repositories describe $SERVICE_NAME --location=$REGION &> /dev/null; then
        log_info "Creating Artifact Registry repository..."
        gcloud artifacts repositories create $SERVICE_NAME \
            --repository-format=docker \
            --location=$REGION \
            --description="Docker repository for crawler service"
    fi
    
    # Configure Docker to use gcloud as a credential helper
    gcloud auth configure-docker $REGION-docker.pkg.dev
    
    # Build the image
    IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/crawler:latest"
    
    log_info "Building Docker image: $IMAGE_URI"
    docker build -t $IMAGE_URI ../gcp-crawler-service/
    
    # Push the image
    log_info "Pushing Docker image..."
    docker push $IMAGE_URI
    
    log_info "Docker image built and pushed successfully."
}

deploy_with_terraform() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -var="project_id=$PROJECT_ID" -var="region=$REGION"
    
    # Apply the deployment
    terraform apply -var="project_id=$PROJECT_ID" -var="region=$REGION" -auto-approve
    
    cd ..
    
    log_info "Terraform deployment completed."
}

deploy_manual() {
    log_info "Deploying services manually..."
    
    # Deploy Cloud Run service
    log_info "Deploying Cloud Run service..."
    gcloud run deploy $SERVICE_NAME \
        --image=$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/crawler:latest \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --memory=4Gi \
        --cpu=2 \
        --max-instances=100 \
        --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
    
    # Create Pub/Sub topic
    log_info "Creating Pub/Sub topic..."
    if ! gcloud pubsub topics describe crawl-jobs &> /dev/null; then
        gcloud pubsub topics create crawl-jobs
    fi
    
    # Create Pub/Sub subscription
    log_info "Creating Pub/Sub subscription..."
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    if ! gcloud pubsub subscriptions describe crawler-subscription &> /dev/null; then
        gcloud pubsub subscriptions create crawler-subscription \
            --topic=crawl-jobs \
            --push-endpoint="$SERVICE_URL/" \
            --ack-deadline=600
    fi
    
    log_info "Manual deployment completed."
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    # Test health endpoint
    if curl -f "$SERVICE_URL" &> /dev/null; then
        log_info "Health check passed: $SERVICE_URL"
    else
        log_warn "Health check failed for: $SERVICE_URL"
    fi
    
    # List Pub/Sub topics
    log_info "Pub/Sub topics:"
    gcloud pubsub topics list --filter="name:crawl-jobs"
    
    log_info "Deployment verification completed."
}

# Main execution
main() {
    log_info "Starting GCP Crawler Service deployment..."
    
    check_requirements
    setup_gcp
    build_and_push_image
    
    # Choose deployment method
    if [ "$1" = "terraform" ]; then
        deploy_with_terraform
    else
        deploy_manual
    fi
    
    verify_deployment
    
    log_info "Deployment completed successfully!"
    log_info "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [terraform|manual]"
    echo ""
    echo "Environment variables required:"
    echo "  PROJECT_ID - GCP Project ID"
    echo "  SUPABASE_URL - Supabase project URL"
    echo "  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key"
    echo ""
    echo "Optional:"
    echo "  REGION - GCP region (default: us-central1)"
    exit 1
fi

# Run main function
main $1