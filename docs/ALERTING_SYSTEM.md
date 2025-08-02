# Nexus Dashboard Alerting System

A comprehensive alerting system with notifications, webhook integrations, and alert channels for the Nexus dashboard.

## Overview

The alerting system provides:

- **Alert Rules Engine**: Define custom rules for monitoring API metrics
- **Notification Channels**: Multiple delivery methods (email, webhook, Slack, Discord, Teams, in-app)
- **Notification Templates**: Customizable message templates for different channels
- **Background Jobs**: Automated alert evaluation and notification delivery
- **Delivery Tracking**: Monitor notification delivery status and retry failed deliveries
- **User Preferences**: Fine-grained control over which alerts to receive

## Components

### 1. Database Schema

#### Core Tables
- `alert_rules`: Custom alert rules with conditions and thresholds
- `notification_channels`: User-configured notification endpoints
- `alert_deliveries`: Tracks notification delivery attempts
- `user_notification_preferences`: User preferences for alert routing
- `notification_templates`: Message templates for different channels

#### Relationships
- Users can have multiple notification channels
- Alert rules belong to users and optionally to API providers
- Alert deliveries link alerts to notification channels
- Templates define how alerts are formatted for different channel types

### 2. Services

#### AlertRulesService (`src/lib/services/alert-rules.service.ts`)
- Create, update, delete alert rules
- Evaluate rules against current metrics
- Support for multiple metric types (error rate, response time, cost, request count)
- Configurable thresholds, time windows, and cooldown periods

#### NotificationsService (`src/lib/services/notifications.service.ts`)
- Manage notification channels (email, webhook, Slack, Discord, Teams)
- Send notifications with template rendering
- Channel verification and testing
- Delivery status tracking

### 3. Background Jobs

#### Alert Evaluation Job (`src/lib/jobs/alert-evaluation.job.ts`)
- Runs every minute to evaluate active alert rules
- Creates alerts when conditions are met
- Respects cooldown periods to prevent spam
- Supports both rule-based and auto-generated alerts

#### Notification Delivery Job (`src/lib/jobs/notification-delivery.job.ts`)
- Processes pending notification deliveries
- Implements retry logic with exponential backoff
- Updates delivery status and channel statistics
- Handles failed deliveries gracefully

#### Cleanup Job (`src/lib/jobs/cleanup.job.ts`)
- Removes old resolved alerts and delivery records
- Cleans up inactive alert rules
- Configurable retention periods
- Runs daily to maintain database performance

### 4. API Endpoints

#### Notification Channels
- `GET /api/notifications/channels` - List user channels
- `POST /api/notifications/channels` - Create new channel
- `PUT /api/notifications/channels/[id]` - Update channel
- `DELETE /api/notifications/channels/[id]` - Delete channel
- `POST /api/notifications/test` - Test channel delivery

#### Alert Rules
- `GET /api/alerts/rules` - List user rules
- `POST /api/alerts/rules` - Create new rule
- `PUT /api/alerts/rules/[id]` - Update rule
- `DELETE /api/alerts/rules/[id]` - Delete rule
- `POST /api/alerts/rules/[id]/toggle` - Toggle rule activation
- `POST /api/alerts/rules/[id]/test` - Test rule evaluation

#### Statistics
- `GET /api/alerts/stats` - Get alert and rule statistics
- `GET /api/notifications/history` - Get delivery history

#### Admin (Job Management)
- `GET /api/admin/jobs` - Get job status
- `POST /api/admin/jobs` - Control job execution

## Setup

### 1. Database Migration

Run the migration to create the new tables:

```bash
pnpm db:migrate
```

The migration file (`0005_alert_rules_and_notifications.sql`) creates all necessary tables and indexes.

### 2. Environment Variables

Add to your `.env.local`:

```env
# Enable background jobs (optional, defaults to production only)
ENABLE_BACKGROUND_JOBS=true

# Email provider (if using email notifications)
EMAIL_PROVIDER_API_KEY=your-key-here

# Webhook security (optional)
WEBHOOK_SECRET=your-webhook-secret
```

### 3. Initialize Background Jobs

Add to your application startup (e.g., in a layout or middleware):

```typescript
import { initializeAlertingSystem } from '@/lib/init-alerts';

// Initialize on server start
initializeAlertingSystem();
```

## Usage

### Creating Alert Rules

```typescript
import { AlertRulesService } from '@/lib/services/alert-rules.service';

const rule = await AlertRulesService.createRule({
  userId: 'user123',
  providerId: 'openai', // optional
  name: 'High Error Rate',
  description: 'Alert when error rate exceeds 10%',
  type: 'error_rate',
  severity: 'high',
  conditions: {
    threshold: 10,
    timeWindow: 15, // minutes
    metric: 'error_rate',
    operator: 'gt'
  },
  cooldownMinutes: 60
});
```

### Setting up Notification Channels

#### Email Channel
```typescript
import { NotificationsService } from '@/lib/services/notifications.service';

const emailChannel = await NotificationsService.createChannel({
  userId: 'user123',
  name: 'Primary Email',
  type: 'email',
  config: {
    email: {
      address: 'user@example.com'
    }
  }
});
```

#### Webhook Channel
```typescript
const webhookChannel = await NotificationsService.createChannel({
  userId: 'user123',
  name: 'Monitoring Webhook',
  type: 'webhook',
  config: {
    webhook: {
      url: 'https://api.example.com/alerts',
      secret: 'webhook-secret',
      headers: {
        'Authorization': 'Bearer token123'
      }
    }
  }
});
```

#### Slack Channel
```typescript
const slackChannel = await NotificationsService.createChannel({
  userId: 'user123',
  name: 'Team Alerts',
  type: 'slack',
  config: {
    slack: {
      webhookUrl: 'https://hooks.slack.com/services/...',
      channel: '#alerts',
      username: 'Nexus Bot'
    }
  }
});
```

### Testing Notifications

```typescript
// Test a specific channel
const result = await NotificationsService.testChannel(channelId, userId);

if (result.success) {
  console.log('Test notification sent successfully');
} else {
  console.error('Test failed:', result.error);
}
```

### Manual Alert Rule Evaluation

```typescript
// Test rule evaluation without creating alerts
const rule = await AlertRulesService.getRuleById(ruleId, userId);
const result = await AlertRulesService.testRule(rule);

console.log('Current value:', result.currentValue);
console.log('Would trigger:', result.triggered);
```

## Alert Rule Conditions

### Supported Metrics
- `error_rate`: Percentage of failed requests (status >= 400)
- `response_time`: Average response time in milliseconds
- `cost`: Total cost over time window
- `request_count`: Number of requests (rate per minute)
- `success_rate`: Percentage of successful requests

### Operators
- `gt`: Greater than
- `gte`: Greater than or equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `eq`: Equal to

### Example Conditions

```typescript
// Error rate > 5% over 10 minutes
{
  threshold: 5,
  timeWindow: 10,
  metric: 'error_rate',
  operator: 'gt'
}

// Average response time > 2000ms over 5 minutes
{
  threshold: 2000,
  timeWindow: 5,
  metric: 'response_time',
  operator: 'gt'
}

// Cost > $10 over 1 hour
{
  threshold: 10,
  timeWindow: 60,
  metric: 'cost',
  operator: 'gt'
}
```

## Notification Templates

### Template Variables
All notification templates have access to these variables:

- `{{alertId}}`: Unique alert identifier
- `{{alertTitle}}`: Alert title
- `{{alertMessage}}`: Alert message
- `{{alertType}}`: Type of alert (error_rate, slow_response, etc.)
- `{{severity}}`: Alert severity (low, medium, high, critical)
- `{{timestamp}}`: ISO timestamp
- `{{formattedTime}}`: Human-readable timestamp
- `{{dashboardUrl}}`: Base dashboard URL
- `{{alertUrl}}`: Direct link to alert details
- `{{providerId}}`: API provider ID (if applicable)
- `{{metadata}}`: Additional alert metadata

### Example Email Template
```html
Subject: [{{severity}}] {{alertTitle}}

Alert: {{alertTitle}}

{{alertMessage}}

Details:
- Type: {{alertType}}
- Severity: {{severity}}
- Time: {{formattedTime}}
- Provider: {{providerId}}

View in dashboard: {{alertUrl}}

--
Nexus Dashboard Alert System
```

### Example Webhook Payload
```json
{
  "alert_id": "{{alertId}}",
  "title": "{{alertTitle}}",
  "message": "{{alertMessage}}",
  "type": "{{alertType}}",
  "severity": "{{severity}}",
  "timestamp": "{{timestamp}}",
  "provider_id": "{{providerId}}",
  "dashboard_url": "{{dashboardUrl}}",
  "metadata": {{metadata}}
}
```

## Security Considerations

### Webhook Security
- Webhooks include signature headers for verification
- Use the `X-Nexus-Signature` header with HMAC-SHA256
- Configure webhook secrets for verification

### Channel Verification
- Email channels require verification before activation
- Webhook channels can be tested before saving
- Failed deliveries are tracked and channels can be auto-disabled

### Access Control
- Users can only manage their own channels and rules
- API endpoints validate user ownership
- Admin endpoints can be restricted to specific roles

## Monitoring and Troubleshooting

### Job Status
Check background job health:
```bash
curl /api/admin/jobs
```

### Delivery History
Monitor notification delivery:
```bash
curl "/api/notifications/history?status=failed&limit=50"
```

### Alert Statistics
View alert metrics:
```bash
curl /api/alerts/stats
```

### Logs
Background jobs log their execution results:
- Alert evaluation results
- Notification delivery attempts
- Error details and retry schedules

## Performance Considerations

### Database Indexes
The migration creates optimized indexes for:
- Alert rule lookups by user and provider
- Notification channel filtering
- Delivery status and retry queries
- Template lookups by type and severity

### Job Scheduling
- Alert evaluation: Every 1 minute (configurable)
- Notification delivery: Every 2 minutes (configurable)
- Cleanup: Daily (configurable)
- Auto alerts: Every 15 minutes (legacy support)

### Retention Policies
- Resolved alerts: 30 days (configurable)
- Delivery records: 30 days (configurable)
- Inactive rules: 90 days (configurable)

## Integration Examples

### Webhook Integration with External Systems

```javascript
// Example webhook receiver
app.post('/nexus-alerts', (req, res) => {
  const signature = req.headers['x-nexus-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
    
  if (`sha256=${expectedSignature}` !== signature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process alert
  const alert = req.body;
  console.log('Received alert:', alert.title);
  
  // Forward to monitoring system, create ticket, etc.
  
  res.status(200).send('OK');
});
```

### Slack Bot Integration

```javascript
// Custom Slack message formatting
const slackMessage = {
  "channel": "#alerts",
  "username": "Nexus Dashboard",
  "icon_emoji": ":warning:",
  "attachments": [{
    "color": severity === 'critical' ? 'danger' : 'warning',
    "title": alertTitle,
    "text": alertMessage,
    "fields": [
      {
        "title": "Severity",
        "value": severity.toUpperCase(),
        "short": true
      },
      {
        "title": "Type",
        "value": alertType,
        "short": true
      }
    ],
    "actions": [{
      "type": "button",
      "text": "View Dashboard",
      "url": alertUrl
    }]
  }]
};
```

## Best Practices

### Rule Configuration
- Set appropriate cooldown periods to prevent alert fatigue
- Use escalating severity levels (start with low/medium for testing)
- Configure meaningful time windows for your use case
- Test rules before enabling them in production

### Channel Management
- Verify all channels before relying on them
- Use multiple channels for critical alerts
- Regularly test notification delivery
- Monitor delivery success rates

### Template Customization
- Create specific templates for different alert types
- Include actionable information in messages
- Use clear, non-technical language for stakeholder notifications
- Include direct links to relevant dashboards

### Monitoring
- Set up alerts for the alerting system itself
- Monitor job execution health
- Track notification delivery rates
- Review and cleanup old alerts regularly

## Troubleshooting

### Common Issues

1. **Alerts not triggering**
   - Check if rules are active
   - Verify time window and threshold settings
   - Ensure sufficient data points exist
   - Check cooldown periods

2. **Notifications not delivered**
   - Verify channel configuration
   - Check delivery history for errors
   - Test channel connectivity
   - Review background job status

3. **Performance issues**
   - Monitor database query performance
   - Adjust job intervals if needed
   - Review retention settings
   - Check for large numbers of failed deliveries

4. **Background jobs not running**
   - Verify `ENABLE_BACKGROUND_JOBS` environment variable
   - Check application logs for initialization errors
   - Ensure database connectivity
   - Verify job scheduler status

### Debug Commands

```bash
# Check job status
curl /api/admin/jobs

# Run job manually
curl -X POST /api/admin/jobs -d '{"action":"run_once","jobName":"alert_evaluation"}'

# Test notification channel
curl -X POST /api/notifications/test -d '{"channelId":"channel123"}'

# View delivery failures
curl "/api/notifications/history?status=failed"
```

This comprehensive alerting system provides robust monitoring capabilities with flexible notification options and reliable delivery mechanisms.