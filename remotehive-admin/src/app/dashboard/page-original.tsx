'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ClientOnlyDashboard from '@/components/ClientOnlyDashboard';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import { MetricsCard, StatusIndicator, ProgressTracker } from '@/components/dashboard/widgets';
import { useScraperRealTime } from '@/hooks/useScraperRealTime';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import DashboardLayoutManager, { ViewMode } from '@/components/layout/DashboardLayoutManager';
import { GridWidget } from '@/components/layout/GridContainer';
import { LayoutItem } from '@/components/layout/ResponsiveLayout';
import {
  Activity,
  Settings,
  Plus,
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Zap,
  Users,
  Globe,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Server,
  Wifi,
  WifiOff,
  Layout,
  Grid3X3,
  Smartphone,
  Tablet,
  RotateCcw,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScraperJob {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  source: string;
  lastRun?: Date;
  nextRun?: Date;
  itemsScraped: number;
  errorCount: number;
  successRate: number;
}

interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  version: string;
}

interface DashboardState {
  activeTab: string;
  scraperStatus: 'idle' | 'running' | 'paused' | 'error';
  isLoading: boolean;
  lastUpdate: Date;
  autoRefresh: boolean;
  refreshInterval: number;
  selectedTimeRange: string;
  customDateRange: { start: Date; end: Date } | null;
  showFilters: boolean;
  viewMode: ViewMode;
  layoutMode: 'grid' | 'responsive' | 'mobile';
  filters: {
    status: string[];
    source: string[];
    dateRange: string;
  };
}

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0h 0m',
    version: '1.0.0'
  });

  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    scraperStatus: 'idle',
    isLoading: false,
    lastUpdate: new Date(),
    autoRefresh: true,
    refreshInterval: 30000,
    selectedTimeRange: '24h',
    customDateRange: null,
    showFilters: false,
    viewMode: 'auto',
    layoutMode: 'responsive',
    filters: {
      status: [],
      source: [],
      dateRange: '24h'
    }
  });

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // API service functions
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return default data on error
      return {
        totalConfigurations: 0,
        runningScrapers: 0,
        jobsScraped: 0,
        successRate: 0,
        performanceData: [],
        recentActivity: []
      };
    }
  };

  const fetchScraperJobsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/scraper-jobs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scraper jobs: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching scraper jobs:', error);
      return [];
    }
  };

  // Dashboard widgets configuration
  const [dashboardWidgets, setDashboardWidgets] = useState<GridWidget[]>([]);

  // Update widgets when dashboard data changes
  useEffect(() => {
    setDashboardWidgets([
      {
        id: 'total-configurations',
        type: 'metrics',
        title: 'Total Configurations',
        description: 'Active scraper configurations',
        component: ({ value, change, trend, icon }) => (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">+{change} from last month</p>
            </CardContent>
          </Card>
        ),
        props: {
          value: dashboardData.totalConfigurations,
          change: 12,
          trend: 'up',
          icon: 'settings'
        }
      },
      {
        id: 'running-scrapers',
        type: 'metrics',
        title: 'Running Scrapers',
        description: 'Currently active scrapers',
        component: ({ value, change, trend, icon }) => (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Running Scrapers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{change} from last hour</p>
            </CardContent>
          </Card>
        ),
        props: {
          value: dashboardData.runningScrapers,
          change: -2,
          trend: 'down',
          icon: 'activity'
        }
      },
      {
        id: 'jobs-scraped',
        type: 'metrics',
        title: 'Jobs Scraped',
        description: 'Total jobs processed today',
        component: ({ value, change, trend, icon }) => (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Jobs Scraped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">+{change} from yesterday</p>
            </CardContent>
          </Card>
        ),
        props: {
          value: dashboardData.jobsScraped,
          change: 156,
          trend: 'up',
          icon: 'database'
        }
      },
      {
        id: 'success-rate',
        type: 'metrics',
        title: 'Success Rate',
        description: 'Overall scraping success rate',
        component: ({ value, change, trend, icon }) => (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}%</div>
              <p className="text-xs text-muted-foreground">+{change}% from last week</p>
            </CardContent>
          </Card>
        ),
        props: {
          value: dashboardData.successRate,
          change: 2.1,
          trend: 'up',
          icon: 'trending-up'
        }
      },
      {
        id: 'scraper-status',
        type: 'status',
        title: 'Scraper Status',
        description: 'Current system status',
        component: ({ status, message, lastUpdate }) => (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Scraper Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={status === 'running' ? 'default' : 'secondary'}>
                  {status}
                </Badge>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {lastUpdate?.toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ),
        props: {
          status: state.scraperStatus,
          message: getStatusMessage(state.scraperStatus),
          lastUpdate: state.lastUpdate
        }
      },
      {
        id: 'performance-chart',
        type: 'chart',
        title: 'Performance Metrics',
        description: 'Real-time scraping performance',
        component: ({ data }) => (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">Chart data: {JSON.stringify(data?.slice(0, 3))}...</div>
            </CardContent>
          </Card>
        ),
        props: {
          data: dashboardData.performanceData
        }
      },
      {
        id: 'recent-activity',
        type: 'activity',
        title: 'Recent Activity',
        description: 'Latest scraper activities',
        component: ({ activities }) => (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activities?.slice(0, 5).map((activity: any, index: number) => (
                   <div key={index} className="text-sm">
                     <span className="font-medium">{activity.action}</span>
                     <span className="text-muted-foreground ml-2">{activity.timestamp}</span>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        ),
        props: {
          activities: dashboardData.recentActivity
        }
      },
      {
        id: 'system-health',
        type: 'progress',
        title: 'System Health',
        description: 'Overall system performance',
        component: ({ progress, status, details }) => (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">{progress}%</div>
                <Badge variant={status === 'healthy' ? 'default' : 'destructive'}>
                  {status}
                </Badge>
                {details?.map((detail: any, index: number) => (
                   <div key={index} className="flex justify-between items-center">
                     <span className="text-sm">{detail.label}</span>
                     <span className="text-sm font-medium">{detail.value}%</span>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        ),
        props: {
          progress: 85,
          status: 'healthy',
          details: [
            { label: 'CPU Usage', value: 45, status: 'good' },
            { label: 'Memory', value: 67, status: 'warning' },
            { label: 'Disk Space', value: 23, status: 'good' },
            { label: 'Network', value: 89, status: 'good' }
          ]
        }
      }
    ]);
  }, [dashboardData]);

  // Dashboard layouts for different breakpoints
  const [dashboardLayouts, setDashboardLayouts] = useState<Record<string, LayoutItem[]>>({
    lg: [
      { i: 'total-configurations', x: 0, y: 0, w: 2, h: 1 },
      { i: 'running-scrapers', x: 2, y: 0, w: 2, h: 1 },
      { i: 'jobs-scraped', x: 4, y: 0, w: 2, h: 1 },
      { i: 'success-rate', x: 6, y: 0, w: 2, h: 1 },
      { i: 'scraper-status', x: 0, y: 1, w: 3, h: 2 },
      { i: 'performance-chart', x: 3, y: 1, w: 5, h: 2 },
      { i: 'recent-activity', x: 0, y: 3, w: 4, h: 2 },
      { i: 'system-health', x: 4, y: 3, w: 4, h: 2 }
    ],
    md: [
      { i: 'total-configurations', x: 0, y: 0, w: 1, h: 1 },
      { i: 'running-scrapers', x: 1, y: 0, w: 1, h: 1 },
      { i: 'jobs-scraped', x: 2, y: 0, w: 1, h: 1 },
      { i: 'success-rate', x: 0, y: 1, w: 1, h: 1 },
      { i: 'scraper-status', x: 1, y: 1, w: 2, h: 2 },
      { i: 'performance-chart', x: 0, y: 3, w: 3, h: 2 },
      { i: 'recent-activity', x: 0, y: 5, w: 3, h: 2 },
      { i: 'system-health', x: 0, y: 7, w: 3, h: 2 }
    ],
    sm: [
      { i: 'total-configurations', x: 0, y: 0, w: 1, h: 1 },
      { i: 'running-scrapers', x: 1, y: 0, w: 1, h: 1 },
      { i: 'jobs-scraped', x: 0, y: 1, w: 1, h: 1 },
      { i: 'success-rate', x: 1, y: 1, w: 1, h: 1 },
      { i: 'scraper-status', x: 0, y: 2, w: 2, h: 2 },
      { i: 'performance-chart', x: 0, y: 4, w: 2, h: 2 },
      { i: 'recent-activity', x: 0, y: 6, w: 2, h: 2 },
      { i: 'system-health', x: 0, y: 8, w: 2, h: 2 }
    ],
    xs: [
      { i: 'total-configurations', x: 0, y: 0, w: 1, h: 1 },
      { i: 'running-scrapers', x: 0, y: 1, w: 1, h: 1 },
      { i: 'jobs-scraped', x: 0, y: 2, w: 1, h: 1 },
      { i: 'success-rate', x: 0, y: 3, w: 1, h: 1 },
      { i: 'scraper-status', x: 0, y: 4, w: 1, h: 2 },
      { i: 'performance-chart', x: 0, y: 6, w: 1, h: 2 },
      { i: 'recent-activity', x: 0, y: 8, w: 1, h: 2 },
      { i: 'system-health', x: 0, y: 10, w: 1, h: 2 }
    ]
  });

  // Real-time connection
  const {
    metrics,
    scraperStatuses,
    systemHealth,
    recentActivity,
    isConnected,
    error: connectionError,
    reconnect
  } = useScraperRealTime({
    websocketUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/admin/dashboard?token=admin',
    apiUrl: '/api/scraper',
    refreshInterval: 5000,
    enabled: true
  });

  // Real scraper jobs data from API
  const [scraperJobs, setScraperJobs] = useState<ScraperJob[]>([]);
  const [dashboardData, setDashboardData] = useState({
    totalConfigurations: 0,
    runningScrapers: 0,
    jobsScraped: 0,
    successRate: 0,
    performanceData: [],
    recentActivity: []
  });
  const [apiError, setApiError] = useState<string | null>(null);

  // Load initial data and system status
  useEffect(() => {
    const loadInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      setApiError(null);
      
      try {
        const [dashboardDataResponse, scraperJobsResponse, systemStatusResponse] = await Promise.all([
          fetchDashboardData(),
          fetchScraperJobsData(),
          fetch(`${API_BASE_URL}/system/status`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
              'Content-Type': 'application/json'
            }
          }).then(res => res.ok ? res.json() : { cpu: 0, memory: 0, disk: 0, network: 0, uptime: '0h 0m', version: '1.0.0' })
        ]);
        
        setDashboardData(dashboardDataResponse);
        setScraperJobs(scraperJobsResponse);
        setSystemStatus(systemStatusResponse);
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setState(prev => ({ ...prev, isLoading: false, lastUpdate: new Date() }));
      }
    };

    loadInitialData();
    
    // Auto-refresh data every 30 seconds
    const interval = setInterval(async () => {
      try {
        const [dashboardDataResponse, scraperJobsResponse] = await Promise.all([
          fetchDashboardData(),
          fetchScraperJobsData()
        ]);
        
        setDashboardData(dashboardDataResponse);
        setScraperJobs(scraperJobsResponse);
        setState(prev => ({ ...prev, lastUpdate: new Date() }));
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate dashboard metrics from API data
  const dashboardMetrics = {
    totalJobs: dashboardData.totalConfigurations || scraperJobs.length,
    activeJobs: dashboardData.runningScrapers || scraperJobs.filter(job => job.status === 'running').length,
    completedJobs: scraperJobs.filter(job => job.status === 'completed').length,
    failedJobs: scraperJobs.filter(job => job.status === 'failed').length,
    totalItemsScraped: dashboardData.jobsScraped || scraperJobs.reduce((sum, job) => sum + job.itemsScraped, 0),
    avgSuccessRate: dashboardData.successRate || (scraperJobs.length > 0 
      ? scraperJobs.reduce((sum, job) => sum + job.successRate, 0) / scraperJobs.length 
      : 0),
    totalErrors: scraperJobs.reduce((sum, job) => sum + job.errorCount, 0)
  };

  // Handle tab changes
  const handleTabChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, activeTab: value }));
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Handle scraper actions
  const handleScraperAction = useCallback(async (action: 'start' | 'pause' | 'stop' | 'restart') => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (action) {
        case 'start':
          setState(prev => ({ ...prev, scraperStatus: 'running' }));
          break;
        case 'pause':
          setState(prev => ({ ...prev, scraperStatus: 'paused' }));
          break;
        case 'stop':
          setState(prev => ({ ...prev, scraperStatus: 'idle' }));
          break;
        case 'restart':
          setState(prev => ({ ...prev, scraperStatus: 'running' }));
          break;
      }
    } catch (error) {
      setState(prev => ({ ...prev, scraperStatus: 'error' }));
    } finally {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        lastUpdate: new Date()
      }));
    }
  }, []);

  // Handle layout changes
  const handleLayoutChange = useCallback((layouts: Record<string, LayoutItem[]>) => {
    setDashboardLayouts(layouts);
  }, []);

  // Handle widget changes
  const handleWidgetChange = useCallback((widgets: GridWidget[]) => {
    setDashboardWidgets(widgets);
  }, []);

  // Handle view mode changes
  const handleViewModeChange = useCallback((viewMode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  const handleJobAction = async (jobId: string, action: 'start' | 'pause' | 'stop' | 'restart') => {
    try {
      // Replace with actual API call
      const response = await fetch(`/api/scraper/jobs/${jobId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Update job status locally
        setScraperJobs(jobs => 
          jobs.map(job => {
            if (job.id === jobId) {
              switch (action) {
                case 'start':
                  return { ...job, status: 'running' as const };
                case 'pause':
                  return { ...job, status: 'paused' as const };
                case 'stop':
                  return { ...job, status: 'idle' as const, progress: 0 };
                case 'restart':
                  return { ...job, status: 'running' as const, progress: 0 };
                default:
                  return job;
              }
            }
            return job;
          })
        );
      }
    } catch (error) {
      console.error(`Failed to ${action} job:`, error);
    }
  };

  const getStatusIcon = (status: ScraperJob['status']) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ScraperJob['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      {(connectionError || apiError) && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            {connectionError ? `Connection lost: ${connectionError}` : `API Error: ${apiError}`}
            <Button variant="outline" size="sm" className="ml-2" onClick={reconnect}>
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Jobs"
          value={dashboardMetrics.totalJobs}
          description="Configured scrapers"
          icon={<Database className="h-4 w-4" />}
        />
        <MetricsCard
          title="Active Jobs"
          value={dashboardMetrics.activeJobs}
          description="Currently running"
          icon={<Activity className="h-4 w-4" />}
          badge={{
            text: isConnected ? 'Live' : 'Offline',
            variant: isConnected ? 'default' : 'destructive'
          }}
        />
        <MetricsCard
          title="Items Scraped"
          value={dashboardMetrics.totalItemsScraped.toLocaleString()}
          description="Total data points"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            direction: 'up',
            percentage: 12.5,
            period: 'vs last hour'
          }}
        />
        <MetricsCard
          title="Success Rate"
          value={`${dashboardMetrics.avgSuccessRate.toFixed(1)}%`}
          description="Average success rate"
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{
            direction: dashboardMetrics.avgSuccessRate > 95 ? 'up' : 'down',
            percentage: 2.3,
            period: 'vs yesterday'
          }}
        />
      </div>

      {/* Scraper Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scraper Jobs</CardTitle>
              <CardDescription>Manage and monitor your scraping jobs</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scraperJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(job.status)}
                  <div>
                    <h4 className="font-medium">{job.name}</h4>
                    <p className="text-sm text-muted-foreground">{job.source}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{job.itemsScraped} items</p>
                    <p className="text-xs text-muted-foreground">
                      {job.successRate.toFixed(1)}% success
                    </p>
                  </div>
                  
                  {job.status === 'running' && (
                    <div className="w-24">
                      <ProgressTracker
                        progress={job.progress}
                        status={job.status}
                        showPercentage={true}
                        size="sm"
                      />
                    </div>
                  )}
                  
                  <Badge className={cn('text-xs', getStatusColor(job.status))}>
                    {job.status}
                  </Badge>
                  
                  <div className="flex space-x-1">
                    {job.status === 'idle' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJobAction(job.id, 'start')}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    {job.status === 'running' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction(job.id, 'pause')}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction(job.id, 'stop')}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {(job.status === 'failed' || job.status === 'completed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJobAction(job.id, 'restart')}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>System Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">{systemStatus.cpu}%</span>
              </div>
              <ProgressTracker progress={systemStatus.cpu} status="running" size="sm" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">{systemStatus.memory}%</span>
              </div>
              <ProgressTracker progress={systemStatus.memory} status="running" size="sm" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-muted-foreground">{systemStatus.disk}%</span>
              </div>
              <ProgressTracker progress={systemStatus.disk} status="running" size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>System Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Uptime</p>
                <p className="text-muted-foreground">{systemStatus.uptime}</p>
              </div>
              <div>
                <p className="font-medium">Version</p>
                <p className="text-muted-foreground">{systemStatus.version}</p>
              </div>
              <div>
                <p className="font-medium">Connection</p>
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-medium">Network</p>
                <p className="text-muted-foreground">{systemStatus.network} Mbps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render layout mode selector
  const renderLayoutModeSelector = () => (
    <div className="flex items-center space-x-2">
      <Select
        value={state.layoutMode}
        onValueChange={(value: 'grid' | 'responsive' | 'mobile') => 
          setState(prev => ({ ...prev, layoutMode: value }))
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="responsive">
            <div className="flex items-center space-x-2">
              <Layout className="h-4 w-4" />
              <span>Responsive</span>
            </div>
          </SelectItem>
          <SelectItem value="grid">
            <div className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4" />
              <span>Grid Layout</span>
            </div>
          </SelectItem>
          <SelectItem value="mobile">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile View</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Tabs value={state.activeTab} onValueChange={handleTabChange} className="h-screen flex flex-col">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Smart Scraper Dashboard</h1>
                <p className="text-muted-foreground">
                  Monitor and manage your web scraping operations
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge 
                  variant={getStatusVariant(state.scraperStatus)}
                  className="capitalize"
                >
                  {state.scraperStatus}
                </Badge>
                
                <div className="text-sm text-muted-foreground">
                  Last updated: {state.lastUpdate.toLocaleTimeString()}
                </div>
                
                {renderLayoutModeSelector()}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={state.isLoading}
                >
                  <RefreshCw className={cn(
                    'h-4 w-4 mr-2',
                    state.isLoading && 'animate-spin'
                  )} />
                  Refresh
                </Button>
              </div>
            </div>
            
            <TabsList className="w-full justify-start border-t">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full m-0">
              {state.layoutMode === 'responsive' || state.layoutMode === 'mobile' ? (
                <DashboardLayoutManager
                  widgets={dashboardWidgets}
                  layouts={dashboardLayouts}
                  title="Smart Scraper Dashboard"
                  subtitle="Monitor and manage your web scraping operations"
                  enableMobileView={true}
                  enableTabletView={true}
                  enableDesktopView={true}
                  enableLayoutEditor={true}
                  enablePresets={true}
                  enableExport={true}
                  enableImport={true}
                  onLayoutChange={handleLayoutChange}
                  onWidgetChange={handleWidgetChange}
                  onViewModeChange={handleViewModeChange}
                />
              ) : (
                <div className="p-6 space-y-6">
                  {renderOverviewTab()}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="h-full m-0">
              <AnalyticsDashboard
                websocketUrl={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/analytics/dashboard?token=admin'}
                apiUrl="/api/scraper"
                enableRealTime={true}
                showExportOptions={true}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

// Helper function to get status message
function getStatusMessage(status: DashboardState['scraperStatus']): string {
  switch (status) {
    case 'running':
      return 'All systems operational';
    case 'paused':
      return 'Scraping operations paused';
    case 'idle':
      return 'No active scraping operations';
    case 'error':
      return 'System error detected';
    default:
      return 'Unknown status';
  }
}

// Helper function to get status badge variant
function getStatusVariant(status: DashboardState['scraperStatus']) {
  switch (status) {
    case 'running':
      return 'default';
    case 'paused':
      return 'secondary';
    case 'idle':
      return 'outline';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function WrappedDashboardPage() {
  return (
    <ClientOnlyDashboard>
      <DashboardPage />
    </ClientOnlyDashboard>
  );
}