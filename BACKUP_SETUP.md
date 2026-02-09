# Tea Management System - Backup Setup Guide

## Overview

This guide explains how to set up automatic daily backups for your Tea Management System with multiple storage destinations:

1. **Local Server** - Primary backup storage
2. **Remote Server** - Secondary backup via SSH/SCP
3. **Cloud Storage** - AWS S3, Google Cloud, or Dropbox

---

## Quick Start

### 1. Copy and Configure

```bash
cd /var/www/tea-management/backend/scripts

# Copy configuration template
cp backup.config.example backup.config

# Edit configuration
nano backup.config
```

### 2. Set Up Cron Job

```bash
# Make scripts executable
chmod +x daily-backup.sh setup-backup-cron.sh

# Set up automatic daily backup at 2 AM
./setup-backup-cron.sh
```

### 3. Test Backup

```bash
# Run backup manually to test
./daily-backup.sh
```

---

## Detailed Configuration

### Database Settings

```bash
DB_NAME="tea_management"
DB_USER="postgres"
DB_PASSWORD="your-password"
DB_HOST="localhost"
DB_PORT="5432"
```

---

## Option 1: Remote Server Backup (SSH/SCP)

### Prerequisites

1. Set up SSH key-based authentication:

```bash
# Generate SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/backup_key

# Copy key to remote server
ssh-copy-id -i ~/.ssh/backup_key.pub user@backup-server.com

# Test connection
ssh -i ~/.ssh/backup_key user@backup-server.com
```

2. Create backup directory on remote server:

```bash
ssh user@backup-server.com "mkdir -p /backups/tea-management"
```

### Configuration

```bash
REMOTE_ENABLED=true
REMOTE_SERVER="user@backup-server.com"
REMOTE_BACKUP_DIR="/backups/tea-management"
SSH_KEY_PATH="~/.ssh/backup_key"
```

---

## Option 2: AWS S3 Backup

### Prerequisites

1. Install AWS CLI:

```bash
sudo apt update
sudo apt install awscli -y
```

2. Configure AWS credentials:

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your region (e.g., us-east-1)
```

3. Create S3 bucket:

```bash
aws s3 mb s3://your-tea-backup-bucket --region us-east-1
```

4. (Optional) Set up lifecycle policy for automatic cleanup:

```bash
aws s3api put-bucket-lifecycle-configuration \
    --bucket your-tea-backup-bucket \
    --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "DeleteOldBackups",
                "Status": "Enabled",
                "Prefix": "daily/",
                "Expiration": {
                    "Days": 30
                }
            }
        ]
    }'
```

### Configuration

```bash
AWS_S3_ENABLED=true
AWS_S3_BUCKET="your-tea-backup-bucket"
AWS_REGION="us-east-1"
```

---

## Option 3: Google Cloud Storage Backup

### Prerequisites

1. Install Google Cloud SDK:

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

2. Authenticate:

```bash
gcloud auth login
```

3. Create bucket:

```bash
gsutil mb gs://your-tea-backup-bucket
```

### Configuration

```bash
GCS_ENABLED=true
GCS_BUCKET="your-tea-backup-bucket"
```

---

## Option 4: Dropbox Backup

### Prerequisites

1. Install Dropbox Uploader:

```bash
curl -o /usr/local/bin/dropbox_uploader.sh \
    https://raw.githubusercontent.com/andreafabrizi/Dropbox-Uploader/master/dropbox_uploader.sh
chmod +x /usr/local/bin/dropbox_uploader.sh
```

2. Configure (follow prompts):

```bash
/usr/local/bin/dropbox_uploader.sh
```

### Configuration

```bash
DROPBOX_ENABLED=true
DROPBOX_DIR="/backups/tea-management"
```

---

## Notifications

### Email Notifications

```bash
# Install mail utility
sudo apt install mailutils -y

# Configure
NOTIFICATION_EMAIL="admin@yourdomain.com"
```

### Slack Notifications

1. Create Slack Webhook: https://api.slack.com/messaging/webhooks

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/xxx/xxx"
```

---

## Backup Schedule

| Type | Schedule | Retention |
|------|----------|-----------|
| Daily | Every day at 2 AM | 30 days |
| Weekly | Every Sunday | 90 days |
| Monthly | 1st of each month | 365 days |

---

## Restore from Backup

### From Local Backup

```bash
# List available backups
ls -la /var/backups/tea-management/daily/

# Restore specific backup
gunzip -c /var/backups/tea-management/daily/tea_management_backup_2024-01-15.sql.gz | \
    pg_restore -h localhost -U postgres -d tea_management -c
```

### From AWS S3

```bash
# Download backup
aws s3 cp s3://your-bucket/daily/tea_management_backup_2024-01-15.sql.gz ./

# Restore
gunzip -c tea_management_backup_2024-01-15.sql.gz | \
    pg_restore -h localhost -U postgres -d tea_management -c
```

### From Google Cloud Storage

```bash
# Download backup
gsutil cp gs://your-bucket/daily/tea_management_backup_2024-01-15.sql.gz ./

# Restore
gunzip -c tea_management_backup_2024-01-15.sql.gz | \
    pg_restore -h localhost -U postgres -d tea_management -c
```

---

## Monitoring

### Check Backup Logs

```bash
# View today's log
cat /var/backups/tea-management/logs/backup_$(date +%Y-%m-%d).log

# View last backup log
tail -100 /var/log/tea-backup.log
```

### Verify Cron Job

```bash
# List cron jobs
crontab -l

# Check cron service
systemctl status cron
```

---

## Troubleshooting

### Backup Failed

1. Check logs:
```bash
cat /var/backups/tea-management/logs/backup_$(date +%Y-%m-%d).log
```

2. Test database connection:
```bash
psql -h localhost -U postgres -d tea_management -c "SELECT 1"
```

3. Check disk space:
```bash
df -h /var/backups
```

### AWS S3 Upload Failed

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://your-bucket/
```

### Remote Server Connection Failed

```bash
# Test SSH connection
ssh -i ~/.ssh/backup_key -v user@backup-server.com

# Check SSH key permissions
chmod 600 ~/.ssh/backup_key
```

---

## Security Best Practices

1. **Encrypt backups** before uploading to cloud:
```bash
# Add to backup script
gpg --symmetric --cipher-algo AES256 backup.sql.gz
```

2. **Use IAM roles** instead of access keys for AWS

3. **Rotate SSH keys** regularly

4. **Test restores** monthly to ensure backups are valid

5. **Monitor backup sizes** for anomalies

---

## Cost Estimation (Cloud Storage)

| Provider | 100GB/month | Notes |
|----------|-------------|-------|
| AWS S3 Standard | ~$2.30 | Good for frequent access |
| AWS S3 Glacier | ~$0.40 | Good for archives |
| Google Cloud | ~$2.00 | Similar to S3 |
| Dropbox Plus | $9.99 | 2TB included |

---

## Support

For issues or questions:
- Check logs first
- Review this documentation
- Contact system administrator
