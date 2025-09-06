'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Server,
  Wifi,
  HardDrive,
  Shield,
  Activity,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  Globe,
  Lock,
  Unlock,
  Heart,
  Cpu,
  MemoryStick,
  Network,
  FileText,
  Users,
  Mail,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Health check interfaces
interface HealthCheck {
  id: string;
  name: string;
  category: 'system' | 'database' | 'network' | 'security' | 'application' | 'external';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
  enabled: boolean;
  interval: number; // in seconds
  timeout: number; // in seconds
  retries: number;
  endpoint?: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'queue' | 'api' | 'external';
  status: 'running' | 'stopped' | 'error' | 'maintenance';
  uptime: number; // in seconds
  version?: string;
  host?: string;
  port?: number;
  lastRestart?: Date;
  memoryUsage?: number;
  cpuUsage?: number;
  connections?: number;
  maxConnections?: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
  assignee?: string;
}

interface HealthMetrics {
  overallHealth: number; // 0-100
  totalChecks: number;
  healthyChecks: number;
  warningChecks: number;
  criticalChecks: number;
  unknownChecks: number;
  averageResponseTime: number;
  uptime: number;
  lastIncident?: Date;
}

interface SystemHealthMonitorProps {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  showDetails?: boolean;
  enableNotifications?: boolean;
  apiUrl?: string;
  websocketUrl?: string;
}

const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  refreshInterval = 30000,
  enableAutoRefresh = true,
  showDetails = true,
  enableNotifications = true,
  apiUrl = '/api/health',
  websocketUrl
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(enableAutoRefresh);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  
  // Health monitoring state
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<HealthMetrics>({
    overallHealth: 100,
    totalChecks: 0,
    healthyChecks: 0,
    warningChecks: 0,
    criticalChecks: 0,
    unknownChecks: 0,
    averageResponseTime: 0,
    uptime: 0
  });

  // Generate mock health checks
  const generateMockHealthChecks = useCallback((): HealthCheck[] => {
    const checks: HealthCheck[] = [
      {
        id: 'database-connection',
        name: 'Database Connection',
        category: 'database',
        status: Math.random() > 0.1 ? 'healthy' : 'critical',
        lastCheck: new Date(),
        responseTime: 50 + Math.random() * 100,
        message: 'PostgreSQL connection active',
        enabled: true,
        interval: 30,
        timeout: 10,
        retries: 3,
        endpoint: 'postgresql://localhost:5432'
      },
      {
        id: 'redis-cache',
        name: 'Redis Cache',
        category: 'database',
        status: Math.random() > 0.05 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 10 + Math.random() * 30,
        message: 'Redis cache operational',
        enabled: true,
        interval: 60,
        timeout: 5,
        retries: 2,
        endpoint: 'redis://localhost:6379'
      },
      {
        id: 'api-health',
        name: 'API Health',
        category: 'application',
        status: Math.random() > 0.15 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 100 + Math.random() * 200,
        message: 'API endpoints responding',
        enabled: true,
        interval: 30,
        timeout: 15,
        retries: 3,
        endpoint: '/api/health'
      },
      {
        id: 'disk-space',
        name: 'Disk Space',
        category: 'system',
        status: Math.random() > 0.2 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 5,
        message: `Disk usage: ${(60 + Math.random() * 30).toFixed(1)}%`,
        enabled: true,
        interval: 300,
        timeout: 10,
        retries: 1
      },
      {
        id: 'memory-usage',
        name: 'Memory Usage',
        category: 'system',
        status: Math.random() > 0.25 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 2,
        message: `Memory usage: ${(50 + Math.random() * 40).toFixed(1)}%`,
        enabled: true,
        interval: 60,
        timeout: 5,
        retries: 1
      },
      {
        id: 'network-connectivity',
        name: 'Network Connectivity',
        category: 'network',
        status: Math.random() > 0.05 ? 'healthy' : 'critical',
        lastCheck: new Date(),
        responseTime: 20 + Math.random() * 80,
        message: 'Internet connectivity active',
        enabled: true,
        interval: 120,
        timeout: 30,
        retries: 3,
        endpoint: 'https://google.com'
      },
      {
        id: 'ssl-certificate',
        name: 'SSL Certificate',
        category: 'security',
        status: Math.random() > 0.1 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 100,
        message: 'SSL certificate valid for 45 days',
        enabled: true,
        interval: 3600,
        timeout: 10,
        retries: 2
      },
      {
        id: 'scraper-queue',
        name: 'Scraper Queue',
        category: 'application',
        status: Math.random() > 0.2 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 25,
        message: `Queue size: ${Math.floor(Math.random() * 50)} jobs`,
        enabled: true,
        interval: 60,
        timeout: 10,
        retries: 2
      },
      {
        id: 'external-api',
        name: 'External API',
        category: 'external',
        status: Math.random() > 0.3 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 200 + Math.random() * 300,
        message: 'Third-party API accessible',
        enabled: true,
        interval: 300,
        timeout: 30,
        retries: 3,
        endpoint: 'https://api.example.com'
      },
      {
        id: 'backup-system',
        name: 'Backup System',
        category: 'system',
        status: Math.random() > 0.15 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime: 50,
        message: 'Last backup: 2 hours ago',
        enabled: true,
        interval: 1800,
        timeout: 60,
        retries: 1
      }
    ];
    
    return checks;
  }, []);

  // Generate mock services
  const generateMockServices = useCallback((): ServiceStatus[] => {
    const services: ServiceStatus[] = [
      {
        id: 'web-server',
        name: 'Web Server',
        type: 'service',
        status: Math.random() > 0.05 ? 'running' : 'error',
        uptime: Math.floor(Math.random() * 86400 * 30), // Up to 30 days
        version: '2.4.1',
        host: 'localhost',
        port: 3000,
        memoryUsage: 50 + Math.random() * 30,
        cpuUsage: 10 + Math.random() * 20,
        connections: Math.floor(Math.random() * 100),
        maxConnections: 1000
      },
      {
        id: 'database',
        name: 'PostgreSQL',
        type: 'database',
        status: Math.random() > 0.02 ? 'running' : 'error',
        uptime: Math.floor(Math.random() * 86400 * 60), // Up to 60 days
        version: '14.9',
        host: 'localhost',
        port: 5432,
        memoryUsage: 200 + Math.random() * 100,
        cpuUsage: 5 + Math.random() * 15,
        connections: Math.floor(Math.random() * 50),
        maxConnections: 200
      },
      {
        id: 'redis',
        name: 'Redis Cache',
        type: 'cache',
        status: Math.random() > 0.03 ? 'running' : 'error',
        uptime: Math.floor(Math.random() * 86400 * 45), // Up to 45 days
        version: '7.0.12',
        host: 'localhost',
        port: 6379,
        memoryUsage: 100 + Math.random() * 50,
        cpuUsage: 2 + Math.random() * 8,
        connections: Math.floor(Math.random() * 20),
        maxConnections: 100
      },
      {
        id: 'scraper-worker',
        name: 'Scraper Worker',
        type: 'service',
        status: Math.random() > 0.1 ? 'running' : 'stopped',
        uptime: Math.floor(Math.random() * 86400 * 7), // Up to 7 days
        version: '1.2.3',
        memoryUsage: 150 + Math.random() * 100,
        cpuUsage: 20 + Math.random() * 40
      },
      {
        id: 'message-queue',
        name: 'Message Queue',
        type: 'queue',
        status: Math.random() > 0.05 ? 'running' : 'error',
        uptime: Math.floor(Math.random() * 86400 * 20), // Up to 20 days
        version: '3.8.0',
        host: 'localhost',
        port: 5672,
        memoryUsage: 80 + Math.random() * 40,
        cpuUsage: 5 + Math.random() * 10
      }
    ];
    
    return services;
  }, []);

  // Generate mock alerts
  const generateMockAlerts = useCallback((): SystemAlert[] => {
    const alerts: SystemAlert[] = [];
    
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        type: 'warning',
        title: 'High Memory Usage',
        message: 'System memory usage has exceeded 85% threshold',
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        source: 'memory-monitor',
        acknowledged: false,
        resolved: false
      });
    }
    
    if (Math.random() > 0.8) {
      alerts.push({
        id: `alert-${Date.now()}-2`,
        type: 'error',
        title: 'Database Connection Failed',
        message: 'Unable to establish connection to primary database',
        timestamp: new Date(Date.now() - Math.random() * 1800000),
        source: 'database-monitor',
        acknowledged: false,
        resolved: false
      });
    }
    
    if (Math.random() > 0.9) {
      alerts.push({
        id: `alert-${Date.now()}-3`,
        type: 'critical',
        title: 'Service Unavailable',
        message: 'Web server has stopped responding to health checks',
        timestamp: new Date(Date.now() - Math.random() * 600000),
        source: 'service-monitor',
        acknowledged: false,
        resolved: false
      });
    }
    
    return alerts;
  }, []);

  // Update health data
  const updateHealthData = useCallback(() => {
    const checks = generateMockHealthChecks();
    const serviceList = generateMockServices();
    const alertList = generateMockAlerts();
    
    setHealthChecks(checks);
    setServices(serviceList);
    setAlerts(prev => [...alertList, ...prev].slice(0, 50)); // Keep last 50 alerts
    
    // Calculate metrics
    const totalChecks = checks.length;
    const healthyChecks = checks.filter(c => c.status === 'healthy').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    const criticalChecks = checks.filter(c => c.status === 'critical').length;
    const unknownChecks = checks.filter(c => c.status === 'unknown').length;
    
    const overallHealth = totalChecks > 0 ? 
      ((healthyChecks * 100 + warningChecks * 50 + criticalChecks * 0 + unknownChecks * 25) / totalChecks) : 100;
    
    const averageResponseTime = checks.reduce((sum, check) => 
      sum + (check.responseTime || 0), 0) / checks.length;
    
    setMetrics({
      overallHealth,
      totalChecks,
      healthyChecks,
      warningChecks,
      criticalChecks,
      unknownChecks,
      averageResponseTime,
      uptime: Math.floor(Math.random() * 86400 * 30) // Mock uptime
    });
    
    setLastUpdate(new Date());
  }, [generateMockHealthChecks, generateMockServices, generateMockAlerts]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(updateHealthData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, updateHealthData]);

  // Initial data load
  useEffect(() => {
    updateHealthData();
  }, [updateHealthData]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateHealthData();
    } finally {
      setIsLoading(false);
    }
  }, [updateHealthData]);

  // Toggle health check
  const toggleHealthCheck = useCallback((checkId: string) => {
    setHealthChecks(prev => prev.map(check => 
      check.id === checkId ? { ...check, enabled: !check.enabled } : check
    ));
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  }, []);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'application':
        return <Activity className="h-4 w-4" />;
      case 'external':
        return <Globe className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Filter health checks
  const filteredHealthChecks = useMemo(() => {
    if (showOnlyIssues) {
      return healthChecks.filter(check => check.status !== 'healthy');
    }
    return healthChecks;
  }, [healthChecks, showOnlyIssues]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (showOnlyIssues) {
      return services.filter(service => service.status !== 'running');
    }
    return services;
  }, [services, showOnlyIssues]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Health Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of system components and services
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant={metrics.overallHealth >= 90 ? 'default' : 
                    metrics.overallHealth >= 70 ? 'secondary' : 'destructive'}
          >
            {metrics.overallHealth.toFixed(0)}% Healthy
          </Badge>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={showOnlyIssues}
              onCheckedChange={setShowOnlyIssues}
            />
            <span className="text-sm text-muted-foreground">Issues only</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn(
              'h-4 w-4 mr-2',
              isLoading && 'animate-spin'
            )} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.filter(alert => !alert.resolved).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <div className="grid gap-2">
            {alerts.filter(alert => !alert.resolved).slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'critical' || alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  {alert.title}
                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Source: {alert.source} • {alert.timestamp.toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallHealth.toFixed(0)}%</div>
            <Progress value={metrics.overallHealth} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Checks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.healthyChecks}/{metrics.totalChecks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.warningChecks} warnings, {metrics.criticalChecks} critical
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Average across all checks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics.uptime)}</div>
            <p className="text-xs text-muted-foreground">Since last restart</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health-checks">Health Checks</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Status by Category */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Health Status by Category</CardTitle>
                <CardDescription>Current status of different system components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['system', 'database', 'network', 'security', 'application', 'external'].map(category => {
                  const categoryChecks = healthChecks.filter(check => check.category === category);
                  const healthyCount = categoryChecks.filter(check => check.status === 'healthy').length;
                  const totalCount = categoryChecks.length;
                  const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 100;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </div>
                        <span>{healthyCount}/{totalCount}</span>
                      </div>
                      <Progress value={healthPercentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>Current status of running services</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {service.version && `v${service.version} • `}
                              {formatUptime(service.uptime)}
                            </div>
                          </div>
                        </div>
                        <Badge variant={service.status === 'running' ? 'default' : 'destructive'}>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health-checks" className="space-y-6">
          <div className="grid gap-4">
            {filteredHealthChecks.map((check) => (
              <Card key={check.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      {getCategoryIcon(check.category)}
                      <div>
                        <CardTitle className="text-base">{check.name}</CardTitle>
                        <CardDescription>
                          {check.message} • Last check: {check.lastCheck.toLocaleTimeString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{check.category}</Badge>
                      <Switch
                        checked={check.enabled}
                        onCheckedChange={() => toggleHealthCheck(check.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                {showDetails && (
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Response Time</h4>
                        <p className="text-sm">{check.responseTime?.toFixed(0) || 'N/A'} ms</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Check Interval</h4>
                        <p className="text-sm">{check.interval}s</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Timeout</h4>
                        <p className="text-sm">{check.timeout}s</p>
                      </div>
                      {check.endpoint && (
                        <div className="md:col-span-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Endpoint</h4>
                          <p className="text-sm font-mono">{check.endpoint}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-4">
            {filteredServices.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <CardTitle className="text-base">{service.name}</CardTitle>
                        <CardDescription>
                          {service.type} • Uptime: {formatUptime(service.uptime)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={service.status === 'running' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                </CardHeader>
                {showDetails && (
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {service.version && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Version</h4>
                          <p className="text-sm">{service.version}</p>
                        </div>
                      )}
                      {service.host && service.port && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                          <p className="text-sm">{service.host}:{service.port}</p>
                        </div>
                      )}
                      {service.memoryUsage && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Memory</h4>
                          <p className="text-sm">{service.memoryUsage.toFixed(1)} MB</p>
                        </div>
                      )}
                      {service.cpuUsage && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">CPU</h4>
                          <p className="text-sm">{service.cpuUsage.toFixed(1)}%</p>
                        </div>
                      )}
                      {service.connections !== undefined && service.maxConnections && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Connections</h4>
                          <div className="space-y-1">
                            <p className="text-sm">{service.connections}/{service.maxConnections}</p>
                            <Progress 
                              value={(service.connections / service.maxConnections) * 100} 
                              className="h-1" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">System Alerts</h3>
              <div className="text-sm text-muted-foreground">
                {alerts.filter(alert => !alert.resolved).length} active alerts
              </div>
            </div>
            
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={cn(
                  alert.resolved && 'opacity-50',
                  alert.type === 'critical' && 'border-red-500',
                  alert.type === 'error' && 'border-red-400',
                  alert.type === 'warning' && 'border-yellow-400'
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {alert.type === 'critical' && <XCircle className="h-5 w-5 text-red-500" />}
                        {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-400" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                        <div>
                          <CardTitle className="text-base">{alert.title}</CardTitle>
                          <CardDescription>
                            {alert.source} • {alert.timestamp.toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.type === 'critical' || alert.type === 'error' ? 'destructive' : 
                                      alert.type === 'warning' ? 'secondary' : 'default'}>
                          {alert.type}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                        {alert.resolved && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{alert.message}</p>
                    {!alert.resolved && (
                      <div className="flex space-x-2 mt-4">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthMonitor;
export type { HealthCheck, ServiceStatus, SystemAlert, HealthMetrics };