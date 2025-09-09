import { apiClient } from './client';

// Job Seeker interfaces
export interface JobSeeker {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
  resume_url?: string;
  profile_picture?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface JobSeekerStats {
  total: number;
  active: number;
  verified: number;
  newThisMonth: number;
  growthRate: number;
}

export interface JobSeekerFilters {
  search?: string;
  experience_level?: string;
  location?: string;
  skills?: string[];
  is_active?: boolean;
  is_verified?: boolean;
  created_after?: string;
  created_before?: string;
}

export interface JobSeekerListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: JobSeekerFilters;
}

export interface JobSeekerListResponse {
  data: JobSeeker[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class JobSeekerApiService {
  private static client = apiClient;

  /**
   * Get all job seekers with pagination and filtering
   */
  static async getJobSeekers(params: JobSeekerListParams = {}): Promise<JobSeekerListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(`${key}[]`, v));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const response = await this.client.get<JobSeekerListResponse>(
        `/api/v1/admin/job-seekers?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching job seekers:', error);
      // Return mock data as fallback
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: 0
      };
    }
  }

  /**
   * Get job seeker by ID
   */
  static async getJobSeekerById(id: string): Promise<JobSeeker | null> {
    try {
      const response = await this.client.get<JobSeeker>(`/api/v1/admin/job-seekers/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching job seeker:', error);
      return null;
    }
  }

  /**
   * Get job seeker statistics
   */
  static async getJobSeekerStats(): Promise<JobSeekerStats> {
    try {
      const response = await this.client.get<JobSeekerStats>('/api/v1/admin/job-seekers/stats');
      return response;
    } catch (error) {
      console.error('Error fetching job seeker stats:', error);
      // Return mock data as fallback
      return {
        total: 0,
        active: 0,
        verified: 0,
        newThisMonth: 0,
        growthRate: 0
      };
    }
  }

  /**
   * Update job seeker
   */
  static async updateJobSeeker(id: string, data: Partial<JobSeeker>): Promise<JobSeeker | null> {
    try {
      const response = await this.client.put<JobSeeker>(`/api/v1/admin/job-seekers/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating job seeker:', error);
      return null;
    }
  }

  /**
   * Delete job seeker
   */
  static async deleteJobSeeker(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/admin/job-seekers/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting job seeker:', error);
      return false;
    }
  }

  /**
   * Verify job seeker
   */
  static async verifyJobSeeker(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/job-seekers/${id}/verify`, {});
      return true;
    } catch (error) {
      console.error('Error verifying job seeker:', error);
      return false;
    }
  }

  /**
   * Suspend job seeker
   */
  static async suspendJobSeeker(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/job-seekers/${id}/suspend`, {});
      return true;
    } catch (error) {
      console.error('Error suspending job seeker:', error);
      return false;
    }
  }

  /**
   * Activate job seeker
   */
  static async activateJobSeeker(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/job-seekers/${id}/activate`, {});
      return true;
    } catch (error) {
      console.error('Error activating job seeker:', error);
      return false;
    }
  }

  /**
   * Search job seekers
   */
  static async searchJobSeekers(query: string, limit: number = 10): Promise<JobSeeker[]> {
    try {
      const response = await this.client.get<JobSeeker[]>(
        `/api/v1/admin/job-seekers/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error searching job seekers:', error);
      return [];
    }
  }

  /**
   * Export job seekers data
   */
  static async exportJobSeekers(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.client.defaults.baseURL}/api/v1/admin/job-seekers/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting job seekers:', error);
      return null;
    }
  }
}