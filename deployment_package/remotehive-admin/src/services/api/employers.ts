import { SupabaseService, TABLES, STATUS_TYPES } from './supabase';

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

    const offset = (page - 1) * limit;
    const filters: Record<string, any> = {};

    if (status) filters.status = status;
    if (industry) filters.industry = industry;

    let employers: Employer[];

    if (search) {
      employers = await SupabaseService.search<Employer>(
        TABLES.EMPLOYERS,
        search,
        ['company_name', 'contact_email', 'location'],
        {
          select: `
            *,
            total_job_posts:job_posts(count),
            active_job_posts:job_posts(count).eq(status,active)
          `,
          filters,
          limit
        }
      );
    } else {
      employers = await SupabaseService.read<Employer>(
        TABLES.EMPLOYERS,
        {
          select: `
            *,
            total_job_posts:job_posts(count),
            active_job_posts:job_posts(count).eq(status,active)
          `,
          filters,
          orderBy: { column: sortBy, ascending: sortOrder === 'asc' },
          limit,
          offset
        }
      );
    }

    const total = await SupabaseService.count(TABLES.EMPLOYERS, filters);

    return { employers, total };
  }

  // Get employer by ID
  static async getEmployerById(id: string): Promise<Employer> {
    const employers = await SupabaseService.read<Employer>(
      TABLES.EMPLOYERS,
      {
        select: `
          *,
          total_job_posts:job_posts(count),
          active_job_posts:job_posts(count).eq(status,active),
          user:users(*)
        `,
        filters: { id }
      }
    );

    if (!employers.length) {
      throw new Error('Employer not found');
    }

    return employers[0];
  }

  // Get employer statistics
  static async getEmployerStats(): Promise<EmployerStats> {
    const [total, pending, approved, rejected, premium] = await Promise.all([
      SupabaseService.count(TABLES.EMPLOYERS),
      SupabaseService.count(TABLES.EMPLOYERS, { status: STATUS_TYPES.PENDING }),
      SupabaseService.count(TABLES.EMPLOYERS, { status: STATUS_TYPES.APPROVED }),
      SupabaseService.count(TABLES.EMPLOYERS, { status: STATUS_TYPES.REJECTED }),
      SupabaseService.count(TABLES.EMPLOYERS, { is_premium: true })
    ]);

    // Get active employers this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const active_this_month = await SupabaseService.count(TABLES.EMPLOYERS, {
      status: STATUS_TYPES.APPROVED,
      created_at: `gte.${thisMonth.toISOString()}`
    });

    return {
      total,
      pending,
      approved,
      rejected,
      premium,
      active_this_month
    };
  }

  // Approve employer
  static async approveEmployer(id: string, adminId: string): Promise<Employer> {
    return await SupabaseService.update<Employer>(
      TABLES.EMPLOYERS,
      id,
      {
        status: STATUS_TYPES.APPROVED,
        approved_at: new Date().toISOString(),
        approved_by: adminId,
        rejection_reason: null
      }
    );
  }

  // Reject employer
  static async rejectEmployer(
    id: string,
    adminId: string,
    reason: string
  ): Promise<Employer> {
    return await SupabaseService.update<Employer>(
      TABLES.EMPLOYERS,
      id,
      {
        status: STATUS_TYPES.REJECTED,
        approved_by: adminId,
        rejection_reason: reason,
        approved_at: null
      }
    );
  }

  // Update employer
  static async updateEmployer(
    id: string,
    data: Partial<Employer>
  ): Promise<Employer> {
    return await SupabaseService.update<Employer>(
      TABLES.EMPLOYERS,
      id,
      {
        ...data,
        updated_at: new Date().toISOString()
      }
    );
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

    return await SupabaseService.update<Employer>(
      TABLES.EMPLOYERS,
      id,
      updateData
    );
  }

  // Suspend employer
  static async suspendEmployer(id: string, reason: string): Promise<Employer> {
    return await SupabaseService.update<Employer>(
      TABLES.EMPLOYERS,
      id,
      {
        status: 'suspended',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Delete employer
  static async deleteEmployer(id: string): Promise<void> {
    await SupabaseService.delete(TABLES.EMPLOYERS, id);
  }

  // Get pending employers for approval queue
  static async getPendingEmployers(): Promise<Employer[]> {
    return await SupabaseService.read<Employer>(
      TABLES.EMPLOYERS,
      {
        filters: { status: STATUS_TYPES.PENDING },
        orderBy: { column: 'created_at', ascending: true }
      }
    );
  }

  // Get employer industries for filters
  static async getIndustries(): Promise<string[]> {
    const { data, error } = await SupabaseService.read<{ industry: string }>(
      TABLES.EMPLOYERS,
      {
        select: 'industry',
      }
    );

    if (error) throw error;

    const industries = [...new Set(data.map(item => item.industry))]
      .filter(Boolean)
      .sort();

    return industries;
  }
}