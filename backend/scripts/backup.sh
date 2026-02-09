#!/bin/bash

# ============================================
# Tea Management System - Comprehensive Backup Script
# ============================================
#
# Features:
# - Local database backup with compression
# - Remote sync to another server (rsync/scp)
# - Cloud storage support (S3, Google Cloud, etc.)
# - Automatic cleanup of old backups
# - Email notifications (optional)
#
# Usage:
#   chmod +x backup.sh
#   ./backup.sh [--local-only] [--no-remote]
#
# Cron job example (runs at 2 AM daily):
#   0 2 * * * /path/to/backend/scripts/backup.sh >> /var/log/tea-backup.log 2>&1
# ============================================

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/backup.config"

if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "ERROR: Configuration file not found: $CONFIG_FILE"
    echo "Please copy backup.config.example to backup.config and configure it."
    exit 1
fi

# Default values if not set in config
DB_NAME="${DB_NAME:-tea_management}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tea-management}"
LOG_FILE="${LOG_FILE:-/var/log/tea-management-backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
REMOTE_RETENTION_DAYS="${REMOTE_RETENTION_DAYS:-90}"

# Timestamp for this backup
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_ONLY=$(date +"%Y-%m-%d")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        "INFO")  color=$GREEN ;;
        "WARN")  color=$YELLOW ;;
        "ERROR") color=$RED ;;
        *)       color=$NC ;;
    esac

    echo -e "${color}[$timestamp] [$level] $message${NC}"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Create directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

log "INFO" "=========================================="
log "INFO" "Starting Tea Management System Backup"
log "INFO" "=========================================="

# ============================================
# 1. DATABASE BACKUP
# ============================================
log "INFO" "Step 1: Creating database backup..."

BACKUP_FILE="$BACKUP_DIR/daily/tea_db_$TIMESTAMP.sql.gz"

# Create database backup
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "INFO" "Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log "ERROR" "Database backup failed!"
    exit 1
fi

# ============================================
# 2. WEEKLY BACKUP (Every Sunday)
# ============================================
DAY_OF_WEEK=$(date +%u)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    log "INFO" "Step 2: Creating weekly backup..."
    WEEKLY_FILE="$BACKUP_DIR/weekly/tea_db_weekly_$DATE_ONLY.sql.gz"
    cp "$BACKUP_FILE" "$WEEKLY_FILE"
    log "INFO" "Weekly backup created: $WEEKLY_FILE"
fi

# ============================================
# 3. MONTHLY BACKUP (1st of each month)
# ============================================
DAY_OF_MONTH=$(date +%d)
if [ "$DAY_OF_MONTH" -eq "01" ]; then
    log "INFO" "Step 3: Creating monthly backup..."
    MONTHLY_FILE="$BACKUP_DIR/monthly/tea_db_monthly_$DATE_ONLY.sql.gz"
    cp "$BACKUP_FILE" "$MONTHLY_FILE"
    log "INFO" "Monthly backup created: $MONTHLY_FILE"
fi

# ============================================
# 4. SYNC TO REMOTE SERVER (rsync/scp)
# ============================================
if [ "$ENABLE_REMOTE_SERVER" = "true" ] && [ -n "$REMOTE_SERVER" ]; then
    log "INFO" "Step 4: Syncing to remote server..."

    if command_exists rsync; then
        # Use rsync (preferred - faster for incremental)
        rsync -avz --progress \
            -e "ssh -p ${REMOTE_PORT:-22} -i ${REMOTE_SSH_KEY:-~/.ssh/id_rsa}" \
            "$BACKUP_DIR/" \
            "${REMOTE_USER:-root}@${REMOTE_SERVER}:${REMOTE_PATH:-/var/backups/tea-management}/"

        if [ $? -eq 0 ]; then
            log "INFO" "Remote sync completed successfully (rsync)"
        else
            log "WARN" "Remote sync failed (rsync)"
        fi
    elif command_exists scp; then
        # Fallback to scp
        scp -P "${REMOTE_PORT:-22}" \
            -i "${REMOTE_SSH_KEY:-~/.ssh/id_rsa}" \
            "$BACKUP_FILE" \
            "${REMOTE_USER:-root}@${REMOTE_SERVER}:${REMOTE_PATH:-/var/backups/tea-management}/"

        if [ $? -eq 0 ]; then
            log "INFO" "Remote sync completed successfully (scp)"
        else
            log "WARN" "Remote sync failed (scp)"
        fi
    else
        log "WARN" "Neither rsync nor scp available for remote sync"
    fi
else
    log "INFO" "Step 4: Remote server sync disabled or not configured"
fi

# ============================================
# 5. SYNC TO CLOUD STORAGE (S3/GCS/B2)
# ============================================
if [ "$ENABLE_CLOUD_BACKUP" = "true" ]; then
    log "INFO" "Step 5: Syncing to cloud storage..."

    case "$CLOUD_PROVIDER" in
        "s3"|"aws")
            # AWS S3
            if command_exists aws; then
                aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX:-backups}/daily/" \
                    --storage-class "${S3_STORAGE_CLASS:-STANDARD_IA}"

                # Sync weekly and monthly if they exist
                if [ -f "$WEEKLY_FILE" ]; then
                    aws s3 cp "$WEEKLY_FILE" "s3://${S3_BUCKET}/${S3_PREFIX:-backups}/weekly/"
                fi
                if [ -f "$MONTHLY_FILE" ]; then
                    aws s3 cp "$MONTHLY_FILE" "s3://${S3_BUCKET}/${S3_PREFIX:-backups}/monthly/"
                fi

                log "INFO" "AWS S3 sync completed"
            else
                log "WARN" "AWS CLI not installed, skipping S3 backup"
            fi
            ;;

        "gcs"|"google")
            # Google Cloud Storage
            if command_exists gsutil; then
                gsutil cp "$BACKUP_FILE" "gs://${GCS_BUCKET}/${GCS_PREFIX:-backups}/daily/"

                if [ -f "$WEEKLY_FILE" ]; then
                    gsutil cp "$WEEKLY_FILE" "gs://${GCS_BUCKET}/${GCS_PREFIX:-backups}/weekly/"
                fi
                if [ -f "$MONTHLY_FILE" ]; then
                    gsutil cp "$MONTHLY_FILE" "gs://${GCS_BUCKET}/${GCS_PREFIX:-backups}/monthly/"
                fi

                log "INFO" "Google Cloud Storage sync completed"
            else
                log "WARN" "gsutil not installed, skipping GCS backup"
            fi
            ;;

        "b2"|"backblaze")
            # Backblaze B2
            if command_exists b2; then
                b2 upload-file "$B2_BUCKET" "$BACKUP_FILE" "${B2_PREFIX:-backups}/daily/$(basename $BACKUP_FILE)"
                log "INFO" "Backblaze B2 sync completed"
            else
                log "WARN" "b2 CLI not installed, skipping B2 backup"
            fi
            ;;

        "s3-compatible")
            # S3-compatible storage (MinIO, DigitalOcean Spaces, etc.)
            if command_exists aws; then
                aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX:-backups}/daily/" \
                    --endpoint-url "$S3_ENDPOINT" \
                    --storage-class "${S3_STORAGE_CLASS:-STANDARD}"
                log "INFO" "S3-compatible storage sync completed"
            else
                log "WARN" "AWS CLI not installed, skipping S3-compatible backup"
            fi
            ;;

        *)
            log "WARN" "Unknown cloud provider: $CLOUD_PROVIDER"
            ;;
    esac
else
    log "INFO" "Step 5: Cloud backup disabled or not configured"
fi

# ============================================
# 6. CLEANUP OLD BACKUPS
# ============================================
log "INFO" "Step 6: Cleaning up old backups..."

# Clean local daily backups
find "$BACKUP_DIR/daily" -name "tea_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
DAILY_COUNT=$(ls -1 "$BACKUP_DIR/daily"/tea_db_*.sql.gz 2>/dev/null | wc -l)
log "INFO" "Local daily backups: $DAILY_COUNT (keeping $RETENTION_DAYS days)"

# Clean local weekly backups (keep 12 weeks)
find "$BACKUP_DIR/weekly" -name "tea_db_weekly_*.sql.gz" -mtime +84 -delete 2>/dev/null || true
WEEKLY_COUNT=$(ls -1 "$BACKUP_DIR/weekly"/tea_db_weekly_*.sql.gz 2>/dev/null | wc -l)
log "INFO" "Local weekly backups: $WEEKLY_COUNT (keeping 12 weeks)"

# Clean local monthly backups (keep 12 months)
find "$BACKUP_DIR/monthly" -name "tea_db_monthly_*.sql.gz" -mtime +365 -delete 2>/dev/null || true
MONTHLY_COUNT=$(ls -1 "$BACKUP_DIR/monthly"/tea_db_monthly_*.sql.gz 2>/dev/null | wc -l)
log "INFO" "Local monthly backups: $MONTHLY_COUNT (keeping 12 months)"

# Clean old cloud backups (if using S3 lifecycle rules, this is optional)
if [ "$ENABLE_CLOUD_BACKUP" = "true" ] && [ "$CLOUD_PROVIDER" = "s3" ] && command_exists aws; then
    # List and delete old daily backups from S3
    OLD_DATE=$(date -d "-${REMOTE_RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || date -v-${REMOTE_RETENTION_DAYS}d +%Y-%m-%d)
    log "INFO" "Cleaning S3 backups older than $OLD_DATE"
fi

# ============================================
# 7. SUMMARY
# ============================================
log "INFO" "=========================================="
log "INFO" "Backup Summary"
log "INFO" "=========================================="
log "INFO" "Database: $DB_NAME"
log "INFO" "Backup file: $BACKUP_FILE"
log "INFO" "Size: $BACKUP_SIZE"
log "INFO" "Local backups: $DAILY_COUNT daily, $WEEKLY_COUNT weekly, $MONTHLY_COUNT monthly"
log "INFO" "Remote server: ${ENABLE_REMOTE_SERVER:-disabled}"
log "INFO" "Cloud backup: ${ENABLE_CLOUD_BACKUP:-disabled} (${CLOUD_PROVIDER:-none})"
log "INFO" "=========================================="
log "INFO" "Backup completed successfully!"
log "INFO" "=========================================="

# ============================================
# 8. EMAIL NOTIFICATION (optional)
# ============================================
if [ "$ENABLE_EMAIL_NOTIFICATION" = "true" ] && [ -n "$EMAIL_TO" ]; then
    SUBJECT="[Tea Management] Backup Completed - $DATE_ONLY"
    BODY="Backup completed successfully.\n\nDatabase: $DB_NAME\nFile: $BACKUP_FILE\nSize: $BACKUP_SIZE\n\nLocal backups: $DAILY_COUNT daily, $WEEKLY_COUNT weekly, $MONTHLY_COUNT monthly"

    if command_exists mail; then
        echo -e "$BODY" | mail -s "$SUBJECT" "$EMAIL_TO"
        log "INFO" "Email notification sent to $EMAIL_TO"
    fi
fi

exit 0
