# Communication Providers Documentation

## Overview
The SentinelIQ notification system supports multiple communication channels for real-time incident alerts and notifications.

## Implemented Providers

### 1. Email (SMTP) ✅
**Status**: Fully Functional

**Configuration Required**:
```typescript
{
  provider: 'EMAIL',
  config: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    fromAddress: process.env.SMTP_FROM_ADDRESS,
  }
}
```

**Recipients Format**: Email addresses (e.g., `user@example.com`)

---

### 2. Slack ✅
**Status**: Fully Functional

**Configuration Required**:
```typescript
{
  provider: 'SLACK',
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  }
}
```

**Webhook Setup**:
1. Create a Slack App at https://api.slack.com/apps
2. Enable "Incoming Webhooks"
3. Create a new webhook for your channel
4. Use the webhook URL in configuration

**Recipients Format**: Not used (webhook sends to configured channel)

**Features**:
- Rich message formatting with blocks
- Action buttons with links
- Color-coded by notification type
- Contextual workspace information

---

### 3. Discord ✅
**Status**: Fully Functional

**Configuration Required**:
```typescript
{
  provider: 'DISCORD',
  config: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  }
}
```

**Webhook Setup**:
1. Go to your Discord server settings
2. Navigate to Webhooks
3. Create a new webhook
4. Copy the webhook URL

**Recipients Format**: Not used (webhook sends to configured channel)

**Features**:
- Embedded message format
- Color-coded embeds by notification type
- Timestamp information
- Footer branding

---

### 4. Telegram ✅
**Status**: Fully Functional

**Configuration Required**:
```typescript
{
  provider: 'TELEGRAM',
  config: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  }
}
```

**Setup Instructions**:
1. Create a bot via BotFather on Telegram
   - Message `@BotFather` on Telegram
   - Use `/newbot` command
   - Follow the prompts
   - Get your bot token
2. Add bot to your chat/group
3. Get the chat ID:
   - Send a message to the bot
   - Call: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Find the chat ID in the response

**Recipients Format**: Telegram chat IDs (numeric IDs)

**Features**:
- HTML formatted messages
- Inline buttons for viewing details
- Support for multiple recipients
- Emoji indicators by notification type

---

### 5. Microsoft Teams ✅
**Status**: Fully Functional

**Configuration Required**:
```typescript
{
  provider: 'TEAMS',
  config: {
    webhookUrl: process.env.TEAMS_WEBHOOK_URL,
  }
}
```

**Webhook Setup**:
1. Open Microsoft Teams
2. Go to your channel
3. Click "..." (More options)
4. Select "Connectors"
5. Search for "Incoming Webhook"
6. Configure and copy the webhook URL

**Recipients Format**: Not used (webhook sends to configured channel)

**Features**:
- Adaptive Card format
- Color-coded theme by notification type
- Fact sections with structured data
- Action buttons for viewing details
- Professional formatting

---

## Usage Example

### Backend Operation
```typescript
import { sendNotification } from '@src/core/notifications/operations';

await sendNotification({
  title: 'Critical Security Alert',
  message: 'Suspicious activity detected on production server',
  type: 'CRITICAL',
  provider: 'SLACK', // or 'TEAMS', 'DISCORD', 'TELEGRAM', 'EMAIL'
  recipients: ['user@example.com'], // varies by provider
  workspaceId: workspaceId,
}, context);
```

### Configuration in Environment
```bash
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_ADDRESS=noreply@sentineliq.com

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Discord
DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/YOUR/WEBHOOK

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Microsoft Teams
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/YOUR/IncomingWebhook/ENDPOINT
```

---

## Notification Types & Colors

All providers support the following notification types with consistent styling:

- **INFO** 🔵 (Blue) - General information
- **SUCCESS** 🟢 (Green) - Successful operation
- **WARNING** 🟡 (Yellow/Gold) - Warning/caution
- **ERROR** 🔴 (Red-Orange) - Error occurred
- **CRITICAL** 🚨 (Dark Red) - Critical alert

---

## Architecture

### Provider Registry Pattern
```typescript
// All providers register in ProviderRegistry
export class ProviderRegistry {
  private static providers: Map<ProviderType, new (config: any) => INotificationProvider> = new Map([
    ['EMAIL', EmailProvider],
    ['SLACK', SlackProvider],
    ['DISCORD', DiscordProvider],
    ['TELEGRAM', TelegramProvider],
    ['TEAMS', TeamsProvider],
    ['WEBHOOK', WebhookProvider],
  ]);

  static createProvider(type: ProviderType, config: Record<string, any>): INotificationProvider {
    const ProviderClass = this.providers.get(type);
    if (!ProviderClass) {
      throw new Error(`Provider ${type} not implemented`);
    }
    return new ProviderClass(config);
  }
}
```

### Base Provider
All providers extend `BaseNotificationProvider` which provides:
- Consistent logging
- Error handling
- Success tracking
- Interface compliance

---

## Integration Points

1. **Notification Operations** (`src/core/notifications/operations.ts`)
   - Main interface for sending notifications
   - Handles provider selection
   - Manages delivery logs

2. **Event Bus** (`src/core/notifications/eventBus.ts`)
   - Triggers notifications on system events
   - Automatic provider routing

3. **Delivery Service** (`src/core/notifications/deliveryService.ts`)
   - Manages retries
   - Handles failures gracefully
   - Tracks delivery status

---

## Error Handling

All providers implement robust error handling:
- Configuration validation
- Network error recovery
- Detailed error logging
- Graceful failure modes

### Common Errors

| Error | Solution |
|-------|----------|
| "Provider not configured" | Check environment variables |
| "API returned 401" | Verify API credentials |
| "Invalid recipient format" | Check recipient ID format for provider |
| "Network timeout" | Retry or check connectivity |

---

## Future Enhancements

- [ ] Provider retry logic with exponential backoff
- [ ] Delivery status webhooks
- [ ] Multi-provider fallback chains
- [ ] Message templating system
- [ ] Scheduled/digest notifications
- [ ] Provider rate limiting
- [ ] Rich media support (images, files)

---

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
