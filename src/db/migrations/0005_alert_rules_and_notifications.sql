-- Create alert rules table
CREATE TABLE IF NOT EXISTS "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"trigger_count" integer DEFAULT 0 NOT NULL,
	"cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create notification channels table
CREATE TABLE IF NOT EXISTS "notification_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_used" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create alert deliveries table
CREATE TABLE IF NOT EXISTS "alert_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"status" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"error" text,
	"response" jsonb,
	"sent_at" timestamp,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"channel_id" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"variables" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_provider_id_api_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "api_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_channel_id_notification_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "notification_channels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_channel_id_notification_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "notification_channels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "alert_rules_user_id_idx" ON "alert_rules" ("user_id");
CREATE INDEX IF NOT EXISTS "alert_rules_provider_id_idx" ON "alert_rules" ("provider_id");
CREATE INDEX IF NOT EXISTS "alert_rules_type_idx" ON "alert_rules" ("type");
CREATE INDEX IF NOT EXISTS "alert_rules_is_active_idx" ON "alert_rules" ("is_active");
CREATE INDEX IF NOT EXISTS "alert_rules_last_triggered_idx" ON "alert_rules" ("last_triggered");

CREATE INDEX IF NOT EXISTS "notification_channels_user_id_idx" ON "notification_channels" ("user_id");
CREATE INDEX IF NOT EXISTS "notification_channels_type_idx" ON "notification_channels" ("type");
CREATE INDEX IF NOT EXISTS "notification_channels_is_active_idx" ON "notification_channels" ("is_active");
CREATE INDEX IF NOT EXISTS "notification_channels_is_verified_idx" ON "notification_channels" ("is_verified");

CREATE INDEX IF NOT EXISTS "alert_deliveries_alert_id_idx" ON "alert_deliveries" ("alert_id");
CREATE INDEX IF NOT EXISTS "alert_deliveries_channel_id_idx" ON "alert_deliveries" ("channel_id");
CREATE INDEX IF NOT EXISTS "alert_deliveries_status_idx" ON "alert_deliveries" ("status");
CREATE INDEX IF NOT EXISTS "alert_deliveries_next_retry_at_idx" ON "alert_deliveries" ("next_retry_at");

CREATE INDEX IF NOT EXISTS "user_notification_preferences_user_id_idx" ON "user_notification_preferences" ("user_id");
CREATE INDEX IF NOT EXISTS "user_notification_preferences_channel_id_idx" ON "user_notification_preferences" ("channel_id");
CREATE INDEX IF NOT EXISTS "user_notification_preferences_alert_type_severity_idx" ON "user_notification_preferences" ("alert_type", "severity");

CREATE INDEX IF NOT EXISTS "notification_templates_type_alert_type_severity_idx" ON "notification_templates" ("type", "alert_type", "severity");

-- Insert default notification templates
INSERT INTO "notification_templates" ("id", "name", "type", "alert_type", "severity", "subject", "body", "is_default") VALUES
('tmpl_email_error_rate_critical', 'Email Error Rate Critical', 'email', 'error_rate', 'critical', 
 '[CRITICAL] High Error Rate Alert', 
 'Critical Alert: {{alertTitle}}

{{alertMessage}}

This is a critical alert that requires immediate attention.

Details:
- Alert Type: {{alertType}}
- Severity: {{severity}}
- Time: {{formattedTime}}
- Provider: {{providerId}}

Please investigate immediately and take corrective action.

View details: {{alertUrl}}

--
Nexus Dashboard Alert System', true),

('tmpl_email_slow_response_high', 'Email Slow Response High', 'email', 'slow_response', 'high',
 '[HIGH] Slow Response Time Alert',
 'High Priority Alert: {{alertTitle}}

{{alertMessage}}

Details:
- Alert Type: {{alertType}}
- Severity: {{severity}}
- Time: {{formattedTime}}

View details: {{alertUrl}}

--
Nexus Dashboard Alert System', true),

('tmpl_webhook_generic', 'Generic Webhook Template', 'webhook', 'error_rate', 'medium',
 null,
 '{
  "alert_id": "{{alertId}}",
  "title": "{{alertTitle}}",
  "message": "{{alertMessage}}",
  "type": "{{alertType}}",
  "severity": "{{severity}}",
  "timestamp": "{{timestamp}}",
  "provider_id": "{{providerId}}",
  "dashboard_url": "{{dashboardUrl}}",
  "metadata": {{metadata}}
}', true),

('tmpl_slack_critical', 'Slack Critical Alert', 'slack', 'error_rate', 'critical',
 null,
 ':rotating_light: *CRITICAL ALERT* :rotating_light:

*{{alertTitle}}*

{{alertMessage}}

*Severity:* {{severity}}
*Time:* {{formattedTime}}

<{{alertUrl}}|:point_right: View in Dashboard>', true);

-- Insert some default notification preferences (these will be created when users set up channels)