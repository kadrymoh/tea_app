#!/bin/bash

# ============================================
# PostgreSQL Database Restore Script
# ============================================
#
# This script restores your PostgreSQL database from a backup
#
# Usage:
#   chmod +x restore.sh
#   ./restore.sh <backup_file>
#
# Example:
#   ./restore.sh /var/backups/tea-management/tea_management_2026-01-20_02-00-00.sql.gz
# ============================================

# Configuration - MODIFY THESE VALUES
DB_NAME="tea_management"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "ERROR: No backup file specified!"
    echo "Usage: ./restore.sh <backup_file>"
    echo "Example: ./restore.sh /var/backups/tea-management/tea_management_2026-01-20.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=========================================="
echo "PostgreSQL Database Restore"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""

# Warning prompt
read -p "WARNING: This will replace ALL data in the database. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Starting restore process..."

# Stop the application (optional, uncomment if using PM2)
# echo "Stopping application..."
# pm2 stop backend

# Drop and recreate database
echo "Recreating database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
echo "Restoring from backup..."
gunzip -c $BACKUP_FILE | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "SUCCESS: Database restored successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run: cd /path/to/backend && npx prisma generate"
    echo "2. Restart the application: pm2 restart backend"
else
    echo ""
    echo "ERROR: Restore failed!"
    exit 1
fi

# Restart the application (optional, uncomment if using PM2)
# echo "Restarting application..."
# pm2 restart backend

echo "=========================================="
