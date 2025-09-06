import { SupabaseService, TABLES } from './supabase';

export interface AnalyticsData {
  users: {
    total: number;
    new_this_month: number;
    active_users: number;
    growth_rate: number;
  };
  job_posts: {
    total: number;
    active: number;
    new_this_month: number;
    applications_total: number;
  };
  employers: {
    total: number;
    active: number;
    premium: number;
    new_this_month: number;
  };
  job_seekers: {
    total: number;
    active: number;
    premium: number;
    new_this_month: number;
  };
  revenue: {
    total: number;
    this_month: number;
    growth_rate: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface TopPerformer {
  id: string;
  name: string;
  type: 'employer' | 'job_seeker';
  metric: number;
  metric_type: string;
}

export interface PlatformAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  created_at: string;
  is_resolved: boolean;
}

export class AnalyticsService {
  // Get overall platform analytics
  static async getPlatformAnalytics(): Promise<AnalyticsData> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Users analytics
    const [totalUsers, newUsersThisMonth, newUsersLastMonth, activeUsers] = await Promise.all([
      SupabaseService.count(TABLES.USERS),
      SupabaseService.count(TABLES.USERS, {
        created_at: `gte.${thisMonth.toISOString()}`
      }),
      SupabaseService.count(TABLES.USERS, {
        created_at: `gte.${lastMonth.toISOString()}.lt.${thisMonth.toISOString()}`
      }),
      SupabaseService.count(TABLES.USERS, {
        last_sign_in_at: `gte.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`
      })
    ]);

    const userGrowthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : 0;

    // Job posts analytics
    const [totalJobPosts, activeJobPosts, newJobPostsThisMonth, totalApplications] = await Promise.all([
      SupabaseService.count(TABLES.JOB_POSTS),
      SupabaseService.count(TABLES.JOB_POSTS, { status: 'active' }),
      SupabaseService.count(TABLES.JOB_POSTS, {
        created_at: `gte.${thisMonth.toISOString()}`
      }),
      SupabaseService.count(TABLES.APPLICATIONS)
    ]);

    // Employers analytics
    const [totalEmployers, activeEmployers, premiumEmployers, newEmployersThisMonth] = await Promise.all([
      SupabaseService.count(TABLES.EMPLOYERS),
      SupabaseService.count(TABLES.EMPLOYERS, { status: 'approved' }),
      SupabaseService.count(TABLES.EMPLOYERS, { is_premium: true }),
      SupabaseService.count(TABLES.EMPLOYERS, {
        created_at: `gte.${thisMonth.toISOString()}`
      })
    ]);

    // Job seekers analytics
    const [totalJobSeekers, activeJobSeekers, premiumJobSeekers, newJobSeekersThisMonth] = await Promise.all([
      SupabaseService.count(TABLES.JOB_SEEKERS),
      SupabaseService.count(TABLES.JOB_SEEKERS, { status: 'active' }),
      SupabaseService.count(TABLES.JOB_SEEKERS, { is_premium: true }),
      SupabaseService.count(TABLES.JOB_SEEKERS, {
        created_at: `gte.${thisMonth.toISOString()}`
      })
    ]);

    // Revenue analytics (mock data - would integrate with payment provider)
    const totalRevenue = premiumEmployers * 99 + premiumJobSeekers * 29; // Mock calculation
    const thisMonthRevenue = newEmployersThisMonth * 99 + newJobSeekersThisMonth * 29;
    const lastMonthRevenue = 5000; // Mock data
    const revenueGrowthRate = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      users: {
        total: totalUsers,
        new_this_month: newUsersThisMonth,
        active_users: activeUsers,
        growth_rate: userGrowthRate
      },
      job_posts: {
        total: totalJobPosts,
        active: activeJobPosts,
        new_this_month: newJobPostsThisMonth,
        applications_total: totalApplications
      },
      employers: {
        total: totalEmployers,
        active: activeEmployers,
        premium: premiumEmployers,
        new_this_month: newEmployersThisMonth
      },
      job_seekers: {
        total: totalJobSeekers,
        active: activeJobSeekers,
        premium: premiumJobSeekers,
        new_this_month: newJobSeekersThisMonth
      },
      revenue: {
        total: totalRevenue,
        this_month: thisMonthRevenue,
        growth_rate: revenueGrowthRate
      }
    };
  }

  // Get user growth chart data
  static async getUserGrowthData(period: 'week' | 'month' | 'year' = 'month'): Promise<ChartData> {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    let periodCount = 12;
    let dateFormat = 'MMM';
    
    if (period === 'week') {
      periodCount = 7;
      dateFormat = 'ddd';
    } else if (period === 'year') {
      periodCount = 5;
      dateFormat = 'YYYY';
    }

    for (let i = periodCount - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let label: string;

      if (period === 'week') {
        startDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        label = startDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        label = startDate.toLocaleDateString('en-US', { month: 'short' });
      } else {
        startDate = new Date(now.getFullYear() - i, 0, 1);
        endDate = new Date(now.getFullYear() - i + 1, 0, 1);
        label = startDate.getFullYear().toString();
      }

      const count = await SupabaseService.count(TABLES.USERS, {
        created_at: `gte.${startDate.toISOString()}.lt.${endDate.toISOString()}`
      });

      labels.push(label);
      data.push(count);
    }

    return {
      labels,
      datasets: [{
        label: 'New Users',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        fill: true
      }]
    };
  }

  // Get job categories distribution
  static async getJobCategoriesData(): Promise<ChartData> {
    const { data, error } = await SupabaseService.read<{ industry: string }>(
      TABLES.JOB_POSTS,
      {
        select: 'industry',
        filters: { status: 'active' }
      }
    );

    if (error) throw error;

    const categoryCounts: Record<string, number> = {};
    data.forEach(item => {
      if (item.industry) {
        categoryCounts[item.industry] = (categoryCounts[item.industry] || 0) + 1;
      }
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedCategories.map(([category]) => category),
      datasets: [{
        label: 'Job Posts',
        data: sortedCategories.map(([, count]) => count),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
        ]
      }]
    };
  }

  // Get application trends
  static async getApplicationTrends(period: 'week' | 'month' = 'month'): Promise<ChartData> {
    const now = new Date();
    const labels: string[] = [];
    const applicationData: number[] = [];
    const hireData: number[] = [];

    const periodCount = period === 'week' ? 7 : 12;

    for (let i = periodCount - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let label: string;

      if (period === 'week') {
        startDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        label = startDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        label = startDate.toLocaleDateString('en-US', { month: 'short' });
      }

      const [applications, hires] = await Promise.all([
        SupabaseService.count(TABLES.APPLICATIONS, {
          created_at: `gte.${startDate.toISOString()}.lt.${endDate.toISOString()}`
        }),
        SupabaseService.count(TABLES.APPLICATIONS, {
          status: 'hired',
          updated_at: `gte.${startDate.toISOString()}.lt.${endDate.toISOString()}`
        })
      ]);

      labels.push(label);
      applicationData.push(applications);
      hireData.push(hires);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Applications',
          data: applicationData,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          fill: false
        },
        {
          label: 'Hires',
          data: hireData,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgb(16, 185, 129)',
          fill: false
        }
      ]
    };
  }

  // Get top performing employers
  static async getTopEmployers(limit: number = 10): Promise<TopPerformer[]> {
    const employers = await SupabaseService.read<any>(
      TABLES.EMPLOYERS,
      {
        select: `
          id,
          company_name,
          job_posts:job_posts(count).eq(status,active)
        `,
        filters: { status: 'approved' },
        orderBy: { column: 'created_at', ascending: false },
        limit
      }
    );

    return employers.map(employer => ({
      id: employer.id,
      name: employer.company_name,
      type: 'employer' as const,
      metric: employer.job_posts?.[0]?.count || 0,
      metric_type: 'Active Job Posts'
    }));
  }

  // Get top performing job seekers
  static async getTopJobSeekers(limit: number = 10): Promise<TopPerformer[]> {
    const jobSeekers = await SupabaseService.read<any>(
      TABLES.JOB_SEEKERS,
      {
        select: `
          id,
          first_name,
          last_name,
          profile_completion,
          applications:applications(count)
        `,
        filters: { status: 'active' },
        orderBy: { column: 'profile_completion', ascending: false },
        limit
      }
    );

    return jobSeekers.map(seeker => ({
      id: seeker.id,
      name: `${seeker.first_name} ${seeker.last_name}`,
      type: 'job_seeker' as const,
      metric: seeker.profile_completion || 0,
      metric_type: 'Profile Completion %'
    }));
  }

  // Get platform alerts
  static async getPlatformAlerts(): Promise<PlatformAlert[]> {
    // This would typically come from a monitoring system
    // For now, we'll generate some mock alerts based on data
    const alerts: PlatformAlert[] = [];

    // Check for high pending approvals
    const pendingEmployers = await SupabaseService.count(TABLES.EMPLOYERS, { status: 'pending' });
    const pendingJobPosts = await SupabaseService.count(TABLES.JOB_POSTS, { status: 'pending' });
    const flaggedPosts = await SupabaseService.count(TABLES.JOB_POSTS, { is_flagged: true });

    if (pendingEmployers > 10) {
      alerts.push({
        id: 'pending-employers',
        type: 'warning',
        title: 'High Pending Employer Approvals',
        message: `${pendingEmployers} employers are waiting for approval`,
        created_at: new Date().toISOString(),
        is_resolved: false
      });
    }

    if (pendingJobPosts > 20) {
      alerts.push({
        id: 'pending-jobs',
        type: 'warning',
        title: 'High Pending Job Post Approvals',
        message: `${pendingJobPosts} job posts are waiting for approval`,
        created_at: new Date().toISOString(),
        is_resolved: false
      });
    }

    if (flaggedPosts > 5) {
      alerts.push({
        id: 'flagged-posts',
        type: 'error',
        title: 'Flagged Content Requires Attention',
        message: `${flaggedPosts} job posts have been flagged for review`,
        created_at: new Date().toISOString(),
        is_resolved: false
      });
    }

    return alerts;
  }

  // Get device usage statistics
  static async getDeviceUsage(): Promise<Record<string, number>> {
    // This would typically come from analytics tracking
    // Mock data for demonstration
    return {
      'Desktop': 65,
      'Mobile': 30,
      'Tablet': 5
    };
  }

  // Get location-based statistics
  static async getLocationStats(limit: number = 10): Promise<Record<string, number>> {
    const [employerLocations, jobSeekerLocations] = await Promise.all([
      SupabaseService.read<{ location: string }>(
        TABLES.EMPLOYERS,
        {
          select: 'location',
          filters: { status: 'approved' }
        }
      ),
      SupabaseService.read<{ location: string }>(
        TABLES.JOB_SEEKERS,
        {
          select: 'location',
          filters: { status: 'active' }
        }
      )
    ]);

    const locationCounts: Record<string, number> = {};
    
    [...employerLocations, ...jobSeekerLocations].forEach(item => {
      if (item.location) {
        locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .reduce((obj, [location, count]) => {
        obj[location] = count;
        return obj;
      }, {} as Record<string, number>);
  }

  // Export analytics data
  static async exportAnalyticsData(format: 'csv' | 'json' = 'csv'): Promise<string> {
    const analytics = await this.getPlatformAnalytics();
    
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    }
    
    // Convert to CSV format
    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', analytics.users.total.toString()],
      ['New Users This Month', analytics.users.new_this_month.toString()],
      ['Active Users', analytics.users.active_users.toString()],
      ['User Growth Rate', `${analytics.users.growth_rate.toFixed(2)}%`],
      ['Total Job Posts', analytics.job_posts.total.toString()],
      ['Active Job Posts', analytics.job_posts.active.toString()],
      ['Total Applications', analytics.job_posts.applications_total.toString()],
      ['Total Employers', analytics.employers.total.toString()],
      ['Active Employers', analytics.employers.active.toString()],
      ['Premium Employers', analytics.employers.premium.toString()],
      ['Total Job Seekers', analytics.job_seekers.total.toString()],
      ['Active Job Seekers', analytics.job_seekers.active.toString()],
      ['Premium Job Seekers', analytics.job_seekers.premium.toString()],
      ['Total Revenue', `$${analytics.revenue.total.toString()}`],
      ['This Month Revenue', `$${analytics.revenue.this_month.toString()}`],
      ['Revenue Growth Rate', `${analytics.revenue.growth_rate.toFixed(2)}%`]
    ];
    
    return csvData.map(row => row.join(',')).join('\n');
  }
}