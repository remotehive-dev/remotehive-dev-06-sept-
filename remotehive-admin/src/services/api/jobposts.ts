import { apiClient, ApiResponse, PaginatedResponse } from '../../lib/api-client';

// Status constants
const STATUS_TYPES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  DRAFT: 'draft',
  EXPIRED: 'expired',
  FILLED: 'filled'
} as const;

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

    const filters: Record<string, any> = {};

    if (status) filters.status = status;
    if (employer_id) filters.employer_id = employer_id;
    if (industry) filters.industry = industry;
    if (remote_type) filters.remote_type = remote_type;
    if (employment_type) filters.employment_type = employment_type;
    if (is_flagged !== undefined) filters.is_flagged = is_flagged;
    if (is_urgent !== undefined) filters.is_urgent = is_urgent;

    const response = await apiClient.getItems<JobPost>('job_posts', {
      filters,
      search,
      searchColumns: search ? ['title', 'description', 'location', 'skills_required'] : undefined,
      sortBy,
      sortOrder,
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch job posts');
    }

    return {
      jobPosts: response.data?.items || [],
      total: response.data?.total || 0
    };
  }

  // Get job post by ID
  static async getJobPostById(id: string): Promise<JobPost> {
    const response = await apiClient.getItem<JobPost>('job_posts', id);

    if (response.error) {
      throw new Error(response.error.message || 'Job post not found');
    }

    if (!response.data) {
      throw new Error('Job post not found');
    }

    return response.data;
  }

  // Get job post statistics
  static async getJobPostStats(): Promise<JobPostStats> {
    const [totalRes, pendingRes, approvedRes, rejectedRes, activeRes, flaggedRes, urgentRes, featuredRes] = await Promise.all([
      apiClient.getCount('job_posts'),
      apiClient.getCount('job_posts', { status: STATUS_TYPES.PENDING }),
      apiClient.getCount('job_posts', { status: STATUS_TYPES.APPROVED }),
      apiClient.getCount('job_posts', { status: STATUS_TYPES.REJECTED }),
      apiClient.getCount('job_posts', { status: STATUS_TYPES.ACTIVE }),
      apiClient.getCount('job_posts', { is_flagged: true }),
      apiClient.getCount('job_posts', { is_urgent: true }),
      apiClient.getCount('job_posts', { is_featured: true })
    ]);

    return {
      total: totalRes.data?.count || 0,
      pending: pendingRes.data?.count || 0,
      approved: approvedRes.data?.count || 0,
      rejected: rejectedRes.data?.count || 0,
      active: activeRes.data?.count || 0,
      flagged: flaggedRes.data?.count || 0,
      urgent: urgentRes.data?.count || 0,
      featured: featuredRes.data?.count || 0
    };
  }

  // Approve job post
  static async approveJobPost(id: string, adminId: string): Promise<JobPost> {
    const response = await apiClient.approveJobPost(id);
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to approve job post');
    }

    return response.data!;
  }

  // Reject job post
  static async rejectJobPost(
    id: string,
    adminId: string,
    reason: string
  ): Promise<JobPost> {
    const response = await apiClient.rejectJobPost(id, reason);
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to reject job post');
    }

    return response.data!;
  }

  // Update job post
  static async updateJobPost(
    id: string,
    data: Partial<JobPost>
  ): Promise<JobPost> {
    const response = await apiClient.updateItem<JobPost>('job_posts', id, {
      ...data,
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to update job post');
    }

    return response.data!;
  }

  // Flag job post
  static async flagJobPost(id: string, reason: string): Promise<JobPost> {
    const response = await apiClient.updateItem<JobPost>('job_posts', id, {
      is_flagged: true,
      flagged_reason: reason,
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to flag job post');
    }

    return response.data!;
  }

  // Unflag job post
  static async unflagJobPost(id: string): Promise<JobPost> {
    const response = await apiClient.updateItem<JobPost>('job_posts', id, {
      is_flagged: false,
      flagged_reason: null,
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to unflag job post');
    }

    return response.data!;
  }

  // Toggle featured status
  static async toggleFeatured(id: string, isFeatured: boolean): Promise<JobPost> {
    const response = await apiClient.updateItem<JobPost>('job_posts', id, {
      is_featured: isFeatured,
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to toggle featured status');
    }

    return response.data!;
  }

  // Toggle urgent status
  static async toggleUrgent(id: string, isUrgent: boolean): Promise<JobPost> {
    const response = await apiClient.updateItem<JobPost>('job_posts', id, {
      is_urgent: isUrgent,
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to toggle urgent status');
    }

    return response.data!;
  }

  // Delete job post
  static async deleteJobPost(id: string): Promise<void> {
    const response = await apiClient.deleteItem('job_posts', id);
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to delete job post');
    }
  }

  // Get pending job posts
  static async getPendingJobPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<{ jobPosts: JobPost[]; total: number }> {
    const response = await apiClient.getItems<JobPost>('job_posts', {
      filters: { status: STATUS_TYPES.PENDING },
      sortBy: 'created_at',
      sortOrder: 'asc',
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch pending job posts');
    }

    return {
      jobPosts: response.data?.items || [],
      total: response.data?.total || 0
    };
  }

  // Get flagged job posts
  static async getFlaggedJobPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<{ jobPosts: JobPost[]; total: number }> {
    const response = await apiClient.getItems<JobPost>('job_posts', {
      filters: { is_flagged: true },
      sortBy: 'updated_at',
      sortOrder: 'desc',
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch flagged job posts');
    }

    return {
      jobPosts: response.data?.items || [],
      total: response.data?.total || 0
    };
  }

  // Get urgent job posts
  static async getUrgentJobPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<{ jobPosts: JobPost[]; total: number }> {
    const response = await apiClient.getItems<JobPost>('job_posts', {
      filters: { 
        is_urgent: true,
        status: STATUS_TYPES.ACTIVE
      },
      sortBy: 'created_at',
      sortOrder: 'desc',
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch urgent job posts');
    }

    return {
      jobPosts: response.data?.items || [],
      total: response.data?.total || 0
    };
  }

  // Get job posts by industry
  static async getJobPostsByIndustry(): Promise<Record<string, number>> {
    const response = await apiClient.getItems<{ industry: string }>('job_posts', {
      filters: { status: STATUS_TYPES.ACTIVE },
      fields: ['industry']
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch job posts by industry');
    }

    const industryCounts: Record<string, number> = {};
    const data = response.data || [];
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
      const response = await apiClient.getCount('job_posts', {
        remote_type: type,
        status: STATUS_TYPES.ACTIVE
      });
      
      if (response.error) {
        throw new Error(response.error.message || `Failed to count ${type} job posts`);
      }
      
      counts[type] = response.data?.count || 0;
    }

    return counts;
  }

  // Get trending job posts (most viewed/applied)
  static async getTrendingJobPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<{ jobPosts: JobPost[]; total: number }> {
    const response = await apiClient.getItems<JobPost>('job_posts', {
      filters: { status: STATUS_TYPES.ACTIVE },
      sort: { applications_count: 'desc' },
      page,
      limit
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch trending job posts');
    }

    return {
      jobPosts: response.data || [],
      total: response.total || 0
    };
  }

  // Create job post (for admin posting on behalf of employer)
  static async createJobPost(data: Omit<JobPost, 'id' | 'created_at' | 'updated_at'>): Promise<JobPost> {
    const response = await apiClient.createItem<JobPost>('job_posts', {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to create job post');
    }

    return response.data!;
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
      const response = await apiClient.updateItem('job_posts', id, approvalData);
      if (response.error) {
        throw new Error(response.error.message || `Failed to approve job post ${id}`);
      }
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
      const response = await apiClient.updateItem('job_posts', id, rejectionData);
      if (response.error) {
        throw new Error(response.error.message || `Failed to reject job post ${id}`);
      }
    }
  }
}