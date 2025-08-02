# Database Schema Improvements

## Overview

Based on the analysis of the current schema and the requirements for a comprehensive API monitoring dashboard supporting 10K+ concurrent users, here are the recommended improvements to enhance scalability, performance, and functionality.

## Current Schema Analysis

### Strengths
- ✅ Good foundation with user authentication and basic API monitoring
- ✅ Proper foreign key relationships
- ✅ JSONB fields for flexible metadata storage
- ✅ Timestamping for all records

### Areas for Improvement
- ❌ Missing indexes for high-performance queries
- ❌ No table partitioning for time-series data
- ❌ Limited organization/multi-tenant support
- ❌ Missing advanced alerting and analytics tables
- ❌ No audit logging or security event tracking
- ❌ Missing real-time aggregation support

## Recommended Schema Enhancements

### 1. Add Missing Indexes

```sql
-- Add these indexes to the existing schema for better performance

-- User table indexes
CREATE INDEX CONCURRENTLY idx_users_email_active ON users (email) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_users_organization ON users (organization_id) WHERE organization_id IS NOT NULL;

-- API Keys indexes
CREATE INDEX CONCURRENTLY idx_api_keys_user_provider ON api_keys (user_id, provider_id);
CREATE INDEX CONCURRENTLY idx_api_keys_hash ON api_keys USING HASH (key_hash);
CREATE INDEX CONCURRENTLY idx_api_keys_active ON api_keys (is_active, last_used) WHERE is_active = TRUE;

-- API Metrics indexes (critical for performance)
CREATE INDEX CONCURRENTLY idx_api_metrics_user_timestamp ON api_metrics (user_id, timestamp DESC);
CREATE INDEX CONCURRENTLY idx_api_metrics_provider_timestamp ON api_metrics (provider_id, timestamp DESC);
CREATE INDEX CONCURRENTLY idx_api_metrics_composite ON api_metrics (user_id, provider_id, timestamp DESC);
CREATE INDEX CONCURRENTLY idx_api_metrics_status_errors ON api_metrics (status_code, timestamp DESC) WHERE status_code >= 400;
CREATE INDEX CONCURRENTLY idx_api_metrics_cost ON api_metrics (cost, timestamp DESC) WHERE cost IS NOT NULL;

-- Cost budgets indexes
CREATE INDEX CONCURRENTLY idx_cost_budgets_user_active ON cost_budgets (user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_cost_budgets_provider ON cost_budgets (provider_id, is_active) WHERE is_active = TRUE;

-- Alerts indexes
CREATE INDEX CONCURRENTLY idx_alerts_user_unread ON alerts (user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX CONCURRENTLY idx_alerts_severity ON alerts (severity, is_resolved, created_at DESC) WHERE is_resolved = FALSE;
```

### 2. Add Organization Support

```sql
-- Add organization table for multi-tenant support
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE api_metrics ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE cost_budgets ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization references
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE api_keys ADD CONSTRAINT fk_api_keys_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE cost_budgets ADD CONSTRAINT fk_cost_budgets_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add indexes for organization support
CREATE INDEX CONCURRENTLY idx_users_organization_role ON users (organization_id, role) WHERE organization_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_api_keys_organization ON api_keys (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_api_metrics_organization_time ON api_metrics (organization_id, timestamp DESC) WHERE organization_id IS NOT NULL;
```

### 3. Enhance API Providers Table

```sql
-- Add missing fields to api_providers
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS documentation_url TEXT;
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'usage';
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS rate_limits JSONB;
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS supported_auth_types TEXT[] DEFAULT ARRAY['api_key'];
ALTER TABLE api_providers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing providers with default values
UPDATE api_providers SET 
    category = CASE 
        WHEN name IN ('openai', 'openrouter') THEN 'ai'
        WHEN name = 'twilio' THEN 'communication'
        WHEN name = 'exa' THEN 'search'
        WHEN name = 'apollo' THEN 'crm'
        ELSE 'other'
    END,
    pricing_model = 'usage',
    supported_auth_types = ARRAY['api_key']
WHERE category IS NULL;
```

### 4. Enhance API Keys Security

```sql
-- Add security fields to api_keys
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix TEXT;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rate_limit_override JSONB;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Update existing keys with prefix (first 8 characters)
UPDATE api_keys SET key_prefix = LEFT(key_hash, 8) WHERE key_prefix IS NULL;

-- Add constraint to ensure prefix exists
ALTER TABLE api_keys ADD CONSTRAINT chk_api_keys_prefix CHECK (key_prefix IS NOT NULL);
```

### 5. Add API Endpoints Table

```sql
-- Create api_endpoints table for detailed monitoring
CREATE TABLE api_endpoints (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    cost_per_request DECIMAL(10, 6),
    cost_per_token DECIMAL(10, 8),
    expected_response_time_ms INTEGER,
    rate_limit_per_minute INTEGER,
    is_deprecated BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider_id, path, method)
);

-- Add indexes
CREATE INDEX idx_api_endpoints_provider ON api_endpoints (provider_id, is_deprecated);
CREATE INDEX idx_api_endpoints_category ON api_endpoints (category) WHERE category IS NOT NULL;

-- Add endpoint_id to api_metrics
ALTER TABLE api_metrics ADD COLUMN IF NOT EXISTS endpoint_id TEXT REFERENCES api_endpoints(id);
```

### 6. Partition api_metrics Table

```sql
-- Convert api_metrics to partitioned table (requires data migration)
-- This should be done during a maintenance window

-- 1. Create new partitioned table
CREATE TABLE api_metrics_new (
    id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    organization_id TEXT,
    api_key_id TEXT,
    endpoint_id TEXT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    cost DECIMAL(12, 8),
    tokens JSONB,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- 2. Create monthly partitions
SELECT create_monthly_partition('api_metrics_new', DATE_TRUNC('month', CURRENT_DATE) + (n || ' months')::INTERVAL)
FROM generate_series(-6, 12) n;

-- 3. Migrate data (do this in chunks)
-- INSERT INTO api_metrics_new SELECT * FROM api_metrics WHERE timestamp >= '2024-01-01';

-- 4. Rename tables (atomic operation)
-- ALTER TABLE api_metrics RENAME TO api_metrics_old;
-- ALTER TABLE api_metrics_new RENAME TO api_metrics;
```

### 7. Add Real-time Aggregation Tables

```sql
-- Hourly aggregations for real-time dashboards
CREATE TABLE hourly_metrics_summary (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT,
    provider_id TEXT NOT NULL,
    hour TIMESTAMP NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    avg_response_time NUMERIC(8,2),
    total_cost DECIMAL(12, 8) NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    unique_endpoints INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider_id, hour)
);

-- Daily aggregations for analytics
CREATE TABLE daily_metrics_summary (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT,
    provider_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    avg_response_time NUMERIC(8,2),
    total_cost DECIMAL(12, 8) NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    unique_endpoints INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider_id, date)
);

-- Indexes for aggregation tables
CREATE INDEX idx_hourly_summary_user_hour ON hourly_metrics_summary (user_id, hour DESC);
CREATE INDEX idx_hourly_summary_provider_hour ON hourly_metrics_summary (provider_id, hour DESC);
CREATE INDEX idx_daily_summary_user_date ON daily_metrics_summary (user_id, date DESC);
CREATE INDEX idx_daily_summary_provider_date ON daily_metrics_summary (provider_id, date DESC);
```

### 8. Enhanced Alerting System

```sql
-- Alert rules table
CREATE TABLE alert_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id TEXT REFERENCES api_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL, -- cost_threshold, error_rate, response_time, downtime, anomaly
    conditions JSONB NOT NULL,
    thresholds JSONB NOT NULL,
    evaluation_window TEXT NOT NULL, -- 5m, 15m, 1h, 1d
    notification_channels JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Alert notifications tracking
CREATE TABLE alert_notifications (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL, -- email, slack, webhook, sms
    channel_config JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, retrying
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alert_rules_user_active ON alert_rules (user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_alert_notifications_status ON alert_notifications (status, created_at);
```

### 9. Audit and Security Logging

```sql
-- Security events logging
CREATE TABLE security_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit trail for sensitive operations
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data processing logs for GDPR compliance
CREATE TABLE data_processing_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- DATA_EXPORT, DATA_DELETION, CONSENT_UPDATE
    details JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for security and audit logs
CREATE INDEX idx_security_logs_severity_time ON security_logs (severity, timestamp DESC);
CREATE INDEX idx_security_logs_user_time ON security_logs (user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_table_time ON audit_logs (table_name, timestamp DESC);
CREATE INDEX idx_audit_logs_user_time ON audit_logs (user_id, timestamp DESC) WHERE user_id IS NOT NULL;
```

### 10. Performance Monitoring Tables

```sql
-- API health checks
CREATE TABLE health_checks (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
    endpoint_id TEXT REFERENCES api_endpoints(id),
    check_type TEXT NOT NULL, -- ping, auth_test, full_test
    status TEXT NOT NULL, -- healthy, degraded, unhealthy
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    checked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SLA tracking
CREATE TABLE slo_metrics (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- availability, latency, error_rate
    target_value DECIMAL(8, 4) NOT NULL,
    actual_value DECIMAL(8, 4) NOT NULL,
    measurement_window TEXT NOT NULL, -- 1h, 1d, 7d, 30d
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    breach_duration_seconds INTEGER DEFAULT 0,
    is_breached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_checks_provider_time ON health_checks (provider_id, checked_at DESC);
CREATE INDEX idx_slo_metrics_provider_type ON slo_metrics (provider_id, metric_type, period_start DESC);
```

## Migration Strategy

### Phase 1: Non-Breaking Changes
1. Add new columns with default values
2. Create new tables that don't affect existing functionality
3. Add indexes concurrently
4. Update application code to use new fields

### Phase 2: Data Migration
1. Populate new fields with computed values
2. Create and populate aggregation tables
3. Test new functionality thoroughly

### Phase 3: Breaking Changes
1. Partition large tables during maintenance window
2. Update foreign key constraints
3. Remove deprecated columns/tables
4. Optimize and rebuild indexes

### SQL Migration Scripts

```sql
-- migration_001_add_indexes.sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_metrics_user_timestamp ON api_metrics (user_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_metrics_provider_timestamp ON api_metrics (provider_id, timestamp DESC);
-- ... add all other indexes

-- migration_002_add_organization_support.sql
-- Add organization columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- ... add other organization fields

-- migration_003_create_new_tables.sql
-- Create all new tables
CREATE TABLE IF NOT EXISTS api_endpoints (...);
CREATE TABLE IF NOT EXISTS alert_rules (...);
-- ... create other new tables

-- migration_004_partition_metrics.sql
-- Partition metrics table (maintenance window required)
-- ... partitioning logic

-- migration_005_create_aggregations.sql
-- Create and populate aggregation tables
CREATE TABLE hourly_metrics_summary (...);
-- ... create aggregation logic
```

## Performance Benefits

### Expected Improvements
1. **Query Performance**: 10-100x faster queries with proper indexing
2. **Scalability**: Partitioning enables handling of billions of metrics
3. **Real-time Dashboards**: Pre-aggregated data for instant loading
4. **Concurrent Users**: Optimized for 10K+ concurrent users
5. **Storage Efficiency**: Better compression and organization

### Monitoring Metrics
- Query execution time (target: <100ms for 95th percentile)
- Index usage statistics
- Table size and growth rate
- Connection pool utilization
- Cache hit ratios

## Next Steps

1. **Review and approve** the proposed schema changes
2. **Create migration scripts** for each phase
3. **Test migrations** in staging environment
4. **Plan maintenance windows** for breaking changes
5. **Monitor performance** after each migration
6. **Update application code** to leverage new features

This comprehensive schema enhancement will transform the current basic monitoring system into a enterprise-grade API monitoring platform capable of handling massive scale while providing rich analytics and real-time insights.