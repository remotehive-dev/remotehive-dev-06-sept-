import { apiClient } from '../../lib/api-client';

const STATUS_TYPES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

export interface JobSeeker {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location: string;
  bio?: string;
  skills: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  job_preferences: {
    remote_preference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    salary_expectation?: {
      min: number;
      max: number;
      currency: string;
    };
    preferred_industries: string[];
    preferred_roles: string[];
  };
  resume_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  is_premium: boolean;
  profile_completion: number;
  last_active: string;
  created_at: string;
  updated_at: string;
  total_applications?: number;
  successful_applications?: number;
}

export interface JobSeekerStats {
  total: number;
  active: number;
  inactive: number;
  premium: number;
  new_this_month: number;
  high_performers: number;
}

export class JobSeekerService {
  // Get all job seekers with pagination and filters
  static async getJobSeekers(options: {
    page?: number;
    limit?: number;
    status?: string;
    experience_level?: string;
    location?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ jobSeekers: JobSeeker[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      experience_level,
      location,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const filters: Record<string, any> = {};

    if (status) filters.status = status;
    if (experience_level) filters.experience_level = experience_level;
    if (location) filters.location = location;

    const response = await apiClient.getItems('jobseekers', {
      page,
      limit,
      filters,
      search,
      sortBy,
      sortOrder
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      jobSeekers: response.data || [],
      total: response.total || 0
    };
  }

  // Get job seeker by ID
  static async getJobSeekerById(id: string): Promise<JobSeeker> {
    const response = await apiClient.getItem('jobseekers', id);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error('Job seeker not found');
    }

    return response.data;
  }

  // Get job seeker statistics
  static async getJobSeekerStats(): Promise<JobSeekerStats> {
    const [totalResponse, activeResponse, inactiveResponse, premiumResponse] = await Promise.all([
      apiClient.getCount('jobseekers'),
      apiClient.getCount('jobseekers', { status: STATUS_TYPES.ACTIVE }),
      apiClient.getCount('jobseekers', { status: STATUS_TYPES.INACTIVE }),
      apiClient.getCount('jobseekers', { is_premium: true })
    ]);

    // Get new job seekers this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonthResponse = await apiClient.getCount('jobseekers', {
      created_at: `gte.${thisMonth.toISOString()}`
    });

    // Get high performers (profile completion > 80% and active)
    const highPerformersResponse = await apiClient.getCount('jobseekers', {
      status: STATUS_TYPES.ACTIVE,
      profile_completion: 'gte.80'
    });

    return {
      total: totalResponse.data?.count || 0,
      active: activeResponse.data?.count || 0,
      inactive: inactiveResponse.data?.count || 0,
      premium: premiumResponse.data?.count || 0,
      new_this_month: newThisMonthResponse.data?.count || 0,
      high_performers: highPerformersResponse.data?.count || 0
    };
  }

  // Update job seeker
  static async updateJobSeeker(
    id: string,
    data: Partial<JobSeeker>
  ): Promise<JobSeeker> {
    const response = await apiClient.updateItem('jobseekers', id, {
      ...data,
      updated_at: new Date().toISOString()
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Toggle premium status
  static async togglePremium(id: string, isPremium: boolean): Promise<JobSeeker> {
    const response = await apiClient.updateItem('jobseekers', id, {
      is_premium: isPremium,
      updated_at: new Date().toISOString()
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Suspend job seeker
  static async suspendJobSeeker(id: string): Promise<JobSeeker> {
    const response = await apiClient.updateItem('jobseekers', id, {
      status: 'suspended',
      updated_at: new Date().toISOString()
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Activate job seeker
  static async activateJobSeeker(id: string): Promise<JobSeeker> {
    const response = await apiClient.updateItem('jobseekers', id, {
      status: STATUS_TYPES.ACTIVE,
      updated_at: new Date().toISOString()
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Delete job seeker
  static async deleteJobSeeker(id: string): Promise<void> {
    const response = await apiClient.deleteItem('jobseekers', id);

    if (response.error) {
      throw new Error(response.error);
    }
  }

  // Get top performing job seekers
  static async getTopPerformers(limit: number = 10): Promise<JobSeeker[]> {
    const response = await apiClient.getItems('jobseekers', {
      filters: { status: STATUS_TYPES.ACTIVE },
      sortBy: 'profile_completion',
      sortOrder: 'desc',
      limit
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  // Get job seekers by experience level
  static async getJobSeekersByExperience(): Promise<Record<string, number>> {
    const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
    const counts: Record<string, number> = {};

    for (const level of experienceLevels) {
      const response = await apiClient.getCount('jobseekers', {
        experience_level: level,
        status: STATUS_TYPES.ACTIVE
      });
      counts[level] = response.data?.count || 0;
    }

    return counts;
  }

  // Get job seekers by location
  static async getJobSeekersByLocation(limit: number = 10): Promise<Record<string, number>> {
    const response = await apiClient.getItems('jobseekers', {
      filters: { status: STATUS_TYPES.ACTIVE },
      select: 'location'
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const locationCounts: Record<string, number> = {};
    (response.data || []).forEach((item: any) => {
      if (item.location) {
        locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
      }
    });

    // Sort by count and return top locations
    const sortedLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .reduce((obj, [location, count]) => {
        obj[location] = count;
        return obj;
      }, {} as Record<string, number>);

    return sortedLocations;
  }

  // Get recent activity
  static async getRecentActivity(limit: number = 20): Promise<JobSeeker[]> {
    const response = await apiClient.getItems('jobseekers', {
      sortBy: 'updated_at',
      sortOrder: 'desc',
      limit
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  // Search by skills
  static async searchBySkills(skills: string[], page: number = 1, limit: number = 20): Promise<{ jobSeekers: JobSeeker[]; total: number }> {
    const response = await apiClient.getItems('jobseekers', {
      filters: { 
        status: STATUS_TYPES.ACTIVE,
        skills: { $in: skills }
      },
      sortBy: 'created_at',
      sortOrder: 'desc',
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return { 
      jobSeekers: response.data || [], 
      total: response.total || 0 
    };
  }
}