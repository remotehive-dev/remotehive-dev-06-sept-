'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MetricsCard,
  StatusIndicator,
  ProgressTracker,
  RealTimeChart,
  ChartDataPoint,
  ChartSeries,
  TimeRange
} from './widgets';
import { useScraperRealTime } from '@/hooks/useScraperRealTime';
import { AnalyticsService } from '@/services/analytics';
import { ErrorHandlingService } from '@/services/errorHandling';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export interface AnalyticsDashboardProps {
  className?: string;
  websocketUrl?: string;
  apiUrl?: string;
  refreshInterval?: number;
  enableRealTime?: boolean;
  defaultTimeRange?: TimeRange;
  showExportOptions?: boolean;
  customFilters?: {
    sources?: string[];
    categories?: string[];
    statuses?: string[];
  };
}

interface DashboardMetrics {
  totalScrapers: number;
  activeScrapers: number;
  successRate: number;
  avgResponseTime: number;
  dataPointsCollected: number;
  errorsToday: number;
  performanceScore: number;
  systemHealth: number;
}

interface AnalyticsData {
  performanceMetrics: ChartDataPoint[];
  errorAnalysis: ChartDataPoint[];
  sourceMetrics: ChartDataPoint[];
  trendData: ChartDataPoint[];
  velocityData: ChartDataPoint[];
  qualityMetrics: ChartDataPoint[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className,
  websocketUrl,
  apiUrl = '/api/scraper',
  refreshInterval = 30000,
  enableRealTime = true,
  defaultTimeRange = '24h',
  showExportOptions = true,
  customFilters
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const analyticsService = useMemo(() => new AnalyticsService(apiUrl), [apiUrl]);
  const errorHandler = useMemo(() => new ErrorHandlingService(), []);
  
  // Real-time data hook
  const {
    metrics,
    scraperStatuses,
    systemHealth,
    recentActivity,
    chartData,
    isConnected,
    error: realtimeError,
    reconnect
  } = useScraperRealTime({
    websocketUrl,
    apiUrl,
    refreshInterval,
    enabled: enableRealTime
  });

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    performanceMetrics: [],
    errorAnalysis: [],
    sourceMetrics: [],
    trendData: [],
    velocityData: [],
    qualityMetrics: []
  });

  // Dashboard metrics calculation
  const dashboardMetrics = useMemo<DashboardMetrics>(() => {
    const activeScrapers = scraperStatuses?.filter(s => s.status === 'running').length || 0;
    const totalScrapers = scraperStatuses?.length || 0;
    const successfulScrapers = scraperStatuses?.filter(s => s.status === 'completed').length || 0;
    
    return {
      totalScrapers,
      activeScrapers,
      successRate: totalScrapers > 0 ? (successfulScrapers / totalScrapers) * 100 : 0,
      avgResponseTime: metrics?.avgResponseTime || 0,
      dataPointsCollected: metrics?.totalDataPoints || 0,
      errorsToday: metrics?.errorsToday || 0,
      performanceScore: metrics?.performanceScore || 0,
      systemHealth: systemHealth?.overall || 0
    };
  }, [metrics, scraperStatuses, systemHealth]);

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const timeRangeConfig = {
        timeRange,
        customRange: timeRange === 'custom' ? dateRange : undefined
      };

      const [performance, errors, sources, trends, velocity, quality] = await Promise.all([
        analyticsService.getPerformanceMetrics(timeRangeConfig),
        analyticsService.getErrorAnalysis(timeRangeConfig),
        analyticsService.getSourceMetrics(selectedSources, timeRangeConfig),
        analyticsService.getTrendAnalysis(timeRangeConfig),
        analyticsService.getScrapingVelocity(timeRangeConfig),
        analyticsService.getQualityMetrics(timeRangeConfig)
      ]);

      setAnalyticsData({
        performanceMetrics: performance,
        errorAnalysis: errors,
        sourceMetrics: sources,
        trendData: trends,
        velocityData: velocity,
        qualityMetrics: quality
      });
    } catch (err) {
      const handledError = errorHandler.handleApiError(err as Error);
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, dateRange, selectedSources]);

  // Chart series configurations
  const performanceSeries: ChartSeries[] = [
    { key: 'responseTime', name: 'Response Time', color: '#3b82f6', type: 'line' },
    { key: 'throughput', name: 'Throughput', color: '#10b981', type: 'area', yAxisId: 'right' }
  ];

  const errorSeries: ChartSeries[] = [
    { key: 'errors', name: 'Errors', color: '#ef4444', type: 'bar' },
    { key: 'warnings', name: 'Warnings', color: '#f59e0b', type: 'bar' }
  ];

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      // Implementation for exporting analytics data
      console.log(`Exporting analytics data as ${format}`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Scrapers"
          value={dashboardMetrics.totalScrapers}
          description="Configured scrapers"
          icon={<Database className="h-4 w-4" />}
          trend={{
            direction: 'stable',
            percentage: 0,
            period: 'vs last period'
          }}
        />
        <MetricsCard
          title="Active Scrapers"
          value={dashboardMetrics.activeScrapers}
          description="Currently running"
          icon={<Activity className="h-4 w-4" />}
          trend={{
            direction: dashboardMetrics.activeScrapers > 0 ? 'up' : 'stable',
            percentage: 5.2,
            period: 'vs last hour'
          }}
          badge={{
            text: isConnected ? 'Live' : 'Offline',
            variant: isConnected ? 'default' : 'destructive'
          }}
        />
        <MetricsCard
          title="Success Rate"
          value={`${dashboardMetrics.successRate.toFixed(1)}%`}
          description="Successful completions"
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{
            direction: dashboardMetrics.successRate > 90 ? 'up' : 'down',
            percentage: 2.1,
            period: 'vs yesterday'
          }}
        />
        <MetricsCard
          title="Avg Response Time"
          value={`${dashboardMetrics.avgResponseTime}ms`}
          description="Average response time"
          icon={<Clock className="h-4 w-4" />}
          trend={{
            direction: 'down',
            percentage: 8.3,
            period: 'improvement'
          }}
        />
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeChart
          title="Performance Metrics"
          description="Response time and throughput over time"
          data={analyticsData.performanceMetrics}
          series={performanceSeries}
          type="composed"
          height={300}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          realTimeUpdates={enableRealTime}
          showControls={true}
          enableCrosshair={true}
        />
        
        <RealTimeChart
          title="Error Analysis"
          description="Error and warning trends"
          data={analyticsData.errorAnalysis}
          series={errorSeries}
          type="bar"
          height={300}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator
              status={systemHealth?.overall > 90 ? 'completed' : systemHealth?.overall > 70 ? 'running' : 'failed'}
              title="Overall System Health"
              description={`${dashboardMetrics.systemHealth}% healthy`}
              progress={dashboardMetrics.systemHealth}
              variant="card"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Scrapers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scraperStatuses?.slice(0, 3).map((scraper, index) => (
              <StatusIndicator
                key={index}
                status={scraper.status}
                title={scraper.name}
                description={scraper.description}
                variant="inline"
                showBadge={true}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity?.slice(0, 4).map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{activity.action}</span>
                <Badge variant="outline" className="text-xs">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeChart
          title="Source Performance"
          description="Performance metrics by data source"
          data={analyticsData.sourceMetrics}
          type="pie"
          height={350}
          showLegend={true}
        />
        
        <RealTimeChart
          title="Scraping Velocity"
          description="Data collection rate over time"
          data={analyticsData.velocityData}
          type="area"
          height={350}
          smoothing={true}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RealTimeChart
          title="Quality Trends"
          description="Data quality metrics and trends"
          data={analyticsData.qualityMetrics}
          type="line"
          height={400}
          showControls={true}
          enableBrushing={true}
        />
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricsCard
          title="Performance Score"
          value={dashboardMetrics.performanceScore}
          description="Overall performance rating"
          icon={<Target className="h-4 w-4" />}
        />
        <MetricsCard
          title="Data Points"
          value={dashboardMetrics.dataPointsCollected.toLocaleString()}
          description="Collected today"
          icon={<Database className="h-4 w-4" />}
        />
        <MetricsCard
          title="Errors Today"
          value={dashboardMetrics.errorsToday}
          description="Error occurrences"
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={{
            direction: 'down',
            percentage: 15.2,
            period: 'vs yesterday'
          }}
        />
      </div>

      <RealTimeChart
        title="Detailed Performance Analysis"
        description="Comprehensive performance metrics with trend analysis"
        data={analyticsData.trendData}
        type="composed"
        height={500}
        showControls={true}
        enableCrosshair={true}
        annotations={[
          { x: '12:00', y: 100, label: 'Peak Hours', color: '#f59e0b' }
        ]}
      />
    </div>
  );

  return (
    <ErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive scraper analytics and performance monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {timeRange === 'custom' && (
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            )}
            
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5 minutes</SelectItem>
                <SelectItem value="15m">15 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="6h">6 hours</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {showExportOptions && (
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {(error || realtimeError) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || realtimeError}
              {!isConnected && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
                  onClick={reconnect}
                >
                  Reconnect
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <LineChart className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {renderAnalyticsTab()}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {renderPerformanceTab()}
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default AnalyticsDashboard;