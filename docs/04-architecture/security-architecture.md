# Security Architecture - Nexus API Monitoring Dashboard

## Overview

The security architecture for the Nexus API Monitoring Dashboard implements defense-in-depth principles with multiple layers of protection, comprehensive encryption, and strict access controls. This document outlines the security measures, compliance frameworks, and best practices implemented across the entire system.

## Security Framework

### Security Principles

1. **Zero Trust Architecture**: Never trust, always verify
2. **Principle of Least Privilege**: Minimal access rights for users and systems
3. **Defense in Depth**: Multiple overlapping security layers
4. **Encryption Everywhere**: Data protection at rest and in transit
5. **Continuous Monitoring**: Real-time security event detection
6. **Compliance by Design**: Built-in regulatory compliance

### Threat Model

#### Identified Threats
- **External Attacks**: DDoS, injection attacks, API abuse
- **Data Breaches**: Unauthorized access to sensitive data
- **Insider Threats**: Malicious or accidental internal access
- **Supply Chain Attacks**: Third-party dependency vulnerabilities
- **Account Takeover**: Credential theft and session hijacking
- **API Key Exposure**: Leaked or stolen API credentials

#### Attack Vectors
- Web application vulnerabilities
- API endpoint exploitation
- Social engineering
- Phishing attacks
- Man-in-the-middle attacks
- Credential stuffing

## Authentication and Authorization

### Better Auth Implementation

```typescript
// src/lib/auth-config.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { 
  rateLimit, 
  multiFactorAuth, 
  auditLog,
  sessionSecurity 
} from "./auth-plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: "users",
      session: "sessions",
      account: "accounts",
      verification: "verification"
    }
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    // Custom password validation
    passwordValidator: (password: string) => {
      const requirements = [
        /[a-z]/.test(password), // lowercase
        /[A-Z]/.test(password), // uppercase
        /\d/.test(password),    // number
        /[!@#$%^&*(),.?":{}|<>]/.test(password), // special character
        password.length >= 12
      ];
      return requirements.every(Boolean);
    }
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },

  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN
    },
    cookiePrefix: "nexus-",
    generateId: () => crypto.randomUUID()
  },

  plugins: [
    rateLimit({
      loginAttempts: {
        max: 5,
        window: 15 * 60 * 1000, // 15 minutes
        blockDuration: 30 * 60 * 1000 // 30 minutes
      },
      passwordReset: {
        max: 3,
        window: 60 * 60 * 1000 // 1 hour
      }
    }),
    
    multiFactorAuth({
      enabled: true,
      methods: ["totp", "sms", "email"],
      enforceForAdmins: true,
      gracePeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
    }),
    
    auditLog({
      events: ["login", "logout", "password_change", "mfa_setup", "api_key_created"],
      retention: 90 * 24 * 60 * 60 * 1000 // 90 days
    }),
    
    sessionSecurity({
      ipValidation: true,
      userAgentValidation: true,
      concurrentSessions: 5,
      invalidateOnSuspiciousActivity: true
    })
  ]
});
```

### Role-Based Access Control (RBAC)

```typescript
// src/lib/rbac.ts
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  USER = 'user',
  VIEWER = 'viewer'
}

export enum Permission {
  // User management
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  
  // API keys
  CREATE_API_KEY = 'create_api_key',
  READ_API_KEY = 'read_api_key',
  UPDATE_API_KEY = 'update_api_key',
  DELETE_API_KEY = 'delete_api_key',
  
  // Metrics
  READ_METRICS = 'read_metrics',
  EXPORT_METRICS = 'export_metrics',
  
  // Organization
  MANAGE_ORGANIZATION = 'manage_organization',
  INVITE_USERS = 'invite_users',
  
  // Billing
  VIEW_BILLING = 'view_billing',
  MANAGE_BILLING = 'manage_billing',
  
  // System
  SYSTEM_ADMIN = 'system_admin'
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  
  [Role.ORG_ADMIN]: [
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.CREATE_API_KEY,
    Permission.READ_API_KEY,
    Permission.UPDATE_API_KEY,
    Permission.DELETE_API_KEY,
    Permission.READ_METRICS,
    Permission.EXPORT_METRICS,
    Permission.MANAGE_ORGANIZATION,
    Permission.INVITE_USERS,
    Permission.VIEW_BILLING,
    Permission.MANAGE_BILLING
  ],
  
  [Role.USER]: [
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.CREATE_API_KEY,
    Permission.READ_API_KEY,
    Permission.UPDATE_API_KEY,
    Permission.DELETE_API_KEY,
    Permission.READ_METRICS,
    Permission.EXPORT_METRICS
  ],
  
  [Role.VIEWER]: [
    Permission.READ_USER,
    Permission.READ_API_KEY,
    Permission.READ_METRICS
  ]
};

export class RBACService {
  static hasPermission(userRole: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
  }

  static hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  static hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  static getPermissions(userRole: Role): Permission[] {
    return ROLE_PERMISSIONS[userRole] ?? [];
  }
}

// Authorization middleware
export function requirePermission(permission: Permission) {
  return async (req: NextRequest, context: any) => {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = session.user.role as Role;
    if (!RBACService.hasPermission(userRole, permission)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  };
}
```

## Data Security

### Encryption Implementation

```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return Buffer.from(key, 'hex');
  }

  static encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('nexus-api-monitor', 'utf8'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + encrypted data + tag
    return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
  }

  static decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAAD(Buffer.from('nexus-api-monitor', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash API keys for storage
  static async hashApiKey(apiKey: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const hash = await crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  static async verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
    const parts = hashedKey.split(':');
    if (parts.length !== 2) return false;

    const salt = Buffer.from(parts[0], 'hex');
    const storedHash = parts[1];
    const hash = await crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512');
    
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), hash);
  }

  // Generate secure API keys
  static generateApiKey(prefix: string = 'nex'): string {
    const randomPart = crypto.randomBytes(32).toString('base64url');
    return `${prefix}_${randomPart}`;
  }

  // Secure random token generation
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
}
```

### Database Security

```sql
-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY user_isolation ON users
    FOR ALL
    TO authenticated_user
    USING (id = current_user_id());

-- API keys policy
CREATE POLICY api_keys_isolation ON api_keys
    FOR ALL
    TO authenticated_user
    USING (user_id = current_user_id());

-- Metrics policy with organization support
CREATE POLICY metrics_isolation ON api_metrics
    FOR ALL
    TO authenticated_user
    USING (
        user_id = current_user_id() 
        OR organization_id = current_user_organization_id()
    );

-- Budget policy
CREATE POLICY budgets_isolation ON cost_budgets
    FOR ALL
    TO authenticated_user
    USING (user_id = current_user_id());

-- Alerts policy
CREATE POLICY alerts_isolation ON alerts
    FOR ALL
    TO authenticated_user
    USING (user_id = current_user_id());

-- Functions to get current user context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
    SELECT current_setting('app.user_id', true);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS TEXT AS $$
    SELECT current_setting('app.organization_id', true);
$$ LANGUAGE SQL STABLE;

-- Audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            table_name, operation, old_data, user_id, timestamp
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(OLD), 
            current_user_id(), NOW()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            table_name, operation, old_data, new_data, user_id, timestamp
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW),
            current_user_id(), NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name, operation, new_data, user_id, timestamp
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(NEW),
            current_user_id(), NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_api_keys AFTER INSERT OR UPDATE OR DELETE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

## API Security

### Rate Limiting and DDoS Protection

```typescript
// src/lib/rate-limiter.ts
import { Redis } from 'ioredis';

export class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    operation: string = 'default'
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${operation}:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;

    const pipeline = this.redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results?.[0]?.[1] as number;

    const isAllowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetTime = (window + 1) * windowMs;

    return {
      allowed: isAllowed,
      remaining,
      resetTime,
      limit
    };
  }

  // Sliding window rate limiter for more precise control
  async slidingWindowRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `sliding:${identifier}`;
    const now = Date.now();
    const cutoff = now - windowMs;

    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, cutoff);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, now);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const count = results?.[1]?.[1] as number;

    const isAllowed = count < limit;
    const remaining = Math.max(0, limit - count - 1);

    return {
      allowed: isAllowed,
      remaining,
      resetTime: now + windowMs,
      limit
    };
  }
}

// Rate limiting middleware
export function rateLimit(options: {
  keyGenerator?: (req: NextRequest) => string;
  max: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  const limiter = new RateLimiter();

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const identifier = options.keyGenerator?.(req) || 
      req.headers.get('x-forwarded-for') || 
      req.headers.get('x-real-ip') || 
      'unknown';

    const result = await limiter.slidingWindowRateLimit(
      identifier,
      options.max,
      options.windowMs
    );

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: options.message || 'Too many requests',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    return null; // Allow request to continue
  };
}
```

### Input Validation and Sanitization

```typescript
// src/lib/validation.ts
import { z } from 'zod';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export class InputValidator {
  // Sanitize HTML content
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title']
    });
  }

  // Validate and sanitize SQL-like inputs
  static sanitizeSqlInput(input: string): string {
    // Remove potential SQL injection patterns
    const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
    return input.replace(dangerous, '').trim();
  }

  // Validate API endpoint paths
  static validateApiPath(path: string): boolean {
    const validPathPattern = /^\/[a-zA-Z0-9\/_-]*$/;
    return validPathPattern.test(path) && path.length <= 255;
  }

  // Validate and normalize email addresses
  static validateEmail(email: string): boolean {
    return validator.isEmail(email) && email.length <= 254;
  }

  // Validate API key format
  static validateApiKeyFormat(apiKey: string): boolean {
    // Expected format: prefix_base64url
    const keyPattern = /^[a-zA-Z]{2,10}_[A-Za-z0-9_-]{32,}$/;
    return keyPattern.test(apiKey);
  }

  // Strong password validation
  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    if (/(.)\1{3,}/.test(password)) {
      errors.push('Password cannot contain more than 3 consecutive identical characters');
    }

    if (/1234|abcd|qwerty|password/i.test(password)) {
      errors.push('Password cannot contain common patterns');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Validation schemas
export const securitySchemas = {
  apiKey: z.object({
    name: z.string().min(1).max(100).refine(
      (name) => !/<script|javascript:|data:/i.test(name),
      'Invalid characters in API key name'
    ),
    key: z.string().refine(
      InputValidator.validateApiKeyFormat,
      'Invalid API key format'
    )
  }),

  userRegistration: z.object({
    email: z.string().email().refine(
      InputValidator.validateEmail,
      'Invalid email address'
    ),
    password: z.string().refine(
      (password) => InputValidator.validatePassword(password).valid,
      'Password does not meet security requirements'
    ),
    name: z.string().min(1).max(100).transform(
      (name) => validator.escape(name.trim())
    )
  }),

  apiEndpoint: z.object({
    path: z.string().refine(
      InputValidator.validateApiPath,
      'Invalid API endpoint path'
    ),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    description: z.string().max(500).transform(
      InputValidator.sanitizeHtml
    ).optional()
  })
};
```

## Security Monitoring and Incident Response

### Security Event Monitoring

```typescript
// src/lib/security-monitor.ts
export class SecurityMonitor {
  private static readonly SUSPICIOUS_PATTERNS = [
    /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s/gi,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi
  ];

  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const securityLog = {
      id: crypto.randomUUID(),
      type: event.type,
      severity: event.severity,
      description: event.description,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata,
      timestamp: new Date()
    };

    // Store in database
    await db.insert(securityLogs).values(securityLog);

    // Send alerts for critical events
    if (event.severity === 'CRITICAL') {
      await this.sendSecurityAlert(securityLog);
    }

    // Update threat intelligence
    await this.updateThreatIntelligence(event);
  }

  static detectSuspiciousInput(input: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
  }

  static async detectAnomalousBehavior(
    userId: string,
    activity: UserActivity
  ): Promise<AnomalyDetection> {
    const recentActivity = await this.getUserRecentActivity(userId, 24); // 24 hours
    
    const anomalies: string[] = [];

    // Check for unusual request frequency
    if (activity.requestCount > recentActivity.averageRequestCount * 5) {
      anomalies.push('Unusual request frequency');
    }

    // Check for new IP address from different geolocation
    if (activity.ipAddress !== recentActivity.commonIpAddress) {
      const distance = await this.calculateGeoDistance(
        activity.ipAddress,
        recentActivity.commonIpAddress
      );
      
      if (distance > 1000) { // More than 1000km
        anomalies.push('Login from unusual location');
      }
    }

    // Check for new user agent
    if (activity.userAgent !== recentActivity.commonUserAgent) {
      anomalies.push('New device or browser');
    }

    // Check for unusual API usage patterns
    if (activity.apiCallCount > recentActivity.averageApiCalls * 10) {
      anomalies.push('Unusual API usage');
    }

    return {
      isAnomalous: anomalies.length > 0,
      anomalies,
      riskScore: this.calculateRiskScore(anomalies),
      timestamp: new Date()
    };
  }

  private static calculateRiskScore(anomalies: string[]): number {
    const weights = {
      'Unusual request frequency': 30,
      'Login from unusual location': 50,
      'New device or browser': 20,
      'Unusual API usage': 40
    };

    return anomalies.reduce((score, anomaly) => 
      score + (weights[anomaly] || 10), 0
    );
  }

  private static async sendSecurityAlert(event: SecurityLog): Promise<void> {
    // Implementation for sending security alerts
    // Could integrate with Slack, email, PagerDuty, etc.
  }
}

// Security middleware for all requests
export function securityMiddleware() {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const startTime = Date.now();
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check for suspicious patterns in URL
    if (SecurityMonitor.detectSuspiciousInput(req.url)) {
      await SecurityMonitor.logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        severity: 'HIGH',
        description: 'Suspicious pattern detected in URL',
        ipAddress,
        userAgent,
        metadata: { url: req.url }
      });

      return NextResponse.json(
        { error: 'Request blocked for security reasons' },
        { status: 400 }
      );
    }

    // Check request body for suspicious content
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = await req.text();
        if (SecurityMonitor.detectSuspiciousInput(body)) {
          await SecurityMonitor.logSecurityEvent({
            type: 'SUSPICIOUS_PAYLOAD',
            severity: 'HIGH',
            description: 'Suspicious pattern detected in request body',
            ipAddress,
            userAgent,
            metadata: { method: req.method, contentLength: body.length }
          });

          return NextResponse.json(
            { error: 'Request blocked for security reasons' },
            { status: 400 }
          );
        }
      } catch (error) {
        // Continue if unable to read body
      }
    }

    // Log successful security check
    const processingTime = Date.now() - startTime;
    if (processingTime > 1000) { // Log slow requests
      await SecurityMonitor.logSecurityEvent({
        type: 'SLOW_REQUEST',
        severity: 'LOW',
        description: 'Request processing took longer than expected',
        ipAddress,
        userAgent,
        metadata: { processingTime, url: req.url }
      });
    }

    return null; // Allow request to continue
  };
}
```

### Incident Response System

```typescript
// src/lib/incident-response.ts
export class IncidentResponse {
  static async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    const response: IncidentResponse = {
      id: crypto.randomUUID(),
      incidentId: incident.id,
      status: 'INVESTIGATING',
      assignedTo: await this.getOnCallSecurityTeam(),
      actions: [],
      createdAt: new Date()
    };

    // Immediate automated responses
    switch (incident.type) {
      case 'BRUTE_FORCE_ATTACK':
        await this.blockIPAddress(incident.ipAddress, '1h');
        response.actions.push('IP address temporarily blocked');
        break;

      case 'SUSPICIOUS_API_USAGE':
        await this.suspendApiKey(incident.apiKeyId);
        response.actions.push('API key suspended pending investigation');
        break;

      case 'DATA_BREACH_ATTEMPT':
        await this.enableEmergencyMode();
        response.actions.push('Emergency mode activated');
        break;

      case 'PRIVILEGE_ESCALATION':
        await this.lockUserAccount(incident.userId);
        response.actions.push('User account locked');
        break;
    }

    // Store incident response
    await db.insert(incidentResponses).values(response);

    // Notify security team
    await this.notifySecurityTeam(incident, response);

    // Start automated investigation
    await this.startAutomatedInvestigation(incident);
  }

  private static async blockIPAddress(ipAddress: string, duration: string): Promise<void> {
    const redis = new Redis(process.env.REDIS_URL!);
    const expirationSeconds = this.parseDuration(duration);
    
    await redis.setex(`blocked_ip:${ipAddress}`, expirationSeconds, 'true');
  }

  private static async suspendApiKey(apiKeyId: string): Promise<void> {
    await db.update(apiKeys)
      .set({ 
        isActive: false,
        suspendedAt: new Date(),
        suspensionReason: 'Security incident'
      })
      .where(eq(apiKeys.id, apiKeyId));
  }

  private static async enableEmergencyMode(): Promise<void> {
    // Implement emergency mode logic
    // - Increase security logging
    // - Require additional authentication
    // - Restrict sensitive operations
  }

  private static parseDuration(duration: string): number {
    const units = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = duration.match(/(\d+)([smhd])/);
    if (!match) return 3600; // Default 1 hour
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}
```

## Compliance and Privacy

### GDPR Compliance

```typescript
// src/lib/gdpr-compliance.ts
export class GDPRCompliance {
  // Right to be forgotten
  static async deleteUserData(userId: string): Promise<DeletionReport> {
    const deletionReport: DeletionReport = {
      userId,
      startedAt: new Date(),
      tablesProcessed: [],
      recordsDeleted: 0,
      status: 'IN_PROGRESS'
    };

    try {
      await db.transaction(async (tx) => {
        // Delete user metrics
        const metricsDeleted = await tx.delete(apiMetrics)
          .where(eq(apiMetrics.userId, userId));
        deletionReport.recordsDeleted += metricsDeleted.rowCount || 0;
        deletionReport.tablesProcessed.push('api_metrics');

        // Delete API keys
        const keysDeleted = await tx.delete(apiKeys)
          .where(eq(apiKeys.userId, userId));
        deletionReport.recordsDeleted += keysDeleted.rowCount || 0;
        deletionReport.tablesProcessed.push('api_keys');

        // Delete alerts
        const alertsDeleted = await tx.delete(alerts)
          .where(eq(alerts.userId, userId));
        deletionReport.recordsDeleted += alertsDeleted.rowCount || 0;
        deletionReport.tablesProcessed.push('alerts');

        // Anonymize user record instead of deleting
        await tx.update(users)
          .set({
            name: 'Deleted User',
            email: `deleted_${userId}@example.com`,
            isActive: false,
            deletedAt: new Date()
          })
          .where(eq(users.id, userId));
        deletionReport.tablesProcessed.push('users');
      });

      deletionReport.status = 'COMPLETED';
      deletionReport.completedAt = new Date();

    } catch (error) {
      deletionReport.status = 'FAILED';
      deletionReport.error = error.message;
    }

    // Log deletion for compliance
    await this.logDataDeletion(deletionReport);
    
    return deletionReport;
  }

  // Data export for portability
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const userData = await db.select().from(users).where(eq(users.id, userId));
    const apiKeysData = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
    const metricsData = await db.select().from(apiMetrics)
      .where(eq(apiMetrics.userId, userId))
      .limit(10000); // Limit for performance
    const alertsData = await db.select().from(alerts).where(eq(alerts.userId, userId));

    return {
      user: userData[0],
      apiKeys: apiKeysData.map(key => ({
        ...key,
        keyHash: '[REDACTED]' // Don't export sensitive data
      })),
      metrics: metricsData,
      alerts: alertsData,
      exportedAt: new Date(),
      format: 'JSON'
    };
  }

  // Consent management
  static async updateConsent(userId: string, consent: ConsentSettings): Promise<void> {
    await db.update(users)
      .set({
        consent: consent,
        consentUpdatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  private static async logDataDeletion(report: DeletionReport): Promise<void> {
    await db.insert(dataProcessingLogs).values({
      id: crypto.randomUUID(),
      userId: report.userId,
      operation: 'DATA_DELETION',
      details: JSON.stringify(report),
      timestamp: new Date()
    });
  }
}
```

### Security Headers and CSP

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' *.vercel.app wss: ws:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

This comprehensive security architecture provides:

1. **Multi-layered Authentication**: Strong password policies, MFA, session security
2. **Robust Authorization**: RBAC with fine-grained permissions
3. **Data Protection**: End-to-end encryption, secure key management
4. **API Security**: Rate limiting, input validation, DDoS protection
5. **Monitoring & Response**: Real-time threat detection, automated incident response
6. **Compliance**: GDPR compliance, audit logging, data governance
7. **Infrastructure Security**: Security headers, CSP, secure defaults

The security framework is designed to protect against modern threats while maintaining usability and performance for legitimate users.