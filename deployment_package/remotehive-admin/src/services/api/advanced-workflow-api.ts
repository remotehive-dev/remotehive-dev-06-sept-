// ============================================================================
// ADVANCED JOB WORKFLOW API SERVICE - Enhanced Admin Management
// RemoteHive - RH00 Employer Integration & Frontend Service
// ============================================================================

import { ApiResponse, PaginatedResponse } from './types';

// ============================================================================
// ENHANCED INTERFACES
// ============================================================================

export interface EmployerWithStats {
  id: string;
  employer_number: string; // RH00 series
  company_name: string;
  company_email: string;
  company_phone?: string;
  company_website?: string;
  company_description?: string;
  company_logo_url?: string;
  company_size?: string;
  industry?: string;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  
  // Job Statistics
  total_jobs: number;
  active_jobs: number;
  pending_jobs: number;
  draft_jobs: number;
  rejected_jobs: number;
  featured_jobs: number;
  avg_views: number;
  avg_applications: number;
  last_job_created?: string;
  first_job_created?: string;
}

export interface EnhancedJobPost {
  id: string;
  employer_id: string;
  employer_number: string; // RH00 series
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  job_type: string;
  work_location: string;
  experience_level: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  skills_required?: string[];
  education_level?: string;
  application_deadline?: string;
  
  // Enhanced Workflow Fields
  status: string;
  priority: string;
  workflow_stage: string;
  auto_publish: boolean;
  scheduled_publish_date?: string;
  expiry_date?: string;
  last_workflow_action?: string;
  workflow_notes?: string;
  admin_priority: number;
  requires_review: boolean;
  review_completed_at?: string;
  review_completed_by?: string;
  
  // Approval Workflow
  submitted_for_approval_at?: string;
  submitted_for_approval_by?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  
  // Publishing Workflow
  published_at?: string;
  published_by?: string;
  unpublished_at?: string;
  unpublished_by?: string;
  unpublish_reason?: string;
  
  // Job Features
  is_featured: boolean;
  is_urgent: boolean;
  is_flagged: boolean;
  flagged_at?: string;
  flagged_by?: string;
  flagged_reason?: string;
  
  // Analytics
  views_count: number;
  applications_count: number;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}

export interface WorkflowAction {
  action: 'approve' | 'reject' | 'publish' | 'unpublish' | 'pause' | 'resume' | 'close' | 'flag' | 'unflag';
  reason?: string;
  notes?: string;
}

export interface BulkWorkflowAction {
  job_ids: string[];
  action: WorkflowAction;
}

export interface EmployerSearchParams {
  search?: string; // Search by company name, email, or RH number
  industry?: string;
  company_size?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  has_active_jobs?: boolean;
  created_after?: string;
  created_before?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface JobSearchParams {
  employer_number?: string;
  status?: string;
  workflow_stage?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface WorkflowStatistics {
  workflow_stats: {
    total_jobs: number;
    pending_approval: number;
    approved_today: number;
    rejected_today: number;
    published_today: number;
    avg_approval_time_hours: number;
  };
  employer_stats: {
    total_employers: number;
    verified_employers: number;
    new_employers_this_month: number;
    latest_rh_number: string;
    active_employers: number;
  };
  workflow_stage_distribution: Array<{
    stage: string;
    count: number;
  }>;
}

export interface WorkflowLog {
  id: string;
  job_post_id: string;
  employer_number: string;
  action: string;
  from_status?: string;
  to_status?: string;
  workflow_stage_before?: string;
  workflow_stage_after?: string;
  performed_by: string;
  reason?: string;
  notes?: string;
  automated_action: boolean;
  created_at: string;
}

export interface JobWithEmployer extends EnhancedJobPost {
  employer: {
    employer_number: string;
    company_name: string;
    company_email: string;
    is_verified: boolean;
  };
}

// ============================================================================
// ADVANCED WORKFLOW API SERVICE
// ============================================================================

class AdvancedWorkflowApiService {
  private baseUrl = '/api/v1/admin/workflow';

  // ============================================================================
  // EMPLOYER MANAGEMENT WITH RH00 SYSTEM
  // ============================================================================

  /**
   * Get all employers with job statistics and RH00 numbers
   */
  async getEmployersWithStats(
    params: EmployerSearchParams = {}
  ): Promise<PaginatedResponse<EmployerWithStats>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/employers?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employers: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get employer details by RH00 series number
   */
  async getEmployerByRhNumber(employerNumber: string): Promise<EmployerWithStats> {
    const response = await fetch(`${this.baseUrl}/employers/${employerNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employer: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // JOB POSTS BY EMPLOYER (RH00 Integration)
  // ============================================================================

  /**
   * Get all job posts for a specific employer by RH00 number
   */
  async getJobsByEmployer(
    employerNumber: string,
    params: JobSearchParams = {}
  ): Promise<{
    jobs: EnhancedJobPost[];
    employer: {
      employer_number: string;
      company_name: string;
      company_email: string;
      is_verified: boolean;
    };
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${this.baseUrl}/employers/${employerNumber}/jobs?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // ENHANCED WORKFLOW ACTIONS
  // ============================================================================

  /**
   * Perform workflow action on a job post
   */
  async performWorkflowAction(
    jobId: string,
    action: WorkflowAction
  ): Promise<ApiResponse<{
    message: string;
    job_id: string;
    new_status: string;
    new_workflow_stage: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/workflow-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      throw new Error(`Failed to perform workflow action: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Perform bulk workflow actions on multiple job posts
   */
  async performBulkWorkflowAction(
    bulkAction: BulkWorkflowAction
  ): Promise<ApiResponse<{
    message: string;
    updated_jobs: Array<{
      job_id: string;
      title: string;
      old_status: string;
      new_status: string;
    }>;
    total_updated: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/jobs/bulk-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(bulkAction),
    });

    if (!response.ok) {
      throw new Error(`Failed to perform bulk action: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // WORKFLOW STATISTICS AND ANALYTICS
  // ============================================================================

  /**
   * Get comprehensive workflow statistics
   */
  async getWorkflowStatistics(): Promise<WorkflowStatistics> {
    const response = await fetch(`${this.baseUrl}/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // AUTOMATED WORKFLOW FUNCTIONS
  // ============================================================================

  /**
   * Manually trigger auto-publishing of scheduled jobs
   */
  async runAutoPublish(): Promise<ApiResponse<{
    message: string;
    published_count: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/automation/publish-scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to run auto-publish: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Manually trigger auto-expiration of jobs
   */
  async runAutoExpire(): Promise<ApiResponse<{
    message: string;
    expired_count: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/automation/expire-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to run auto-expire: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // WORKFLOW HISTORY AND LOGS
  // ============================================================================

  /**
   * Get complete workflow history for a specific job
   */
  async getJobWorkflowHistory(jobId: string): Promise<{
    job_id: string;
    job_title: string;
    employer_number: string;
    current_status: string;
    current_workflow_stage: string;
    workflow_history: WorkflowLog[];
  }> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/workflow-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get workflow history for all jobs of a specific employer
   */
  async getEmployerWorkflowHistory(
    employerNumber: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<{
    employer_number: string;
    company_name: string;
    workflow_history: WorkflowLog[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/employers/${employerNumber}/workflow-history?page=${page}&per_page=${perPage}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch employer workflow history: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Search employers by various criteria
   */
  async searchEmployers(searchTerm: string): Promise<EmployerWithStats[]> {
    const params: EmployerSearchParams = {
      search: searchTerm,
      per_page: 50
    };

    const response = await this.getEmployersWithStats(params);
    return response.employers || [];
  }

  /**
   * Get employers with pending jobs
   */
  async getEmployersWithPendingJobs(): Promise<EmployerWithStats[]> {
    const params: EmployerSearchParams = {
      has_active_jobs: true,
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 100
    };

    const response = await this.getEmployersWithStats(params);
    return response.employers?.filter(emp => emp.pending_jobs > 0) || [];
  }

  /**
   * Get recently created employers
   */
  async getRecentEmployers(days: number = 30): Promise<EmployerWithStats[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const params: EmployerSearchParams = {
      created_after: date.toISOString(),
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 50
    };

    const response = await this.getEmployersWithStats(params);
    return response.employers || [];
  }

  /**
   * Get workflow stage options
   */
  getWorkflowStageOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'pending_approval', label: 'Pending Approval' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'published', label: 'Published' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'closed', label: 'Closed' },
      { value: 'expired', label: 'Expired' },
      { value: 'archived', label: 'Archived' },
      { value: 'flagged', label: 'Flagged' },
      { value: 'cancelled', label: 'Cancelled' }
    ];
  }

  /**
   * Get workflow action options
   */
  getWorkflowActionOptions(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'approve', label: 'Approve', color: 'green' },
      { value: 'reject', label: 'Reject', color: 'red' },
      { value: 'publish', label: 'Publish', color: 'blue' },
      { value: 'unpublish', label: 'Unpublish', color: 'orange' },
      { value: 'pause', label: 'Pause', color: 'yellow' },
      { value: 'resume', label: 'Resume', color: 'green' },
      { value: 'close', label: 'Close', color: 'gray' },
      { value: 'flag', label: 'Flag', color: 'red' },
      { value: 'unflag', label: 'Unflag', color: 'green' }
    ];
  }
}

// Export singleton instance
export const advancedWorkflowApi = new AdvancedWorkflowApiService();
export default advancedWorkflowApi;