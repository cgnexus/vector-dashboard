import { pgTable, text, timestamp, boolean, integer, decimal, jsonb } from 'drizzle-orm/pg-core';

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

// API Monitoring Tables
export const apiProviders = pgTable("api_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  baseUrl: text("base_url"),
  status: text("status").$default("active").notNull(), // active, inactive, maintenance
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull().references(() => apiProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(), // Store hashed version for security
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").$default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const apiMetrics = pgTable("api_metrics", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => apiProviders.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  apiKeyId: text("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // in milliseconds
  requestSize: integer("request_size"), // in bytes
  responseSize: integer("response_size"), // in bytes
  cost: decimal("cost", { precision: 10, scale: 6 }), // API cost if applicable
  tokens: jsonb("tokens"), // token usage for AI APIs { input: number, output: number, total: number }
  metadata: jsonb("metadata"), // additional provider-specific data
  timestamp: timestamp("timestamp").$defaultFn(() => new Date()).notNull(),
});

export const costBudgets = pgTable("cost_budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => apiProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // daily, weekly, monthly, yearly
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }), // percentage (0-100)
  isActive: boolean("is_active").$default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => apiProviders.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // cost_threshold, rate_limit, error_rate, downtime
  severity: text("severity").notNull(), // low, medium, high, critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // alert-specific data
  isRead: boolean("is_read").$default(false).notNull(),
  isResolved: boolean("is_resolved").$default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const alertRules = pgTable("alert_rules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => apiProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // cost_threshold, rate_limit, error_rate, downtime, slow_response
  severity: text("severity").notNull(), // low, medium, high, critical
  conditions: jsonb("conditions").notNull(), // threshold, timeWindow, metric, operator
  isActive: boolean("is_active").$default(true).notNull(),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").$default(0).notNull(),
  cooldownMinutes: integer("cooldown_minutes").$default(60).notNull(), // prevent spam
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const notificationChannels = pgTable("notification_channels", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // email, webhook, slack, discord, teams, in_app
  config: jsonb("config").notNull(), // channel-specific configuration
  isActive: boolean("is_active").$default(true).notNull(),
  isVerified: boolean("is_verified").$default(false).notNull(),
  lastUsed: timestamp("last_used"),
  failureCount: integer("failure_count").$default(0).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const alertDeliveries = pgTable("alert_deliveries", {
  id: text("id").primaryKey(),
  alertId: text("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull().references(() => notificationChannels.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // pending, sent, failed, retrying
  attempt: integer("attempt").$default(1).notNull(),
  maxAttempts: integer("max_attempts").$default(3).notNull(),
  error: text("error"),
  response: jsonb("response"), // provider response data
  sentAt: timestamp("sent_at"),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // cost_threshold, rate_limit, error_rate, etc.
  severity: text("severity").notNull(), // low, medium, high, critical
  channelId: text("channel_id").notNull().references(() => notificationChannels.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").$default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const notificationTemplates = pgTable("notification_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // email, webhook, slack, discord, teams
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  subject: text("subject"), // for email
  body: text("body").notNull(),
  variables: jsonb("variables"), // available template variables
  isDefault: boolean("is_default").$default(false).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// Type exports for better TypeScript support
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type ApiProvider = typeof apiProviders.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ApiMetric = typeof apiMetrics.$inferSelect;
export type CostBudget = typeof costBudgets.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type AlertRule = typeof alertRules.$inferSelect;
export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type AlertDelivery = typeof alertDeliveries.$inferSelect;
export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
