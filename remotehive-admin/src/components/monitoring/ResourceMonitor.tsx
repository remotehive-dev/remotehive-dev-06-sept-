'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Server,
  Thermometer,
  Zap,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Resource monitoring interfaces
interface ResourceMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 0-100
    cores: number;
    frequency: number; // GHz
    temperature?: number; // Celsius
    processes: number;
    loadAverage: number[];
  };
  memory: {
    usage: number; // 0-100
    used: number; // GB
    total: number; // GB
    available: number; // GB
    cached: number; // GB
    buffers: number; // GB
    swapUsed: number; // GB
    swapTotal: number; // GB
  };
  disk: {
    usage: number; // 0-100
    used: number; // GB
    total: number; // GB
    available: number; // GB
    readSpeed: number; // MB/s
    writeSpeed: number; // MB/s
    iops: number;
  };
  network: {
    downloadSpeed: number; // MB/s
    uploadSpeed: number; // MB/s
    totalDownload: number; // GB
    totalUpload: number; // GB
    connections: number;
    latency: number; // ms
    packetLoss: number; // %
  };
}

interface ResourceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface ResourceThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  network: { warning: number; critical: number };
  temperature: { warning: number; critical: number };
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  user: string;
  startTime: Date;
}

interface ResourceMonitorProps {
  refreshInterval?: number;
  historyLength?: number;
  enableAlerts?: boolean;
  showProcesses?: boolean;
  thresholds?: Partial<ResourceThresholds>;
  apiUrl?: string;
}

const ResourceMonitor: React.FC<ResourceMonitorProps> = ({
  refreshInterval = 5000,
  historyLength = 60,
  enableAlerts = true,
  showProcesses = true,
  thresholds: customThresholds,
  apiUrl = '/api/resources'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  
  // Resource monitoring state
  const [currentMetrics, setCurrentMetrics] = useState<ResourceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<ResourceMetrics[]>([]);
  const [alerts, setAlerts] = useState<ResourceAlert[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [thresholds, setThresholds] = useState<ResourceThresholds>({
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    network: { warning: 80, critical: 95 },
    temperature: { warning: 70, critical: 85 },
    ...customThresholds
  });

  // Generate mock resource metrics
  const generateMockMetrics = useCallback((): ResourceMetrics => {
    const now = new Date();
    
    // Generate realistic fluctuating values
    const cpuBase = 20 + Math.sin(Date.now() / 10000) * 15;
    const memoryBase = 60 + Math.sin(Date.now() / 15000) * 10;
    const diskBase = 45 + Math.sin(Date.now() / 20000) * 5;
    
    return {
      timestamp: now,
      cpu: {
        usage: Math.max(0, Math.min(100, cpuBase + (Math.random() - 0.5) * 20)),
        cores: 8,
        frequency: 3.2 + Math.random() * 0.8,
        temperature: 45 + Math.random() * 25,
        processes: 150 + Math.floor(Math.random() * 50),
        loadAverage: [1.2, 1.5, 1.8]
      },
      memory: {
        usage: Math.max(0, Math.min(100, memoryBase + (Math.random() - 0.5) * 15)),
        used: 0,
        total: 16,
        available: 0,
        cached: 2 + Math.random() * 2,
        buffers: 0.5 + Math.random() * 0.5,
        swapUsed: Math.random() * 2,
        swapTotal: 4
      },
      disk: {
        usage: Math.max(0, Math.min(100, diskBase + (Math.random() - 0.5) * 10)),
        used: 0,
        total: 500,
        available: 0,
        readSpeed: Math.random() * 100,
        writeSpeed: Math.random() * 50,
        iops: 1000 + Math.random() * 2000
      },
      network: {
        downloadSpeed: Math.random() * 10,
        uploadSpeed: Math.random() * 5,
        totalDownload: 150 + Math.random() * 50,
        totalUpload: 75 + Math.random() * 25,
        connections: 50 + Math.floor(Math.random() * 100),
        latency: 10 + Math.random() * 20,
        packetLoss: Math.random() * 2
      }
    };
  }, []);

  // Calculate derived values
  const calculateDerivedValues = useCallback((metrics: ResourceMetrics): ResourceMetrics => {
    const memoryUsed = (metrics.memory.usage / 100) * metrics.memory.total;
    const memoryAvailable = metrics.memory.total - memoryUsed;
    const diskUsed = (metrics.disk.usage / 100) * metrics.disk.total;
    const diskAvailable = metrics.disk.total - diskUsed;
    
    return {
      ...metrics,
      memory: {
        ...metrics.memory,
        used: memoryUsed,
        available: memoryAvailable
      },
      disk: {
        ...metrics.disk,
        used: diskUsed,
        available: diskAvailable
      }
    };
  }, []);

  // Generate mock processes
  const generateMockProcesses = useCallback((): ProcessInfo[] => {
    const processNames = [
      'chrome', 'firefox', 'code', 'node', 'python', 'docker', 'postgres',
      'redis', 'nginx', 'apache', 'mysql', 'mongodb', 'elasticsearch',
      'java', 'dotnet', 'ruby', 'php', 'go', 'rust', 'systemd'
    ];
    
    return processNames.slice(0, 10 + Math.floor(Math.random() * 10)).map((name, index) => ({
      pid: 1000 + index,
      name,
      cpuUsage: Math.random() * 25,
      memoryUsage: Math.random() * 1000,
      status: Math.random() > 0.1 ? 'running' : 'sleeping',
      user: Math.random() > 0.3 ? 'user' : 'root',
      startTime: new Date(Date.now() - Math.random() * 86400000)
    }));
  }, []);

  // Check for alerts
  const checkAlerts = useCallback((metrics: ResourceMetrics) => {
    const newAlerts: ResourceAlert[] = [];
    
    // CPU alerts
    if (metrics.cpu.usage >= thresholds.cpu.critical) {
      newAlerts.push({
        id: `cpu-critical-${Date.now()}`,
        type: 'cpu',
        severity: 'critical',
        message: `CPU usage is critically high at ${metrics.cpu.usage.toFixed(1)}%`,
        threshold: thresholds.cpu.critical,
        currentValue: metrics.cpu.usage,
        timestamp: new Date(),
        acknowledged: false
      });
    } else if (metrics.cpu.usage >= thresholds.cpu.warning) {
      newAlerts.push({
        id: `cpu-warning-${Date.now()}`,
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is high at ${metrics.cpu.usage.toFixed(1)}%`,
        threshold: thresholds.cpu.warning,
        currentValue: metrics.cpu.usage,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Memory alerts
    if (metrics.memory.usage >= thresholds.memory.critical) {
      newAlerts.push({
        id: `memory-critical-${Date.now()}`,
        type: 'memory',
        severity: 'critical',
        message: `Memory usage is critically high at ${metrics.memory.usage.toFixed(1)}%`,
        threshold: thresholds.memory.critical,
        currentValue: metrics.memory.usage,
        timestamp: new Date(),
        acknowledged: false
      });
    } else if (metrics.memory.usage >= thresholds.memory.warning) {
      newAlerts.push({
        id: `memory-warning-${Date.now()}`,
        type: 'memory',
        severity: 'warning',
        message: `Memory usage is high at ${metrics.memory.usage.toFixed(1)}%`,
        threshold: thresholds.memory.warning,
        currentValue: metrics.memory.usage,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Disk alerts
    if (metrics.disk.usage >= thresholds.disk.critical) {
      newAlerts.push({
        id: `disk-critical-${Date.now()}`,
        type: 'disk',
        severity: 'critical',
        message: `Disk usage is critically high at ${metrics.disk.usage.toFixed(1)}%`,
        threshold: thresholds.disk.critical,
        currentValue: metrics.disk.usage,
        timestamp: new Date(),
        acknowledged: false
      });
    } else if (metrics.disk.usage >= thresholds.disk.warning) {
      newAlerts.push({
        id: `disk-warning-${Date.now()}`,
        type: 'disk',
        severity: 'warning',
        message: `Disk usage is high at ${metrics.disk.usage.toFixed(1)}%`,
        threshold: thresholds.disk.warning,
        currentValue: metrics.disk.usage,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    // Temperature alerts
    if (metrics.cpu.temperature && metrics.cpu.temperature >= thresholds.temperature.critical) {
      newAlerts.push({
        id: `temp-critical-${Date.now()}`,
        type: 'cpu',
        severity: 'critical',
        message: `CPU temperature is critically high at ${metrics.cpu.temperature.toFixed(1)}°C`,
        threshold: thresholds.temperature.critical,
        currentValue: metrics.cpu.temperature,
        timestamp: new Date(),
        acknowledged: false
      });
    } else if (metrics.cpu.temperature && metrics.cpu.temperature >= thresholds.temperature.warning) {
      newAlerts.push({
        id: `temp-warning-${Date.now()}`,
        type: 'cpu',
        severity: 'warning',
        message: `CPU temperature is high at ${metrics.cpu.temperature.toFixed(1)}°C`,
        threshold: thresholds.temperature.warning,
        currentValue: metrics.cpu.temperature,
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    if (enableAlerts && newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 100)); // Keep last 100 alerts
    }
  }, [thresholds, enableAlerts]);

  // Update resource data
  const updateResourceData = useCallback(() => {
    const rawMetrics = generateMockMetrics();
    const metrics = calculateDerivedValues(rawMetrics);
    const processData = generateMockProcesses();
    
    setCurrentMetrics(metrics);
    setProcesses(processData);
    
    // Update history
    setMetricsHistory(prev => {
      const newHistory = [...prev, metrics];
      return newHistory.slice(-historyLength);
    });
    
    // Check for alerts
    checkAlerts(metrics);
    
    setLastUpdate(new Date());
  }, [generateMockMetrics, calculateDerivedValues, generateMockProcesses, historyLength, checkAlerts]);

  // Auto-refresh effect
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(updateResourceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, refreshInterval, updateResourceData]);

  // Initial data load
  useEffect(() => {
    updateResourceData();
  }, [updateResourceData]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      updateResourceData();
    } finally {
      setIsLoading(false);
    }
  }, [updateResourceData]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get chart data based on time range
  const chartData = useMemo(() => {
    const ranges = {
      '1m': 12,   // Last 12 data points (1 minute)
      '5m': 60,   // Last 60 data points (5 minutes)
      '15m': 180, // Last 180 data points (15 minutes)
      '1h': 720   // Last 720 data points (1 hour)
    };
    
    const dataPoints = ranges[timeRange];
    const data = metricsHistory.slice(-dataPoints);
    
    return data.map((metrics, index) => ({
      time: metrics.timestamp.toLocaleTimeString(),
      cpu: metrics.cpu.usage,
      memory: metrics.memory.usage,
      disk: metrics.disk.usage,
      network: (metrics.network.downloadSpeed + metrics.network.uploadSpeed) * 10, // Scale for visibility
      temperature: metrics.cpu.temperature || 0
    }));
  }, [metricsHistory, timeRange]);

  // Get resource status color
  const getResourceStatus = (usage: number, type: keyof ResourceThresholds) => {
    if (usage >= thresholds[type].critical) return 'critical';
    if (usage >= thresholds[type].warning) return 'warning';
    return 'normal';
  };

  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  // Format bytes
  const formatBytes = (bytes: number, decimals = 1): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
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

  if (!currentMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", expandedView && "fixed inset-0 z-50 bg-background p-6 overflow-auto")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resource Monitor</h2>
          <p className="text-muted-foreground">
            Real-time system resource monitoring and alerts
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isMonitoring}
              onCheckedChange={setIsMonitoring}
            />
            <span className="text-sm text-muted-foreground">Monitoring</span>
          </div>
          
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
          >
            {expandedView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
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
      {alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <Button variant="outline" size="sm" onClick={clearAllAlerts}>
              Clear All
            </Button>
          </div>
          <div className="grid gap-2">
            {alerts.filter(alert => !alert.acknowledged).slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  {alert.message}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  Threshold: {alert.threshold}% • Current: {alert.currentValue.toFixed(1)}%
                  <div className="mt-1 text-xs text-muted-foreground">
                    {alert.timestamp.toLocaleString()}
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
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.cpu.usage.toFixed(1)}%</div>
            <Progress 
              value={currentMetrics.cpu.usage} 
              className={cn(
                "mt-2",
                getResourceStatus(currentMetrics.cpu.usage, 'cpu') === 'critical' && "[&>div]:bg-red-500",
                getResourceStatus(currentMetrics.cpu.usage, 'cpu') === 'warning' && "[&>div]:bg-yellow-500"
              )} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {currentMetrics.cpu.cores} cores • {currentMetrics.cpu.frequency.toFixed(1)} GHz
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.memory.usage.toFixed(1)}%</div>
            <Progress 
              value={currentMetrics.memory.usage} 
              className={cn(
                "mt-2",
                getResourceStatus(currentMetrics.memory.usage, 'memory') === 'critical' && "[&>div]:bg-red-500",
                getResourceStatus(currentMetrics.memory.usage, 'memory') === 'warning' && "[&>div]:bg-yellow-500"
              )} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {currentMetrics.memory.used.toFixed(1)} GB / {currentMetrics.memory.total} GB
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.disk.usage.toFixed(1)}%</div>
            <Progress 
              value={currentMetrics.disk.usage} 
              className={cn(
                "mt-2",
                getResourceStatus(currentMetrics.disk.usage, 'disk') === 'critical' && "[&>div]:bg-red-500",
                getResourceStatus(currentMetrics.disk.usage, 'disk') === 'warning' && "[&>div]:bg-yellow-500"
              )} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {currentMetrics.disk.used.toFixed(0)} GB / {currentMetrics.disk.total} GB
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(currentMetrics.network.downloadSpeed + currentMetrics.network.uploadSpeed).toFixed(1)} MB/s
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span className="flex items-center">
                <Download className="h-3 w-3 mr-1" />
                {currentMetrics.network.downloadSpeed.toFixed(1)} MB/s
              </span>
              <span className="flex items-center">
                <Upload className="h-3 w-3 mr-1" />
                {currentMetrics.network.uploadSpeed.toFixed(1)} MB/s
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Current system status and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4" />
                      <span>CPU Temperature</span>
                    </div>
                    <span className={getStatusColor(getResourceStatus(currentMetrics.cpu.temperature || 0, 'temperature'))}>
                      {currentMetrics.cpu.temperature?.toFixed(1) || 'N/A'}°C
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Load Average</span>
                    </div>
                    <span>{currentMetrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4" />
                      <span>Active Processes</span>
                    </div>
                    <span>{currentMetrics.cpu.processes}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MemoryStick className="h-4 w-4" />
                      <span>Cached Memory</span>
                    </div>
                    <span>{currentMetrics.memory.cached.toFixed(1)} GB</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4" />
                      <span>Disk I/O</span>
                    </div>
                    <span>
                      R: {currentMetrics.disk.readSpeed.toFixed(1)} MB/s • 
                      W: {currentMetrics.disk.writeSpeed.toFixed(1)} MB/s
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Network className="h-4 w-4" />
                      <span>Network Latency</span>
                    </div>
                    <span>{currentMetrics.network.latency.toFixed(1)} ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resource Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Breakdown</CardTitle>
                <CardDescription>Detailed resource utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{currentMetrics.memory.usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={currentMetrics.memory.usage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Used: {currentMetrics.memory.used.toFixed(1)} GB</span>
                      <span>Available: {currentMetrics.memory.available.toFixed(1)} GB</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Swap Usage</span>
                      <span>{((currentMetrics.memory.swapUsed / currentMetrics.memory.swapTotal) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(currentMetrics.memory.swapUsed / currentMetrics.memory.swapTotal) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Used: {currentMetrics.memory.swapUsed.toFixed(1)} GB</span>
                      <span>Total: {currentMetrics.memory.swapTotal} GB</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disk Usage</span>
                      <span>{currentMetrics.disk.usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={currentMetrics.disk.usage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Used: {currentMetrics.disk.used.toFixed(0)} GB</span>
                      <span>Free: {currentMetrics.disk.available.toFixed(0)} GB</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Connections</span>
                      <span>{currentMetrics.network.connections}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total Down: {currentMetrics.network.totalDownload.toFixed(1)} GB</span>
                      <span>Total Up: {currentMetrics.network.totalUpload.toFixed(1)} GB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resource Usage Charts</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                <span className="text-sm text-muted-foreground">Grid</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={showLegend} onCheckedChange={setShowLegend} />
                <span className="text-sm text-muted-foreground">Legend</span>
              </div>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Over Time</CardTitle>
              <CardDescription>
                Real-time monitoring of system resources ({timeRange} view)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' && (
                    <RechartsLineChart data={chartData}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      {showLegend && <Legend />}
                      <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" strokeWidth={2} />
                      <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" strokeWidth={2} />
                      <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" strokeWidth={2} />
                      <Line type="monotone" dataKey="network" stroke="#ff7300" name="Network (x10)" strokeWidth={2} />
                    </RechartsLineChart>
                  )}
                  {chartType === 'area' && (
                    <AreaChart data={chartData}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      {showLegend && <Legend />}
                      <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" name="CPU %" />
                      <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Memory %" />
                      <Area type="monotone" dataKey="disk" stackId="1" stroke="#ffc658" fill="#ffc658" name="Disk %" />
                    </AreaChart>
                  )}
                  {chartType === 'bar' && (
                    <BarChart data={chartData}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      {showLegend && <Legend />}
                      <Bar dataKey="cpu" fill="#8884d8" name="CPU %" />
                      <Bar dataKey="memory" fill="#82ca9d" name="Memory %" />
                      <Bar dataKey="disk" fill="#ffc658" name="Disk %" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-6">
          {showProcesses && (
            <Card>
              <CardHeader>
                <CardTitle>Running Processes</CardTitle>
                <CardDescription>Top processes by resource usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {processes
                      .sort((a, b) => b.cpuUsage - a.cpuUsage)
                      .map((process) => (
                        <div key={process.pid} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              process.status === 'running' ? 'bg-green-500' : 'bg-gray-400'
                            )} />
                            <div>
                              <div className="font-medium">{process.name}</div>
                              <div className="text-xs text-muted-foreground">
                                PID: {process.pid} • User: {process.user}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              CPU: {process.cpuUsage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              RAM: {formatBytes(process.memoryUsage * 1024 * 1024)}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>Configure resource usage alert thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">CPU Usage Thresholds</label>
                  <div className="grid gap-4 mt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Warning: {thresholds.cpu.warning}%</span>
                        <span>Critical: {thresholds.cpu.critical}%</span>
                      </div>
                      <div className="grid gap-2">
                        <Slider
                          value={[thresholds.cpu.warning]}
                          onValueChange={([value]) => setThresholds(prev => ({
                            ...prev,
                            cpu: { ...prev.cpu, warning: value }
                          }))}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <Slider
                          value={[thresholds.cpu.critical]}
                          onValueChange={([value]) => setThresholds(prev => ({
                            ...prev,
                            cpu: { ...prev.cpu, critical: value }
                          }))}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Memory Usage Thresholds</label>
                  <div className="grid gap-4 mt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Warning: {thresholds.memory.warning}%</span>
                        <span>Critical: {thresholds.memory.critical}%</span>
                      </div>
                      <div className="grid gap-2">
                        <Slider
                          value={[thresholds.memory.warning]}
                          onValueChange={([value]) => setThresholds(prev => ({
                            ...prev,
                            memory: { ...prev.memory, warning: value }
                          }))}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <Slider
                          value={[thresholds.memory.critical]}
                          onValueChange={([value]) => setThresholds(prev => ({
                            ...prev,
                            memory: { ...prev.memory, critical: value }
                          }))}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Disk Usage Thresholds</label>
                  <div className="grid gap-4 mt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Warning: {thresholds.disk.warning}%</span>
                        <span>Critical: {thresholds.disk.critical}%</span>
                      </div>
                      <div className="grid gap-2">
                        <Slider
                          value={[thresholds.disk.warning]}
                          onValueChange={([value]) => setThresholds(prev => ({
                            ...prev,
                            disk: { ...prev.disk, warning: value }
                          }))}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <Slider
                          value={[thresholds.disk.critical]}
                          onValueChange={([value]) => setThresholds(prev => ({
                            ...prev,
                            disk: { ...prev.disk, critical: value }
                          }))}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceMonitor;
export type { ResourceMetrics, ResourceAlert, ResourceThresholds, ProcessInfo };