import { apiClient, ApiResponse, PaginatedResponse } from './base-api';
import { API_ENDPOINTS, STATUS_TYPES, PAGINATION } from './constants';

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
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      experience_level,
      location,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const params: Record<string, any> = {
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    };

    if (status) params.status = status;
    if (experience_level) params.experience_level = experience_level;
    if (location) params.location = location;
    if (search) params.search = search;

    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<JobSeeker>>>(
        API_ENDPOINTS.JOB_SEEKERS.BASE,
        { params }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch job seekers');
      }

      const { data: jobSeekers, total } = response.data.data!;
      return { jobSeekers, total };
    } catch (error: any) {
      console.error('Error fetching job seekers:', error);
      throw new Error(error.message || 'Failed to fetch job seekers');
    }
  }

  // Get job seeker by ID
  static async getJobSeekerById(id: string): Promise<JobSeeker> {
    try {
      const response = await apiClient.get<ApiResponse<JobSeeker>>(
        API_ENDPOINTS.JOB_SEEKERS.BY_ID(id)
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Job seeker not found');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching job seeker:', error);
      throw new Error(error.message || 'Job seeker not found');
    }
  }

  // Get job seeker statistics
  static async getJobSeekerStats(): Promise<JobSeekerStats> {
    try {
      const response = await apiClient.get<ApiResponse<JobSeekerStats>>(
        API_ENDPOINTS.JOB_SEEKERS.STATS
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch job seeker statistics');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching job seeker stats:', error);
      throw new Error(error.message || 'Failed to fetch job seeker statistics');
    }
  }

  // Update job seeker
  static async updateJobSeeker(
    id: string,
    data: Partial<JobSeeker>
  ): Promise<JobSeeker> {
    try {
      const response = await apiClient.put<ApiResponse<JobSeeker>>(
        API_ENDPOINTS.JOB_SEEKERS.BY_ID(id),
        {
          ...data,
          updated_at: new Date().toISOString()
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update job seeker');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error updating job seeker:', error);
      throw new Error(error.message || 'Failed to update job seeker');
    }
  }

  // Toggle premium status
  static async togglePremium(id: string, isPremium: boolean): Promise<JobSeeker> {
    try {
      const response = await apiClient.patch<ApiResponse<JobSeeker>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BY_ID(id)}/premium`,
        {
          is_premium: isPremium,
          updated_at: new Date().toISOString()
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to toggle premium status');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error toggling premium status:', error);
      throw new Error(error.message || 'Failed to toggle premium status');
    }
  }

  // Suspend job seeker
  static async suspendJobSeeker(id: string): Promise<JobSeeker> {
    try {
      const response = await apiClient.patch<ApiResponse<JobSeeker>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BY_ID(id)}/suspend`,
        {
          status: 'suspended',
          updated_at: new Date().toISOString()
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to suspend job seeker');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error suspending job seeker:', error);
      throw new Error(error.message || 'Failed to suspend job seeker');
    }
  }

  // Activate job seeker
  static async activateJobSeeker(id: string): Promise<JobSeeker> {
    try {
      const response = await apiClient.patch<ApiResponse<JobSeeker>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BY_ID(id)}/activate`,
        {
          status: STATUS_TYPES.ACTIVE,
          updated_at: new Date().toISOString()
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to activate job seeker');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error activating job seeker:', error);
      throw new Error(error.message || 'Failed to activate job seeker');
    }
  }

  // Delete job seeker
  static async deleteJobSeeker(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        API_ENDPOINTS.JOB_SEEKERS.BY_ID(id)
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete job seeker');
      }
    } catch (error: any) {
      console.error('Error deleting job seeker:', error);
      throw new Error(error.message || 'Failed to delete job seeker');
    }
  }

  // Get top performing job seekers
  static async getTopPerformers(limit: number = 10): Promise<JobSeeker[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobSeeker[]>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BASE}/top-performers?limit=${limit}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch top performers');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching top performers:', error);
      throw new Error(error.message || 'Failed to fetch top performers');
    }
  }

  // Get job seekers by experience level
  static async getJobSeekersByExperience(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, number>>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BASE}/by-experience`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch job seekers by experience');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching job seekers by experience:', error);
      throw new Error(error.message || 'Failed to fetch job seekers by experience');
    }
  }

  // Get job seekers by location
  static async getJobSeekersByLocation(limit: number = 10): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, number>>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BASE}/by-location?limit=${limit}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch job seekers by location');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching job seekers by location:', error);
      throw new Error(error.message || 'Failed to fetch job seekers by location');
    }
  }

  // Get recent job seeker activity
  static async getRecentActivity(limit: number = 10): Promise<JobSeeker[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobSeeker[]>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BASE}/recent-activity?limit=${limit}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch recent activity');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      throw new Error(error.message || 'Failed to fetch recent activity');
    }
  }

  // Search job seekers by skills
  static async searchBySkills(skills: string[]): Promise<JobSeeker[]> {
    try {
      const response = await apiClient.post<ApiResponse<JobSeeker[]>>(
        `${API_ENDPOINTS.JOB_SEEKERS.BASE}/search-by-skills`,
        { skills }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to search job seekers by skills');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error searching job seekers by skills:', error);
      throw new Error(error.message || 'Failed to search job seekers by skills');
    }
  }
}