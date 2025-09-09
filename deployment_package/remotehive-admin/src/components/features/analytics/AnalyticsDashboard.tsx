'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Eye,
  MousePointer,
  Clock,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Share,
  Target,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  UserCheck,
  Building,
  FileText,
  MessageSquare,
  Star,
  Zap,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { GlassCard, StatsCard } from '@/components/ui/advanced/glass-card';
import { AnimatedChart } from '@/components/ui/advanced/animated-chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface AnalyticsDashboardProps {
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock analytics data
const analyticsData = {
  overview: {
    totalUsers: 12847,
    totalEmployers: 1234,
    totalJobSeekers: 11613,
    totalJobPosts: 3456,
    totalApplications: 28934,
    totalViews: 156789,
    conversionRate: 3.2,
    avgSessionDuration: '4m 32s',
    bounceRate: 42.3,
    revenue: 89750
  },
  growth: {
    usersGrowth: 15.2,
    employersGrowth: 8.7,
    jobSeekersGrowth: 16.1,
    jobPostsGrowth: 12.4,
    applicationsGrowth: 23.8,
    revenueGrowth: 18.9
  },
  userGrowthData: [
    { month: 'Jan', users: 8500, employers: 850, jobSeekers: 7650 },
    { month: 'Feb', users: 9200, employers: 920, jobSeekers: 8280 },
    { month: 'Mar', users: 9800, employers: 980, jobSeekers: 8820 },
    { month: 'Apr', users: 10500, employers: 1050, jobSeekers: 9450 },
    { month: 'May', users: 11200, employers: 1120, jobSeekers: 10080 },
    { month: 'Jun', users: 12000, employers: 1200, jobSeekers: 10800 },
    { month: 'Jul', users: 12847, employers: 1234, jobSeekers: 11613 }
  ],
  jobCategoriesData: [
    { name: 'Technology', value: 35, count: 1210 },
    { name: 'Marketing', value: 18, count: 622 },
    { name: 'Design', value: 15, count: 518 },
    { name: 'Sales', value: 12, count: 415 },
    { name: 'Customer Support', value: 10, count: 346 },
    { name: 'Finance', value: 6, count: 207 },
    { name: 'HR', value: 4, count: 138 }
  ],
  applicationTrendsData: [
    { date: '2024-01-14', applications: 145, views: 1250, conversions: 4.6 },
    { date: '2024-01-15', applications: 167, views: 1380, conversions: 5.2 },
    { date: '2024-01-16', applications: 134, views: 1190, conversions: 3.8 },
    { date: '2024-01-17', applications: 189, views: 1420, conversions: 5.8 },
    { date: '2024-01-18', applications: 156, views: 1310, conversions: 4.1 },
    { date: '2024-01-19', applications: 178, views: 1450, conversions: 5.1 },
    { date: '2024-01-20', applications: 203, views: 1580, conversions: 6.2 }
  ],
  deviceData: [
    { name: 'Desktop', value: 52, users: 6680 },
    { name: 'Mobile', value: 35, users: 4496 },
    { name: 'Tablet', value: 13, users: 1671 }
  ],
  locationData: [
    { country: 'United States', users: 4523, percentage: 35.2 },
    { country: 'Canada', users: 1847, percentage: 14.4 },
    { country: 'United Kingdom', users: 1534, percentage: 11.9 },
    { country: 'Germany', users: 1289, percentage: 10.0 },
    { country: 'Australia', users: 967, percentage: 7.5 },
    { country: 'France', users: 834, percentage: 6.5 },
    { country: 'Netherlands', users: 723, percentage: 5.6 },
    { country: 'Others', users: 1130, percentage: 8.9 }
  ],
  revenueData: [
    { month: 'Jan', revenue: 65000, subscriptions: 520, avgPerUser: 125 },
    { month: 'Feb', revenue: 68500, subscriptions: 548, avgPerUser: 125 },
    { month: 'Mar', revenue: 72000, subscriptions: 576, avgPerUser: 125 },
    { month: 'Apr', revenue: 75500, subscriptions: 604, avgPerUser: 125 },
    { month: 'May', revenue: 79000, subscriptions: 632, avgPerUser: 125 },
    { month: 'Jun', revenue: 83500, subscriptions: 668, avgPerUser: 125 },
    { month: 'Jul', revenue: 89750, subscriptions: 718, avgPerUser: 125 }
  ],
  topPerformers: {
    employers: [
      { name: 'TechCorp Inc.', jobPosts: 45, applications: 1234, hireRate: 8.2 },
      { name: 'StartupXYZ', jobPosts: 32, applications: 987, hireRate: 12.1 },
      { name: 'Global Solutions', jobPosts: 28, applications: 756, hireRate: 6.8 },
      { name: 'Innovation Labs', jobPosts: 24, applications: 645, hireRate: 9.5 },
      { name: 'Digital Agency', jobPosts: 19, applications: 523, hireRate: 11.3 }
    ],
    jobSeekers: [
      { name: 'Sarah Johnson', applications: 23, responseRate: 78.3, profileViews: 456 },
      { name: 'Mike Chen', applications: 19, responseRate: 84.2, profileViews: 389 },
      { name: 'Emily Davis', applications: 17, responseRate: 70.6, profileViews: 334 },
      { name: 'David Wilson', applications: 15, responseRate: 86.7, profileViews: 298 },
      { name: 'Lisa Rodriguez', applications: 14, responseRate: 92.9, profileViews: 267 }
    ]
  },
  alerts: [
    {
      id: '1',
      type: 'warning',
      title: 'High Bounce Rate',
      message: 'Bounce rate increased by 12% this week',
      timestamp: new Date('2024-01-20T10:30:00'),
      severity: 'medium'
    },
    {
      id: '2',
      type: 'success',
      title: 'Revenue Milestone',
      message: 'Monthly revenue exceeded $85K target',
      timestamp: new Date('2024-01-20T09:15:00'),
      severity: 'low'
    },
    {
      id: '3',
      type: 'info',
      title: 'New Feature Usage',
      message: 'Premium features adoption at 67%',
      timestamp: new Date('2024-01-20T08:45:00'),
      severity: 'low'
    }
  ]
};

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '1y', label: 'Last year' },
  { value: 'custom', label: 'Custom range' }
];

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Analytics data export has been initiated.'
    });
  };

  const handleRefresh = () => {
    toast({
      title: 'Data Refreshed',
      description: 'Analytics data has been updated.'
    });
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Platform insights, metrics, and performance analytics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {analyticsData.alerts.length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Recent Alerts</h3>
              <Badge variant="outline">{analyticsData.alerts.length} active</Badge>
            </div>
            <div className="space-y-3">
              {analyticsData.alerts.map(alert => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">{alert.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Main Analytics */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Users"
                value={analyticsData.overview.totalUsers.toLocaleString()}
                change={analyticsData.growth.usersGrowth}
                trend="up"
                icon={Users}
                description="All registered users"
              />
              <StatsCard
                title="Job Posts"
                value={analyticsData.overview.totalJobPosts.toLocaleString()}
                change={analyticsData.growth.jobPostsGrowth}
                trend="up"
                icon={Briefcase}
                description="Active job listings"
                variant="success"
              />
              <StatsCard
                title="Applications"
                value={analyticsData.overview.totalApplications.toLocaleString()}
                change={analyticsData.growth.applicationsGrowth}
                trend="up"
                icon={FileText}
                description="Total applications"
                variant="warning"
              />
              <StatsCard
                title="Revenue"
                value={`$${(analyticsData.overview.revenue / 1000).toFixed(0)}K`}
                change={analyticsData.growth.revenueGrowth}
                trend="up"
                icon={DollarSign}
                description="Monthly revenue"
                variant="success"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">User Growth Trend</h3>
                  <Badge variant="outline">+{analyticsData.growth.usersGrowth}%</Badge>
                </div>
                <AnimatedChart
                  type="line"
                  data={analyticsData.userGrowthData}
                  height={300}
                  config={{
                    xKey: 'month',
                    lines: [
                      { key: 'users', color: '#3b82f6', name: 'Total Users' },
                      { key: 'employers', color: '#10b981', name: 'Employers' },
                      { key: 'jobSeekers', color: '#f59e0b', name: 'Job Seekers' }
                    ]
                  }}
                />
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Job Categories</h3>
                  <Badge variant="outline">{analyticsData.jobCategoriesData.length} categories</Badge>
                </div>
                <AnimatedChart
                  type="pie"
                  data={analyticsData.jobCategoriesData}
                  height={300}
                  config={{
                    dataKey: 'value',
                    nameKey: 'name'
                  }}
                />
              </GlassCard>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Page Views</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.overview.totalViews.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(12.5)}
                  <span className={`text-sm font-medium ${getTrendColor(12.5)}`}>+12.5%</span>
                  <span className="text-sm text-slate-500">vs last month</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Conversion Rate</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.overview.conversionRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(0.8)}
                  <span className={`text-sm font-medium ${getTrendColor(0.8)}`}>+0.8%</span>
                  <span className="text-sm text-slate-500">vs last month</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Avg Session</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.overview.avgSessionDuration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(-5.2)}
                  <span className={`text-sm font-medium ${getTrendColor(-5.2)}`}>-5.2%</span>
                  <span className="text-sm text-slate-500">vs last month</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Bounce Rate</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.overview.bounceRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(3.1)}
                  <span className={`text-sm font-medium ${getTrendColor(3.1)}`}>+3.1%</span>
                  <span className="text-sm text-slate-500">vs last month</span>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard
                title="Total Users"
                value={analyticsData.overview.totalUsers.toLocaleString()}
                change={analyticsData.growth.usersGrowth}
                trend="up"
                icon={Users}
                description="All registered users"
              />
              <StatsCard
                title="Employers"
                value={analyticsData.overview.totalEmployers.toLocaleString()}
                change={analyticsData.growth.employersGrowth}
                trend="up"
                icon={Building}
                description="Company accounts"
                variant="success"
              />
              <StatsCard
                title="Job Seekers"
                value={analyticsData.overview.totalJobSeekers.toLocaleString()}
                change={analyticsData.growth.jobSeekersGrowth}
                trend="up"
                icon={UserCheck}
                description="Individual accounts"
                variant="warning"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Device Usage</h3>
                <AnimatedChart
                  type="pie"
                  data={analyticsData.deviceData}
                  height={300}
                  config={{
                    dataKey: 'value',
                    nameKey: 'name'
                  }}
                />
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Locations</h3>
                <div className="space-y-4">
                  {analyticsData.locationData.slice(0, 6).map((location, index) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{location.country}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{location.users.toLocaleString()} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white">{location.percentage}%</p>
                        <Progress value={location.percentage} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Active Jobs"
                value={analyticsData.overview.totalJobPosts.toLocaleString()}
                change={analyticsData.growth.jobPostsGrowth}
                trend="up"
                icon={Briefcase}
                description="Currently active"
              />
              <StatsCard
                title="Applications"
                value={analyticsData.overview.totalApplications.toLocaleString()}
                change={analyticsData.growth.applicationsGrowth}
                trend="up"
                icon={FileText}
                description="Total submitted"
                variant="success"
              />
              <StatsCard
                title="Avg per Job"
                value={(analyticsData.overview.totalApplications / analyticsData.overview.totalJobPosts).toFixed(1)}
                change={8.4}
                trend="up"
                icon={Target}
                description="Applications per job"
                variant="warning"
              />
              <StatsCard
                title="Success Rate"
                value="12.3%"
                change={2.1}
                trend="up"
                icon={CheckCircle}
                description="Hire success rate"
                variant="success"
              />
            </div>

            <GlassCard className="p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Application Trends</h3>
              <AnimatedChart
                type="area"
                data={analyticsData.applicationTrendsData}
                height={400}
                config={{
                  xKey: 'date',
                  areas: [
                    { key: 'applications', color: '#3b82f6', name: 'Applications' },
                    { key: 'views', color: '#10b981', name: 'Job Views' }
                  ]
                }}
              />
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Performing Employers</h3>
                <div className="space-y-4">
                  {analyticsData.topPerformers.employers.map((employer, index) => (
                    <div key={employer.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{employer.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{employer.jobPosts} jobs posted</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white">{employer.hireRate}%</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">hire rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Job Categories Performance</h3>
                <div className="space-y-4">
                  {analyticsData.jobCategoriesData.slice(0, 5).map((category, index) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{category.count} jobs</span>
                      </div>
                      <Progress value={category.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Monthly Revenue"
                value={`$${(analyticsData.overview.revenue / 1000).toFixed(0)}K`}
                change={analyticsData.growth.revenueGrowth}
                trend="up"
                icon={DollarSign}
                description="Current month"
                variant="success"
              />
              <StatsCard
                title="Subscriptions"
                value="718"
                change={13.6}
                trend="up"
                icon={Star}
                description="Active subscriptions"
              />
              <StatsCard
                title="Avg per User"
                value="$125"
                change={0}
                trend="neutral"
                icon={Users}
                description="Monthly ARPU"
                variant="warning"
              />
              <StatsCard
                title="Churn Rate"
                value="2.3%"
                change={-0.8}
                trend="down"
                icon={TrendingUp}
                description="Monthly churn"
                variant="success"
              />
            </div>

            <GlassCard className="p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Revenue Growth</h3>
              <AnimatedChart
                type="bar"
                data={analyticsData.revenueData}
                height={400}
                config={{
                  xKey: 'month',
                  bars: [
                    { key: 'revenue', color: '#10b981', name: 'Revenue ($)' }
                  ]
                }}
              />
            </GlassCard>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Job Seekers</h3>
                <div className="space-y-4">
                  {analyticsData.topPerformers.jobSeekers.map((seeker, index) => (
                    <div key={seeker.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{seeker.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{seeker.applications} applications</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white">{seeker.responseRate}%</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">response rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Platform Health</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Server Uptime</span>
                      <span className="text-sm font-bold text-green-600">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">API Response Time</span>
                      <span className="text-sm font-bold text-blue-600">145ms</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Database Performance</span>
                      <span className="text-sm font-bold text-green-600">Excellent</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">User Satisfaction</span>
                      <span className="text-sm font-bold text-green-600">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}