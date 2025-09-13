// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

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
    const response = await apiRequest('/admin/analytics/platform');
    return response.data || response;
  }

  // Get user growth chart data
  static async getUserGrowthData(period: 'week' | 'month' | 'year' = 'month'): Promise<ChartData> {
    const response = await apiRequest(`/admin/analytics/user-growth?period=${period}`);
    return response.data || response;
  }

  // Get job categories distribution data
  static async getJobCategoriesData(): Promise<ChartData> {
    const response = await apiRequest('/admin/analytics/job-categories');
    return response.data || response;
  }

  // Get application trends data
  static async getApplicationTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<ChartData> {
    const response = await apiRequest(`/admin/analytics/application-trends?period=${period}`);
    return response.data || response;
  }

  // Get top performing employers
  static async getTopEmployers(limit: number = 10): Promise<TopPerformer[]> {
    const response = await apiRequest(`/admin/analytics/top-employers?limit=${limit}`);
    return response.data || response;
  }

  // Get top performing job seekers
  static async getTopJobSeekers(limit: number = 10): Promise<TopPerformer[]> {
    const response = await apiRequest(`/admin/analytics/top-job-seekers?limit=${limit}`);
    return response.data || response;
  }

  // Get platform alerts and notifications
  static async getPlatformAlerts(): Promise<PlatformAlert[]> {
    const response = await apiRequest('/admin/analytics/platform-alerts');
    return response.data || response;
  }

  // Get device usage statistics
  static async getDeviceUsage(): Promise<ChartData> {
    const response = await apiRequest('/admin/analytics/device-usage');
    return response.data || response;
  }

  // Get location-based statistics
  static async getLocationStats(): Promise<{ country: string; count: number; percentage: number }[]> {
    const response = await apiRequest('/admin/analytics/location-stats');
    return response.data || response;
  }

  // Export analytics data
  static async exportAnalyticsData(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiRequest(`/admin/analytics/export?format=${format}`, {
      method: 'GET'
    });
    
    if (format === 'json') {
      return new Blob([JSON.stringify(response.data || response, null, 2)], {
        type: 'application/json'
      });
    }
    
    return new Blob([response.data || response], { type: 'text/csv' });
  }
}