# Backup & Recovery

This document covers data backup strategies, disaster recovery procedures, and business continuity planning for the OpenPeople.ai platform.

## Table of Contents

- [Backup Strategy](#backup-strategy)
- [Database Backups](#database-backups)
- [File Storage Backups](#file-storage-backups)
- [Configuration Backups](#configuration-backups)
- [Recovery Procedures](#recovery-procedures)
- [Disaster Recovery](#disaster-recovery)
- [Testing and Validation](#testing-and-validation)

---

## Backup Strategy

### Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RPO** (Recovery Point Objective) | 24 hours | Maximum acceptable data loss |
| **RTO** (Recovery Time Objective) | 4 hours | Maximum acceptable downtime |
| **MTTR** (Mean Time to Recovery) | 1 hour | Average recovery time |

### Backup Tiers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKUP HIERARCHY                                   │
│                                                                              │
│  Tier 1: Real-time                                                          │
│  ├── Database replication (Supabase managed)                                │
│  ├── R2 object versioning                                                   │
│  └── Git version control                                                    │
│                                                                              │
│  Tier 2: Daily                                                              │
│  ├── Database point-in-time backup                                          │
│  └── Configuration snapshots                                                │
│                                                                              │
│  Tier 3: Weekly                                                             │
│  ├── Full database export                                                   │
│  └── Cross-region backup copy                                               │
│                                                                              │
│  Tier 4: Monthly                                                            │
│  ├── Archived backups                                                       │
│  └── Compliance retention                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backup Components

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| Database | Supabase PITR | Continuous | 7 days |
| Database | Daily export | Daily | 30 days |
| Database | Weekly full backup | Weekly | 90 days |
| File Storage | R2 versioning | On change | 30 days |
| Configuration | Git + Vercel | On deploy | Forever |
| Secrets | Manual export | Monthly | Secure storage |

---

## Database Backups

### Supabase Managed Backups

Supabase provides automatic backups based on your plan:

| Plan | Backup Type | Frequency | Retention |
|------|-------------|-----------|-----------|
| Free | Daily | 24h | 7 days |
| Pro | Point-in-time | Continuous | 7 days |
| Enterprise | Point-in-time | Continuous | 30+ days |

**Access Backups**: Supabase Dashboard → Settings → Database → Backups

### Manual Database Export

For additional backup security:

```bash
# Export using pg_dump (requires direct database access)
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump

# Or use Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql --data-only
```

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
BACKUP_FILE="$BACKUP_DIR/openpeople_$DATE.dump"

# Create backup
pg_dump -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  -F c \
  -f $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to backup storage
aws s3 cp $BACKUP_FILE.gz s3://openpeople-backups/database/

# Clean up old local backups (keep 7 days)
find $BACKUP_DIR -name "*.dump.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Point-in-Time Recovery (PITR)

Supabase Pro plans support PITR:

1. Go to Supabase Dashboard → Settings → Database → Backups
2. Select "Restore from backup"
3. Choose date/time for restoration
4. Confirm restoration (creates new database instance)

**Important**: PITR restores to a new database instance. You'll need to update connection strings after recovery.

---

## File Storage Backups

### R2 Object Versioning

Enable versioning for automatic file backups:

```javascript
// Cloudflare R2 bucket configuration
{
  "Versioning": {
    "Status": "Enabled"
  }
}
```

**Retrieve Previous Versions**:
```javascript
// List versions of an object
const versions = await r2.listObjectVersions({
  Bucket: 'openpeople-storage',
  Prefix: 'tenant-id/file-key',
});

// Restore a specific version
await r2.copyObject({
  Bucket: 'openpeople-storage',
  CopySource: `openpeople-storage/file-key?versionId=${versionId}`,
  Key: 'file-key',
});
```

### Cross-Region Replication

For disaster recovery, replicate to another region:

```javascript
// R2 replication configuration
{
  "ReplicationConfiguration": {
    "Rules": [
      {
        "Status": "Enabled",
        "Destination": {
          "Bucket": "openpeople-storage-dr"
        }
      }
    ]
  }
}
```

### Storage Export Script

```bash
#!/bin/bash
# scripts/backup-storage.sh

DATE=$(date +%Y%m%d)
BACKUP_BUCKET="openpeople-backups"

# Sync R2 to backup bucket
rclone sync r2:openpeople-storage backup:$BACKUP_BUCKET/storage/$DATE \
  --progress \
  --transfers 32

echo "Storage backup completed to $BACKUP_BUCKET/storage/$DATE"
```

---

## Configuration Backups

### Environment Variables

Export Vercel environment variables:

```bash
# Export all environment variables
vercel env pull .env.backup

# Store securely (encrypted)
gpg --cipher-algo AES256 --symmetric .env.backup
```

### Infrastructure as Code

Maintain infrastructure configuration in version control:

```
infrastructure/
├── vercel.json           # Vercel configuration
├── supabase/
│   ├── config.toml       # Supabase project config
│   └── migrations/       # Database migrations
├── cloudflare/
│   └── r2-config.json    # R2 bucket configuration
└── README.md             # Setup instructions
```

### DNS Configuration Backup

Document DNS records:

```yaml
# dns-records.yaml
openpeople.ai:
  - type: A
    name: "@"
    value: "76.76.21.21"
  - type: CNAME
    name: "www"
    value: "cname.vercel-dns.com"
  - type: CNAME
    name: "*"
    value: "cname.vercel-dns.com"
  - type: TXT
    name: "_resend"
    value: "resend-verification=..."
```

---

## Recovery Procedures

### Database Recovery

#### Scenario: Data Corruption

```bash
# 1. Identify the corruption time
# 2. Access Supabase Dashboard → Backups
# 3. Select point-in-time before corruption
# 4. Restore to new instance

# 5. Verify restored data
psql -h restored-db.supabase.co -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM tenants;"

# 6. Update application configuration
# Update SUPABASE_URL to point to restored database

# 7. Redeploy application
vercel --prod
```

#### Scenario: Accidental Table Drop

```sql
-- If PITR available, restore to point before drop
-- If not, restore from daily backup

-- After restoration, verify data integrity
SELECT 
  schemaname,
  tablename,
  n_live_tup
FROM pg_stat_user_tables
ORDER BY tablename;
```

### File Recovery

#### Scenario: Deleted Files

```javascript
// Restore from R2 versioning
async function restoreDeletedFile(bucket, key) {
  // List all versions including delete markers
  const versions = await r2.listObjectVersions({
    Bucket: bucket,
    Prefix: key,
  });
  
  // Find the last non-deleted version
  const lastVersion = versions.Versions
    .filter(v => !v.IsDeleteMarker)
    .sort((a, b) => b.LastModified - a.LastModified)[0];
  
  // Restore by copying the version
  await r2.copyObject({
    Bucket: bucket,
    CopySource: `${bucket}/${key}?versionId=${lastVersion.VersionId}`,
    Key: key,
  });
  
  return lastVersion;
}
```

### Full Platform Recovery

```
Recovery Runbook - Full Platform
═══════════════════════════════

1. ASSESS
   □ Identify scope of incident
   □ Determine affected components
   □ Establish communication channel

2. DATABASE RECOVERY
   □ Access Supabase Dashboard
   □ Initiate PITR or restore from backup
   □ Verify data integrity
   □ Update connection strings

3. STORAGE RECOVERY
   □ Check R2 bucket status
   □ Restore from versioning or backup
   □ Verify file accessibility

4. APPLICATION RECOVERY
   □ Verify Git repository integrity
   □ Redeploy from last known good commit
   □ Update environment variables if needed

5. VERIFICATION
   □ Test authentication flow
   □ Verify tenant access
   □ Check API endpoints
   □ Validate file uploads/downloads

6. COMMUNICATION
   □ Update status page
   □ Notify affected tenants
   □ Document incident
```

---

## Disaster Recovery

### DR Scenarios

| Scenario | Impact | Recovery Strategy |
|----------|--------|-------------------|
| Vercel outage | Application unavailable | Failover to backup deployment |
| Supabase outage | Database unavailable | PITR to new region |
| R2 outage | Storage unavailable | Restore from DR region |
| Region failure | All services | Cross-region failover |

### Multi-Region Architecture (Enterprise)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-REGION DR ARCHITECTURE                          │
│                                                                              │
│  PRIMARY (US-EAST)                    SECONDARY (EU-WEST)                   │
│  ┌─────────────────────┐              ┌─────────────────────┐               │
│  │   Vercel Edge       │              │   Vercel Edge       │               │
│  │   (Active)          │              │   (Standby)         │               │
│  └──────────┬──────────┘              └──────────┬──────────┘               │
│             │                                    │                           │
│  ┌──────────▼──────────┐   Replication  ┌──────▼──────────┐               │
│  │   Supabase          │ ─────────────► │   Supabase      │               │
│  │   (Primary)         │                │   (Replica)     │               │
│  └─────────────────────┘                └─────────────────┘               │
│             │                                    │                           │
│  ┌──────────▼──────────┐   Replication  ┌──────▼──────────┐               │
│  │   R2 Storage        │ ─────────────► │   R2 Storage    │               │
│  │   (Primary)         │                │   (DR)          │               │
│  └─────────────────────┘                └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Failover Procedure

```bash
#!/bin/bash
# scripts/failover.sh

echo "Starting failover to DR region..."

# 1. Update DNS to point to DR region
# (Manual step - update at DNS provider)

# 2. Promote Supabase replica
supabase db promote --project-ref dr-project-ref

# 3. Update application configuration
vercel env add SUPABASE_URL $DR_SUPABASE_URL --production

# 4. Trigger redeployment
vercel --prod

# 5. Verify services
curl -f https://openpeople.ai/api/health || echo "Health check failed"

echo "Failover complete. Verify all services manually."
```

---

## Testing and Validation

### Backup Testing Schedule

| Test | Frequency | Procedure |
|------|-----------|-----------|
| Backup verification | Daily | Automated integrity check |
| Restore test | Weekly | Restore to test environment |
| DR drill | Quarterly | Full failover simulation |

### Automated Backup Verification

```bash
#!/bin/bash
# scripts/verify-backup.sh

set -e

# Verify database backup exists and is valid
LATEST_BACKUP=$(aws s3 ls s3://openpeople-backups/database/ | tail -1 | awk '{print $4}')

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup found"
  exit 1
fi

# Download and verify
aws s3 cp s3://openpeople-backups/database/$LATEST_BACKUP /tmp/
gunzip /tmp/$LATEST_BACKUP

# Check backup integrity
pg_restore --list /tmp/${LATEST_BACKUP%.gz} > /dev/null
if [ $? -eq 0 ]; then
  echo "Backup verification successful: $LATEST_BACKUP"
else
  echo "ERROR: Backup verification failed"
  exit 1
fi

# Cleanup
rm /tmp/${LATEST_BACKUP%.gz}
```

### Restore Testing

```bash
#!/bin/bash
# scripts/test-restore.sh

TEST_DB="openpeople_test_restore"

# Create test database
createdb $TEST_DB

# Restore from latest backup
pg_restore -d $TEST_DB /path/to/latest/backup.dump

# Verify data
psql -d $TEST_DB -c "SELECT COUNT(*) FROM tenants;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM profiles;"

# Run integrity checks
psql -d $TEST_DB -c "
SELECT 
  (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants,
  (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as super_admins;
"

# Cleanup
dropdb $TEST_DB

echo "Restore test completed successfully"
```

### DR Drill Checklist

```markdown
## Quarterly DR Drill Checklist

### Preparation
- [ ] Schedule drill during low-traffic period
- [ ] Notify stakeholders
- [ ] Prepare rollback plan

### Execution
- [ ] Simulate primary region failure
- [ ] Execute failover procedure
- [ ] Verify application accessibility
- [ ] Test authentication flow
- [ ] Verify data consistency
- [ ] Test API endpoints
- [ ] Measure RTO (actual vs target)

### Validation
- [ ] Confirm all tenants accessible
- [ ] Verify no data loss (RPO)
- [ ] Test file upload/download
- [ ] Confirm email/SMS delivery

### Restoration
- [ ] Failback to primary region
- [ ] Verify data sync
- [ ] Confirm normal operations

### Documentation
- [ ] Record drill results
- [ ] Update runbooks if needed
- [ ] Schedule next drill
```

---

## Related Documentation

- [Deployment Overview](./overview.md)
- [Infrastructure](./infrastructure.md)
- [Monitoring](./monitoring.md)
- [Security Overview](../security/overview.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
