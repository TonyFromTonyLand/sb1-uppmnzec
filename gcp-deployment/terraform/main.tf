terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "supabase_url" {
  description = "Supabase Project URL"
  type        = string
}

variable "supabase_service_role_key" {
  description = "Supabase Service Role Key"
  type        = string
  sensitive   = true
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  
  service = each.value
  disable_on_destroy = false
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "crawler_repo" {
  location      = var.region
  repository_id = "crawler-service"
  description   = "Docker repository for crawler service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.required_apis]
}

# Pub/Sub topic for crawl jobs
resource "google_pubsub_topic" "crawl_jobs" {
  name = "crawl-jobs"
  
  depends_on = [google_project_service.required_apis]
}

# Service account for Cloud Run
resource "google_service_account" "crawler_service" {
  account_id   = "crawler-service"
  display_name = "Crawler Service Account"
  description  = "Service account for the crawler Cloud Run service"
}

# Service account for Cloud Functions
resource "google_service_account" "cloud_functions" {
  account_id   = "cloud-functions"
  display_name = "Cloud Functions Service Account"
  description  = "Service account for Cloud Functions"
}

# IAM bindings for Pub/Sub
resource "google_pubsub_topic_iam_binding" "publisher" {
  topic = google_pubsub_topic.crawl_jobs.name
  role  = "roles/pubsub.publisher"
  
  members = [
    "serviceAccount:${google_service_account.cloud_functions.email}",
  ]
}

resource "google_pubsub_topic_iam_binding" "subscriber" {
  topic = google_pubsub_topic.crawl_jobs.name
  role  = "roles/pubsub.subscriber"
  
  members = [
    "serviceAccount:${google_service_account.crawler_service.email}",
  ]
}

# Cloud Run service for crawler
resource "google_cloud_run_v2_service" "crawler_service" {
  name     = "crawler-service"
  location = var.region
  
  template {
    service_account = google_service_account.crawler_service.email
    
    scaling {
      min_instance_count = 0
      max_instance_count = 100
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/crawler-service/crawler:latest"
      
      ports {
        container_port = 8080
      }
      
      env {
        name  = "SUPABASE_URL"
        value = var.supabase_url
      }
      
      env {
        name  = "SUPABASE_SERVICE_ROLE_KEY"
        value = var.supabase_service_role_key
      }
      
      env {
        name  = "MAX_CONCURRENCY"
        value = "20"
      }
      
      env {
        name  = "CRAWL_DELAY"
        value = "500"
      }
      
      env {
        name  = "REQUEST_TIMEOUT"
        value = "30000"
      }
      
      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
        cpu_idle = true
      }
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Pub/Sub subscription for Cloud Run
resource "google_pubsub_subscription" "crawler_subscription" {
  name  = "crawler-subscription"
  topic = google_pubsub_topic.crawl_jobs.name
  
  push_config {
    push_endpoint = "${google_cloud_run_v2_service.crawler_service.uri}/"
    
    oidc_token {
      service_account_email = google_service_account.crawler_service.email
    }
  }
  
  ack_deadline_seconds = 600  # 10 minutes for long-running crawls
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
}

# Dead letter topic for failed jobs
resource "google_pubsub_topic" "dead_letter" {
  name = "crawl-jobs-dead-letter"
}

# Cloud Run IAM for public access (adjust as needed)
resource "google_cloud_run_service_iam_binding" "crawler_public" {
  location = google_cloud_run_v2_service.crawler_service.location
  service  = google_cloud_run_v2_service.crawler_service.name
  role     = "roles/run.invoker"
  
  members = [
    "serviceAccount:${google_service_account.crawler_service.email}",
  ]
}

# Cloud Scheduler job for job publisher
resource "google_cloud_scheduler_job" "job_publisher" {
  name             = "job-publisher-trigger"
  description      = "Trigger job publisher function every 2 minutes"
  schedule         = "*/2 * * * *"  # Every 2 minutes
  time_zone        = "UTC"
  attempt_deadline = "320s"
  
  retry_config {
    retry_count = 3
  }
  
  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.job_publisher.service_config[0].uri
    
    oidc_token {
      service_account_email = google_service_account.cloud_functions.email
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Scheduler job for job maintenance
resource "google_cloud_scheduler_job" "job_maintenance" {
  name             = "job-maintenance-trigger"
  description      = "Trigger job maintenance function every hour"
  schedule         = "0 * * * *"  # Every hour
  time_zone        = "UTC"
  attempt_deadline = "320s"
  
  retry_config {
    retry_count = 3
  }
  
  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.job_maintenance.service_config[0].uri
    
    oidc_token {
      service_account_email = google_service_account.cloud_functions.email
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Function for job publisher
resource "google_cloudfunctions2_function" "job_publisher" {
  name        = "job-publisher"
  location    = var.region
  description = "Publishes queued jobs to Pub/Sub"
  
  build_config {
    runtime     = "nodejs18"
    entry_point = "publishJobs"
    
    source {
      storage_source {
        bucket = google_storage_bucket.functions_bucket.name
        object = google_storage_bucket_object.job_publisher_source.name
      }
    }
  }
  
  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 300
    service_account_email = google_service_account.cloud_functions.email
    
    environment_variables = {
      SUPABASE_URL              = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
      PUBSUB_TOPIC              = google_pubsub_topic.crawl_jobs.name
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Function for job maintenance
resource "google_cloudfunctions2_function" "job_maintenance" {
  name        = "job-maintenance"
  location    = var.region
  description = "Maintains and cleans up jobs"
  
  build_config {
    runtime     = "nodejs18"
    entry_point = "maintainJobs"
    
    source {
      storage_source {
        bucket = google_storage_bucket.functions_bucket.name
        object = google_storage_bucket_object.job_maintenance_source.name
      }
    }
  }
  
  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 300
    service_account_email = google_service_account.cloud_functions.email
    
    environment_variables = {
      SUPABASE_URL              = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Storage bucket for Cloud Functions source code
resource "google_storage_bucket" "functions_bucket" {
  name     = "${var.project_id}-cloud-functions-source"
  location = var.region
}

# Upload job publisher source
data "archive_file" "job_publisher_source" {
  type        = "zip"
  source_dir  = "../gcp-cloud-functions/job-publisher"
  output_path = "/tmp/job-publisher.zip"
}

resource "google_storage_bucket_object" "job_publisher_source" {
  name   = "job-publisher-${data.archive_file.job_publisher_source.output_md5}.zip"
  bucket = google_storage_bucket.functions_bucket.name
  source = data.archive_file.job_publisher_source.output_path
}

# Upload job maintenance source
data "archive_file" "job_maintenance_source" {
  type        = "zip"
  source_dir  = "../gcp-cloud-functions/job-maintenance"
  output_path = "/tmp/job-maintenance.zip"
}

resource "google_storage_bucket_object" "job_maintenance_source" {
  name   = "job-maintenance-${data.archive_file.job_maintenance_source.output_md5}.zip"
  bucket = google_storage_bucket.functions_bucket.name
  source = data.archive_file.job_maintenance_source.output_path
}

# Outputs
output "crawler_service_url" {
  description = "URL of the deployed crawler service"
  value       = google_cloud_run_v2_service.crawler_service.uri
}

output "job_publisher_url" {
  description = "URL of the job publisher function"
  value       = google_cloudfunctions2_function.job_publisher.service_config[0].uri
}

output "job_maintenance_url" {
  description = "URL of the job maintenance function"
  value       = google_cloudfunctions2_function.job_maintenance.service_config[0].uri
}

output "pubsub_topic" {
  description = "Name of the Pub/Sub topic"
  value       = google_pubsub_topic.crawl_jobs.name
}