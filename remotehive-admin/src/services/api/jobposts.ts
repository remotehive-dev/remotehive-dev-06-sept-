import { SupabaseService, TABLES, STATUS_TYPES } from './supabase';

export interface JobPost {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  salary_range?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  location: string;
  remote_type: 'remote' | 'hybrid' | 'onsite';
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  industry: string;
  skills_required: string[];
  application_deadline?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'expired' | 'filled';
  is_featured: boolean;
  is_urgent: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  flagged_reason?: string;
  is_flagged: boolean;
  employer?: {
    company_name: string;
    company_logo?: string;
    industry: string;
  };
}

export interface JobPostStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  active: number;
  flagged: number;
  urgent: number;
  featured: number;
}

export class JobPostService {
  // Get all job posts with pagination and filters
  static async getJobPosts(options: {
    page?: number;
    limit?: number;
    status?: string;
    employer_id?: string;
    industry?: string;
    remote_type?: string;
    employment_type?: string;
    is_flagged?: boolean;
    is_urgent?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ jobPosts: JobPost[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      employer_id,
      industry,
      remote_type,
      employment_type,
      is_flagged,
      is_urgent,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const filters: Record<string, any> = {};

    if (status) filters.status = status;
    if (employer_id) filters.employer_id = employer_id;
    if (industry) filters.industry = industry;
    if (remote_type) filters.remote_type = remote_type;
    if (employment_type) filters.employment_type = employment_type;
    if (is_flagged !== undefined) filters.is_flagged = is_flagged;
    if (is_urgent !== undefined) filters.is_urgent = is_urgent;

    let jobPosts: JobPost[];

    if (search) {
      jobPosts = await SupabaseService.search<JobPost>(
        TABLES.JOB_POSTS,
        search,
        ['title', 'description', 'location', 'skills_required'],
        {
          select: `
            *,
            employer:employers(
              company_name,
              company_logo,
              industry
            )
          `,
          filters,
          limit
        }
      );
    } else {
      jobPosts = await SupabaseService.read<JobPost>(
        TABLES.JOB_POSTS,
        {
          select: `
            *,
            employer:employers(
              company_name,
              company_logo,
              industry
            )
          `,
          filters,
          orderBy: { column: sortBy, ascending: sortOrder === 'asc' },
          limit,
          offset
        }
      );
    }

    const total = await SupabaseService.count(TABLES.JOB_POSTS, filters);

    return { jobPosts, total };
  }

  // Get job post by ID
  static async getJobPostById(id: string): Promise<JobPost> {
    const jobPosts = await SupabaseService.read<JobPost>(
      TABLES.JOB_POSTS,
      {
        select: `
          *,
          employer:employers(
            company_name,
            company_logo,
            company_website,
            industry,
            location,
            contact_email
          ),
          applications:applications(count)
        `,
        filters: { id }
      }
    );

    if (!jobPosts.length) {
      throw new Error('Job post not found');
    }

    return jobPosts[0];
  }

  // Get job post statistics
  static async getJobPostStats(): Promise<JobPostStats> {
    const [total, pending, approved, rejected, active, flagged, urgent, featured] = await Promise.all([
      SupabaseService.count(TABLES.JOB_POSTS),
      SupabaseService.count(TABLES.JOB_POSTS, { status: STATUS_TYPES.PENDING }),
      SupabaseService.count(TABLES.JOB_POSTS, { status: STATUS_TYPES.APPROVED }),
      SupabaseService.count(TABLES.JOB_POSTS, { status: STATUS_TYPES.REJECTED }),
      SupabaseService.count(TABLES.JOB_POSTS, { status: STATUS_TYPES.ACTIVE }),
      SupabaseService.count(TABLES.JOB_POSTS, { is_flagged: true }),
      SupabaseService.count(TABLES.JOB_POSTS, { is_urgent: true }),
      SupabaseService.count(TABLES.JOB_POSTS, { is_featured: true })
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      active,
      flagged,
      urgent,
      featured
    };
  }

  // Approve job post
  static async approveJobPost(id: string, adminId: string): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        status: STATUS_TYPES.APPROVED,
        approved_at: new Date().toISOString(),
        approved_by: adminId,
        rejection_reason: null,
        published_at: new Date().toISOString()
      }
    );
  }

  // Reject job post
  static async rejectJobPost(
    id: string,
    adminId: string,
    reason: string
  ): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        status: STATUS_TYPES.REJECTED,
        approved_by: adminId,
        rejection_reason: reason,
        approved_at: null
      }
    );
  }

  // Update job post
  static async updateJobPost(
    id: string,
    data: Partial<JobPost>
  ): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        ...data,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Flag job post
  static async flagJobPost(id: string, reason: string): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        is_flagged: true,
        flagged_reason: reason,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Unflag job post
  static async unflagJobPost(id: string): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        is_flagged: false,
        flagged_reason: null,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Toggle featured status
  static async toggleFeatured(id: string, isFeatured: boolean): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        is_featured: isFeatured,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Toggle urgent status
  static async toggleUrgent(id: string, isUrgent: boolean): Promise<JobPost> {
    return await SupabaseService.update<JobPost>(
      TABLES.JOB_POSTS,
      id,
      {
        is_urgent: isUrgent,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Delete job post
  static async deleteJobPost(id: string): Promise<void> {
    await SupabaseService.delete(TABLES.JOB_POSTS, id);
  }

  // Get pending job posts for approval queue
  static async getPendingJobPosts(): Promise<JobPost[]> {
    return await SupabaseService.read<JobPost>(
      TABLES.JOB_POSTS,
      {
        select: `
          *,
          employer:employers(
            company_name,
            company_logo,
            industry
          )
        `,
        filters: { status: STATUS_TYPES.PENDING },
        orderBy: { column: 'created_at', ascending: true }
      }
    );
  }

  // Get flagged job posts
  static async getFlaggedJobPosts(): Promise<JobPost[]> {
    return await SupabaseService.read<JobPost>(
      TABLES.JOB_POSTS,
      {
        select: `
          *,
          employer:employers(
            company_name,
            company_logo,
            industry
          )
        `,
        filters: { is_flagged: true },
        orderBy: { column: 'updated_at', ascending: false }
      }
    );
  }

  // Get urgent job posts
  static async getUrgentJobPosts(): Promise<JobPost[]> {
    return await SupabaseService.read<JobPost>(
      TABLES.JOB_POSTS,
      {
        select: `
          *,
          employer:employers(
            company_name,
            company_logo,
            industry
          )
        `,
        filters: { 
          is_urgent: true,
          status: STATUS_TYPES.ACTIVE
        },
        orderBy: { column: 'created_at', ascending: false }
      }
    );
  }

  // Get job posts by industry
  static async getJobPostsByIndustry(): Promise<Record<string, number>> {
    const { data, error } = await SupabaseService.read<{ industry: string }>(
      TABLES.JOB_POSTS,
      {
        select: 'industry',
        filters: { status: STATUS_TYPES.ACTIVE }
      }
    );

    if (error) throw error;

    const industryCounts: Record<string, number> = {};
    data.forEach(item => {
      if (item.industry) {
        industryCounts[item.industry] = (industryCounts[item.industry] || 0) + 1;
      }
    });

    return industryCounts;
  }

  // Get job posts by remote type
  static async getJobPostsByRemoteType(): Promise<Record<string, number>> {
    const remoteTypes = ['remote', 'hybrid', 'onsite'];
    const counts: Record<string, number> = {};

    for (const type of remoteTypes) {
      counts[type] = await SupabaseService.count(TABLES.JOB_POSTS, {
        remote_type: type,
        status: STATUS_TYPES.ACTIVE
      });
    }

    return counts;
  }

  // Get trending job posts (most viewed/applied)
  static async getTrendingJobPosts(limit: number = 10): Promise<JobPost[]> {
    return await SupabaseService.read<JobPost>(
      TABLES.JOB_POSTS,
      {
        select: `
          *,
          employer:employers(
            company_name,
            company_logo,
            industry
          )
        `,
        filters: { status: STATUS_TYPES.ACTIVE },
        orderBy: { column: 'applications_count', ascending: false },
        limit
      }
    );
  }

  // Create job post (for admin posting on behalf of employer)
  static async createJobPost(data: Omit<JobPost, 'id' | 'created_at' | 'updated_at'>): Promise<JobPost> {
    return await SupabaseService.create<JobPost>(
      TABLES.JOB_POSTS,
      {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
  }

  // Bulk approve job posts
  static async bulkApproveJobPosts(ids: string[], adminId: string): Promise<void> {
    const approvalData = {
      status: STATUS_TYPES.APPROVED,
      approved_at: new Date().toISOString(),
      approved_by: adminId,
      rejection_reason: null,
      published_at: new Date().toISOString()
    };

    for (const id of ids) {
      await SupabaseService.update(TABLES.JOB_POSTS, id, approvalData);
    }
  }

  // Bulk reject job posts
  static async bulkRejectJobPosts(ids: string[], adminId: string, reason: string): Promise<void> {
    const rejectionData = {
      status: STATUS_TYPES.REJECTED,
      approved_by: adminId,
      rejection_reason: reason,
      approved_at: null
    };

    for (const id of ids) {
      await SupabaseService.update(TABLES.JOB_POSTS, id, rejectionData);
    }
  }
}