import { apiClient } from '../../lib/api';

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
    const [totalUsersResponse, newUsersThisMonthResponse, newUsersLastMonthResponse, activeUsersResponse] = await Promise.all([
      apiClient.getCount('users'),
      apiClient.getCount('users', {
        created_at: { $gte: thisMonth.toISOString() }
      }),
      apiClient.getCount('users', {
        created_at: { $gte: lastMonth.toISOString(), $lt: thisMonth.toISOString() }
      }),
      apiClient.getCount('users', {
        last_sign_in_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      })
    ]);

    const totalUsers = totalUsersResponse.data?.count || 0;
    const newUsersThisMonth = newUsersThisMonthResponse.data?.count || 0;
    const newUsersLastMonth = newUsersLastMonthResponse.data?.count || 0;
    const activeUsers = activeUsersResponse.data?.count || 0;

    const userGrowthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : 0;

    // Job posts analytics
    const [totalJobPostsResponse, activeJobPostsResponse, newJobPostsThisMonthResponse, totalApplicationsResponse] = await Promise.all([
      apiClient.getCount('job_posts'),
      apiClient.getCount('job_posts', { status: 'active' }),
      apiClient.getCount('job_posts', {
        created_at: { $gte: thisMonth.toISOString() }
      }),
      apiClient.getCount('applications')
    ]);

    const totalJobPosts = totalJobPostsResponse.data?.count || 0;
    const activeJobPosts = activeJobPostsResponse.data?.count || 0;
    const newJobPostsThisMonth = newJobPostsThisMonthResponse.data?.count || 0;
    const totalApplications = totalApplicationsResponse.data?.count || 0;

    // Employers analytics
    const [totalEmployersResponse, activeEmployersResponse, premiumEmployersResponse, newEmployersThisMonthResponse] = await Promise.all([
      apiClient.getCount('employers'),
      apiClient.getCount('employers', { status: 'active' }),
      apiClient.getCount('employers', { is_premium: true }),
      apiClient.getCount('employers', {
        created_at: { $gte: thisMonth.toISOString() }
      })
    ]);

    const totalEmployers = totalEmployersResponse.data?.count || 0;
    const activeEmployers = activeEmployersResponse.data?.count || 0;
    const premiumEmployers = premiumEmployersResponse.data?.count || 0;
    const newEmployersThisMonth = newEmployersThisMonthResponse.data?.count || 0;

    // Job seekers analytics
    const [totalJobSeekersResponse, activeJobSeekersResponse, premiumJobSeekersResponse, newJobSeekersThisMonthResponse] = await Promise.all([
      apiClient.getCount('job_seekers'),
      apiClient.getCount('job_seekers', { status: 'active' }),
      apiClient.getCount('job_seekers', { is_premium: true }),
      apiClient.getCount('job_seekers', {
        created_at: { $gte: thisMonth.toISOString() }
      })
    ]);

    const totalJobSeekers = totalJobSeekersResponse.data?.count || 0;
    const activeJobSeekers = activeJobSeekersResponse.data?.count || 0;
    const premiumJobSeekers = premiumJobSeekersResponse.data?.count || 0;
    const newJobSeekersThisMonth = newJobSeekersThisMonthResponse.data?.count || 0;

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

      const countResponse = await apiClient.getCount('users', {
        created_at: { $gte: startDate.toISOString(), $lt: endDate.toISOString() }
      });

      const count = countResponse.data?.count || 0;

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
    const jobPostsResponse = await apiClient.getItems('job_posts', {
      select: ['industry'],
      filters: { status: 'active' }
    });

    if (jobPostsResponse.error) {
      throw new Error(jobPostsResponse.error);
    }

    const data = jobPostsResponse.data || [];

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

      const [applicationsResponse, hiresResponse] = await Promise.all([
        apiClient.getCount('applications', {
          created_at: { $gte: startDate.toISOString(), $lt: endDate.toISOString() }
        }),
        apiClient.getCount('applications', {
          status: 'hired',
          updated_at: { $gte: startDate.toISOString(), $lt: endDate.toISOString() }
        })
      ]);

      const applications = applicationsResponse.data?.count || 0;
      const hires = hiresResponse.data?.count || 0;

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
    const employersResponse = await apiClient.getItems('employers', {
      select: ['id', 'company_name'],
      filters: { status: 'approved' },
      sort: { job_posts_count: -1 },
      limit: 10
    });

    if (employersResponse.error) {
      throw new Error(employersResponse.error);
    }

    const employers = employersResponse.data || [];

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
    const jobSeekersResponse = await apiClient.getItems('job_seekers', {
      select: ['id', 'first_name', 'last_name', 'profile_completion'],
      filters: { status: 'active' },
      sort: { profile_completion: -1 },
      limit
    });

    if (jobSeekersResponse.error) {
      throw new Error(jobSeekersResponse.error);
    }

    const jobSeekers = jobSeekersResponse.data || [];

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
    const [pendingEmployersResponse, pendingJobPostsResponse, flaggedPostsResponse] = await Promise.all([
      apiClient.getCount('employers', { status: 'pending' }),
      apiClient.getCount('job_posts', { status: 'pending' }),
      apiClient.getCount('job_posts', { is_flagged: true })
    ]);

    const pendingEmployers = pendingEmployersResponse.data?.count || 0;
    const pendingJobPosts = pendingJobPostsResponse.data?.count || 0;
    const flaggedPosts = flaggedPostsResponse.data?.count || 0;

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
    const [employerLocationsResponse, jobSeekerLocationsResponse] = await Promise.all([
      apiClient.getItems('employers', {
        select: ['location'],
        filters: { status: 'approved' }
      }),
      apiClient.getItems('job_seekers', {
        select: ['location'],
        filters: { status: 'active' }
      })
    ]);

    if (employerLocationsResponse.error || jobSeekerLocationsResponse.error) {
      throw new Error('Failed to fetch location data');
    }

    const employerLocations = employerLocationsResponse.data || [];
    const jobSeekerLocations = jobSeekerLocationsResponse.data || [];

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