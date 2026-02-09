#!/bin/bash

# ============================================
# Tea Management System - Database Restore Script
# ============================================
#
# Restores database from local or cloud backup
#
# Usage:
#   chmod +x restore.sh
#   ./restore.sh <backup_file>
#   ./restore.sh --list                    # List available backups
#   ./restore.sh --latest                  # Restore latest backup
#   ./restore.sh --from-s3 <s3_path>       # Restore from S3
#   ./restore.sh --from-remote <path>      # Restore from remote server
#
# Examples:
#   ./restore.sh /var/backups/tea-management/daily/tea_db_2026-01-31_02-00-00.sql.gz
#   ./restore.sh --latest
#   ./restore.sh --from-s3 s3://bucket/backups/daily/tea_db_2026-01-31.sql.gz
# ============================================

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/backup.config"

if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "WARNING: Configuration file not found, using defaults"
    DB_NAME="tea_management"
    DB_USER="postgres"
    DB_HOST="localhost"
    DB_PORT="5432"
    BACKUP_DIR="/var/backups/tea-management"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Temp directory for downloads
TEMP_DIR="/tmp/tea-restore-$$"

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}
trap cleanup EXIT

# Print colored message
print_msg() {
    local color="$1"
    local msg="$2"
    echo -e "${color}${msg}${NC}"
}

# List available backups
list_backups() {
    print_msg "$BLUE" "=========================================="
    print_msg "$BLUE" "Available Local Backups"
    print_msg "$BLUE" "=========================================="

    echo ""
    print_msg "$GREEN" "Daily Backups:"
    if [ -d "$BACKUP_DIR/daily" ]; then
        ls -lh "$BACKUP_DIR/daily"/*.sql.gz 2>/dev/null | tail -10 || echo "  (none)"
    else
        echo "  (directory not found)"
    fi

    echo ""
    print_msg "$GREEN" "Weekly Backups:"
    if [ -d "$BACKUP_DIR/weekly" ]; then
        ls -lh "$BACKUP_DIR/weekly"/*.sql.gz 2>/dev/null || echo "  (none)"
    else
        echo "  (directory not found)"
    fi

    echo ""
    print_msg "$GREEN" "Monthly Backups:"
    if [ -d "$BACKUP_DIR/monthly" ]; then
        ls -lh "$BACKUP_DIR/monthly"/*.sql.gz 2>/dev/null || echo "  (none)"
    else
        echo "  (directory not found)"
    fi

    echo ""
}

# Get latest backup file
get_latest_backup() {
    local latest=""

    # Check daily first
    if [ -d "$BACKUP_DIR/daily" ]; then
        latest=$(ls -t "$BACKUP_DIR/daily"/*.sql.gz 2>/dev/null | head -1)
    fi

    # Fallback to weekly
    if [ -z "$latest" ] && [ -d "$BACKUP_DIR/weekly" ]; then
        latest=$(ls -t "$BACKUP_DIR/weekly"/*.sql.gz 2>/dev/null | head -1)
    fi

    # Fallback to monthly
    if [ -z "$latest" ] && [ -d "$BACKUP_DIR/monthly" ]; then
        latest=$(ls -t "$BACKUP_DIR/monthly"/*.sql.gz 2>/dev/null | head -1)
    fi

    echo "$latest"
}

# Download from S3
download_from_s3() {
    local s3_path="$1"
    local local_file="$TEMP_DIR/backup.sql.gz"

    mkdir -p "$TEMP_DIR"

    print_msg "$BLUE" "Downloading from S3: $s3_path"

    if [ -n "$S3_ENDPOINT" ]; then
        aws s3 cp "$s3_path" "$local_file" --endpoint-url "$S3_ENDPOINT"
    else
        aws s3 cp "$s3_path" "$local_file"
    fi

    echo "$local_file"
}

# Download from remote server
download_from_remote() {
    local remote_path="$1"
    local local_file="$TEMP_DIR/backup.sql.gz"

    mkdir -p "$TEMP_DIR"

    print_msg "$BLUE" "Downloading from remote server..."

    scp -P "${REMOTE_PORT:-22}" \
        -i "${REMOTE_SSH_KEY:-~/.ssh/id_rsa}" \
        "${REMOTE_USER:-root}@${REMOTE_SERVER}:${remote_path}" \
        "$local_file"

    echo "$local_file"
}

# Perform restore
do_restore() {
    local backup_file="$1"

    # Verify file exists and is not empty
    if [ ! -f "$backup_file" ]; then
        print_msg "$RED" "ERROR: Backup file not found: $backup_file"
        exit 1
    fi

    if [ ! -s "$backup_file" ]; then
        print_msg "$RED" "ERROR: Backup file is empty: $backup_file"
        exit 1
    fi

    local file_size=$(du -h "$backup_file" | cut -f1)

    print_msg "$BLUE" "=========================================="
    print_msg "$BLUE" "Tea Management System - Database Restore"
    print_msg "$BLUE" "=========================================="
    echo ""
    echo "Database:    $DB_NAME"
    echo "Host:        $DB_HOST:$DB_PORT"
    echo "User:        $DB_USER"
    echo "Backup file: $backup_file"
    echo "File size:   $file_size"
    echo ""

    print_msg "$YELLOW" "WARNING: This will REPLACE ALL DATA in the database!"
    print_msg "$YELLOW" "This action cannot be undone!"
    echo ""
    read -p "Type 'yes' to continue: " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        print_msg "$YELLOW" "Restore cancelled."
        exit 0
    fi

    echo ""
    print_msg "$BLUE" "Starting restore process..."

    # Export password for psql
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi

    # Create a temporary backup of current database (just in case)
    print_msg "$BLUE" "Creating safety backup of current database..."
    local safety_backup="$BACKUP_DIR/safety_backup_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$safety_backup" || true
    if [ -s "$safety_backup" ]; then
        print_msg "$GREEN" "Safety backup created: $safety_backup"
    fi

    # Terminate existing connections
    print_msg "$BLUE" "Terminating existing database connections..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
        AND pid <> pg_backend_pid();
    " 2>/dev/null || true

    # Drop and recreate database
    print_msg "$BLUE" "Dropping existing database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null

    print_msg "$BLUE" "Creating fresh database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

    # Restore from backup
    print_msg "$BLUE" "Restoring data from backup..."
    gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo ""
        print_msg "$GREEN" "=========================================="
        print_msg "$GREEN" "SUCCESS: Database restored successfully!"
        print_msg "$GREEN" "=========================================="
        echo ""
        print_msg "$BLUE" "Next steps:"
        echo "1. Regenerate Prisma client: cd backend && npx prisma generate"
        echo "2. Restart the application: pm2 restart backend"
        echo ""
        print_msg "$YELLOW" "Safety backup location: $safety_backup"
    else
        print_msg "$RED" "ERROR: Restore failed!"
        print_msg "$YELLOW" "You can restore the safety backup: $safety_backup"
        exit 1
    fi
}

# Main logic
case "${1:-}" in
    --list|-l)
        list_backups
        ;;

    --latest)
        BACKUP_FILE=$(get_latest_backup)
        if [ -z "$BACKUP_FILE" ]; then
            print_msg "$RED" "ERROR: No backup files found!"
            exit 1
        fi
        print_msg "$GREEN" "Latest backup: $BACKUP_FILE"
        do_restore "$BACKUP_FILE"
        ;;

    --from-s3)
        if [ -z "$2" ]; then
            print_msg "$RED" "ERROR: S3 path required"
            echo "Usage: ./restore.sh --from-s3 s3://bucket/path/backup.sql.gz"
            exit 1
        fi
        BACKUP_FILE=$(download_from_s3 "$2")
        do_restore "$BACKUP_FILE"
        ;;

    --from-remote)
        if [ -z "$2" ]; then
            print_msg "$RED" "ERROR: Remote path required"
            echo "Usage: ./restore.sh --from-remote /var/backups/tea-management/daily/backup.sql.gz"
            exit 1
        fi
        BACKUP_FILE=$(download_from_remote "$2")
        do_restore "$BACKUP_FILE"
        ;;

    --help|-h)
        echo "Usage: ./restore.sh [OPTIONS] [BACKUP_FILE]"
        echo ""
        echo "Options:"
        echo "  --list, -l          List available local backups"
        echo "  --latest            Restore the most recent backup"
        echo "  --from-s3 <path>    Download and restore from S3"
        echo "  --from-remote <path> Download and restore from remote server"
        echo "  --help, -h          Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./restore.sh --list"
        echo "  ./restore.sh --latest"
        echo "  ./restore.sh /var/backups/tea-management/daily/tea_db_2026-01-31.sql.gz"
        echo "  ./restore.sh --from-s3 s3://my-bucket/backups/daily/tea_db_2026-01-31.sql.gz"
        ;;

    "")
        print_msg "$RED" "ERROR: No backup file specified!"
        echo "Usage: ./restore.sh <backup_file>"
        echo "       ./restore.sh --help for more options"
        exit 1
        ;;

    *)
        do_restore "$1"
        ;;
esac
