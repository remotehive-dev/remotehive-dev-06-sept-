import { apiClient } from '../../lib/api';

// Status types for employers
const STATUS_TYPES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

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
    const {
      page = 1,
      limit = 10,
      status,
      industry,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const filters: Record<string, any> = {};

    if (status) filters.status = status;
    if (industry) filters.industry = industry;

    const response = await apiClient.getItems('employers', {
      filters,
      search,
      sortBy,
      sortOrder,
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return { 
      employers: response.data || [], 
      total: response.total || 0 
    };
  }

  // Get employer by ID
  static async getEmployerById(id: string): Promise<Employer> {
    const response = await apiClient.getItem('employers', id);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error('Employer not found');
    }

    return response.data;
  }

  // Get employer statistics
  static async getEmployerStats(): Promise<EmployerStats> {
    const [totalResponse, pendingResponse, approvedResponse, rejectedResponse, premiumResponse] = await Promise.all([
      apiClient.getCount('employers'),
      apiClient.getCount('employers', { status: STATUS_TYPES.PENDING }),
      apiClient.getCount('employers', { status: STATUS_TYPES.APPROVED }),
      apiClient.getCount('employers', { status: STATUS_TYPES.REJECTED }),
      apiClient.getCount('employers', { is_premium: true })
    ]);

    // Get active employers this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const activeThisMonthResponse = await apiClient.getCount('employers', {
      status: STATUS_TYPES.APPROVED,
      created_at: { $gte: thisMonth.toISOString() }
    });

    return {
      total: totalResponse.data?.count || 0,
      pending: pendingResponse.data?.count || 0,
      approved: approvedResponse.data?.count || 0,
      rejected: rejectedResponse.data?.count || 0,
      premium: premiumResponse.data?.count || 0,
      active_this_month: activeThisMonthResponse.data?.count || 0
    };
  }

  // Approve employer
  static async approveEmployer(id: string, adminId: string): Promise<Employer> {
    const response = await apiClient.updateItem('employers', id, {
      status: STATUS_TYPES.APPROVED,
      approved_at: new Date().toISOString(),
      approved_by: adminId,
      rejection_reason: null
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Reject employer
  static async rejectEmployer(
    id: string,
    adminId: string,
    reason: string
  ): Promise<Employer> {
    const response = await apiClient.updateItem('employers', id, {
      status: STATUS_TYPES.REJECTED,
      approved_by: adminId,
      rejection_reason: reason,
      approved_at: null
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Update employer
  static async updateEmployer(
    id: string,
    data: Partial<Employer>
  ): Promise<Employer> {
    const response = await apiClient.updateItem('employers', id, {
      ...data,
      updated_at: new Date().toISOString()
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Toggle premium status
  static async togglePremium(id: string, isPremium: boolean): Promise<Employer> {
    const updateData: Partial<Employer> = {
      is_premium: isPremium,
      updated_at: new Date().toISOString()
    };

    if (isPremium) {
      // Set premium expiry to 1 year from now
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      updateData.subscription_expires_at = expiryDate.toISOString();
      updateData.subscription_plan = 'premium';
    } else {
      updateData.subscription_expires_at = null;
      updateData.subscription_plan = null;
    }

    const response = await apiClient.updateItem('employers', id, updateData);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Suspend employer
  static async suspendEmployer(id: string, adminId: string): Promise<Employer> {
    const response = await apiClient.updateItem('employers', id, {
      status: STATUS_TYPES.SUSPENDED,
      updated_at: new Date().toISOString(),
      updated_by: adminId
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  // Delete employer
  static async deleteEmployer(id: string): Promise<void> {
    const response = await apiClient.deleteItem('employers', id);

    if (response.error) {
      throw new Error(response.error);
    }
  }

  // Get pending employers
  static async getPendingEmployers(): Promise<Employer[]> {
    const response = await apiClient.getItems('employers', {
      filters: { status: STATUS_TYPES.PENDING },
      sort: { created_at: -1 }
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  // Get industries
  static async getIndustries(): Promise<{ industry: string; count: number }[]> {
    const response = await apiClient.getItems('employers', {
      filters: { status: STATUS_TYPES.APPROVED },
      select: ['industry']
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const employers = response.data || [];

    // Count industries
    const industryCount: { [key: string]: number } = {};
    employers.forEach(employer => {
      if (employer.industry) {
        industryCount[employer.industry] = (industryCount[employer.industry] || 0) + 1;
      }
    });

    return Object.entries(industryCount)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count);
  }
}