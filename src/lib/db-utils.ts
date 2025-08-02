import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { PostgresJsTransaction } from 'drizzle-orm/postgres-js';
import { ExtractTablesWithRelations } from 'drizzle-orm';

// Transaction type
export type DbTransaction = PostgresJsTransaction<
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>,
  Record<string, never>
>;

// Execute function within a transaction
export async function withTransaction<T>(
  fn: (tx: DbTransaction) => Promise<T>
): Promise<T> {
  return await db.transaction(fn);
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;
    
    return {
      healthy: true,
      latency
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get database statistics
export async function getDatabaseStats() {
  try {
    const [tableStats] = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname;
    `);

    const [connectionStats] = await db.execute(sql`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity;
    `);

    return {
      tables: tableStats,
      connections: connectionStats
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error}`);
  }
}

// Optimistic locking helper
export class OptimisticLockError extends Error {
  constructor(message: string = 'Resource was modified by another process') {
    super(message);
    this.name = 'OptimisticLockError';
  }
}

// Connection pool monitoring
export async function getConnectionPoolStats() {
  try {
    const [poolStats] = await db.execute(sql`
      SELECT 
        numbackends as active_connections,
        xact_commit as transactions_committed,
        xact_rollback as transactions_rolled_back,
        blks_read as blocks_read,
        blks_hit as blocks_hit,
        tup_returned as tuples_returned,
        tup_fetched as tuples_fetched,
        tup_inserted as tuples_inserted,
        tup_updated as tuples_updated,
        tup_deleted as tuples_deleted
      FROM pg_stat_database 
      WHERE datname = current_database();
    `);

    return poolStats;
  } catch (error) {
    throw new Error(`Failed to get connection pool stats: ${error}`);
  }
}

// Database cleanup utilities
export async function cleanupOldData(retentionDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  return await withTransaction(async (tx) => {
    // Clean up old API metrics
    const metricsDeleted = await tx.execute(sql`
      DELETE FROM api_metrics 
      WHERE timestamp < ${cutoffDate.toISOString()}
    `);

    // Clean up resolved alerts older than retention period
    const alertsDeleted = await tx.execute(sql`
      DELETE FROM alerts 
      WHERE is_resolved = true 
      AND resolved_at < ${cutoffDate.toISOString()}
    `);

    // Clean up expired sessions
    const sessionsDeleted = await tx.execute(sql`
      DELETE FROM session 
      WHERE expires_at < NOW()
    `);

    return {
      metricsDeleted: metricsDeleted.rowCount || 0,
      alertsDeleted: alertsDeleted.rowCount || 0,
      sessionsDeleted: sessionsDeleted.rowCount || 0
    };
  });
}

// Index management utilities
export async function analyzeTablePerformance(tableName: string) {
  try {
    const [indexUsage] = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE tablename = ${tableName}
      ORDER BY idx_tup_read DESC;
    `);

    const [tableSize] = await db.execute(sql`
      SELECT 
        pg_size_pretty(pg_total_relation_size(${tableName})) as total_size,
        pg_size_pretty(pg_relation_size(${tableName})) as table_size,
        pg_size_pretty(pg_indexes_size(${tableName})) as indexes_size
    `);

    return {
      indexUsage,
      tableSize: tableSize[0]
    };
  } catch (error) {
    throw new Error(`Failed to analyze table performance: ${error}`);
  }
}