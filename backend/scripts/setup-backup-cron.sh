#!/bin/bash

# ============================================
# Tea Management System - Setup Backup Cron Jobs
# ============================================
# Run this script once to set up automatic backups
#
# Usage:
#   chmod +x setup-backup-cron.sh
#   sudo ./setup-backup-cron.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
LOG_FILE="/var/log/tea-management-backup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_msg() {
    echo -e "${1}${2}${NC}"
}

print_msg "$BLUE" "=========================================="
print_msg "$BLUE" "Tea Management System - Backup Setup"
print_msg "$BLUE" "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_msg "$YELLOW" "Note: Running without sudo. Some operations may require root privileges."
fi

# 1. Create necessary directories
print_msg "$BLUE" "Step 1: Creating directories..."
sudo mkdir -p /var/backups/tea-management/{daily,weekly,monthly}
sudo mkdir -p /var/log
sudo touch "$LOG_FILE"
sudo chmod 666 "$LOG_FILE"
print_msg "$GREEN" "✓ Directories created"

# 2. Make scripts executable
print_msg "$BLUE" "Step 2: Setting script permissions..."
chmod +x "$BACKUP_SCRIPT"
chmod +x "${SCRIPT_DIR}/restore.sh" 2>/dev/null || true
print_msg "$GREEN" "✓ Scripts are executable"

# 3. Check for config file
print_msg "$BLUE" "Step 3: Checking configuration..."
if [ ! -f "${SCRIPT_DIR}/backup.config" ]; then
    print_msg "$YELLOW" "⚠ Configuration file not found!"
    print_msg "$YELLOW" "  Creating from template..."
    cp "${SCRIPT_DIR}/backup.config.example" "${SCRIPT_DIR}/backup.config"
    print_msg "$YELLOW" "  Please edit: ${SCRIPT_DIR}/backup.config"
else
    print_msg "$GREEN" "✓ Configuration file exists"
fi

# 4. Check if cron job already exists
print_msg "$BLUE" "Step 4: Setting up cron jobs..."

CRON_EXISTS=false
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    print_msg "$YELLOW" "⚠ Backup cron job already exists"
    CRON_EXISTS=true
fi

if [ "$CRON_EXISTS" = false ]; then
    # Add cron jobs
    # Daily backup at 2:00 AM
    (crontab -l 2>/dev/null; echo "# Tea Management System Backups") | crontab -
    (crontab -l 2>/dev/null; echo "0 2 * * * ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1") | crontab -

    print_msg "$GREEN" "✓ Daily backup cron job added (runs at 2:00 AM)"
fi

# 5. Show current cron jobs
echo ""
print_msg "$BLUE" "Current backup cron jobs:"
crontab -l 2>/dev/null | grep -E "(backup|Tea)" || echo "  (none)"

# 6. Test database connection
echo ""
print_msg "$BLUE" "Step 5: Testing configuration..."

if [ -f "${SCRIPT_DIR}/backup.config" ]; then
    source "${SCRIPT_DIR}/backup.config"

    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi

    if psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-tea_management}" -c "SELECT 1" > /dev/null 2>&1; then
        print_msg "$GREEN" "✓ Database connection successful"
    else
        print_msg "$RED" "✗ Database connection failed"
        print_msg "$YELLOW" "  Please check credentials in backup.config"
    fi
else
    print_msg "$YELLOW" "⚠ Cannot test - config file missing"
fi

# 7. Summary
echo ""
print_msg "$BLUE" "=========================================="
print_msg "$GREEN" "Setup Complete!"
print_msg "$BLUE" "=========================================="
echo ""
print_msg "$BLUE" "Quick Commands:"
echo "  Run backup now:      ${BACKUP_SCRIPT}"
echo "  View backup log:     tail -f ${LOG_FILE}"
echo "  List backups:        ${SCRIPT_DIR}/restore.sh --list"
echo "  Restore backup:      ${SCRIPT_DIR}/restore.sh --latest"
echo "  Edit config:         nano ${SCRIPT_DIR}/backup.config"
echo "  View cron jobs:      crontab -l"
echo ""

if [ ! -f "${SCRIPT_DIR}/backup.config" ] || ! grep -q "DB_PASSWORD=" "${SCRIPT_DIR}/backup.config" 2>/dev/null; then
    print_msg "$YELLOW" "IMPORTANT: Configure backup.config before running backup!"
    echo ""
fi

print_msg "$BLUE" "Backup Schedule:"
echo "  Daily:   Every day at 2:00 AM"
echo "  Weekly:  Every Sunday (kept 12 weeks)"
echo "  Monthly: 1st of month (kept 12 months)"
echo ""

# Optional: Run a test backup
read -p "Run a test backup now? (y/n): " RUN_TEST
if [ "$RUN_TEST" = "y" ] || [ "$RUN_TEST" = "Y" ]; then
    echo ""
    print_msg "$BLUE" "Running test backup..."
    "$BACKUP_SCRIPT"
fi
