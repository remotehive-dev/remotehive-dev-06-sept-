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
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Mail,
  MessageSquare,
  Mute,
  Phone,
  Plus,
  RefreshCw,
  Search,
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
  Edit,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Alert management interfaces
interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: 'cpu' | 'memory' | 'disk' | 'network' | 'temperature' | 'custom';
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  duration: number; // minutes
  severity: 'info' | 'warning' | 'critical';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  triggeredCount: number;
  lastTriggered?: Date;
}

interface AlertInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'silenced';
  value: number;
  threshold: number;
  metric: string;
  tags: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  silencedUntil?: Date;
  escalationLevel: number;
  notificationsSent: number;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'discord';
  enabled: boolean;
  config: {
    email?: { address: string; smtp?: any };
    sms?: { phoneNumber: string; provider?: string };
    webhook?: { url: string; headers?: Record<string, string> };
    slack?: { webhookUrl: string; channel?: string };
    teams?: { webhookUrl: string };
    discord?: { webhookUrl: string };
  };
  filters: {
    severities: string[];
    tags: string[];
    metrics: string[];
  };
  rateLimiting: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
  createdAt: Date;
}

interface EscalationPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: {
    level: number;
    waitTime: number; // minutes
    channels: string[];
    conditions: {
      severities: string[];
      tags: string[];
      unacknowledgedOnly: boolean;
    };
  }[];
  createdAt: Date;
}

interface AlertManagerProps {
  refreshInterval?: number;
  maxAlerts?: number;
  enableSound?: boolean;
  apiUrl?: string;
}

const AlertManager: React.FC<AlertManagerProps> = ({
  refreshInterval = 30000,
  maxAlerts = 1000,
  enableSound = true,
  apiUrl = '/api/alerts'
}) => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMetric, setFilterMetric] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'severity' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Alert management state
  const [alerts, setAlerts] = useState<AlertInstance[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([]);
  const [escalationPolicies, setEscalationPolicies] = useState<EscalationPolicy[]>([]);
  
  // Dialog states
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<EscalationPolicy | null>(null);

  // Generate mock alert data
  const generateMockAlerts = useCallback((): AlertInstance[] => {
    const mockAlerts: AlertInstance[] = [];
    const severities: ('info' | 'warning' | 'critical')[] = ['info', 'warning', 'critical'];
    const statuses: ('active' | 'acknowledged' | 'resolved' | 'silenced')[] = ['active', 'acknowledged', 'resolved', 'silenced'];
    const metrics = ['cpu', 'memory', 'disk', 'network', 'temperature'];
    const messages = [
      'CPU usage exceeded threshold',
      'Memory usage is critically high',
      'Disk space running low',
      'Network latency increased',
      'Temperature threshold exceeded',
      'Service response time degraded',
      'Error rate increased significantly',
      'Database connection pool exhausted'
    ];
    
    for (let i = 0; i < 25; i++) {
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      mockAlerts.push({
        id: `alert-${i + 1}`,
        ruleId: `rule-${Math.floor(Math.random() * 10) + 1}`,
        ruleName: `${metric.toUpperCase()} Threshold Rule`,
        message,
        severity,
        status,
        value: 50 + Math.random() * 50,
        threshold: 70 + Math.random() * 20,
        metric,
        tags: [`env:production`, `service:${metric}`, `team:ops`],
        createdAt,
        acknowledgedAt: status === 'acknowledged' ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000) : undefined,
        acknowledgedBy: status === 'acknowledged' ? 'admin@remotehive.in' : undefined,
        resolvedAt: status === 'resolved' ? new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : undefined,
        silencedUntil: status === 'silenced' ? new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000) : undefined,
        escalationLevel: Math.floor(Math.random() * 3),
        notificationsSent: Math.floor(Math.random() * 5)
      });
    }
    
    return mockAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, []);

  // Generate mock alert rules
  const generateMockRules = useCallback((): AlertRule[] => {
    const metrics: ('cpu' | 'memory' | 'disk' | 'network' | 'temperature')[] = ['cpu', 'memory', 'disk', 'network', 'temperature'];
    const severities: ('info' | 'warning' | 'critical')[] = ['info', 'warning', 'critical'];
    
    return metrics.map((metric, index) => ({
      id: `rule-${index + 1}`,
      name: `${metric.toUpperCase()} Usage Alert`,
      description: `Alert when ${metric} usage exceeds threshold`,
      enabled: Math.random() > 0.2,
      metric,
      condition: 'greater_than',
      threshold: 70 + Math.random() * 20,
      duration: 5 + Math.floor(Math.random() * 10),
      severity: severities[Math.floor(Math.random() * severities.length)],
      tags: [`metric:${metric}`, 'env:production'],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      triggeredCount: Math.floor(Math.random() * 50),
      lastTriggered: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined
    }));
  }, []);

  // Generate mock notification channels
  const generateMockChannels = useCallback((): NotificationChannel[] => {
    return [
      {
        id: 'channel-1',
        name: 'Operations Email',
        type: 'email',
        enabled: true,
        config: {
          email: { address: 'ops@example.com' }
        },
        filters: {
          severities: ['warning', 'critical'],
          tags: ['env:production'],
          metrics: ['cpu', 'memory', 'disk']
        },
        rateLimiting: {
          enabled: true,
          maxPerHour: 10,
          maxPerDay: 50
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'channel-2',
        name: 'Critical Alerts Slack',
        type: 'slack',
        enabled: true,
        config: {
          slack: { webhookUrl: 'https://hooks.slack.com/...', channel: '#alerts' }
        },
        filters: {
          severities: ['critical'],
          tags: [],
          metrics: []
        },
        rateLimiting: {
          enabled: false,
          maxPerHour: 0,
          maxPerDay: 0
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'channel-3',
        name: 'Emergency SMS',
        type: 'sms',
        enabled: false,
        config: {
          sms: { phoneNumber: '+1234567890' }
        },
        filters: {
          severities: ['critical'],
          tags: ['emergency'],
          metrics: []
        },
        rateLimiting: {
          enabled: true,
          maxPerHour: 5,
          maxPerDay: 20
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Generate mock escalation policies
  const generateMockPolicies = useCallback((): EscalationPolicy[] => {
    return [
      {
        id: 'policy-1',
        name: 'Production Escalation',
        description: 'Standard escalation for production alerts',
        enabled: true,
        rules: [
          {
            level: 1,
            waitTime: 5,
            channels: ['channel-1'],
            conditions: {
              severities: ['warning', 'critical'],
              tags: ['env:production'],
              unacknowledgedOnly: true
            }
          },
          {
            level: 2,
            waitTime: 15,
            channels: ['channel-2'],
            conditions: {
              severities: ['critical'],
              tags: ['env:production'],
              unacknowledgedOnly: true
            }
          },
          {
            level: 3,
            waitTime: 30,
            channels: ['channel-3'],
            conditions: {
              severities: ['critical'],
              tags: ['emergency'],
              unacknowledgedOnly: true
            }
          }
        ],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Initialize data
  useEffect(() => {
    setAlerts(generateMockAlerts());
    setAlertRules(generateMockRules());
    setNotificationChannels(generateMockChannels());
    setEscalationPolicies(generateMockPolicies());
  }, [generateMockAlerts, generateMockRules, generateMockChannels, generateMockPolicies]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // In a real app, this would fetch fresh data
        setAlerts(prev => {
          // Simulate new alerts occasionally
          if (Math.random() < 0.1) {
            const newAlert = generateMockAlerts()[0];
            return [{ ...newAlert, id: `alert-${Date.now()}` }, ...prev].slice(0, maxAlerts);
          }
          return prev;
        });
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, maxAlerts, generateMockAlerts]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter(alert => {
      const matchesSearch = searchQuery === '' || 
        alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
      const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
      const matchesMetric = filterMetric === 'all' || alert.metric === filterMetric;
      
      return matchesSearch && matchesSeverity && matchesStatus && matchesMetric;
    });
    
    // Sort alerts
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'severity':
          const severityOrder = { critical: 3, warning: 2, info: 1 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'status':
          const statusOrder = { active: 4, acknowledged: 3, silenced: 2, resolved: 1 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [alerts, searchQuery, filterSeverity, filterStatus, filterMetric, sortBy, sortOrder]);

  // Alert actions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'acknowledged', 
            acknowledgedAt: new Date(),
            acknowledgedBy: 'current-user@example.com'
          }
        : alert
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'resolved', 
            resolvedAt: new Date()
          }
        : alert
    ));
  }, []);

  const silenceAlert = useCallback((alertId: string, duration: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'silenced', 
            silencedUntil: new Date(Date.now() + duration * 60 * 1000)
          }
        : alert
    ));
  }, []);

  // Rule actions
  const toggleRule = useCallback((ruleId: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
        : rule
    ));
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  // Channel actions
  const toggleChannel = useCallback((channelId: string) => {
    setNotificationChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, enabled: !channel.enabled }
        : channel
    ));
  }, []);

  const deleteChannel = useCallback((channelId: string) => {
    setNotificationChannels(prev => prev.filter(channel => channel.id !== channelId));
  }, []);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-500 bg-blue-50 border-blue-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-500 bg-red-50';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-50';
      case 'resolved': return 'text-green-500 bg-green-50';
      case 'silenced': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // Get channel type icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'teams': return <Users className="h-4 w-4" />;
      case 'discord': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
      return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Alert Manager</h2>
          <p className="text-muted-foreground">
            Manage alerts, notification channels, and escalation policies
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {alerts.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter(a => a.status === 'acknowledged').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {alerts.filter(a => a.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alertRules.filter(r => r.enabled).length}/{alertRules.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="silenced">Silenced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="metric">Metric</Label>
                  <Select value={filterMetric} onValueChange={setFilterMetric}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="cpu">CPU</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="disk">Disk</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [by, order] = value.split('-');
                    setSortBy(by as any);
                    setSortOrder(order as any);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created-desc">Newest First</SelectItem>
                      <SelectItem value="created-asc">Oldest First</SelectItem>
                      <SelectItem value="severity-desc">Severity High</SelectItem>
                      <SelectItem value="severity-asc">Severity Low</SelectItem>
                      <SelectItem value="status-desc">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        )} />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{alert.message}</span>
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mt-1">
                            Rule: {alert.ruleName} • 
                            Value: {alert.value.toFixed(1)} / {alert.threshold.toFixed(1)} • 
                            {alert.createdAt.toLocaleString()}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            {alert.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ack
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => silenceAlert(alert.id, 60)}
                            >
                              <Mute className="h-4 w-4 mr-1" />
                              Silence
                            </Button>
                          </>
                        )}
                        
                        {alert.status === 'acknowledged' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alert Rules</h3>
            <Button onClick={() => setShowRuleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          
          <div className="grid gap-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{rule.name}</span>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                          {rule.severity}
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
                      <Label>Condition</Label>
                      <p className="text-sm text-muted-foreground">
                        {rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold}%
                      </p>
                    </div>
                    
                    <div>
                      <Label>Duration</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(rule.duration)}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Triggered</Label>
                      <p className="text-sm text-muted-foreground">
                        {rule.triggeredCount} times
                        {rule.lastTriggered && (
                          <span className="block">
                            Last: {rule.lastTriggered.toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Tags</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {rule.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notification Channels</h3>
            <Button onClick={() => setShowChannelDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>
          
          <div className="grid gap-4">
            {notificationChannels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getChannelIcon(channel.type)}
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{channel.name}</span>
                          <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                            {channel.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">
                            {channel.type}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingChannel(channel);
                          setShowChannelDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Configuration</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {channel.type === 'email' && channel.config.email?.address}
                        {channel.type === 'sms' && channel.config.sms?.phoneNumber}
                        {channel.type === 'slack' && channel.config.slack?.channel}
                        {channel.type === 'webhook' && 'Webhook URL configured'}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Rate Limiting</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {channel.rateLimiting.enabled ? (
                          `${channel.rateLimiting.maxPerHour}/hour, ${channel.rateLimiting.maxPerDay}/day`
                        ) : (
                          'Disabled'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Filters</Label>
                    <div className="grid gap-2 mt-1">
                      <div className="text-sm text-muted-foreground">
                        Severities: {channel.filters.severities.length > 0 ? channel.filters.severities.join(', ') : 'All'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Metrics: {channel.filters.metrics.length > 0 ? channel.filters.metrics.join(', ') : 'All'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Escalation Policies</h3>
            <Button onClick={() => setShowPolicyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </div>
          
          <div className="grid gap-4">
            {escalationPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{policy.name}</span>
                        <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                          {policy.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPolicy(policy);
                          setShowPolicyDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Escalation Rules</Label>
                    {policy.rules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">Level {rule.level}</div>
                          <div className="text-sm text-muted-foreground">
                            Wait {formatDuration(rule.waitTime)} • 
                            Channels: {rule.channels.length} • 
                            Severities: {rule.conditions.severities.join(', ')}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {rule.conditions.unacknowledgedOnly ? 'Unack only' : 'All alerts'}
                        </Badge>
                      </div>
                    ))}
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

export default AlertManager;
export type { AlertRule, AlertInstance, NotificationChannel, EscalationPolicy };