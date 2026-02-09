# Database Backup & Restore Guide

## Overview
This guide explains how to backup and restore your PostgreSQL database for the Tea Management System.

---

## Quick Commands

### Manual Backup
```bash
# Create a backup now
pg_dump -h localhost -U postgres tea_management | gzip > backup_$(date +%Y-%m-%d).sql.gz
```

### Restore from Backup
```bash
# Restore from a backup file
gunzip -c backup_2026-01-20.sql.gz | psql -h localhost -U postgres tea_management
```

---

## Automatic Daily Backups (Recommended)

### Step 1: Configure the Backup Script

1. Open the backup script:
```bash
nano /path/to/tea-management-system/backend/scripts/backup.sh
```

2. Update these variables with your database credentials:
```bash
DB_NAME="tea_management"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
```

3. Set the password as an environment variable:
```bash
export DB_PASSWORD="your_postgres_password"
```

4. Make the script executable:
```bash
chmod +x /path/to/tea-management-system/backend/scripts/backup.sh
```

### Step 2: Setup Cron Job for Daily Backups

1. Open crontab:
```bash
crontab -e
```

2. Add this line to run backup at 2 AM daily:
```cron
0 2 * * * DB_PASSWORD="your_password" /path/to/tea-management-system/backend/scripts/backup.sh
```

3. Save and exit

### Step 3: Verify Backups
```bash
# List all backups
ls -la /var/backups/tea-management/

# Check backup log
cat /var/log/tea-management-backup.log
```

---

## Restore Database

### Option 1: Using the Restore Script

```bash
# Make script executable
chmod +x /path/to/tea-management-system/backend/scripts/restore.sh

# Run restore
DB_PASSWORD="your_password" ./restore.sh /var/backups/tea-management/tea_management_2026-01-20_02-00-00.sql.gz
```

### Option 2: Manual Restore

```bash
# 1. Stop the application
pm2 stop backend

# 2. Drop existing database (WARNING: This deletes all data!)
psql -U postgres -c "DROP DATABASE IF EXISTS tea_management;"

# 3. Create new database
psql -U postgres -c "CREATE DATABASE tea_management;"

# 4. Restore from backup
gunzip -c /var/backups/tea-management/tea_management_2026-01-20.sql.gz | psql -U postgres tea_management

# 5. Regenerate Prisma client
cd /path/to/backend
npx prisma generate

# 6. Restart application
pm2 restart backend
```

---

## Backup to Remote Server (Extra Safety)

For extra safety, copy backups to another server:

### Using rsync:
```bash
# Add to cron after backup completes
rsync -avz /var/backups/tea-management/ user@remote-server:/backups/tea-management/
```

### Using AWS S3:
```bash
# Install AWS CLI first
apt install awscli

# Upload backup to S3
aws s3 cp /var/backups/tea-management/tea_management_$(date +%Y-%m-%d)*.sql.gz s3://your-bucket-name/backups/
```

---

## Backup Best Practices

1. **Test Restores Regularly**: At least once a month, test restoring a backup to ensure it works.

2. **Keep Multiple Copies**: Store backups in multiple locations (local server + cloud).

3. **Monitor Backup Jobs**: Check logs regularly to ensure backups are completing successfully.

4. **Encrypt Sensitive Backups**: If storing in cloud, encrypt the backup files.

5. **Document Everything**: Keep a log of when backups are taken and when restores are performed.

---

## Troubleshooting

### Backup fails with "permission denied"
```bash
# Ensure the backup directory exists and has correct permissions
mkdir -p /var/backups/tea-management
chmod 755 /var/backups/tea-management
```

### Backup fails with "authentication failed"
```bash
# Create a .pgpass file for passwordless authentication
echo "localhost:5432:tea_management:postgres:your_password" > ~/.pgpass
chmod 600 ~/.pgpass
```

### Restore fails with "database in use"
```bash
# Stop all connections first
pm2 stop backend
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'tea_management';"
```

---

## Emergency Recovery

If the server completely crashes:

1. **Setup a new server** with the same OS
2. **Install PostgreSQL** and Node.js
3. **Clone the repository**
4. **Restore the database** from your latest backup
5. **Configure environment variables** (.env file)
6. **Run Prisma generate**: `npx prisma generate`
7. **Start the application**: `pm2 start index.js --name backend`

---

## Contact

For emergency support, contact your system administrator.
