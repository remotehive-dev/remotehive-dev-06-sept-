'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Activity, TrendingUp, Zap, Clock, Server, Database, 
  Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle,
  RefreshCw, Download, Settings, Monitor
} from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_connections: number;
  response_time: number;
  throughput: number;
  error_rate: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  last_restart: string;
  version: string;
  environment: string;
  total_requests: number;
  avg_response_time: number;
  error_count: number;
  warnings: string[];
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  queries: {
    total: number;
    slow_queries: number;
    avg_execution_time: number;
    queries_per_second: number;
  };
  storage: {
    size: number;
    used: number;
    available: number;
    growth_rate: number;
  };
  performance: {
    cache_hit_ratio: number;
    index_usage: number;
    lock_waits: number;
  };
}

interface ScraperPerformance {
  scraper_id: string;
  scraper_name: string;
  status: 'running' | 'idle' | 'error';
  jobs_per_hour: number;
  success_rate: number;
  avg_processing_time: number;
  memory_usage: number;
  cpu_usage: number;
  last_error?: string;
  uptime: number;
}

const PerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    last_restart: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    total_requests: 0,
    avg_response_time: 0,
    error_count: 0,
    warnings: [],
    alerts: []
  });
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics>({
    connections: { active: 0, idle: 0, total: 0, max: 100 },
    queries: { total: 0, slow_queries: 0, avg_execution_time: 0, queries_per_second: 0 },
    storage: { size: 0, used: 0, available: 0, growth_rate: 0 },
    performance: { cache_hit_ratio: 0, index_usage: 0, lock_waits: 0 }
  });
  const [scraperPerformance, setScraperPerformance] = useState<ScraperPerformance[]>([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // WebSocket connection for real-time performance updates
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/performance/monitor?token=admin');
    
    ws.onopen = () => {
      console.log('Performance WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'system_metrics':
          setMetrics(prev => [data.data, ...prev.slice(0, 99)]);
          break;
        case 'health_update':
          setSystemHealth(data.data);
          break;
        case 'database_metrics':
          setDbMetrics(data.data);
          break;
        case 'scraper_performance':
          setScraperPerformance(data.data);
          break;
        case 'alert':
          setSystemHealth(prev => ({
            ...prev,
            alerts: [data.data, ...prev.alerts.slice(0, 49)]
          }));
          if (data.data.type === 'error') {
            toast.error(data.data.message);
          } else if (data.data.type === 'warning') {
            toast.warning(data.data.message);
          }
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Performance WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Performance WebSocket disconnected');
      setTimeout(connectWebSocket, 5000);
    };
    
    setWsConnection(ws);
  }, []);

  useEffect(() => {
    loadInitialData();
    connectWebSocket();
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [healthRes, dbRes, scraperRes] = await Promise.all([
        fetch('/api/v1/admin/performance/health'),
        fetch('/api/v1/admin/performance/database'),
        fetch('/api/v1/admin/performance/scrapers')
      ]);
      
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }
      
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDbMetrics(dbData);
      }
      
      if (scraperRes.ok) {
        const scraperData = await scraperRes.json();
        setScraperPerformance(scraperData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/v1/admin/performance/metrics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const exportMetrics = async () => {
    try {
      const response = await fetch(`/api/v1/admin/performance/export?range=${timeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_metrics_${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Metrics exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export metrics');
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="h-8 w-8" />
            Performance Monitoring
          </h1>
          <p className="text-muted-foreground">Real-time system performance and health monitoring</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadInitialData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className={`h-4 w-4 ${getHealthColor(systemHealth.status)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(systemHealth.status)}`}>
              {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {formatUptime(systemHealth.uptime)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.avg_response_time.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.total_requests.toLocaleString()} total requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((systemHealth.error_count / systemHealth.total_requests) * 100 || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.error_count} errors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.alerts.filter(a => !a.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.warnings.length} warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {systemHealth.alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-2">
          {systemHealth.alerts.filter(a => !a.resolved).slice(0, 3).map(alert => (
            <Alert key={alert.id} className={alert.type === 'error' ? 'border-red-200' : 'border-yellow-200'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{alert.type.toUpperCase()}:</span> {alert.message}
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="scrapers">Scrapers</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
                <CardDescription>System resource utilization over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu_usage" stroke="#8884D8" name="CPU %" />
                    <Line type="monotone" dataKey="memory_usage" stroke="#00C49F" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Disk Usage & Network I/O</CardTitle>
                <CardDescription>Storage and network activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="disk_usage" stroke="#FF8042" name="Disk %" />
                    <Line type="monotone" dataKey="network_io" stroke="#FFBB28" name="Network I/O" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Response Time & Throughput</CardTitle>
              <CardDescription>Application performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="response_time" 
                    stroke="#8884D8" 
                    fill="#8884D8" 
                    fillOpacity={0.6}
                    name="Response Time (ms)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="throughput" 
                    stroke="#00C49F" 
                    fill="#00C49F" 
                    fillOpacity={0.6}
                    name="Throughput (req/s)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Connections</CardTitle>
                <CardDescription>Connection pool status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Connections</span>
                    <span className="font-bold">{dbMetrics.connections.active}</span>
                  </div>
                  <Progress value={(dbMetrics.connections.active / dbMetrics.connections.max) * 100} />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Idle</p>
                      <p className="font-medium">{dbMetrics.connections.idle}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">{dbMetrics.connections.total}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Database query metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Queries/sec</p>
                      <p className="text-2xl font-bold">{dbMetrics.queries.queries_per_second.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Time</p>
                      <p className="text-2xl font-bold">{dbMetrics.queries.avg_execution_time.toFixed(2)}ms</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Slow Queries</span>
                      <span>{dbMetrics.queries.slow_queries}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Ratio</span>
                      <span>{(dbMetrics.performance.cache_hit_ratio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>Database storage metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Used Storage</span>
                  <span className="font-bold">{formatBytes(dbMetrics.storage.used)}</span>
                </div>
                <Progress value={(dbMetrics.storage.used / dbMetrics.storage.size) * 100} />
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Size</p>
                    <p className="font-medium">{formatBytes(dbMetrics.storage.size)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-medium">{formatBytes(dbMetrics.storage.available)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Growth Rate</p>
                    <p className="font-medium">{dbMetrics.storage.growth_rate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scrapers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {scraperPerformance.map(scraper => (
              <Card key={scraper.scraper_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{scraper.scraper_name}</CardTitle>
                    <Badge 
                      variant={scraper.status === 'running' ? 'default' : 
                              scraper.status === 'idle' ? 'secondary' : 'destructive'}
                    >
                      {scraper.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Jobs/hour</p>
                        <p className="font-medium">{scraper.jobs_per_hour}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">{(scraper.success_rate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>{scraper.cpu_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={scraper.cpu_usage} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{formatBytes(scraper.memory_usage)}</span>
                      </div>
                      <Progress value={(scraper.memory_usage / (1024 * 1024 * 1024)) * 100} />
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>Uptime: {formatUptime(scraper.uptime)}</p>
                      <p>Avg Processing: {scraper.avg_processing_time.toFixed(2)}s</p>
                      {scraper.last_error && (
                        <p className="text-red-600 mt-1">Last Error: {scraper.last_error}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
              <CardDescription>Network I/O and connection metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="network_io" 
                    stroke="#8884D8" 
                    fill="#8884D8" 
                    fillOpacity={0.6}
                    name="Network I/O (MB/s)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active_connections" 
                    stroke="#00C49F" 
                    fill="#00C49F" 
                    fillOpacity={0.6}
                    name="Active Connections"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformancePage;