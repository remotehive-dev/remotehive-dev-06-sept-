'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  BarChart3,
  Clock,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  Network,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Info,
  X,
  Gauge,
  Server,
  Wifi,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RealTimeChart from '@/components/dashboard/widgets/RealTimeChart';
import MetricsCard from '@/components/dashboard/widgets/MetricsCard';

// Performance metrics interfaces
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
    frequency?: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    available: number;
    percentage: number;
    readSpeed?: number;
    writeSpeed?: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    latency?: number;
    bandwidth?: number;
  };
}

interface ApplicationMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    totalRequests: number;
  };
  errors: {
    rate: number;
    total: number;
    types: Record<string, number>;
  };
  scrapers: {
    active: number;
    queued: number;
    completed: number;
    failed: number;
    successRate: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  suggestion?: string;
}

interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'memory' | 'network' | 'storage';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: string;
}

interface PerformanceMonitorProps {
  refreshInterval?: number;
  enableRealTime?: boolean;
  showOptimizations?: boolean;
  enableAlerts?: boolean;
  apiUrl?: string;
  websocketUrl?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  refreshInterval = 5000,
  enableRealTime = true,
  showOptimizations = true,
  enableAlerts = true,
  apiUrl = '/api/performance',
  websocketUrl
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(enableRealTime);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  
  // Performance data state
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, cores: 8 },
    memory: { used: 0, total: 16384, available: 0, percentage: 0 },
    disk: { used: 0, total: 512000, available: 0, percentage: 0 },
    network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 }
  });
  
  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics>({
    responseTime: { average: 0, p95: 0, p99: 0, min: 0, max: 0 },
    throughput: { requestsPerSecond: 0, requestsPerMinute: 0, totalRequests: 0 },
    errors: { rate: 0, total: 0, types: {} },
    scrapers: { active: 0, queued: 0, completed: 0, failed: 0, successRate: 0 }
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Generate mock performance data
  const generateMockData = useCallback(() => {
    const now = Date.now();
    
    // System metrics
    const newSystemMetrics: SystemMetrics = {
      cpu: {
        usage: Math.random() * 100,
        cores: 8,
        temperature: 45 + Math.random() * 20,
        frequency: 2.4 + Math.random() * 1.6
      },
      memory: {
        used: 8192 + Math.random() * 4096,
        total: 16384,
        available: 0,
        percentage: 0
      },
      disk: {
        used: 256000 + Math.random() * 128000,
        total: 512000,
        available: 0,
        percentage: 0,
        readSpeed: 100 + Math.random() * 400,
        writeSpeed: 80 + Math.random() * 320
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 800000,
        packetsIn: Math.random() * 10000,
        packetsOut: Math.random() * 8000,
        latency: 10 + Math.random() * 50,
        bandwidth: 80 + Math.random() * 20
      }
    };
    
    // Calculate derived values
    newSystemMetrics.memory.available = newSystemMetrics.memory.total - newSystemMetrics.memory.used;
    newSystemMetrics.memory.percentage = (newSystemMetrics.memory.used / newSystemMetrics.memory.total) * 100;
    newSystemMetrics.disk.available = newSystemMetrics.disk.total - newSystemMetrics.disk.used;
    newSystemMetrics.disk.percentage = (newSystemMetrics.disk.used / newSystemMetrics.disk.total) * 100;
    
    // Application metrics
    const newAppMetrics: ApplicationMetrics = {
      responseTime: {
        average: 150 + Math.random() * 200,
        p95: 300 + Math.random() * 400,
        p99: 500 + Math.random() * 800,
        min: 50 + Math.random() * 50,
        max: 1000 + Math.random() * 2000
      },
      throughput: {
        requestsPerSecond: 10 + Math.random() * 40,
        requestsPerMinute: 600 + Math.random() * 2400,
        totalRequests: 50000 + Math.random() * 100000
      },
      errors: {
        rate: Math.random() * 5,
        total: Math.floor(Math.random() * 100),
        types: {
          'timeout': Math.floor(Math.random() * 20),
          'connection': Math.floor(Math.random() * 15),
          'parsing': Math.floor(Math.random() * 10),
          'rate_limit': Math.floor(Math.random() * 25)
        }
      },
      scrapers: {
        active: Math.floor(Math.random() * 10) + 1,
        queued: Math.floor(Math.random() * 20),
        completed: Math.floor(Math.random() * 1000) + 500,
        failed: Math.floor(Math.random() * 50),
        successRate: 85 + Math.random() * 15
      }
    };
    
    setSystemMetrics(newSystemMetrics);
    setAppMetrics(newAppMetrics);
    
    // Generate historical data point
    const dataPoint = {
      timestamp: now,
      cpu: newSystemMetrics.cpu.usage,
      memory: newSystemMetrics.memory.percentage,
      disk: newSystemMetrics.disk.percentage,
      responseTime: newAppMetrics.responseTime.average,
      throughput: newAppMetrics.throughput.requestsPerSecond,
      errorRate: newAppMetrics.errors.rate
    };
    
    setHistoricalData(prev => {
      const updated = [...prev, dataPoint];
      // Keep only last 100 points
      return updated.slice(-100);
    });
    
    // Generate alerts based on thresholds
    const newAlerts: PerformanceAlert[] = [];
    
    if (newSystemMetrics.cpu.usage > 80) {
      newAlerts.push({
        id: `cpu-${now}`,
        type: 'warning',
        title: 'High CPU Usage',
        message: `CPU usage is at ${newSystemMetrics.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'cpu',
        value: newSystemMetrics.cpu.usage,
        threshold: 80,
        suggestion: 'Consider scaling up or optimizing CPU-intensive operations'
      });
    }
    
    if (newSystemMetrics.memory.percentage > 85) {
      newAlerts.push({
        id: `memory-${now}`,
        type: 'error',
        title: 'High Memory Usage',
        message: `Memory usage is at ${newSystemMetrics.memory.percentage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'memory',
        value: newSystemMetrics.memory.percentage,
        threshold: 85,
        suggestion: 'Implement memory optimization or increase available RAM'
      });
    }
    
    if (newAppMetrics.responseTime.average > 500) {
      newAlerts.push({
        id: `response-${now}`,
        type: 'warning',
        title: 'Slow Response Time',
        message: `Average response time is ${newAppMetrics.responseTime.average.toFixed(0)}ms`,
        timestamp: new Date(),
        metric: 'responseTime',
        value: newAppMetrics.responseTime.average,
        threshold: 500,
        suggestion: 'Optimize database queries and implement caching'
      });
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
    }
    
    setLastUpdate(new Date());
  }, []);

  // Generate optimization suggestions
  const generateOptimizations = useCallback(() => {
    const optimizations: OptimizationSuggestion[] = [
      {
        id: 'cache-implementation',
        category: 'performance',
        priority: 'high',
        title: 'Implement Redis Caching',
        description: 'Add Redis caching layer for frequently accessed data',
        impact: 'Reduce response time by 40-60%',
        implementation: 'Install Redis and implement caching middleware',
        estimatedImprovement: '40-60% faster response times'
      },
      {
        id: 'database-indexing',
        category: 'performance',
        priority: 'high',
        title: 'Optimize Database Indexes',
        description: 'Add missing indexes on frequently queried columns',
        impact: 'Improve query performance by 30-50%',
        implementation: 'Analyze slow queries and add appropriate indexes',
        estimatedImprovement: '30-50% faster database queries'
      },
      {
        id: 'memory-pooling',
        category: 'memory',
        priority: 'medium',
        title: 'Implement Connection Pooling',
        description: 'Use connection pooling to reduce memory overhead',
        impact: 'Reduce memory usage by 20-30%',
        implementation: 'Configure connection pool with optimal settings',
        estimatedImprovement: '20-30% memory reduction'
      },
      {
        id: 'async-processing',
        category: 'performance',
        priority: 'medium',
        title: 'Implement Async Processing',
        description: 'Move heavy operations to background tasks',
        impact: 'Improve user experience and throughput',
        implementation: 'Use Celery or similar task queue system',
        estimatedImprovement: '50-70% better throughput'
      },
      {
        id: 'cdn-implementation',
        category: 'network',
        priority: 'low',
        title: 'Implement CDN',
        description: 'Use Content Delivery Network for static assets',
        impact: 'Reduce bandwidth usage and improve load times',
        implementation: 'Configure CDN service and update asset URLs',
        estimatedImprovement: '30-40% faster asset loading'
      }
    ];
    
    setSuggestions(optimizations);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(generateMockData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, generateMockData]);

  // Initial data load
  useEffect(() => {
    generateMockData();
    generateOptimizations();
  }, [generateMockData, generateOptimizations]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      generateMockData();
    } finally {
      setIsLoading(false);
    }
  }, [generateMockData]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Get performance status
  const getPerformanceStatus = useMemo(() => {
    const cpuStatus = systemMetrics.cpu.usage > 80 ? 'critical' : systemMetrics.cpu.usage > 60 ? 'warning' : 'good';
    const memoryStatus = systemMetrics.memory.percentage > 85 ? 'critical' : systemMetrics.memory.percentage > 70 ? 'warning' : 'good';
    const responseStatus = appMetrics.responseTime.average > 500 ? 'critical' : appMetrics.responseTime.average > 300 ? 'warning' : 'good';
    
    if (cpuStatus === 'critical' || memoryStatus === 'critical' || responseStatus === 'critical') {
      return { status: 'critical', message: 'Critical performance issues detected' };
    }
    if (cpuStatus === 'warning' || memoryStatus === 'warning' || responseStatus === 'warning') {
      return { status: 'warning', message: 'Performance degradation detected' };
    }
    return { status: 'good', message: 'System performance is optimal' };
  }, [systemMetrics, appMetrics]);

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time system and application performance monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant={getPerformanceStatus.status === 'critical' ? 'destructive' : 
                    getPerformanceStatus.status === 'warning' ? 'secondary' : 'default'}
          >
            {getPerformanceStatus.message}
          </Badge>
          
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
      {enableAlerts && alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <div className="grid gap-2">
            {alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  {alert.title}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                  {alert.suggestion && (
                    <div className="mt-2 text-sm">
                      <strong>Suggestion:</strong> {alert.suggestion}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricsCard
              title="CPU Usage"
              value={`${systemMetrics.cpu.usage.toFixed(1)}%`}
              change={Math.random() * 10 - 5}
              trend={systemMetrics.cpu.usage > 70 ? 'down' : 'up'}
              icon={Cpu}
              description="Current CPU utilization"
            />
            
            <MetricsCard
              title="Memory Usage"
              value={`${systemMetrics.memory.percentage.toFixed(1)}%`}
              change={Math.random() * 10 - 5}
              trend={systemMetrics.memory.percentage > 80 ? 'down' : 'up'}
              icon={MemoryStick}
              description="RAM utilization"
            />
            
            <MetricsCard
              title="Response Time"
              value={`${appMetrics.responseTime.average.toFixed(0)}ms`}
              change={Math.random() * 50 - 25}
              trend={appMetrics.responseTime.average > 300 ? 'down' : 'up'}
              icon={Clock}
              description="Average API response time"
            />
            
            <MetricsCard
              title="Throughput"
              value={`${appMetrics.throughput.requestsPerSecond.toFixed(1)}/s`}
              change={Math.random() * 5 - 2.5}
              trend="up"
              icon={Zap}
              description="Requests per second"
            />
          </div>

          {/* Performance Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>CPU, Memory, and Disk usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  data={historicalData.map(d => ({
                    time: new Date(d.timestamp).toISOString(),
                    cpu: d.cpu,
                    memory: d.memory,
                    disk: d.disk
                  }))}
                  type="line"
                  height={300}
                  showControls={true}
                  enableZoom={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Performance</CardTitle>
                <CardDescription>Response time and throughput metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  data={historicalData.map(d => ({
                    time: new Date(d.timestamp).toISOString(),
                    responseTime: d.responseTime,
                    throughput: d.throughput * 10, // Scale for visibility
                    errorRate: d.errorRate * 20 // Scale for visibility
                  }))}
                  type="line"
                  height={300}
                  showControls={true}
                  enableZoom={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Metrics Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>CPU Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{systemMetrics.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.cpu.usage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cores:</span>
                    <span className="ml-2 font-medium">{systemMetrics.cpu.cores}</span>
                  </div>
                  {systemMetrics.cpu.temperature && (
                    <div>
                      <span className="text-muted-foreground">Temp:</span>
                      <span className="ml-2 font-medium">{systemMetrics.cpu.temperature.toFixed(1)}°C</span>
                    </div>
                  )}
                  {systemMetrics.cpu.frequency && (
                    <div>
                      <span className="text-muted-foreground">Freq:</span>
                      <span className="ml-2 font-medium">{systemMetrics.cpu.frequency.toFixed(1)} GHz</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MemoryStick className="h-5 w-5" />
                  <span>Memory Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{systemMetrics.memory.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.memory.percentage} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.memory.used * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.memory.available * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.memory.total * 1024 * 1024)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>Disk Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{systemMetrics.disk.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.disk.percentage} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.disk.used * 1024 * 1024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.disk.available * 1024 * 1024)}</span>
                  </div>
                  {systemMetrics.disk.readSpeed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Read Speed:</span>
                      <span className="font-medium">{systemMetrics.disk.readSpeed.toFixed(1)} MB/s</span>
                    </div>
                  )}
                  {systemMetrics.disk.writeSpeed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Write Speed:</span>
                      <span className="font-medium">{systemMetrics.disk.writeSpeed.toFixed(1)} MB/s</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="h-5 w-5" />
                  <span>Network Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bytes In:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.network.bytesIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bytes Out:</span>
                    <span className="font-medium">{formatBytes(systemMetrics.network.bytesOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packets In:</span>
                    <span className="font-medium">{formatNumber(systemMetrics.network.packetsIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packets Out:</span>
                    <span className="font-medium">{formatNumber(systemMetrics.network.packetsOut)}</span>
                  </div>
                  {systemMetrics.network.latency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="font-medium">{systemMetrics.network.latency.toFixed(1)} ms</span>
                    </div>
                  )}
                  {systemMetrics.network.bandwidth && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bandwidth:</span>
                      <span className="font-medium">{systemMetrics.network.bandwidth.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="application" className="space-y-6">
          {/* Application Metrics Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Response Time Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average:</span>
                    <span className="font-medium">{appMetrics.responseTime.average.toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">95th Percentile:</span>
                    <span className="font-medium">{appMetrics.responseTime.p95.toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">99th Percentile:</span>
                    <span className="font-medium">{appMetrics.responseTime.p99.toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min:</span>
                    <span className="font-medium">{appMetrics.responseTime.min.toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max:</span>
                    <span className="font-medium">{appMetrics.responseTime.max.toFixed(0)} ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Throughput Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requests/Second:</span>
                    <span className="font-medium">{appMetrics.throughput.requestsPerSecond.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requests/Minute:</span>
                    <span className="font-medium">{appMetrics.throughput.requestsPerMinute.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Requests:</span>
                    <span className="font-medium">{formatNumber(appMetrics.throughput.totalRequests)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Error Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span>{appMetrics.errors.rate.toFixed(2)}%</span>
                  </div>
                  <Progress value={appMetrics.errors.rate} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Errors:</span>
                    <span className="font-medium">{appMetrics.errors.total}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Error Types:</span>
                    {Object.entries(appMetrics.errors.types).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type.replace('_', ' ')}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Scraper Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{appMetrics.scrapers.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={appMetrics.scrapers.successRate} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active:</span>
                    <span className="font-medium">{appMetrics.scrapers.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Queued:</span>
                    <span className="font-medium">{appMetrics.scrapers.queued}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">{formatNumber(appMetrics.scrapers.completed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium">{appMetrics.scrapers.failed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {showOptimizations && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optimization Suggestions</h3>
              
              <div className="grid gap-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Badge variant={suggestion.priority === 'high' ? 'destructive' : 
                                        suggestion.priority === 'medium' ? 'secondary' : 'outline'}>
                            {suggestion.priority}
                          </Badge>
                          <span>{suggestion.title}</span>
                        </CardTitle>
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                      <CardDescription>{suggestion.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Impact</h4>
                          <p className="text-sm">{suggestion.impact}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Implementation</h4>
                          <p className="text-sm">{suggestion.implementation}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Estimated Improvement</h4>
                          <p className="text-sm font-medium text-green-600">{suggestion.estimatedImprovement}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;
export type { SystemMetrics, ApplicationMetrics, PerformanceAlert, OptimizationSuggestion };