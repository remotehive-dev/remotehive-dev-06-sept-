'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Mail,
  MessageSquare,
  Mute,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  User,
  Users,
  Webhook,
  X,
  Zap,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Shield,
  AlertCircle,
  Info,
  XCircle,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  Upload,
  FileText,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Database,
  Server,
  Cloud,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Thermometer
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Notification interfaces
interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: {
    events: string[];
    conditions: {
      severity?: string[];
      metrics?: string[];
      tags?: string[];
      timeRange?: { start: string; end: string };
      frequency?: 'immediate' | 'batched' | 'digest';
    };
  };
  channels: string[];
  template: {
    subject: string;
    body: string;
    format: 'text' | 'html' | 'markdown';
  };
  rateLimiting: {
    enabled: boolean;
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  escalation: {
    enabled: boolean;
    levels: {
      delay: number;
      channels: string[];
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  channel: string;
  channelType: string;
  recipient: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  metadata: {
    messageId?: string;
    webhookResponse?: any;
    emailHeaders?: Record<string, string>;
  };
}

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'alert' | 'report' | 'digest' | 'custom';
  subject: string;
  body: string;
  format: 'text' | 'html' | 'markdown';
  variables: string[];
  preview: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'bearer' | 'basic' | 'api_key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  payload: {
    format: 'json' | 'form' | 'xml';
    template: string;
  };
  retryPolicy: {
    enabled: boolean;
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  timeout: number;
  enabled: boolean;
  lastUsed?: Date;
  successRate: number;
  createdAt: Date;
}

interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  channelStats: {
    [channel: string]: {
      sent: number;
      delivered: number;
      failed: number;
      rate: number;
    };
  };
  recentActivity: {
    timestamp: Date;
    count: number;
  }[];
}

interface NotificationSystemProps {
  refreshInterval?: number;
  maxHistory?: number;
  enableRealTime?: boolean;
  apiUrl?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  refreshInterval = 30000,
  maxHistory = 1000,
  enableRealTime = true,
  apiUrl = '/api/notifications'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Notification system state
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpoint[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  
  // Dialog states
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
  
  // Real-time connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Generate mock notification rules
  const generateMockRules = useCallback((): NotificationRule[] => {
    return [
      {
        id: 'rule-1',
        name: 'Critical System Alerts',
        description: 'Immediate notifications for critical system issues',
        enabled: true,
        triggers: {
          events: ['alert.created', 'alert.escalated'],
          conditions: {
            severity: ['critical'],
            metrics: ['cpu', 'memory', 'disk'],
            frequency: 'immediate'
          }
        },
        channels: ['email-ops', 'slack-alerts', 'webhook-pagerduty'],
        template: {
          subject: 'CRITICAL: {{alert.title}}',
          body: 'Alert: {{alert.message}}\nSeverity: {{alert.severity}}\nTime: {{alert.timestamp}}\nValue: {{alert.value}}/{{alert.threshold}}',
          format: 'text'
        },
        rateLimiting: {
          enabled: false,
          maxPerMinute: 0,
          maxPerHour: 0,
          maxPerDay: 0
        },
        escalation: {
          enabled: true,
          levels: [
            { delay: 5, channels: ['email-ops'] },
            { delay: 15, channels: ['slack-alerts'] },
            { delay: 30, channels: ['webhook-pagerduty'] }
          ]
        },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'rule-2',
        name: 'Daily System Report',
        description: 'Daily digest of system performance and alerts',
        enabled: true,
        triggers: {
          events: ['schedule.daily'],
          conditions: {
            timeRange: { start: '08:00', end: '09:00' },
            frequency: 'digest'
          }
        },
        channels: ['email-team'],
        template: {
          subject: 'Daily System Report - {{date}}',
          body: 'System Performance Summary\n\nAlerts: {{stats.alerts}}\nUptime: {{stats.uptime}}\nPerformance: {{stats.performance}}',
          format: 'html'
        },
        rateLimiting: {
          enabled: true,
          maxPerMinute: 0,
          maxPerHour: 0,
          maxPerDay: 1
        },
        escalation: {
          enabled: false,
          levels: []
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'rule-3',
        name: 'Warning Alerts Batch',
        description: 'Batched notifications for warning-level alerts',
        enabled: true,
        triggers: {
          events: ['alert.created'],
          conditions: {
            severity: ['warning'],
            frequency: 'batched'
          }
        },
        channels: ['email-ops'],
        template: {
          subject: 'Warning Alerts Summary ({{count}} alerts)',
          body: 'Warning alerts in the last hour:\n\n{{#alerts}}\n- {{message}} ({{timestamp}})\n{{/alerts}}',
          format: 'text'
        },
        rateLimiting: {
          enabled: true,
          maxPerMinute: 0,
          maxPerHour: 1,
          maxPerDay: 24
        },
        escalation: {
          enabled: false,
          levels: []
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Generate mock notification history
  const generateMockHistory = useCallback((): NotificationHistory[] => {
    const history: NotificationHistory[] = [];
    const statuses: ('pending' | 'sent' | 'delivered' | 'failed' | 'bounced')[] = ['sent', 'delivered', 'failed', 'bounced'];
    const channels = ['email-ops', 'slack-alerts', 'webhook-pagerduty', 'email-team'];
    const channelTypes = ['email', 'slack', 'webhook', 'email'];
    const subjects = [
      'CRITICAL: CPU usage exceeded threshold',
      'WARNING: Memory usage high',
      'Daily System Report',
      'INFO: Backup completed successfully',
      'CRITICAL: Disk space low',
      'WARNING: Network latency increased'
    ];
    
    for (let i = 0; i < 50; i++) {
      const sentAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const channelIndex = Math.floor(Math.random() * channels.length);
      
      history.push({
        id: `notification-${i + 1}`,
        ruleId: `rule-${Math.floor(Math.random() * 3) + 1}`,
        ruleName: `Rule ${Math.floor(Math.random() * 3) + 1}`,
        channel: channels[channelIndex],
        channelType: channelTypes[channelIndex],
        recipient: channelTypes[channelIndex] === 'email' ? 'ops@example.com' : '#alerts',
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        message: 'Alert notification message content...',
        status,
        sentAt,
        deliveredAt: status === 'delivered' ? new Date(sentAt.getTime() + Math.random() * 60 * 1000) : undefined,
        failureReason: status === 'failed' ? 'Connection timeout' : undefined,
        retryCount: status === 'failed' ? Math.floor(Math.random() * 3) : 0,
        metadata: {
          messageId: `msg-${i + 1}`,
          emailHeaders: channelTypes[channelIndex] === 'email' ? { 'Message-ID': `<${i + 1}@example.com>` } : undefined
        }
      });
    }
    
    return history.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }, []);

  // Generate mock templates
  const generateMockTemplates = useCallback((): NotificationTemplate[] => {
    return [
      {
        id: 'template-1',
        name: 'Critical Alert Template',
        description: 'Template for critical system alerts',
        type: 'alert',
        subject: 'CRITICAL: {{alert.title}}',
        body: `🚨 CRITICAL ALERT 🚨

Alert: {{alert.message}}
Severity: {{alert.severity}}
Metric: {{alert.metric}}
Value: {{alert.value}}/{{alert.threshold}}
Time: {{alert.timestamp}}
Tags: {{alert.tags}}

Please investigate immediately.

Dashboard: {{dashboard.url}}`,
        format: 'text',
        variables: ['alert.title', 'alert.message', 'alert.severity', 'alert.metric', 'alert.value', 'alert.threshold', 'alert.timestamp', 'alert.tags', 'dashboard.url'],
        preview: '🚨 CRITICAL ALERT 🚨\n\nAlert: CPU usage exceeded threshold\nSeverity: critical\nMetric: cpu\nValue: 95.2/90.0\nTime: 2024-01-15 14:30:00\nTags: env:production, service:api\n\nPlease investigate immediately.\n\nDashboard: https://dashboard.example.com',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'template-2',
        name: 'Daily Report Template',
        description: 'Template for daily system reports',
        type: 'report',
        subject: 'Daily System Report - {{date}}',
        body: `<!DOCTYPE html>
<html>
<head><title>Daily Report</title></head>
<body>
<h1>System Performance Report</h1>
<h2>{{date}}</h2>

<h3>Summary</h3>
<ul>
<li>Total Alerts: {{stats.alerts}}</li>
<li>System Uptime: {{stats.uptime}}</li>
<li>Average Response Time: {{stats.responseTime}}</li>
</ul>

<h3>Top Issues</h3>
{{#issues}}
<p><strong>{{severity}}</strong>: {{message}} ({{count}} occurrences)</p>
{{/issues}}

<p>View full dashboard: <a href="{{dashboard.url}}">{{dashboard.url}}</a></p>
</body>
</html>`,
        format: 'html',
        variables: ['date', 'stats.alerts', 'stats.uptime', 'stats.responseTime', 'issues', 'dashboard.url'],
        preview: 'HTML email with system performance metrics and charts',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'template-3',
        name: 'Webhook Payload Template',
        description: 'JSON template for webhook notifications',
        type: 'custom',
        subject: 'Webhook Notification',
        body: `{
  "alert": {
    "id": "{{alert.id}}",
    "title": "{{alert.title}}",
    "message": "{{alert.message}}",
    "severity": "{{alert.severity}}",
    "status": "{{alert.status}}",
    "metric": "{{alert.metric}}",
    "value": {{alert.value}},
    "threshold": {{alert.threshold}},
    "timestamp": "{{alert.timestamp}}",
    "tags": [{{#alert.tags}}"{{.}}"{{#unless @last}},{{/unless}}{{/alert.tags}}]
  },
  "system": {
    "hostname": "{{system.hostname}}",
    "environment": "{{system.environment}}"
  },
  "links": {
    "dashboard": "{{dashboard.url}}",
    "runbook": "{{runbook.url}}"
  }
}`,
        format: 'text',
        variables: ['alert.id', 'alert.title', 'alert.message', 'alert.severity', 'alert.status', 'alert.metric', 'alert.value', 'alert.threshold', 'alert.timestamp', 'alert.tags', 'system.hostname', 'system.environment', 'dashboard.url', 'runbook.url'],
        preview: 'JSON payload with alert and system information',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Generate mock webhook endpoints
  const generateMockWebhooks = useCallback((): WebhookEndpoint[] => {
    return [
      {
        id: 'webhook-1',
        name: 'PagerDuty Integration',
        url: 'https://events.pagerduty.com/v2/enqueue',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token token=***'
        },
        authentication: {
          type: 'bearer',
          token: 'pd_token_***'
        },
        payload: {
          format: 'json',
          template: '{ "routing_key": "{{pagerduty.routing_key}}", "event_action": "trigger", "payload": { "summary": "{{alert.message}}", "severity": "{{alert.severity}}", "source": "{{system.hostname}}" } }'
        },
        retryPolicy: {
          enabled: true,
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        },
        timeout: 30000,
        enabled: true,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        successRate: 98.5,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'webhook-2',
        name: 'Slack Incoming Webhook',
        url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: 'none'
        },
        payload: {
          format: 'json',
          template: '{ "text": "{{alert.severity | upper}}: {{alert.message}}", "channel": "#alerts", "username": "AlertBot", "icon_emoji": ":warning:" }'
        },
        retryPolicy: {
          enabled: true,
          maxRetries: 2,
          backoffMultiplier: 1.5,
          initialDelay: 500
        },
        timeout: 15000,
        enabled: true,
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        successRate: 99.2,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'webhook-3',
        name: 'Custom API Endpoint',
        url: 'https://api.example.com/alerts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1.0'
        },
        authentication: {
          type: 'api_key',
          apiKey: 'api_key_***',
          apiKeyHeader: 'X-API-Key'
        },
        payload: {
          format: 'json',
          template: '{ "event": "alert", "data": { "message": "{{alert.message}}", "severity": "{{alert.severity}}", "timestamp": "{{alert.timestamp}}" } }'
        },
        retryPolicy: {
          enabled: false,
          maxRetries: 0,
          backoffMultiplier: 1,
          initialDelay: 0
        },
        timeout: 10000,
        enabled: false,
        successRate: 85.3,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Generate mock stats
  const generateMockStats = useCallback((): NotificationStats => {
    const recentActivity = [];
    for (let i = 23; i >= 0; i--) {
      recentActivity.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
        count: Math.floor(Math.random() * 20) + 5
      });
    }
    
    return {
      totalSent: 1247,
      totalDelivered: 1198,
      totalFailed: 49,
      deliveryRate: 96.1,
      avgDeliveryTime: 2.3,
      channelStats: {
        'email': { sent: 687, delivered: 672, failed: 15, rate: 97.8 },
        'slack': { sent: 324, delivered: 318, failed: 6, rate: 98.1 },
        'webhook': { sent: 236, delivered: 208, failed: 28, rate: 88.1 }
      },
      recentActivity
    };
  }, []);

  // Initialize data
  useEffect(() => {
    setNotificationRules(generateMockRules());
    setNotificationHistory(generateMockHistory());
    setNotificationTemplates(generateMockTemplates());
    setWebhookEndpoints(generateMockWebhooks());
    setNotificationStats(generateMockStats());
  }, [generateMockRules, generateMockHistory, generateMockTemplates, generateMockWebhooks, generateMockStats]);

  // Simulate real-time connection
  useEffect(() => {
    if (enableRealTime) {
      setConnectionStatus('connecting');
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
        setIsConnected(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [enableRealTime]);

  // Auto-refresh effect
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        // Simulate new notifications
        if (Math.random() < 0.3) {
          const newNotification = generateMockHistory()[0];
          setNotificationHistory(prev => [
            { ...newNotification, id: `notification-${Date.now()}` },
            ...prev
          ].slice(0, maxHistory));
        }
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isConnected, refreshInterval, maxHistory, generateMockHistory]);

  // Filter notification history
  const filteredHistory = useMemo(() => {
    return notificationHistory.filter(notification => {
      const matchesSearch = searchQuery === '' || 
        notification.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.ruleName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
      const matchesChannel = filterChannel === 'all' || notification.channelType === filterChannel;
      
      const notificationDate = notification.sentAt.toISOString().split('T')[0];
      const matchesDateRange = notificationDate >= dateRange.start && notificationDate <= dateRange.end;
      
      return matchesSearch && matchesStatus && matchesChannel && matchesDateRange;
    });
  }, [notificationHistory, searchQuery, filterStatus, filterChannel, dateRange]);

  // Rule actions
  const toggleRule = useCallback((ruleId: string) => {
    setNotificationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
        : rule
    ));
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setNotificationRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  // Template actions
  const deleteTemplate = useCallback((templateId: string) => {
    setNotificationTemplates(prev => prev.filter(template => template.id !== templateId));
  }, []);

  // Webhook actions
  const toggleWebhook = useCallback((webhookId: string) => {
    setWebhookEndpoints(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, enabled: !webhook.enabled }
        : webhook
    ));
  }, []);

  const testWebhook = useCallback(async (webhookId: string) => {
    // Simulate webhook test
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Show success/failure message
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-500 bg-blue-50';
      case 'delivered': return 'text-green-500 bg-green-50';
      case 'failed': return 'text-red-500 bg-red-50';
      case 'bounced': return 'text-orange-500 bg-orange-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // Get channel icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification System</h2>
          <p className="text-muted-foreground">
            Manage notification rules, templates, and delivery channels
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            )} />
            <span className="text-sm text-muted-foreground">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats?.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {notificationStats?.deliveryRate.toFixed(1) || 0}%
            </div>
            <Progress value={notificationStats?.deliveryRate || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationStats?.avgDeliveryTime.toFixed(1) || 0}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationRules.filter(r => r.enabled).length}/{notificationRules.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Enabled notification rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Delivery statistics by notification channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationStats && Object.entries(notificationStats.channelStats).map(([channel, stats]) => (
                  <div key={channel} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {getChannelIcon(channel)}
                      <div>
                        <div className="font-medium capitalize">{channel}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.sent} sent • {stats.delivered} delivered • {stats.failed} failed
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold">{stats.rate.toFixed(1)}%</div>
                      <Progress value={stats.rate} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Notification volume over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end space-x-1">
                {notificationStats?.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-t flex-1 min-w-0"
                    style={{ height: `${(activity.count / 20) * 100}%` }}
                    title={`${activity.timestamp.getHours()}:00 - ${activity.count} notifications`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notification Rules</h3>
            <Button onClick={() => setShowRuleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          
          <div className="grid gap-4">
            {notificationRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{rule.name}</span>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">
                          {rule.triggers.conditions.frequency}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Triggers</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Events: {rule.triggers.events.join(', ')}
                        {rule.triggers.conditions.severity && (
                          <div>Severity: {rule.triggers.conditions.severity.join(', ')}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Channels</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rule.channels.length} channel(s) configured
                      </div>
                    </div>
                    
                    <div>
                      <Label>Rate Limiting</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rule.rateLimiting.enabled ? (
                          `${rule.rateLimiting.maxPerHour}/hour`
                        ) : (
                          'Disabled'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {rule.escalation.enabled && (
                    <div className="mt-4">
                      <Label>Escalation Policy</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rule.escalation.levels.length} escalation level(s)
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="channel">Channel</Label>
                  <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card>
            <CardHeader>
              <CardTitle>Notification History ({filteredHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredHistory.map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        {getChannelIcon(notification.channelType)}
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{notification.subject}</span>
                            <Badge variant="outline" className={getStatusColor(notification.status)}>
                              {notification.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mt-1">
                            To: {notification.recipient} • 
                            Rule: {notification.ruleName} • 
                            {notification.sentAt.toLocaleString()}
                          </div>
                          
                          {notification.failureReason && (
                            <div className="text-sm text-red-500 mt-1">
                              Error: {notification.failureReason}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        {notification.deliveredAt && (
                          <div>
                            Delivered: {notification.deliveredAt.toLocaleString()}
                          </div>
                        )}
                        {notification.retryCount > 0 && (
                          <div>Retries: {notification.retryCount}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notification Templates</h3>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
          
          <div className="grid gap-4">
            {notificationTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{template.name}</span>
                        <Badge variant="outline">
                          {template.type}
                        </Badge>
                        <Badge variant="secondary">
                          {template.format}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(template.body)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Subject Template</Label>
                      <div className="text-sm text-muted-foreground mt-1 font-mono bg-gray-50 p-2 rounded">
                        {template.subject}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Available Variables</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Preview</Label>
                      <div className="text-sm text-muted-foreground mt-1 p-3 bg-gray-50 rounded max-h-32 overflow-y-auto">
                        {template.preview}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
            <Button onClick={() => setShowWebhookDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
          
          <div className="grid gap-4">
            {webhookEndpoints.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{webhook.name}</span>
                        <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                          {webhook.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">
                          {webhook.method}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={webhook.enabled}
                        onCheckedChange={() => toggleWebhook(webhook.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={isLoading}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingWebhook(webhook);
                          setShowWebhookDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Authentication</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {webhook.authentication.type === 'none' ? 'None' : webhook.authentication.type}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Success Rate</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {webhook.successRate.toFixed(1)}%
                      </div>
                      <Progress value={webhook.successRate} className="mt-1" />
                    </div>
                    
                    <div>
                      <Label>Last Used</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {webhook.lastUsed ? webhook.lastUsed.toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Retry Policy</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      {webhook.retryPolicy.enabled ? (
                        `Max ${webhook.retryPolicy.maxRetries} retries, ${webhook.retryPolicy.initialDelay}ms initial delay`
                      ) : (
                        'Disabled'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSystem;
export type { NotificationRule, NotificationHistory, NotificationTemplate, WebhookEndpoint, NotificationStats };