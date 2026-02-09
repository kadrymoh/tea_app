#!/bin/bash

# ============================================
# PostgreSQL Database Backup Script
# ============================================
#
# This script creates automatic backups of your PostgreSQL database
# Run this daily using cron job
#
# Usage:
#   chmod +x backup.sh
#   ./backup.sh
#
# Cron job example (runs at 2 AM daily):
#   0 2 * * * /path/to/tea-management-system/backend/scripts/backup.sh
# ============================================

# Configuration - MODIFY THESE VALUES
DB_NAME="tea_management"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Backup directory
BACKUP_DIR="/var/backups/tea-management"
LOG_FILE="/var/log/tea-management-backup.log"

# Retention period (days to keep backups)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/tea_management_$TIMESTAMP.sql.gz"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo "$1"
}

log "=========================================="
log "Starting PostgreSQL backup..."
log "Database: $DB_NAME"
log "Backup file: $BACKUP_FILE"

# Create backup using pg_dump
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "SUCCESS: Backup completed successfully!"
    log "File size: $BACKUP_SIZE"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "tea_management_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/tea_management_*.sql.gz 2>/dev/null | wc -l)
log "Total backups available: $BACKUP_COUNT"

log "Backup process completed!"
log "=========================================="
