import { apiClient } from './client';
import { JobPost } from '@/lib/api';

// Job Workflow Types
export interface JobWorkflowAction {
  notes?: string;
}

export interface JobApprovalAction extends JobWorkflowAction {
  publish_immediately?: boolean;
}

export interface JobRejectionAction extends JobWorkflowAction {
  rejection_reason: string;
}

export interface JobPublishAction extends JobWorkflowAction {
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  is_featured?: boolean;
  is_urgent?: boolean;
}

export interface JobFlagAction extends JobWorkflowAction {
  reason: string;
}

export interface JobWorkflowLog {
  id: string;
  job_post_id: string;
  action: string;
  from_status: string;
  to_status: string;
  performed_by: string;
  performed_at: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStats {
  pending_approval: number;
  under_review: number;
  approved: number;
  rejected: number;
  active: number;
  paused: number;
  closed: number;
  flagged: number;
  cancelled: number;
  expired: number;
  draft: number;
}

/**
 * Job Workflow API Service
 * Handles all job workflow operations including approval, rejection, publishing, etc.
 */
export class JobWorkflowApiService {
  private static client = apiClient;

  // Employer Actions
  
  /**
   * Submit job for approval
   */
  static async submitForApproval(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/submit-for-approval/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error submitting job for approval:', error);
      throw error;
    }
  }

  /**
   * Pause job
   */
  static async pauseJob(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/pause/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error pausing job:', error);
      throw error;
    }
  }

  /**
   * Resume job
   */
  static async resumeJob(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/resume/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error resuming job:', error);
      throw error;
    }
  }

  /**
   * Close job
   */
  static async closeJob(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/close/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error closing job:', error);
      throw error;
    }
  }

  /**
   * Cancel job
   */
  static async cancelJob(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/cancel/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  // Admin Actions

  /**
   * Approve job
   */
  static async approveJob(jobId: string, approvalData: JobApprovalAction): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/admin/approve/${jobId}`,
        approvalData
      );
    } catch (error) {
      console.error('Error approving job:', error);
      throw error;
    }
  }

  /**
   * Reject job
   */
  static async rejectJob(jobId: string, rejectionData: JobRejectionAction): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/admin/reject/${jobId}`,
        rejectionData
      );
    } catch (error) {
      console.error('Error rejecting job:', error);
      throw error;
    }
  }

  /**
   * Publish job
   */
  static async publishJob(jobId: string, publishData: JobPublishAction): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/admin/publish/${jobId}`,
        publishData
      );
    } catch (error) {
      console.error('Error publishing job:', error);
      throw error;
    }
  }

  /**
   * Unpublish job
   */
  static async unpublishJob(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/admin/unpublish/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error unpublishing job:', error);
      throw error;
    }
  }

  /**
   * Flag job
   */
  static async flagJob(jobId: string, flagData: JobFlagAction): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/admin/flag/${jobId}`,
        flagData
      );
    } catch (error) {
      console.error('Error flagging job:', error);
      throw error;
    }
  }

  /**
   * Unflag job
   */
  static async unflagJob(jobId: string, notes?: string): Promise<JobPost> {
    try {
      return await this.client.post<JobPost>(
        `/api/v1/jobs/job-workflow/admin/unflag/${jobId}`,
        { notes }
      );
    } catch (error) {
      console.error('Error unflagging job:', error);
      throw error;
    }
  }

  // Bulk Operations

  /**
   * Bulk approve jobs
   */
  static async bulkApprove(
    jobIds: string[],
    approvalData: JobApprovalAction
  ): Promise<JobPost[]> {
    try {
      return await this.client.post<JobPost[]>(
        '/api/v1/jobs/job-workflow/admin/bulk-approve',
        {
          job_post_ids: jobIds,
          ...approvalData
        }
      );
    } catch (error) {
      console.error('Error bulk approving jobs:', error);
      throw error;
    }
  }

  /**
   * Bulk reject jobs
   */
  static async bulkReject(
    jobIds: string[],
    rejectionData: JobRejectionAction
  ): Promise<JobPost[]> {
    try {
      return await this.client.post<JobPost[]>(
        '/api/v1/jobs/job-workflow/admin/bulk-reject',
        {
          job_post_ids: jobIds,
          ...rejectionData
        }
      );
    } catch (error) {
      console.error('Error bulk rejecting jobs:', error);
      throw error;
    }
  }

  /**
   * Bulk publish jobs
   */
  static async bulkPublish(
    jobIds: string[],
    publishData: JobPublishAction
  ): Promise<JobPost[]> {
    try {
      return await this.client.post<JobPost[]>(
        '/api/v1/jobs/job-workflow/admin/bulk-publish',
        {
          job_post_ids: jobIds,
          ...publishData
        }
      );
    } catch (error) {
      console.error('Error bulk publishing jobs:', error);
      throw error;
    }
  }

  // Query Operations

  /**
   * Get pending approvals
   */
  static async getPendingApprovals(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ jobs: JobPost[]; total: number }> {
    try {
      return await this.client.get<{ jobs: JobPost[]; total: number }>(
        '/api/v1/jobs/job-workflow/admin/pending-approvals',
        { limit, offset }
      );
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  /**
   * Get flagged jobs
   */
  static async getFlaggedJobs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ jobs: JobPost[]; total: number }> {
    try {
      return await this.client.get<{ jobs: JobPost[]; total: number }>(
        '/api/v1/jobs/job-workflow/admin/flagged-jobs',
        { limit, offset }
      );
    } catch (error) {
      console.error('Error fetching flagged jobs:', error);
      throw error;
    }
  }

  /**
   * Get workflow history for a job
   */
  static async getWorkflowHistory(jobId: string): Promise<JobWorkflowLog[]> {
    try {
      return await this.client.get<JobWorkflowLog[]>(
        `/api/v1/jobs/job-workflow/history/${jobId}`
      );
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  static async getWorkflowStats(): Promise<WorkflowStats> {
    try {
      return await this.client.get<WorkflowStats>(
        '/api/v1/jobs/job-workflow/admin/workflow-stats'
      );
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  }

  /**
   * Get jobs by status with pagination
   */
  static async getJobsByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ jobs: JobPost[]; total: number }> {
    try {
      return await this.client.get<{ jobs: JobPost[]; total: number }>(
        '/api/v1/admin/jobposts',
        { status, limit, offset }
      );
    } catch (error) {
      console.error('Error fetching jobs by status:', error);
      throw error;
    }
  }
}

export default JobWorkflowApiService;