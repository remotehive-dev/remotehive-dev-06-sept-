import { apiClient, ApiResponse, PaginatedResponse } from './base-api';
import { API_ENDPOINTS, STATUS_TYPES, PAGINATION } from './constants';

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
}

export interface EmployerStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  premium: number;
  active_this_month: number;
}

export class EmployerService {
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
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        status,
        industry,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (status) params.append('status', status);
      if (industry) params.append('industry', industry);
      if (search) params.append('search', search);

      const response = await apiClient.get<PaginatedResponse<Employer>>(
        `${API_ENDPOINTS.EMPLOYERS.BASE}?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch employers');
      }

      return {
        employers: response.data.data!,
        total: response.data.total!
      };
    } catch (error: any) {
      console.error('Error fetching employers:', error);
      throw new Error(error.message || 'Failed to fetch employers');
    }
  }

  // Get employer by ID
  static async getEmployerById(id: string): Promise<Employer> {
    try {
      const response = await apiClient.get<ApiResponse<Employer>>(
        API_ENDPOINTS.EMPLOYERS.BY_ID(id)
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Employer not found');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching employer by ID:', error);
      throw new Error(error.message || 'Employer not found');
    }
  }

  // Get employer statistics
  static async getEmployerStats(): Promise<EmployerStats> {
    try {
      const response = await apiClient.get<ApiResponse<EmployerStats>>(
        API_ENDPOINTS.EMPLOYERS.STATS
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch employer stats');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error fetching employer stats:', error);
      throw new Error(error.message || 'Failed to fetch employer stats');
    }
  }

  // Approve employer
  static async approveEmployer(id: string, adminId: string): Promise<Employer> {
    try {
      const response = await apiClient.patch<ApiResponse<Employer>>(
        `${API_ENDPOINTS.EMPLOYERS.BY_ID(id)}/approve`,
        { admin_id: adminId }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to approve employer');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error approving employer:', error);
      throw new Error(error.message || 'Failed to approve employer');
    }
  }

  // Reject employer
  static async rejectEmployer(
    id: string,
    adminId: string,
    reason: string
  ): Promise<Employer> {
    try {
      const response = await apiClient.patch<ApiResponse<Employer>>(
        `${API_ENDPOINTS.EMPLOYERS.BY_ID(id)}/reject`,
        { admin_id: adminId, reason }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reject employer');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error rejecting employer:', error);
      throw new Error(error.message || 'Failed to reject employer');
    }
  }

  // Update employer
  static async updateEmployer(
    id: string,
    data: Partial<Employer>
  ): Promise<Employer> {
    try {
      const response = await apiClient.put<ApiResponse<Employer>>(
        API_ENDPOINTS.EMPLOYERS.BY_ID(id),
        data
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update employer');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error updating employer:', error);
      throw new Error(error.message || 'Failed to update employer');
    }
  }

  // Toggle premium status
  static async togglePremium(id: string, isPremium: boolean): Promise<Employer> {
    try {
      const response = await apiClient.patch<ApiResponse<Employer>>(
        `${API_ENDPOINTS.EMPLOYERS.BY_ID(id)}/premium`,
        { is_premium: isPremium }
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

  // Suspend employer
  static async suspendEmployer(id: string): Promise<Employer> {
    try {
      const response = await apiClient.patch<ApiResponse<Employer>>(
        `${API_ENDPOINTS.EMPLOYERS.BY_ID(id)}/suspend`,
        {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to suspend employer');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Error suspending employer:', error);
      throw new Error(error.message || 'Failed to suspend employer');
    }
  }

  // Delete employer
  static async deleteEmployer(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        API_ENDPOINTS.EMPLOYERS.BY_ID(id)
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete employer');
      }
    } catch (error: any) {
      console.error('Error deleting employer:', error);
      throw new Error(error.message || 'Failed to delete employer');
    }
  }

  // Get pending employers for approval queue
  static async getPendingEmployers(): Promise<Employer[]> {
    try {
      const response = await apiClient.get<ApiResponse<Employer[]>>(
        `${API_ENDPOINTS.EMPLOYERS.BASE}/pending`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch pending employers');
      }

      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching pending employers:', error);
      throw new Error(error.message || 'Failed to fetch pending employers');
    }
  }

  // Get industries
  static async getIndustries(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `${API_ENDPOINTS.EMPLOYERS.BASE}/industries`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch industries');
      }

      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching industries:', error);
      throw new Error(error.message || 'Failed to fetch industries');
    }
  }
}