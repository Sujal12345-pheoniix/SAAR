# SAAR Disaster Recovery & Backup Runbook

## 1. RPO & RTO Objectives
- **Recovery Point Objective (RPO)**: < 1 hour (maximum permissible data loss window).
- **Recovery Time Objective (RTO)**: < 2 hours (maximum permissible downtime to restoration).

## 2. Backup Strategy
- **Automated Continuous WAL Archiving**: Point-In-Time Recovery (PITR) enabled via Neon / AWS RDS with 30-day retention window.
- **Daily Logical Backups (`pg_dump`)**:
  - Executed daily at 02:00 UTC.
  - Compressed and encrypted (AES-256) at rest.
  - Stored in geographically isolated object storage (S3 / GCS) with bucket lifecycle protection.
- **Redis Cache**:
  - Configured with `appendonly yes` (AOF) for write endurance.
  - Redis contains non-authoritative ephemeral caches, locks, and token blocklists; authoritative persistence resides in PostgreSQL.

## 3. Disaster Recovery Restoration Procedure

### 3.1 Logical Backup Restore (`pg_restore`)
```bash
# 1. Download and decrypt encrypted backup
aws s3 cp s3://saar-backups-encrypted/prod/backup-2026-09-25.dump.enc ./
gpg --decrypt backup-2026-09-25.dump.enc > backup-latest.dump

# 2. Restore to isolated staging or fresh database target
pg_restore -h <db-host> -U <db-user> -d <target-db> --clean --if-exists --no-owner backup-latest.dump

# 3. Verify data integrity
psql -h <db-host> -U <db-user> -d <target-db> -c "SELECT count(*) FROM \"User\";"
```

### 3.2 Point-In-Time Recovery (PITR)
- In Neon or AWS RDS Console:
  1. Select primary production branch/cluster.
  2. Initiate PITR restore to target timestamp (e.g. 5 minutes before catastrophic incident).
  3. Validate schema and table counts.
  4. Point connection pooling endpoint to restored instance.
