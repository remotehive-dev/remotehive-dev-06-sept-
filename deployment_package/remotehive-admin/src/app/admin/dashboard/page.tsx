'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStore } from '@/store/adminStore';
// Using FastAPI backend services for dashboard data
import { AnalyticsApiService } from '@/services/api/analytics-api';
import { EmployerApiService } from '@/services/api/employers-api';
import { JobSeekerApiService } from '@/services/api/jobseekers-api';
import { JobPostApiService } from '@/services/api/jobposts-api';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  Eye,
  AlertTriangle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/format';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalEmployers: number;
  totalJobSeekers: number;
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  totalApplications: number;
  monthlyRevenue: number;
  growthRate: number;
}

interface ActivityItem {
  id: string;
  type: 'user_registered' | 'job_posted' | 'application_submitted' | 'employer_approved' | 'job_approved' | 'payment_received';
  description: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'warning' | 'error';
  title: string;
  time: string;
}

interface SystemStatus {
  api: { status: string; responseTime: number };
  database: { status: string; connections: number };
  scraperQueue: { status: string; pending: number };
  email: { status: string; lastSent: Date };
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  href: string;
  count?: number;
  variant?: 'default' | 'warning' | 'destructive';
}

const StatCard = ({ title, value, description, icon: Icon, trend, color = "blue", loading = false }: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  loading?: boolean;
}) => {
  const colorClasses = {
    blue: "bg-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950",
    green: "bg-green-500 text-green-500 bg-green-50 dark:bg-green-950",
    purple: "bg-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-950",
    orange: "bg-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-950",
    red: "bg-red-500 text-red-500 bg-red-50 dark:bg-red-950",
    yellow: "bg-yellow-500 text-yellow-500 bg-yellow-50 dark:bg-yellow-950"
  };

  const [bgColor, textColor, lightBg] = colorClasses[color as keyof typeof colorClasses]?.split(' ') || ['bg-gray-500', 'text-gray-500', 'bg-gray-50'];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn('p-2 rounded-lg', lightBg)}>
            <Icon className={cn('w-4 h-4', textColor)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">{description}</p>
            {trend && (
              <div className="flex items-center">
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                )}
                <span className={cn('text-xs font-medium', 
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                )}>
                  {formatPercentage(trend.value / 100)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ActivityItem = ({ id, type, description, timestamp, user, status = 'success' }: ActivityItem) => {
  const statusColors = {
    success: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400',
    warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400',
    error: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400'
  };

  const statusIcons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
  };

  const typeIcons = {
    user_registered: Users,
    job_posted: Briefcase,
    application_submitted: FileText,
    employer_approved: Building2,
    job_approved: CheckCircle,
    payment_received: DollarSign
  };

  const StatusIcon = statusIcons[status];
  const TypeIcon = typeIcons[type] || Activity;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      case 'job_posted':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400';
      case 'application_submitted':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400';
      case 'employer_approved':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'job_approved':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-400';
      case 'payment_received':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
    >
      <div className={cn('p-2 rounded-full', getTypeColor(type))}>
        <TypeIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {description}
          </p>
          <div className={cn('p-1 rounded-full', statusColors[status])}>
            <StatusIcon className="w-3 h-3" />
          </div>
        </div>
        {user && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            by {user}
          </p>
        )}
      </div>
      <div className="text-xs text-gray-400 whitespace-nowrap">
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { analytics, setAnalytics } = useAdminStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEmployers: 0,
    totalJobSeekers: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingJobs: 0,
    totalApplications: 0,
    monthlyRevenue: 0,
    growthRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: { status: 'healthy', responseTime: 0 },
    database: { status: 'healthy', connections: 0 },
    scraperQueue: { status: 'idle', pending: 0 },
    email: { status: 'healthy', lastSent: new Date() }
  });
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data using API-based services
      // Parallel fetch for better performance
      const [analyticsData, employersData, jobSeekersData, jobPostsData] = await Promise.all([
        AnalyticsApiService.getPlatformAnalytics(),
        EmployerApiService.getEmployers({ page: 1, limit: 1 }),
        JobSeekerApiService.getJobSeekers({ page: 1, limit: 1 }),
        JobPostApiService.getJobPosts({ page: 1, limit: 1 })
      ]);
      
      // Update stats with real data
      setStats({
        totalUsers: analyticsData?.totalUsers || 0,
        totalEmployers: employersData?.total || 0,
        totalJobSeekers: jobSeekersData?.total || 0,
        totalJobs: analyticsData?.totalJobPosts || 0,
        activeJobs: analyticsData?.activeJobPosts || 0,
        pendingJobs: jobPostsData?.data?.filter(job => job.status === 'pending').length || 0,
        totalApplications: analyticsData?.totalApplications || 0,
        monthlyRevenue: analyticsData?.monthlyRevenue || 0,
        growthRate: analyticsData?.userGrowthRate || 0
      });
      
      // Set analytics in store
      setAnalytics(analyticsData);
      
      // Generate recent activity (mock data for now)
      const mockActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'user_registered',
          description: 'New user registered',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          user: 'ranjeettiwary589@gmail.com',
          status: 'success',
          title: 'User Registration',
          time: '5 min ago'
        },
        {
          id: '2',
          type: 'job_posted',
          description: 'New job posted: Senior Developer',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          user: 'TechCorp',
          status: 'success',
          title: 'Job Posted',
          time: '15 min ago'
        },
        {
          id: '3',
          type: 'application_submitted',
          description: 'Application submitted for Frontend Role',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user: 'ranjeettiwari105@gmail.com',
          status: 'success',
          title: 'Application Submitted',
          time: '30 min ago'
        },
        {
          id: '4',
          type: 'employer_approved',
          description: 'Employer account approved',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          user: 'StartupXYZ',
          status: 'success',
          title: 'Employer Approved',
          time: '45 min ago'
        },
        {
          id: '5',
          type: 'payment_received',
          description: 'Payment received for job posting',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          user: 'BigTech Inc',
          status: 'success',
          title: 'Payment Received',
          time: '1 hour ago'
        }
      ];
      
      setRecentActivity(mockActivity);
      
      // Update system status (mock for now)
      setSystemStatus({
        api: { status: 'healthy', responseTime: 45 },
        database: { status: 'healthy', connections: 12 },
        scraperQueue: { status: 'processing', pending: 3 },
        email: { status: 'healthy', lastSent: new Date(Date.now() - 10 * 60 * 1000) }
      });
      
      // Set quick actions
      setQuickActions([
        {
          title: 'Pending Approvals',
          description: 'Review pending employer applications',
          icon: AlertTriangle,
          href: '/admin/employers?status=pending',
          count: 5,
          variant: 'warning'
        },
        {
          title: 'Flagged Content',
          description: 'Review flagged job posts',
          icon: AlertCircle,
          href: '/admin/jobs?flagged=true',
          count: 2,
          variant: 'destructive'
        },
        {
          title: 'New Users',
          description: 'Welcome new users',
          icon: Users,
          href: '/admin/users?new=true',
          count: 12
        },
        {
          title: 'Analytics',
          description: 'View detailed analytics',
          icon: TrendingUp,
          href: '/admin/analytics'
        }
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set real zero values on error instead of mock data
      setStats({
        totalUsers: 0,
        totalEmployers: 0,
        totalJobSeekers: 0,
        totalJobs: 0,
        activeJobs: 0,
        pendingJobs: 0,
        totalApplications: 0,
        monthlyRevenue: 0,
        growthRate: 0
      });
      
      // Show error message to user
      console.error('Failed to load dashboard data. Showing empty state.')
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Helper function to get badge variant for system status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'active':
        return { variant: 'success' as const, text: 'Healthy' };
      case 'processing':
      case 'warning':
        return { variant: 'warning' as const, text: 'Processing' };
      case 'error':
      case 'failed':
        return { variant: 'destructive' as const, text: 'Error' };
      case 'idle':
        return { variant: 'secondary' as const, text: 'Idle' };
      default:
        return { variant: 'secondary' as const, text: 'Unknown' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with RemoteHive today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="All registered users"
          icon={Users}
          trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          description="Currently active"
          icon={Briefcase}
          trend={{ value: 8.5, isPositive: true }}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Total Applications"
          value={stats.totalApplications}
          description="All applications"
          icon={FileText}
          trend={{ value: 15.2, isPositive: true }}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          description="This month"
          icon={DollarSign}
          trend={{ value: 23.1, isPositive: true }}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Employers"
          value={stats.totalEmployers}
          description="Registered companies"
          icon={Building2}
          trend={{ value: 5.8, isPositive: true }}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Job Seekers"
          value={stats.totalJobSeekers}
          description="Active candidates"
          icon={Users}
          trend={{ value: 12.3, isPositive: true }}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          description="Awaiting approval"
          icon={Clock}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/activity')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
              <CardDescription>
                Latest system activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} {...activity} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    className="w-full justify-between" 
                    variant={action.variant || 'outline'}
                    onClick={() => router.push(action.href)}
                  >
                    <div className="flex items-center">
                      <action.icon className="w-4 h-4 mr-2" />
                      <span className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs opacity-70">{action.description}</div>
                      </span>
                    </div>
                    {action.count && (
                      <Badge variant="secondary" className="ml-2">
                        {action.count}
                      </Badge>
                    )}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>System Status</span>
              </CardTitle>
              <CardDescription>
                Current system health and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className={cn('w-2 h-2 rounded-full', 
                        systemStatus.api.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className="text-sm font-medium">API Status</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{systemStatus.api.responseTime}ms</span>
                      <Badge variant={getStatusBadge(systemStatus.api.status).variant}>
                        {getStatusBadge(systemStatus.api.status).text}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className={cn('w-2 h-2 rounded-full', 
                        systemStatus.database.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{systemStatus.database.connections} conn</span>
                      <Badge variant={getStatusBadge(systemStatus.database.status).variant}>
                        {getStatusBadge(systemStatus.database.status).text}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className={cn('w-2 h-2 rounded-full', 
                        systemStatus.scraperQueue.status === 'processing' ? 'bg-yellow-500' : 
                        systemStatus.scraperQueue.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className="text-sm font-medium">Scraper Queue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{systemStatus.scraperQueue.pending} pending</span>
                      <Badge variant={getStatusBadge(systemStatus.scraperQueue.status).variant}>
                        {getStatusBadge(systemStatus.scraperQueue.status).text}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className={cn('w-2 h-2 rounded-full', 
                        systemStatus.email.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className="text-sm font-medium">Email Service</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(systemStatus.email.lastSent).toLocaleTimeString()}
                      </span>
                      <Badge variant={getStatusBadge(systemStatus.email.status).variant}>
                        {getStatusBadge(systemStatus.email.status).text}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}