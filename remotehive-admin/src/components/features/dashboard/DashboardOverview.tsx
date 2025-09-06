'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Eye,
  UserPlus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Globe,
  Activity
} from 'lucide-react';
import { StatsCard, GlassCard } from '@/components/ui/advanced/glass-card';
import { AnimatedChart } from '@/components/ui/advanced/animated-chart';
import { DataTable } from '@/components/ui/advanced/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiState } from '@/lib/hooks/useApi';
import { AdminStats, User, JobPost, Employer } from '@/lib/types/admin';
import { CHART_COLORS } from '@/lib/constants/admin';
import { analyticsService } from '@/lib/services/api';
import { toast } from 'react-hot-toast';

interface DashboardOverviewProps {
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

// Default empty data structure
const defaultStats: AdminStats = {
  total_users: 0,
  total_employers: 0,
  total_job_seekers: 0,
  total_job_posts: 0,
  active_job_posts: 0,
  pending_approvals: 0,
  total_applications: 0,
  new_signups_today: 0,
  new_job_posts_today: 0,
  revenue_this_month: 0,
  premium_users: 0
};

const defaultChartData = {
  userGrowth: [],
  jobPostsData: [],
  revenueData: []
};



export function DashboardOverview({ className }: DashboardOverviewProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [chartData, setChartData] = useState(defaultChartData);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState<AdminStats>(defaultStats);

   // Helper functions to generate chart data from real stats
   const generateUserGrowthData = (dashboardStats: any) => {
     // Generate sample growth data based on current stats
     const days = 7;
     const data = [];
     for (let i = days - 1; i >= 0; i--) {
       const date = new Date();
       date.setDate(date.getDate() - i);
       const baseUsers = Math.max(0, dashboardStats.total_users - dashboardStats.new_users_this_week);
       const dailyGrowth = Math.floor(dashboardStats.new_users_this_week / days);
       data.push({
         date: date.toISOString().split('T')[0],
         users: baseUsers + (dailyGrowth * (days - i)),
         name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
       });
     }
     return data;
   };

   const generateJobPostsData = (dashboardStats: any) => {
     return [
       { name: 'Active', value: dashboardStats.active_jobs, color: '#10B981' },
       { name: 'Pending', value: Math.max(0, dashboardStats.total_jobs - dashboardStats.active_jobs), color: '#F59E0B' },
       { name: 'Expired', value: Math.floor(dashboardStats.total_jobs * 0.1), color: '#EF4444' }
     ];
   };

   const generateRevenueData = (dashboardStats: any) => {
     // Generate sample revenue data for the month
     const days = 30;
     const data = [];
     const dailyRevenue = dashboardStats.revenue_this_month / days;
     for (let i = days - 1; i >= 0; i--) {
       const date = new Date();
       date.setDate(date.getDate() - i);
       data.push({
         date: date.toISOString().split('T')[0],
         revenue: dailyRevenue * (days - i) + (Math.random() * dailyRevenue * 0.3),
         name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
       });
     }
     return data;
   };

   // Helper function to calculate percentage change
   const calculatePercentageChange = (current: number, previous: number): number => {
     if (previous === 0) return current > 0 ? 100 : 0;
     return ((current - previous) / previous) * 100;
   };

   useEffect(() => {
     fetchDashboardData();
   }, [timeRange]);
 
   const fetchDashboardData = async () => {
     setLoading(true);
     try {
       const response = await analyticsService.getDashboardStats();
       if (response.success && response.data) {
         // Store previous stats for comparison
         setPreviousStats(stats);
         
         // Map backend DashboardStats to frontend AdminStats format
         const dashboardStats = response.data;
         const mappedStats: AdminStats = {
           total_users: dashboardStats.total_users,
           total_employers: Math.floor(dashboardStats.total_users * 0.3), // Estimate
           total_job_seekers: Math.floor(dashboardStats.total_users * 0.7), // Estimate
           total_job_posts: dashboardStats.total_jobs,
           active_job_posts: dashboardStats.active_jobs,
           pending_approvals: dashboardStats.pending_applications,
           total_applications: dashboardStats.total_applications,
           new_signups_today: dashboardStats.new_users_this_week,
           new_job_posts_today: dashboardStats.new_jobs_this_week,
           revenue_this_month: dashboardStats.revenue_this_month,
           premium_users: Math.floor(dashboardStats.active_users * 0.1) // Estimate
         };
         setStats(mappedStats);
         
         // Generate chart data from real stats
         const generatedChartData = {
           userGrowth: generateUserGrowthData(dashboardStats),
           jobPostsData: generateJobPostsData(dashboardStats),
           revenueData: generateRevenueData(dashboardStats)
         };
         setChartData(generatedChartData);
       }
     } catch (error) {
       console.error('Failed to fetch dashboard data:', error);
       toast.error('Failed to load dashboard data');
     } finally {
       setLoading(false);
     }
   };



  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return UserPlus;
      case 'employer_approval': return CheckCircle;
      case 'job_post': return Briefcase;
      case 'application': return FileText;
      default: return Activity;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Dashboard Overview
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor your platform's performance and key metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          change={calculatePercentageChange(stats.total_users, previousStats.total_users)}
          trend={calculatePercentageChange(stats.total_users, previousStats.total_users) >= 0 ? "up" : "down"}
          icon={Users}
          description="Registered users"
        />
        <StatsCard
          title="Active Employers"
          value={stats.total_employers.toLocaleString()}
          change={calculatePercentageChange(stats.total_employers, previousStats.total_employers)}
          trend={calculatePercentageChange(stats.total_employers, previousStats.total_employers) >= 0 ? "up" : "down"}
          icon={Building2}
          description="Verified companies"
        />
        <StatsCard
          title="Job Posts"
          value={stats.total_job_posts.toLocaleString()}
          change={calculatePercentageChange(stats.total_job_posts, previousStats.total_job_posts)}
          trend={calculatePercentageChange(stats.total_job_posts, previousStats.total_job_posts) >= 0 ? "up" : "down"}
          icon={Briefcase}
          description="Active listings"
        />
        <StatsCard
          title="Revenue"
          value={`$${(stats.revenue_this_month / 1000).toFixed(1)}k`}
          change={calculatePercentageChange(stats.revenue_this_month, previousStats.revenue_this_month)}
          trend={calculatePercentageChange(stats.revenue_this_month, previousStats.revenue_this_month) >= 0 ? "up" : "down"}
          icon={DollarSign}
          description="Monthly recurring"
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                User Growth
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Employers</span>
                </div>
              </div>
            </div>
            <AnimatedChart
              type="line"
              data={chartData.userGrowth}
              height={300}
            />
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Job Types Distribution
              </h3>
            </div>
            <AnimatedChart
              type="pie"
              data={chartData.jobPostsData}
              height={300}
            />
          </GlassCard>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div variants={itemVariants} className="mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Revenue Trends
              </h3>
              <Badge 
                variant="secondary" 
                className={`${
                  calculatePercentageChange(stats.revenue_this_month, previousStats.revenue_this_month) >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {calculatePercentageChange(stats.revenue_this_month, previousStats.revenue_this_month) >= 0 ? '+' : ''}
                {calculatePercentageChange(stats.revenue_this_month, previousStats.revenue_this_month).toFixed(1)}% vs last month
              </Badge>
            </div>
          <AnimatedChart
            type="area"
            data={chartData.revenueData}
            height={200}
          />
        </GlassCard>
      </motion.div>

      {/* Activity and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${getActivityColor(activity.status)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {activity.user}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <Badge 
                      variant={activity.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Top Performers */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Top Performers
              </h3>
              <Button variant="outline" size="sm">
                View Rankings
              </Button>
            </div>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {performer.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {performer.type} • {performer.metric}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {performer.score}%
                    </div>
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        style={{ width: `${performer.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}