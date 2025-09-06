'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Activity, TrendingUp, Users, Briefcase, Clock, Server, 
  RefreshCw, Download, Filter, Calendar, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  total_jobs: number;
  active_scrapers: number;
  pending_imports: number;
  success_rate: number;
  avg_processing_time: number;
  system_health: 'healthy' | 'warning' | 'critical';
  last_updated: string;
}

interface ScrapingActivity {
  timestamp: string;
  scraper_name: string;
  jobs_found: number;
  success_rate: number;
  processing_time: number;
  status: 'running' | 'completed' | 'failed';
}

interface ImportMetrics {
  date: string;
  total_imports: number;
  successful_imports: number;
  failed_imports: number;
  avg_processing_time: number;
}

interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
}

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_jobs: 0,
    active_scrapers: 0,
    pending_imports: 0,
    success_rate: 0,
    avg_processing_time: 0,
    system_health: 'healthy',
    last_updated: new Date().toISOString()
  });
  
  const [scrapingActivity, setScrapingActivity] = useState<ScrapingActivity[]>([]);
  const [importMetrics, setImportMetrics] = useState<ImportMetrics[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/analytics/dashboard?token=admin');
    
    ws.onopen = () => {
      console.log('Analytics WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'stats_update':
          setStats(data.data);
          break;
        case 'scraping_activity':
          setScrapingActivity(prev => [data.data, ...prev.slice(0, 49)]);
          break;
        case 'system_metrics':
          setSystemMetrics(prev => [data.data, ...prev.slice(0, 99)]);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Analytics WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Analytics WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
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
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/v1/admin/analytics/stats'),
        fetch('/api/v1/admin/analytics/activity?limit=50')
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setScrapingActivity(activityData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const [importRes, systemRes] = await Promise.all([
        fetch(`/api/v1/admin/analytics/imports?range=${timeRange}`),
        fetch(`/api/v1/admin/analytics/system?range=${timeRange}`)
      ]);
      
      if (importRes.ok) {
        const importData = await importRes.json();
        setImportMetrics(importData);
      }
      
      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemMetrics(systemData);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const exportData = async (type: string) => {
    try {
      const response = await fetch(`/api/v1/admin/analytics/export?type=${type}&range=${timeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      healthy: { variant: 'default' as const, color: 'text-green-600' },
      warning: { variant: 'secondary' as const, color: 'text-yellow-600' },
      critical: { variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const { variant, color } = variants[health as keyof typeof variants] || variants.healthy;
    
    return (
      <Badge variant={variant} className={color}>
        {health.charAt(0).toUpperCase() + health.slice(1)}
      </Badge>
    );
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Real-time Analytics
          </h1>
          <p className="text-muted-foreground">Monitor system performance and scraping activities</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadInitialData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_jobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(stats.last_updated).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scrapers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_scrapers}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.success_rate * 100).toFixed(1)}%</div>
            <Progress value={stats.success_rate * 100} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthBadge(stats.system_health)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg processing: {stats.avg_processing_time.toFixed(2)}s
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scraping">Scraping Activity</TabsTrigger>
          <TabsTrigger value="imports">Import Metrics</TabsTrigger>
          <TabsTrigger value="system">System Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Success Rate</CardTitle>
                <CardDescription>Success vs failure rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={importMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="successful_imports" 
                      stackId="1" 
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="failed_imports" 
                      stackId="1" 
                      stroke="#FF8042" 
                      fill="#FF8042" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Processing Time Trends</CardTitle>
                <CardDescription>Average processing time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={importMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avg_processing_time" 
                      stroke="#8884D8" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scraping" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Scraping Activity</CardTitle>
                    <CardDescription>Live feed of scraper activities</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportData('scraping')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {scrapingActivity.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent activity
                        </div>
                      ) : (
                        scrapingActivity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{activity.scraper_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.jobs_found} jobs found • {activity.processing_time.toFixed(2)}s
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={activity.status === 'completed' ? 'default' : 
                                        activity.status === 'running' ? 'secondary' : 'destructive'}
                              >
                                {activity.status}
                              </Badge>
                              <span className="text-sm font-medium">
                                {(activity.success_rate * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Scraper Status</CardTitle>
                <CardDescription>Current status of all scrapers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* This would be populated with actual scraper data */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LinkedIn Scraper</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Indeed Scraper</span>
                    <Badge variant="secondary">Idle</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Glassdoor Scraper</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Remote.co Scraper</span>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="imports" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Performance</CardTitle>
                <CardDescription>CSV import metrics and trends</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportData('imports')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={importMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_imports" fill="#8884D8" name="Total Imports" />
                  <Bar dataKey="successful_imports" fill="#00C49F" name="Successful" />
                  <Bar dataKey="failed_imports" fill="#FF8042" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Resource Usage</CardTitle>
                <CardDescription>CPU, Memory, and Disk usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu_usage" stroke="#8884D8" name="CPU %" />
                    <Line type="monotone" dataKey="memory_usage" stroke="#00C49F" name="Memory %" />
                    <Line type="monotone" dataKey="disk_usage" stroke="#FF8042" name="Disk %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>Number of active connections over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="active_connections" 
                      stroke="#8884D8" 
                      fill="#8884D8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;