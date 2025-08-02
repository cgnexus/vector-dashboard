import { db } from '@/db';
import { apiKeys, apiProviders, type ApiKey } from '@/db/schema';
import { and, eq, desc, count, sql } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId, hashSensitiveData } from '@/lib/api-utils';

export interface CreateApiKeyData {
  userId: string;
  providerId: string;
  name: string;
  apiKey: string;
}

export interface UpdateApiKeyData {
  name?: string;
  isActive?: boolean;
}

export interface ApiKeyWithProvider extends ApiKey {
  provider: {
    id: string;
    name: string;
    displayName: string;
  };
}

export class ApiKeyService {
  // Create new API key
  static async create(data: CreateApiKeyData): Promise<ApiKey> {
    return await withTransaction(async (tx) => {
      // Verify provider exists
      const provider = await tx
        .select()
        .from(apiProviders)
        .where(eq(apiProviders.id, data.providerId))
        .limit(1);

      if (!provider.length) {
        throw new Error('Provider not found');
      }

      // Hash the API key for secure storage
      const keyHash = await hashSensitiveData(data.apiKey);

      // Check if key with same hash already exists for this user
      const existingKey = await tx
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.userId, data.userId),
            eq(apiKeys.keyHash, keyHash)
          )
        )
        .limit(1);

      if (existingKey.length > 0) {
        throw new Error('API key already exists');
      }

      const newApiKey: typeof apiKeys.$inferInsert = {
        id: generateId('key'),
        userId: data.userId,
        providerId: data.providerId,
        name: data.name,
        keyHash,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await tx
        .insert(apiKeys)
        .values(newApiKey)
        .returning();

      return created;
    });
  }

  // Get API keys for a user with pagination
  static async getByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      providerId?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{
    keys: ApiKeyWithProvider[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, providerId, isActive } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(apiKeys.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(apiKeys.providerId, providerId));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(apiKeys.isActive, isActive));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated results with provider info
    const keys = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        providerId: apiKeys.providerId,
        name: apiKeys.name,
        keyHash: apiKeys.keyHash,
        lastUsed: apiKeys.lastUsed,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        provider: {
          id: apiProviders.id,
          name: apiProviders.name,
          displayName: apiProviders.displayName
        }
      })
      .from(apiKeys)
      .innerJoin(apiProviders, eq(apiKeys.providerId, apiProviders.id))
      .where(whereClause)
      .orderBy(desc(apiKeys.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      keys,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get single API key by ID (with ownership check)
  static async getById(id: string, userId: string): Promise<ApiKeyWithProvider | null> {
    const [key] = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        providerId: apiKeys.providerId,
        name: apiKeys.name,
        keyHash: apiKeys.keyHash,
        lastUsed: apiKeys.lastUsed,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        provider: {
          id: apiProviders.id,
          name: apiProviders.name,
          displayName: apiProviders.displayName
        }
      })
      .from(apiKeys)
      .innerJoin(apiProviders, eq(apiKeys.providerId, apiProviders.id))
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, userId)
        )
      )
      .limit(1);

    return key || null;
  }

  // Update API key
  static async update(
    id: string,
    userId: string,
    data: UpdateApiKeyData
  ): Promise<ApiKey | null> {
    return await withTransaction(async (tx) => {
      // Verify ownership
      const existing = await tx
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.id, id),
            eq(apiKeys.userId, userId)
          )
        )
        .limit(1);

      if (!existing.length) {
        return null;
      }

      const [updated] = await tx
        .update(apiKeys)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(apiKeys.id, id))
        .returning();

      return updated;
    });
  }

  // Delete API key
  static async delete(id: string, userId: string): Promise<boolean> {
    return await withTransaction(async (tx) => {
      const result = await tx
        .delete(apiKeys)
        .where(
          and(
            eq(apiKeys.id, id),
            eq(apiKeys.userId, userId)
          )
        );

      return (result.rowCount || 0) > 0;
    });
  }

  // Update last used timestamp
  static async updateLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(apiKeys.id, id));
  }

  // Get API key usage statistics
  static async getUsageStats(userId: string, providerId?: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    recentlyUsed: number; // Used in last 7 days
  }> {
    const conditions = [eq(apiKeys.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(apiKeys.providerId, providerId));
    }

    const whereClause = and(...conditions);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stats] = await db
      .select({
        totalKeys: count(),
        activeKeys: count(sql`CASE WHEN ${apiKeys.isActive} = true THEN 1 END`),
        inactiveKeys: count(sql`CASE WHEN ${apiKeys.isActive} = false THEN 1 END`),
        recentlyUsed: count(sql`CASE WHEN ${apiKeys.lastUsed} >= ${sevenDaysAgo.toISOString()} THEN 1 END`)
      })
      .from(apiKeys)
      .where(whereClause);

    return {
      totalKeys: stats.totalKeys,
      activeKeys: stats.activeKeys,
      inactiveKeys: stats.inactiveKeys,
      recentlyUsed: stats.recentlyUsed
    };
  }

  // Verify API key hash (for authentication)
  static async verifyKey(providerId: string, plainKey: string): Promise<ApiKey | null> {
    const keyHash = await hashSensitiveData(plainKey);
    
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.providerId, providerId),
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.isActive, true)
        )
      )
      .limit(1);

    if (key) {
      // Update last used in background
      this.updateLastUsed(key.id).catch(console.error);
    }

    return key || null;
  }

  // Bulk deactivate keys for a provider
  static async bulkDeactivateByProvider(userId: string, providerId: string): Promise<number> {
    const result = await db
      .update(apiKeys)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.providerId, providerId),
          eq(apiKeys.isActive, true)
        )
      );

    return result.rowCount || 0;
  }
}