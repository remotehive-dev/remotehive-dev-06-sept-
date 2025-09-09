import { apiClient } from './client';

export interface AnalyticsData {
  totalUsers: number;
  totalEmployers: number;
  totalJobSeekers: number;
  totalJobPosts: number;
  activeJobPosts: number;
  pendingJobPosts: number;
  totalApplications: number;
  monthlyRevenue: number;
  userGrowthRate: number;
  employerGrowthRate: number;
  jobPostGrowthRate: number;
  applicationGrowthRate: number;
  revenueGrowthRate: number;
  topPerformingEmployers: TopPerformer[];
  topPerformingJobSeekers: TopPerformer[];
  industryDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  skillsDistribution: Record<string, number>;
  remoteJobsPercentage: number;
  averageSalary: number;
  conversionRate: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  value: number;
  change: number;
  avatar?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface TimeSeriesData {
  date: string;
  users: number;
  employers: number;
  jobPosts: number;
  applications: number;
  revenue: number;
}

export class AnalyticsApiService {
  // Get platform analytics overview
  static async getPlatformAnalytics(): Promise<AnalyticsData> {
    try {
      return await apiClient.get<AnalyticsData>('/api/v1/admin/analytics/platform');
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      // Return mock data as fallback
      return {
        totalUsers: 0,
        totalEmployers: 0,
        totalJobSeekers: 0,
        totalJobPosts: 0,
        activeJobPosts: 0,
        pendingJobPosts: 0,
        totalApplications: 0,
        monthlyRevenue: 0,
        userGrowthRate: 0,
        employerGrowthRate: 0,
        jobPostGrowthRate: 0,
        applicationGrowthRate: 0,
        revenueGrowthRate: 0,
        topPerformingEmployers: [],
        topPerformingJobSeekers: [],
        industryDistribution: {},
        locationDistribution: {},
        skillsDistribution: {},
        remoteJobsPercentage: 0,
        averageSalary: 0,
        conversionRate: 0
      };
    }
  }

  // Get user analytics
  static async getUserAnalytics(period: string = '30d'): Promise<TimeSeriesData[]> {
    try {
      return await apiClient.get<TimeSeriesData[]>(`/api/v1/admin/analytics/users?period=${period}`);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return [];
    }
  }

  // Get employer analytics
  static async getEmployerAnalytics(period: string = '30d'): Promise<TimeSeriesData[]> {
    try {
      return await apiClient.get<TimeSeriesData[]>(`/api/v1/admin/analytics/employers?period=${period}`);
    } catch (error) {
      console.error('Error fetching employer analytics:', error);
      return [];
    }
  }

  // Get job post analytics
  static async getJobPostAnalytics(period: string = '30d'): Promise<TimeSeriesData[]> {
    try {
      return await apiClient.get<TimeSeriesData[]>(`/api/v1/admin/analytics/job-posts?period=${period}`);
    } catch (error) {
      console.error('Error fetching job post analytics:', error);
      return [];
    }
  }

  // Get application analytics
  static async getApplicationAnalytics(period: string = '30d'): Promise<TimeSeriesData[]> {
    try {
      return await apiClient.get<TimeSeriesData[]>(`/api/v1/admin/analytics/applications?period=${period}`);
    } catch (error) {
      console.error('Error fetching application analytics:', error);
      return [];
    }
  }

  // Get revenue analytics
  static async getRevenueAnalytics(period: string = '30d'): Promise<TimeSeriesData[]> {
    try {
      return await apiClient.get<TimeSeriesData[]>(`/api/v1/admin/analytics/revenue?period=${period}`);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return [];
    }
  }

  // Get top performing employers
  static async getTopEmployers(limit: number = 10): Promise<TopPerformer[]> {
    try {
      return await apiClient.get<TopPerformer[]>(`/api/v1/admin/analytics/top-employers?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching top employers:', error);
      return [];
    }
  }

  // Get top performing job seekers
  static async getTopJobSeekers(limit: number = 10): Promise<TopPerformer[]> {
    try {
      return await apiClient.get<TopPerformer[]>(`/api/v1/admin/analytics/top-job-seekers?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching top job seekers:', error);
      return [];
    }
  }

  // Get industry distribution
  static async getIndustryDistribution(): Promise<Record<string, number>> {
    try {
      return await apiClient.get<Record<string, number>>('/api/v1/admin/analytics/industry-distribution');
    } catch (error) {
      console.error('Error fetching industry distribution:', error);
      return {};
    }
  }

  // Get location distribution
  static async getLocationDistribution(): Promise<Record<string, number>> {
    try {
      return await apiClient.get<Record<string, number>>('/api/v1/admin/analytics/location-distribution');
    } catch (error) {
      console.error('Error fetching location distribution:', error);
      return {};
    }
  }

  // Get skills distribution
  static async getSkillsDistribution(): Promise<Record<string, number>> {
    try {
      return await apiClient.get<Record<string, number>>('/api/v1/admin/analytics/skills-distribution');
    } catch (error) {
      console.error('Error fetching skills distribution:', error);
      return {};
    }
  }

  // Get conversion funnel data
  static async getConversionFunnel(): Promise<ChartData> {
    try {
      return await apiClient.get<ChartData>('/api/v1/admin/analytics/conversion-funnel');
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      return {
        labels: [],
        datasets: []
      };
    }
  }
}