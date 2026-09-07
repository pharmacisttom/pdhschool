#!/usr/bin/env bash
# PDHSCHOOL Automated Backup Script
# Pluakdaeng Hospital Student Training & Internship Management System
set -euo pipefail

BACKUP_DIR="/var/backups/pdhschool"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="pdhschool"
DATABASE_USER="pdhschool_user"
APP_DIR="/var/www/pdhschool"

mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo " Starting PDHSCHOOL Backup: $TIMESTAMP"
echo "=========================================="

# 1. Backup MySQL Database
echo "📦 Backing up MySQL database..."
mysqldump -u "$DATABASE_USER" -p "$DATABASE_NAME" | gzip > "$BACKUP_DIR/db_${DATABASE_NAME}_${TIMESTAMP}.sql.gz"

# 2. Backup Uploaded Private Documents
echo "📁 Backing up document uploads..."
if [ -d "$APP_DIR/public/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$APP_DIR/public" uploads
fi

# 3. Retention policy: remove backups older than 30 days
echo "🧹 Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +30 -delete

echo "✅ Backup completed successfully at $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*"$TIMESTAMP"*
