#!/bin/bash
# ============================================
# Daily Backup Script for Tea Management System
# ============================================
# This script performs daily backups and sends them to:
# 1. Local backup directory
# 2. Remote server via SSH/SCP
# 3. Cloud storage (AWS S3 / Google Cloud / Dropbox)
# ============================================

# Configuration - UPDATE THESE VALUES
DB_NAME="tea_management"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Backup directories
LOCAL_BACKUP_DIR="/var/backups/tea-management"
BACKUP_RETENTION_DAYS=30

# Remote server configuration
REMOTE_SERVER="backup@your-backup-server.com"
REMOTE_BACKUP_DIR="/backups/tea-management"
SSH_KEY_PATH="~/.ssh/backup_key"

# Cloud configuration (choose one or multiple)
# AWS S3
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"

# Google Cloud Storage
GCS_BUCKET="your-gcs-bucket"

# Dropbox (requires dropbox_uploader.sh)
DROPBOX_DIR="/backups/tea-management"

# Notification settings
NOTIFICATION_EMAIL="admin@yourdomain.com"
SLACK_WEBHOOK_URL=""

# ============================================
# DO NOT EDIT BELOW THIS LINE
# ============================================

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE=$(date +"%Y-%m-%d")
BACKUP_FILENAME="tea_management_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${LOCAL_BACKUP_DIR}/logs/backup_${DATE}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directories if they don't exist
mkdir -p "${LOCAL_BACKUP_DIR}/daily"
mkdir -p "${LOCAL_BACKUP_DIR}/weekly"
mkdir -p "${LOCAL_BACKUP_DIR}/monthly"
mkdir -p "${LOCAL_BACKUP_DIR}/logs"

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

# Send notification function
send_notification() {
    local status=$1
    local message=$2

    # Email notification
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "Tea Management Backup - $status" "$NOTIFICATION_EMAIL" 2>/dev/null
    fi

    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        [ "$status" = "FAILED" ] && color="danger"
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"Backup $status\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
    fi
}

# ============================================
# STEP 1: Create Database Backup
# ============================================
log "=========================================="
log "Starting Daily Backup - ${TIMESTAMP}"
log "=========================================="

log "Creating PostgreSQL backup..."

# Set password via environment variable or .pgpass file
export PGPASSWORD="${DB_PASSWORD:-}"

# Create the backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=custom \
    --verbose \
    --file="${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME%.gz}" \
    2>> "$LOG_FILE"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip -f "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME%.gz}"
    BACKUP_SIZE=$(du -h "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" | cut -f1)
    log_success "Local backup created: ${BACKUP_FILENAME} (${BACKUP_SIZE})"
else
    log_error "Failed to create database backup"
    send_notification "FAILED" "Database backup failed at $(date)"
    exit 1
fi

# ============================================
# STEP 2: Copy to Remote Server
# ============================================
log "Copying backup to remote server..."

if [ -n "$REMOTE_SERVER" ] && [ "$REMOTE_SERVER" != "backup@your-backup-server.com" ]; then
    scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
        "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" \
        "${REMOTE_SERVER}:${REMOTE_BACKUP_DIR}/" \
        2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Backup copied to remote server"
    else
        log_error "Failed to copy backup to remote server"
    fi
else
    log_warning "Remote server not configured, skipping..."
fi

# ============================================
# STEP 3: Upload to AWS S3
# ============================================
log "Uploading backup to AWS S3..."

if [ -n "$AWS_S3_BUCKET" ] && [ "$AWS_S3_BUCKET" != "your-bucket-name" ]; then
    aws s3 cp "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" \
        "s3://${AWS_S3_BUCKET}/daily/${BACKUP_FILENAME}" \
        --region "$AWS_REGION" \
        2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to AWS S3"
    else
        log_error "Failed to upload backup to AWS S3"
    fi
else
    log_warning "AWS S3 not configured, skipping..."
fi

# ============================================
# STEP 4: Upload to Google Cloud Storage
# ============================================
log "Uploading backup to Google Cloud Storage..."

if [ -n "$GCS_BUCKET" ] && [ "$GCS_BUCKET" != "your-gcs-bucket" ]; then
    gsutil cp "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" \
        "gs://${GCS_BUCKET}/daily/${BACKUP_FILENAME}" \
        2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to Google Cloud Storage"
    else
        log_error "Failed to upload backup to Google Cloud Storage"
    fi
else
    log_warning "Google Cloud Storage not configured, skipping..."
fi

# ============================================
# STEP 5: Upload to Dropbox (optional)
# ============================================
if [ -f "/usr/local/bin/dropbox_uploader.sh" ]; then
    log "Uploading backup to Dropbox..."
    /usr/local/bin/dropbox_uploader.sh upload \
        "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" \
        "${DROPBOX_DIR}/${BACKUP_FILENAME}" \
        2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to Dropbox"
    else
        log_error "Failed to upload backup to Dropbox"
    fi
fi

# ============================================
# STEP 6: Weekly & Monthly Backups
# ============================================
# Create weekly backup on Sundays
if [ "$(date +%u)" -eq 7 ]; then
    log "Creating weekly backup..."
    cp "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" \
       "${LOCAL_BACKUP_DIR}/weekly/tea_management_weekly_${DATE}.sql.gz"
    log_success "Weekly backup created"
fi

# Create monthly backup on the 1st
if [ "$(date +%d)" -eq 01 ]; then
    log "Creating monthly backup..."
    cp "${LOCAL_BACKUP_DIR}/daily/${BACKUP_FILENAME}" \
       "${LOCAL_BACKUP_DIR}/monthly/tea_management_monthly_${DATE}.sql.gz"
    log_success "Monthly backup created"
fi

# ============================================
# STEP 7: Cleanup Old Backups
# ============================================
log "Cleaning up old backups..."

# Delete daily backups older than retention period
find "${LOCAL_BACKUP_DIR}/daily" -name "*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete
log "Deleted daily backups older than ${BACKUP_RETENTION_DAYS} days"

# Delete weekly backups older than 90 days
find "${LOCAL_BACKUP_DIR}/weekly" -name "*.sql.gz" -mtime +90 -delete
log "Deleted weekly backups older than 90 days"

# Delete monthly backups older than 365 days
find "${LOCAL_BACKUP_DIR}/monthly" -name "*.sql.gz" -mtime +365 -delete
log "Deleted monthly backups older than 365 days"

# Cleanup old log files
find "${LOCAL_BACKUP_DIR}/logs" -name "*.log" -mtime +30 -delete

# ============================================
# STEP 8: Backup Application Files (optional)
# ============================================
log "Creating application files backup..."

APP_BACKUP_FILENAME="tea_management_app_${TIMESTAMP}.tar.gz"
APP_DIR="/var/www/tea-management"

if [ -d "$APP_DIR" ]; then
    tar -czf "${LOCAL_BACKUP_DIR}/daily/${APP_BACKUP_FILENAME}" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        "$APP_DIR" \
        2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_success "Application files backup created"
    else
        log_warning "Application files backup failed"
    fi
fi

# ============================================
# FINAL SUMMARY
# ============================================
log "=========================================="
log "Backup completed at $(date '+%Y-%m-%d %H:%M:%S')"
log "=========================================="

# Send success notification
send_notification "SUCCESS" "Daily backup completed successfully at $(date). Backup size: ${BACKUP_SIZE}"

exit 0
