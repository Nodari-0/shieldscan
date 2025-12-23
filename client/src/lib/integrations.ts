// ==========================================
// INTEGRATIONS HUB
// ==========================================
// Connect with Slack, Jira, GitHub, PagerDuty, etc.

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: IntegrationConfig;
  createdAt: string;
  lastSyncAt?: string;
  error?: string;
}

export type IntegrationType = 
  | 'slack'
  | 'jira'
  | 'github'
  | 'gitlab'
  | 'pagerduty'
  | 'discord'
  | 'teams'
  | 'linear'
  | 'asana'
  | 'zapier'
  | 'webhook';

export type IntegrationConfig = 
  | SlackConfig
  | JiraConfig
  | GitHubConfig
  | GitLabConfig
  | PagerDutyConfig
  | DiscordConfig
  | TeamsConfig
  | LinearConfig
  | WebhookConfig;

export interface SlackConfig {
  type: 'slack';
  webhookUrl: string;
  channel: string;
  notifyOn: NotificationTrigger[];
  mentionUsers?: string[];
}

export interface JiraConfig {
  type: 'jira';
  instanceUrl: string;
  apiToken: string;
  email: string;
  projectKey: string;
  issueType: string;
  createTicketOn: NotificationTrigger[];
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  customFields?: Record<string, string>;
}

export interface GitHubConfig {
  type: 'github';
  token: string;
  owner: string;
  repo: string;
  createIssuesOn: NotificationTrigger[];
  addLabels?: string[];
  assignees?: string[];
}

export interface GitLabConfig {
  type: 'gitlab';
  instanceUrl: string;
  token: string;
  projectId: string;
  createIssuesOn: NotificationTrigger[];
  labels?: string[];
}

export interface PagerDutyConfig {
  type: 'pagerduty';
  routingKey: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  triggerOn: NotificationTrigger[];
}

export interface DiscordConfig {
  type: 'discord';
  webhookUrl: string;
  notifyOn: NotificationTrigger[];
}

export interface TeamsConfig {
  type: 'teams';
  webhookUrl: string;
  notifyOn: NotificationTrigger[];
}

export interface LinearConfig {
  type: 'linear';
  apiKey: string;
  teamId: string;
  createIssuesOn: NotificationTrigger[];
  labelIds?: string[];
}

export interface WebhookConfig {
  type: 'webhook';
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  triggerOn: NotificationTrigger[];
}

export type NotificationTrigger = 
  | 'new_critical'
  | 'new_high'
  | 'scan_complete'
  | 'scan_failed'
  | 'ssl_expiring'
  | 'downtime'
  | 'score_degraded';

export interface IntegrationTemplate {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredFields: string[];
  optionalFields: string[];
  docUrl: string;
}

// Integration templates
export const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  {
    type: 'slack',
    name: 'Slack',
    description: 'Get security alerts directly in your Slack channels',
    icon: '💬',
    color: '#4A154B',
    requiredFields: ['webhookUrl', 'channel'],
    optionalFields: ['mentionUsers'],
    docUrl: 'https://api.slack.com/messaging/webhooks',
  },
  {
    type: 'jira',
    name: 'Jira',
    description: 'Automatically create tickets for vulnerabilities',
    icon: '🎫',
    color: '#0052CC',
    requiredFields: ['instanceUrl', 'apiToken', 'email', 'projectKey', 'issueType'],
    optionalFields: ['priority', 'customFields'],
    docUrl: 'https://developer.atlassian.com/cloud/jira/',
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Create issues and integrate with GitHub Actions',
    icon: '🐙',
    color: '#24292E',
    requiredFields: ['token', 'owner', 'repo'],
    optionalFields: ['addLabels', 'assignees'],
    docUrl: 'https://docs.github.com/en/rest',
  },
  {
    type: 'gitlab',
    name: 'GitLab',
    description: 'Create issues in your GitLab projects',
    icon: '🦊',
    color: '#FC6D26',
    requiredFields: ['instanceUrl', 'token', 'projectId'],
    optionalFields: ['labels'],
    docUrl: 'https://docs.gitlab.com/ee/api/',
  },
  {
    type: 'pagerduty',
    name: 'PagerDuty',
    description: 'Trigger incidents for critical vulnerabilities',
    icon: '🚨',
    color: '#06AC38',
    requiredFields: ['routingKey'],
    optionalFields: ['severity'],
    docUrl: 'https://developer.pagerduty.com/',
  },
  {
    type: 'discord',
    name: 'Discord',
    description: 'Post alerts to Discord channels',
    icon: '🎮',
    color: '#5865F2',
    requiredFields: ['webhookUrl'],
    optionalFields: [],
    docUrl: 'https://discord.com/developers/docs/resources/webhook',
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    icon: '👥',
    color: '#6264A7',
    requiredFields: ['webhookUrl'],
    optionalFields: [],
    docUrl: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/',
  },
  {
    type: 'linear',
    name: 'Linear',
    description: 'Create issues in Linear for your team',
    icon: '📐',
    color: '#5E6AD2',
    requiredFields: ['apiKey', 'teamId'],
    optionalFields: ['labelIds'],
    docUrl: 'https://developers.linear.app/',
  },
  {
    type: 'webhook',
    name: 'Custom Webhook',
    description: 'Send data to any HTTP endpoint',
    icon: '🔗',
    color: '#6B7280',
    requiredFields: ['url', 'method'],
    optionalFields: ['headers'],
    docUrl: '',
  },
];

// Storage key
const INTEGRATIONS_KEY = 'shieldscan_integrations';

// Get all integrations
export function getIntegrations(): Integration[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(INTEGRATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save integrations
function saveIntegrations(integrations: Integration[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(integrations));
}

// Add integration
export function addIntegration(
  type: IntegrationType,
  name: string,
  config: IntegrationConfig
): Integration {
  const integration: Integration = {
    id: `int_${Date.now()}`,
    type,
    name,
    status: 'connected',
    config,
    createdAt: new Date().toISOString(),
  };

  const integrations = getIntegrations();
  integrations.push(integration);
  saveIntegrations(integrations);

  return integration;
}

// Update integration
export function updateIntegration(
  id: string,
  updates: Partial<Integration>
): Integration | null {
  const integrations = getIntegrations();
  const index = integrations.findIndex(i => i.id === id);
  if (index === -1) return null;

  integrations[index] = { ...integrations[index], ...updates };
  saveIntegrations(integrations);

  return integrations[index];
}

// Remove integration
export function removeIntegration(id: string): boolean {
  const integrations = getIntegrations();
  const filtered = integrations.filter(i => i.id !== id);
  if (filtered.length === integrations.length) return false;

  saveIntegrations(filtered);
  return true;
}

// Test integration
export async function testIntegration(integration: Integration): Promise<{ success: boolean; error?: string }> {
  // Simulate testing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Random success (90% success rate for demo)
  if (Math.random() > 0.1) {
    return { success: true };
  }
  return { success: false, error: 'Connection failed. Please check your credentials.' };
}

// Send notification through integration
export async function sendNotification(
  integration: Integration,
  event: {
    type: NotificationTrigger;
    title: string;
    description: string;
    severity: string;
    url?: string;
  }
): Promise<boolean> {
  // Check if integration should trigger on this event
  const config = integration.config;
  let triggers: NotificationTrigger[] = [];
  
  if ('notifyOn' in config) {
    triggers = config.notifyOn;
  } else if ('triggerOn' in config) {
    triggers = config.triggerOn;
  } else if ('createTicketOn' in config) {
    triggers = config.createTicketOn;
  } else if ('createIssuesOn' in config) {
    triggers = config.createIssuesOn;
  }

  if (!triggers.includes(event.type)) {
    return false;
  }

  // Simulate sending (in production, this would make actual API calls)
  console.log(`[Integration] Sending to ${integration.type}:`, event);
  
  return true;
}

// Format message for different platforms
export function formatNotificationMessage(
  platform: IntegrationType,
  event: {
    title: string;
    description: string;
    severity: string;
    url?: string;
    findings?: Array<{ name: string; severity: string }>;
  }
): Record<string, any> {
  switch (platform) {
    case 'slack':
      return {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `🛡️ ${event.title}` },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: event.description },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `Severity: *${event.severity}*` },
            ],
          },
          ...(event.url ? [{
            type: 'actions',
            elements: [{
              type: 'button',
              text: { type: 'plain_text', text: 'View Details' },
              url: event.url,
            }],
          }] : []),
        ],
      };

    case 'discord':
      return {
        embeds: [{
          title: `🛡️ ${event.title}`,
          description: event.description,
          color: event.severity === 'critical' ? 0xFF0000 : event.severity === 'high' ? 0xFFA500 : 0x00FF00,
          url: event.url,
          footer: { text: 'ShieldScan Security' },
          timestamp: new Date().toISOString(),
        }],
      };

    case 'teams':
      return {
        '@type': 'MessageCard',
        themeColor: event.severity === 'critical' ? 'FF0000' : event.severity === 'high' ? 'FFA500' : '00FF00',
        summary: event.title,
        sections: [{
          activityTitle: event.title,
          facts: [
            { name: 'Severity', value: event.severity },
            { name: 'Description', value: event.description },
          ],
        }],
        potentialAction: event.url ? [{
          '@type': 'OpenUri',
          name: 'View Details',
          targets: [{ os: 'default', uri: event.url }],
        }] : [],
      };

    default:
      return {
        title: event.title,
        description: event.description,
        severity: event.severity,
        url: event.url,
        timestamp: new Date().toISOString(),
      };
  }
}

