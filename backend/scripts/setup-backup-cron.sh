#!/bin/bash
# ============================================
# Setup Backup Cron Job
# ============================================
# Run this script once to set up automatic daily backups
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/daily-backup.sh"

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "daily-backup.sh"; then
    echo "Backup cron job already exists"
    echo "Current cron jobs:"
    crontab -l | grep backup
    exit 0
fi

# Add cron job - runs daily at 2:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * ${BACKUP_SCRIPT} >> /var/log/tea-backup.log 2>&1") | crontab -

echo "Cron job added successfully!"
echo ""
echo "Backup will run daily at 2:00 AM"
echo ""
echo "To verify, run: crontab -l"
echo "To test backup now, run: ${BACKUP_SCRIPT}"
echo ""
echo "IMPORTANT: Before running backup, configure these in daily-backup.sh:"
echo "  1. Database credentials (DB_NAME, DB_USER, DB_HOST)"
echo "  2. Remote server (REMOTE_SERVER, SSH_KEY_PATH)"
echo "  3. Cloud storage (AWS_S3_BUCKET or GCS_BUCKET)"
echo "  4. Notification email (NOTIFICATION_EMAIL)"
