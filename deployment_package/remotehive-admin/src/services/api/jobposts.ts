// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
};

// Status types
const STATUS_TYPES = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected',
  ACTIVE: 'active',
  DRAFT: 'draft',
  EXPIRED: 'expired',
  FILLED: 'filled'
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
};

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

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);
    
    if (status) params.append('status', status);
    if (employer_id) params.append('employer_id', employer_id);
    if (industry) params.append('industry', industry);
    if (remote_type) params.append('remote_type', remote_type);
    if (employment_type) params.append('employment_type', employment_type);
    if (is_flagged !== undefined) params.append('is_flagged', is_flagged.toString());
    if (is_urgent !== undefined) params.append('is_urgent', is_urgent.toString());
    if (search) params.append('search', search);

    const response = await apiRequest(`/admin/jobposts?${params}`);
    return {
      jobPosts: response.data || response.jobposts || [],
      total: response.total || 0
    };
  }

  // Get job post by ID
  static async getJobPostById(id: string): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}`);
    return response.data || response;
  }

  // Get job post statistics
  static async getJobPostStats(): Promise<JobPostStats> {
    const response = await apiRequest('/admin/jobposts/stats');
    return response.data || response;
  }

  // Approve job post
  static async approveJobPost(id: string, adminId: string): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({
        approved_by: adminId
      })
    });
    return response.data || response;
  }

  // Reject job post
  static async rejectJobPost(
    id: string,
    adminId: string,
    reason: string
  ): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        approved_by: adminId,
        rejection_reason: reason
      })
    });
    return response.data || response;
  }

  // Update job post
  static async updateJobPost(
    id: string,
    data: Partial<JobPost>
  ): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  // Flag job post
  static async flagJobPost(id: string, reason: string): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}/flag`, {
      method: 'PATCH',
      body: JSON.stringify({
        flagged_reason: reason
      })
    });
    return response.data || response;
  }

  // Unflag job post
  static async unflagJobPost(id: string): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}/unflag`, {
      method: 'PATCH'
    });
    return response.data || response;
  }

  // Toggle featured status
  static async toggleFeatured(id: string, isFeatured: boolean): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_featured: isFeatured
      })
    });
    return response.data || response;
  }

  // Toggle urgent status
  static async toggleUrgent(id: string, isUrgent: boolean): Promise<JobPost> {
    const response = await apiRequest(`/admin/jobposts/${id}/urgent`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_urgent: isUrgent
      })
    });
    return response.data || response;
  }

  // Delete job post
  static async deleteJobPost(id: string): Promise<void> {
    await apiRequest(`/admin/jobposts/${id}`, {
      method: 'DELETE'
    });
  }

  // Get pending job posts for approval queue
  static async getPendingJobPosts(): Promise<JobPost[]> {
    const response = await apiRequest('/admin/jobposts?status=pending&sort_by=created_at&sort_order=asc');
    return response.data || response.jobposts || [];
  }

  // Get flagged job posts
  static async getFlaggedJobPosts(): Promise<JobPost[]> {
    const response = await apiRequest('/admin/jobposts?is_flagged=true&sort_by=updated_at&sort_order=desc');
    return response.data || response.jobposts || [];
  }

  // Get urgent job posts
  static async getUrgentJobPosts(): Promise<JobPost[]> {
    const response = await apiRequest('/admin/jobposts?is_urgent=true&status=active&sort_by=created_at&sort_order=desc');
    return response.data || response.jobposts || [];
  }

  // Get job posts by industry
  static async getJobPostsByIndustry(industry: string): Promise<JobPost[]> {
    const response = await apiRequest(`/admin/jobposts?industry=${encodeURIComponent(industry)}&status=active&sort_by=created_at&sort_order=desc`);
    return response.data || response.jobposts || [];
  }

  // Get job posts by remote type
  static async getJobPostsByRemoteType(remoteType: string): Promise<JobPost[]> {
    const response = await apiRequest(`/admin/jobposts?remote_type=${encodeURIComponent(remoteType)}&status=active&sort_by=created_at&sort_order=desc`);
    return response.data || response.jobposts || [];
  }

  // Get trending job posts (high application count)
  static async getTrendingJobPosts(): Promise<JobPost[]> {
    const response = await apiRequest('/admin/jobposts?status=active&sort_by=application_count&sort_order=desc&limit=20');
    return response.data || response.jobposts || [];
  }

  // Create new job post
  static async createJobPost(data: Omit<JobPost, 'id' | 'created_at' | 'updated_at'>): Promise<JobPost> {
    const response = await apiRequest('/admin/jobposts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  // Bulk approve job posts
  static async bulkApproveJobPosts(ids: string[]): Promise<void> {
    await apiRequest('/admin/jobposts/bulk/approve', {
      method: 'PATCH',
      body: JSON.stringify({ ids })
    });
  }

  // Bulk reject job posts
  static async bulkRejectJobPosts(ids: string[], reason?: string): Promise<void> {
    await apiRequest('/admin/jobposts/bulk/reject', {
      method: 'PATCH',
      body: JSON.stringify({ ids, reason })
    });
  }
}