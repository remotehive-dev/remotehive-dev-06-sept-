import { apiClient } from './client';

export interface Employer {
  id: string;
  user_id: string;
  company_name: string;
  company_description?: string;
  company_website?: string;
  company_logo?: string;
  industry: string;
  company_size: string;
  location: string;
  contact_email: string;
  contact_phone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  is_premium: boolean;
  subscription_plan?: string;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  total_job_posts?: number;
  active_job_posts?: number;
  user?: any;
}

export interface EmployerStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  premium: number;
  activeThisMonth: number;
  growthRate: number;
}

export class EmployerApiService {
  // Get all employers with pagination and filters
  static async getEmployers(options: {
    page?: number;
    limit?: number;
    status?: string;
    industry?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ employers: Employer[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);
      if (options.industry) params.append('industry', options.industry);
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sort_by', options.sortBy);
      if (options.sortOrder) params.append('sort_order', options.sortOrder);

      return await apiClient.get<{ employers: Employer[]; total: number }>(
        `/api/v1/employers?${params.toString()}`
      );
    } catch (error) {
      console.error('Error fetching employers:', error);
      return { employers: [], total: 0 };
    }
  }

  // Get employer by ID
  static async getEmployerById(id: string): Promise<Employer> {
    try {
      return await apiClient.get<Employer>(`/api/v1/employers/${id}`);
    } catch (error) {
      console.error('Error fetching employer:', error);
      throw new Error('Employer not found');
    }
  }

  // Get employer statistics
  static async getEmployerStats(): Promise<EmployerStats> {
    try {
      return await apiClient.get<EmployerStats>('/api/v1/employers/stats');
    } catch (error) {
      console.error('Error fetching employer stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        premium: 0,
        activeThisMonth: 0,
        growthRate: 0
      };
    }
  }

  // Approve employer
  static async approveEmployer(id: string, adminId: string): Promise<Employer> {
    try {
      return await apiClient.patch<Employer>(`/api/v1/employers/${id}/approve`, {
        admin_id: adminId
      });
    } catch (error) {
      console.error('Error approving employer:', error);
      throw error;
    }
  }

  // Reject employer
  static async rejectEmployer(
    id: string,
    adminId: string,
    reason: string
  ): Promise<Employer> {
    try {
      return await apiClient.patch<Employer>(`/api/v1/employers/${id}/reject`, {
        admin_id: adminId,
        reason: reason
      });
    } catch (error) {
      console.error('Error rejecting employer:', error);
      throw error;
    }
  }

  // Suspend employer
  static async suspendEmployer(id: string, reason: string): Promise<Employer> {
    try {
      return await apiClient.patch<Employer>(`/api/v1/employers/${id}/suspend`, {
        reason: reason
      });
    } catch (error) {
      console.error('Error suspending employer:', error);
      throw error;
    }
  }

  // Delete employer
  static async deleteEmployer(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/employers/${id}`);
    } catch (error) {
      console.error('Error deleting employer:', error);
      throw error;
    }
  }

  // Get pending employers for approval queue
  static async getPendingEmployers(): Promise<Employer[]> {
    try {
      const result = await this.getEmployers({ status: 'pending', limit: 100 });
      return result.employers;
    } catch (error) {
      console.error('Error fetching pending employers:', error);
      return [];
    }
  }

  // Get employer industries for filters
  static async getIndustries(): Promise<string[]> {
    try {
      return await apiClient.get<string[]>('/api/v1/employers/industries');
    } catch (error) {
      console.error('Error fetching industries:', error);
      return [];
    }
  }

  // Update employer
  static async updateEmployer(id: string, data: Partial<Employer>): Promise<Employer> {
    try {
      return await apiClient.put<Employer>(`/api/v1/employers/${id}`, data);
    } catch (error) {
      console.error('Error updating employer:', error);
      throw error;
    }
  }

  // Create employer
  static async createEmployer(data: Partial<Employer>): Promise<Employer> {
    try {
      return await apiClient.post<Employer>('/api/v1/employers', data);
    } catch (error) {
      console.error('Error creating employer:', error);
      throw error;
    }
  }

  // Search employers
  static async searchEmployers(
    searchTerm: string,
    options: {
      limit?: number;
      filters?: Record<string, any>;
    } = {}
  ): Promise<Employer[]> {
    try {
      const params = new URLSearchParams();
      params.append('search', searchTerm);
      if (options.limit) params.append('limit', options.limit.toString());
      
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const result = await apiClient.get<{ employers: Employer[]; total: number }>(
        `/api/v1/employers/search?${params.toString()}`
      );
      return result.employers;
    } catch (error) {
      console.error('Error searching employers:', error);
      return [];
    }
  }
}