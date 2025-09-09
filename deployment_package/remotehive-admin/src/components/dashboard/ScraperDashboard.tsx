'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Activity, Server, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { MetricsCard, StatusIndicator, ProgressTracker, RealTimeChart } from './widgets';
import { useScraperRealTime } from '@/hooks/useScraperRealTime';
import { cn } from '@/lib/utils';
import { Skeleton, TabsSkeleton, ScraperConfigSkeleton } from '@/components/ui/skeleton';

interface ScraperDashboardProps {
  className?: string;
  wsUrl?: string;
  apiUrl?: string;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

const ScraperDashboard: React.FC<ScraperDashboardProps> = ({
  className,
  wsUrl,
  apiUrl,
  refreshInterval = 5000,
  enableRealTime = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    data,
    isLoading,
    error,
    lastUpdate,
    connectionStatus,
    isConnected,
    refresh,
    getRunningScrapers,
    getFailedScrapers,
    getTotalJobsToday
  } = useScraperRealTime({
    wsUrl,
    fallbackApiUrl: apiUrl,
    updateInterval: refreshInterval,
    enableFallback: true
  });

  const runningScrapers = useMemo(() => getRunningScrapers(), [getRunningScrapers]);
  const failedScrapers = useMemo(() => getFailedScrapers(), [getFailedScrapers]);
  const totalJobsToday = useMemo(() => getTotalJobsToday(), [getTotalJobsToday]);

  const connectionStatusConfig = {
    connected: { color: 'bg-green-500', text: 'Connected', icon: CheckCircle },
    connecting: { color: 'bg-yellow-500', text: 'Connecting', icon: Clock },
    disconnected: { color: 'bg-red-500', text: 'Disconnected', icon: AlertTriangle },
    fallback: { color: 'bg-blue-500', text: 'Fallback Mode', icon: RefreshCw }
  };

  const currentStatus = connectionStatusConfig[connectionStatus] || connectionStatusConfig.disconnected;

  if (error && !data.metrics.totalConfigurations) {
    return (
      <div className={cn('p-6', className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to connect to scraper service: {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={refresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scraper Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for your scraping operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={cn('w-2 h-2 rounded-full', currentStatus.color)} />
            <span className="text-sm font-medium">{currentStatus.text}</span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Configurations"
          value={data.metrics.totalConfigurations}
          description="Active scraper configs"
          icon={Server}
          trend={{ value: 0, isPositive: true }}
          loading={isLoading}
        />
        
        <MetricsCard
          title="Running Scrapers"
          value={data.metrics.runningScrapers}
          description={`${runningScrapers.length} active`}
          icon={Activity}
          trend={{ value: 0, isPositive: true }}
          badge={data.metrics.runningScrapers > 0 ? { text: 'Active', variant: 'default' } : undefined}
          loading={isLoading}
        />
        
        <MetricsCard
          title="Jobs Scraped Today"
          value={totalJobsToday}
          description="Total jobs found"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          loading={isLoading}
        />
        
        <MetricsCard
          title="Success Rate"
          value={`${data.metrics.successRate.toFixed(1)}%`}
          description="Last 24 hours"
          icon={CheckCircle}
          trend={{ value: 2.5, isPositive: true }}
          badge={{
            text: data.metrics.successRate >= 90 ? 'Excellent' : data.metrics.successRate >= 70 ? 'Good' : 'Needs Attention',
            variant: data.metrics.successRate >= 90 ? 'default' : data.metrics.successRate >= 70 ? 'secondary' : 'destructive'
          }}
          loading={isLoading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Avg Response Time"
          value={`${data.metrics.avgResponseTime}ms`}
          description="Network latency"
          icon={Zap}
          trend={{ value: -15, isPositive: true }}
          loading={isLoading}
        />
        
        <MetricsCard
          title="Error Rate"
          value={`${data.metrics.errorRate.toFixed(2)}%`}
          description="Failed requests"
          icon={AlertTriangle}
          trend={{ value: -5, isPositive: true }}
          badge={{
            text: data.metrics.errorRate < 5 ? 'Low' : data.metrics.errorRate < 15 ? 'Medium' : 'High',
            variant: data.metrics.errorRate < 5 ? 'default' : data.metrics.errorRate < 15 ? 'secondary' : 'destructive'
          }}
          loading={isLoading}
        />
        
        <MetricsCard
          title="Data Processed"
          value={`${(data.metrics.dataProcessed / 1024 / 1024).toFixed(1)}MB`}
          description="Total data scraped"
          icon={Server}
          trend={{ value: 8, isPositive: true }}
          loading={isLoading}
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scrapers">Active Scrapers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest scraping operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <StatusIndicator
                          status={activity.action === 'completed' ? 'completed' : 
                                 activity.action === 'failed' ? 'failed' : 
                                 activity.action === 'started' ? 'running' : 'idle'}
                          variant="compact"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.scraperName}</p>
                          <p className="text-xs text-muted-foreground">{activity.details}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Jobs Over Time</CardTitle>
                  <CardDescription>Scraping performance trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <RealTimeChart
                    data={data.chartData.jobsOverTime}
                    type="line"
                    height={300}
                    loading={isLoading}
                    showTrend
                    animate
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scrapers" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ScraperConfigSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.scraperStatuses.map((scraper) => (
                <Card key={scraper.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scraper.name}</CardTitle>
                      <StatusIndicator status={scraper.status} variant="inline" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProgressTracker
                      progress={scraper.progress}
                      steps={[
                        { name: 'Initialization', status: 'completed' },
                        { name: 'Scraping', status: scraper.status === 'running' ? 'in_progress' : scraper.status },
                        { name: 'Processing', status: scraper.progress > 80 ? 'in_progress' : 'pending' },
                        { name: 'Completion', status: scraper.status === 'completed' ? 'completed' : 'pending' }
                      ]}
                      startTime={scraper.startTime}
                      eta={scraper.eta}
                      compact
                    />
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jobs Found:</span>
                        <span className="font-medium">{scraper.jobsFound}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">{scraper.currentPage}/{scraper.totalPages} pages</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
                <CardDescription>Success rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  data={data.chartData.successRateOverTime}
                  type="area"
                  height={300}
                  loading={isLoading}
                  showTrend
                  animate
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>Average response time trends</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  data={data.chartData.responseTimeOverTime}
                  type="line"
                  height={300}
                  loading={isLoading}
                  showTrend
                  animate
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate Analysis</CardTitle>
                <CardDescription>Error patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  data={data.chartData.errorRateOverTime}
                  type="bar"
                  height={300}
                  loading={isLoading}
                  showTrend
                  animate
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricsCard
              title="CPU Usage"
              value={`${data.systemHealth.cpuUsage.toFixed(1)}%`}
              description="System processor load"
              icon={Activity}
              trend={{ value: -2, isPositive: true }}
              badge={{
                text: data.systemHealth.cpuUsage < 70 ? 'Normal' : data.systemHealth.cpuUsage < 90 ? 'High' : 'Critical',
                variant: data.systemHealth.cpuUsage < 70 ? 'default' : data.systemHealth.cpuUsage < 90 ? 'secondary' : 'destructive'
              }}
              loading={isLoading}
            />
            
            <MetricsCard
              title="Memory Usage"
              value={`${data.systemHealth.memoryUsage.toFixed(1)}%`}
              description="RAM utilization"
              icon={Server}
              trend={{ value: 1, isPositive: false }}
              badge={{
                text: data.systemHealth.memoryUsage < 80 ? 'Normal' : data.systemHealth.memoryUsage < 95 ? 'High' : 'Critical',
                variant: data.systemHealth.memoryUsage < 80 ? 'default' : data.systemHealth.memoryUsage < 95 ? 'secondary' : 'destructive'
              }}
              loading={isLoading}
            />
            
            <MetricsCard
              title="Queue Size"
              value={data.systemHealth.queueSize}
              description="Pending jobs"
              icon={Clock}
              trend={{ value: -5, isPositive: true }}
              badge={{
                text: data.systemHealth.queueSize < 10 ? 'Low' : data.systemHealth.queueSize < 50 ? 'Medium' : 'High',
                variant: data.systemHealth.queueSize < 10 ? 'default' : data.systemHealth.queueSize < 50 ? 'secondary' : 'destructive'
              }}
              loading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Overall system health and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <StatusIndicator
                      status={data.systemHealth.workerStatus === 'healthy' ? 'completed' : 
                             data.systemHealth.workerStatus === 'warning' ? 'warning' : 'failed'}
                      variant="inline"
                    />
                    <div>
                      <p className="font-medium">Worker Status</p>
                      <p className="text-sm text-muted-foreground">Background processing health</p>
                    </div>
                  </div>
                  <Badge variant={data.systemHealth.workerStatus === 'healthy' ? 'default' : 
                                data.systemHealth.workerStatus === 'warning' ? 'secondary' : 'destructive'}>
                    {data.systemHealth.workerStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Network Latency</p>
                    <p className="text-sm text-muted-foreground">Average response time</p>
                  </div>
                  <span className="font-mono text-lg">{data.systemHealth.networkLatency}ms</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Last Health Check</p>
                    <p className="text-sm text-muted-foreground">System monitoring update</p>
                  </div>
                  <span className="text-sm">{new Date(data.systemHealth.lastHealthCheck).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScraperDashboard;