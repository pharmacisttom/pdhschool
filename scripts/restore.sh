#!/usr/bin/env bash
# PDHSCHOOL Restore Script
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path-to-db-backup.sql.gz> [path-to-uploads.tar.gz]"
    exit 1
fi

DB_BACKUP="$1"
DATABASE_NAME="pdhschool"
DATABASE_USER="pdhschool_user"
APP_DIR="/var/www/pdhschool"

echo "=========================================="
echo " Restoring PDHSCHOOL Database"
echo "=========================================="

echo "⚠️  This will overwrite database $DATABASE_NAME. Are you sure? (Ctrl+C to cancel in 5s)"
sleep 5

echo "📥 Restoring MySQL Database from $DB_BACKUP..."
gunzip < "$DB_BACKUP" | mysql -u "$DATABASE_USER" -p "$DATABASE_NAME"

if [ "$#" -ge 2 ]; then
    UPLOADS_BACKUP="$2"
    echo "📥 Restoring uploads from $UPLOADS_BACKUP..."
    tar -xzf "$UPLOADS_BACKUP" -C "$APP_DIR/public"
fi

echo "✅ Restore completed successfully!"
