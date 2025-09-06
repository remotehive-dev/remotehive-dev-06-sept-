import { apiClient } from './client';

// Job Post interfaces
export interface JobPost {
  id: string;
  title: string;
  description: string;
  company_name: string;
  employer_id: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  work_mode: 'remote' | 'hybrid' | 'onsite';
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  skills_required: string[];
  benefits?: string[];
  application_deadline?: string;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'pending';
  is_featured: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface JobPostStats {
  total: number;
  active: number;
  pending: number;
  closed: number;
  featured: number;
  totalViews: number;
  totalApplications: number;
  newThisMonth: number;
  growthRate: number;
}

export interface JobPostFilters {
  search?: string;
  company_name?: string;
  location?: string;
  job_type?: string;
  work_mode?: string;
  experience_level?: string;
  status?: string;
  is_featured?: boolean;
  salary_min?: number;
  salary_max?: number;
  skills?: string[];
  created_after?: string;
  created_before?: string;
  employer_id?: string;
}

export interface JobPostListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: JobPostFilters;
}

export interface JobPostListResponse {
  data: JobPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class JobPostApiService {
  private static client = apiClient;

  /**
   * Get all job posts with pagination and filtering
   */
  static async getJobPosts(params: JobPostListParams = {}): Promise<JobPostListResponse> {
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
      
      const response = await this.client.get<JobPostListResponse>(
        `/api/v1/admin/jobposts?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching job posts:', error);
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
   * Get job post by ID
   */
  static async getJobPostById(id: string): Promise<JobPost | null> {
    try {
      const response = await this.client.get<JobPost>(`/api/v1/admin/jobposts/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching job post:', error);
      return null;
    }
  }

  /**
   * Get job post statistics
   */
  static async getJobPostStats(): Promise<JobPostStats> {
    try {
      const response = await this.client.get<JobPostStats>('/api/v1/admin/jobposts/stats');
      return response;
    } catch (error) {
      console.error('Error fetching job post stats:', error);
      // Return mock data as fallback
      return {
        total: 0,
        active: 0,
        pending: 0,
        closed: 0,
        featured: 0,
        totalViews: 0,
        totalApplications: 0,
        newThisMonth: 0,
        growthRate: 0
      };
    }
  }

  /**
   * Create new job post
   */
  static async createJobPost(data: Omit<JobPost, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'applications_count'>): Promise<JobPost | null> {
    try {
      const response = await this.client.post<JobPost>('/api/v1/admin/jobposts', data);
      return response;
    } catch (error) {
      console.error('Error creating job post:', error);
      return null;
    }
  }

  /**
   * Update job post
   */
  static async updateJobPost(id: string, data: Partial<JobPost>): Promise<JobPost | null> {
    try {
      const response = await this.client.put<JobPost>(`/api/v1/admin/jobposts/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating job post:', error);
      return null;
    }
  }

  /**
   * Delete job post
   */
  static async deleteJobPost(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/admin/jobposts/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting job post:', error);
      return false;
    }
  }

  /**
   * Approve job post
   */
  static async approveJobPost(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/approve`, {});
      return true;
    } catch (error) {
      console.error('Error approving job post:', error);
      return false;
    }
  }

  /**
   * Reject job post
   */
  static async rejectJobPost(id: string, reason?: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/reject`, { reason });
      return true;
    } catch (error) {
      console.error('Error rejecting job post:', error);
      return false;
    }
  }

  /**
   * Feature job post
   */
  static async featureJobPost(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/feature`, {});
      return true;
    } catch (error) {
      console.error('Error featuring job post:', error);
      return false;
    }
  }

  /**
   * Unfeature job post
   */
  static async unfeatureJobPost(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/unfeature`, {});
      return true;
    } catch (error) {
      console.error('Error unfeaturing job post:', error);
      return false;
    }
  }

  /**
   * Pause job post
   */
  static async pauseJobPost(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/pause`, {});
      return true;
    } catch (error) {
      console.error('Error pausing job post:', error);
      return false;
    }
  }

  /**
   * Resume job post
   */
  static async resumeJobPost(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/resume`, {});
      return true;
    } catch (error) {
      console.error('Error resuming job post:', error);
      return false;
    }
  }

  /**
   * Close job post
   */
  static async closeJobPost(id: string): Promise<boolean> {
    try {
      await this.client.patch(`/api/v1/admin/jobposts/${id}/close`, {});
      return true;
    } catch (error) {
      console.error('Error closing job post:', error);
      return false;
    }
  }

  /**
   * Search job posts
   */
  static async searchJobPosts(query: string, limit: number = 10): Promise<JobPost[]> {
    try {
      const response = await this.client.get<JobPost[]>(
        `/api/v1/admin/jobposts/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error searching job posts:', error);
      return [];
    }
  }

  /**
   * Get job posts by employer
   */
  static async getJobPostsByEmployer(employerId: string, params: JobPostListParams = {}): Promise<JobPostListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await this.client.get<JobPostListResponse>(
        `/api/v1/admin/employers/${employerId}/jobposts?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching employer job posts:', error);
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
   * Export job posts data
   */
  static async exportJobPosts(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.client.defaults.baseURL}/api/v1/admin/jobposts/export?format=${format}`, {
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
      console.error('Error exporting job posts:', error);
      return null;
    }
  }

  /**
   * Get trending job posts
   */
  static async getTrendingJobPosts(limit: number = 10): Promise<JobPost[]> {
    try {
      const response = await this.client.get<JobPost[]>(
        `/api/v1/admin/jobposts/trending?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching trending job posts:', error);
      return [];
    }
  }
}