# Job Workflow Management System

This document describes the comprehensive job workflow management system implemented in RemoteHive, which provides a complete lifecycle management for job posts from creation to publication.

## Overview

The job workflow system provides:
- **State-based job management** with clear transitions
- **Approval workflow** for quality control
- **Publishing controls** for website visibility
- **Audit logging** for all workflow actions
- **Bulk operations** for administrative efficiency
- **Role-based permissions** for security

## Job States

### Primary States

| Status | Description | Who Can Set | Next Possible States |
|--------|-------------|-------------|---------------------|
| `DRAFT` | Initial state when job is created | Employer | `PENDING_APPROVAL`, `CANCELLED` |
| `PENDING_APPROVAL` | Submitted for admin review | Employer | `APPROVED`, `REJECTED`, `UNDER_REVIEW` |
| `UNDER_REVIEW` | Being reviewed by admin | Admin | `APPROVED`, `REJECTED`, `PENDING_APPROVAL` |
| `APPROVED` | Approved by admin, ready to publish | Admin | `ACTIVE`, `REJECTED`, `CANCELLED` |
| `REJECTED` | Rejected by admin | Admin | `PENDING_APPROVAL`, `CANCELLED` |
| `ACTIVE` | Published and visible on website | Admin | `PAUSED`, `CLOSED`, `EXPIRED`, `FLAGGED` |
| `PAUSED` | Temporarily hidden from website | Employer/Admin | `ACTIVE`, `CLOSED`, `CANCELLED` |
| `CLOSED` | Closed by employer/admin | Employer/Admin | `ACTIVE` |
| `EXPIRED` | Automatically expired | System | `ACTIVE` |
| `FLAGGED` | Flagged for review | Admin | `UNDER_REVIEW`, `ACTIVE`, `CANCELLED` |
| `CANCELLED` | Permanently cancelled | Employer/Admin | None (terminal) |

### Additional Job Properties

- **Priority**: `LOW`, `NORMAL`, `HIGH`, `URGENT`
- **Features**: `is_featured`, `is_urgent`, `is_flagged`
- **External Integration**: `external_id`, `external_source`

## Workflow Actions

### Employer Actions

#### Submit for Approval
```http
POST /api/v1/jobs/job-workflow/submit-for-approval/{job_post_id}
```
- **From**: `DRAFT`
- **To**: `PENDING_APPROVAL`
- **Who**: Job owner (employer)
- **Purpose**: Submit job for admin review

#### Pause Job
```http
POST /api/v1/jobs/job-workflow/pause/{job_post_id}
```
- **From**: `ACTIVE`
- **To**: `PAUSED`
- **Who**: Job owner or admin
- **Purpose**: Temporarily hide job from website

#### Resume Job
```http
POST /api/v1/jobs/job-workflow/resume/{job_post_id}
```
- **From**: `PAUSED`
- **To**: `ACTIVE`
- **Who**: Job owner or admin
- **Purpose**: Make paused job visible again

#### Close Job
```http
POST /api/v1/jobs/job-workflow/close/{job_post_id}
```
- **From**: `ACTIVE`, `PAUSED`
- **To**: `CLOSED`
- **Who**: Job owner or admin
- **Purpose**: Close job (can be reopened)

#### Cancel Job
```http
POST /api/v1/jobs/job-workflow/cancel/{job_post_id}
```
- **From**: Any status except `CANCELLED`
- **To**: `CANCELLED`
- **Who**: Job owner or admin
- **Purpose**: Permanently cancel job (terminal)

### Admin Actions

#### Approve Job
```http
POST /api/v1/jobs/job-workflow/admin/approve/{job_post_id}
```
- **From**: `PENDING_APPROVAL`, `UNDER_REVIEW`
- **To**: `APPROVED` or `ACTIVE` (if publish_immediately=true)
- **Who**: Admin only
- **Payload**:
```json
{
  "notes": "Approval notes",
  "publish_immediately": false
}
```

#### Reject Job
```http
POST /api/v1/jobs/job-workflow/admin/reject/{job_post_id}
```
- **From**: `PENDING_APPROVAL`, `UNDER_REVIEW`, `APPROVED`
- **To**: `REJECTED`
- **Who**: Admin only
- **Payload**:
```json
{
  "rejection_reason": "INAPPROPRIATE_CONTENT",
  "notes": "Rejection explanation"
}
```

#### Publish Job
```http
POST /api/v1/jobs/job-workflow/admin/publish/{job_post_id}
```
- **From**: `APPROVED`
- **To**: `ACTIVE`
- **Who**: Admin only
- **Payload**:
```json
{
  "priority": "NORMAL",
  "is_featured": false,
  "is_urgent": false
}
```

#### Unpublish Job
```http
POST /api/v1/jobs/job-workflow/admin/unpublish/{job_post_id}
```
- **From**: `ACTIVE`
- **To**: `APPROVED`
- **Who**: Admin only
- **Purpose**: Remove from website but keep approved

#### Flag Job
```http
POST /api/v1/jobs/job-workflow/admin/flag/{job_post_id}
```
- **From**: Any status
- **To**: `FLAGGED` (if currently `ACTIVE`)
- **Who**: Admin only
- **Payload**:
```json
{
  "reason": "Inappropriate content reported",
  "notes": "Additional details"
}
```

#### Unflag Job
```http
POST /api/v1/jobs/job-workflow/admin/unflag/{job_post_id}
```
- **From**: Any flagged job
- **To**: Previous status or `ACTIVE`
- **Who**: Admin only

### Bulk Operations

#### Bulk Approve
```http
POST /api/v1/jobs/job-workflow/admin/bulk-approve
```
**Payload**:
```json
{
  "job_post_ids": ["job1", "job2", "job3"],
  "notes": "Bulk approval",
  "publish_immediately": false
}
```

#### Bulk Reject
```http
POST /api/v1/jobs/job-workflow/admin/bulk-reject
```

#### Bulk Publish
```http
POST /api/v1/jobs/job-workflow/admin/bulk-publish
```

## Workflow Queries

### Get Pending Approvals
```http
GET /api/v1/jobs/job-workflow/admin/pending-approvals?limit=50&offset=0
```

### Get Flagged Jobs
```http
GET /api/v1/jobs/job-workflow/admin/flagged-jobs?limit=50&offset=0
```

### Get Workflow History
```http
GET /api/v1/jobs/job-workflow/history/{job_post_id}
```

### Get Workflow Statistics
```http
GET /api/v1/jobs/job-workflow/admin/workflow-stats
```
**Response**:
```json
{
  "pending_approval": 15,
  "under_review": 3,
  "approved": 45,
  "rejected": 8,
  "active": 234,
  "paused": 12,
  "closed": 89,
  "flagged": 2,
  "cancelled": 23,
  "expired": 67,
  "draft": 34
}
```

## Database Schema

### JobPost Table Updates

New fields added to support workflow:

```sql
-- Workflow status and priority
status VARCHAR(50) DEFAULT 'draft',
priority VARCHAR(20) DEFAULT 'normal',

-- Approval workflow
submitted_for_approval_at TIMESTAMP,
submitted_by VARCHAR(36),
approved_at TIMESTAMP,
approved_by VARCHAR(36),
rejected_at TIMESTAMP,
rejected_by VARCHAR(36),
rejection_reason VARCHAR(100),
rejection_notes TEXT,

-- Publishing workflow
published_at TIMESTAMP,
published_by VARCHAR(36),
unpublished_at TIMESTAMP,
unpublished_by VARCHAR(36),

-- Job features
is_urgent BOOLEAN DEFAULT FALSE,
is_flagged BOOLEAN DEFAULT FALSE,
flagged_at TIMESTAMP,
flagged_by VARCHAR(36),
flagged_reason VARCHAR(255),

-- External integration
external_id VARCHAR(255),
external_source VARCHAR(100)
```

### JobWorkflowLog Table

Audit log for all workflow actions:

```sql
CREATE TABLE job_workflow_logs (
    id VARCHAR(36) PRIMARY KEY,
    job_post_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    performed_by VARCHAR(36),
    reason VARCHAR(255),
    notes TEXT,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

## Permission System

### Role-Based Access Control

| Action | Employer (Owner) | Employer (Other) | Admin | Super Admin |
|--------|------------------|------------------|-------|-------------|
| Create Job | ✅ | ❌ | ✅ | ✅ |
| Submit for Approval | ✅ | ❌ | ✅ | ✅ |
| Approve/Reject | ❌ | ❌ | ✅ | ✅ |
| Publish/Unpublish | ❌ | ❌ | ✅ | ✅ |
| Pause/Resume | ✅ | ❌ | ✅ | ✅ |
| Close | ✅ | ❌ | ✅ | ✅ |
| Cancel | ✅ | ❌ | ✅ | ✅ |
| Flag/Unflag | ❌ | ❌ | ✅ | ✅ |
| View History | ✅ | ❌ | ✅ | ✅ |
| Bulk Operations | ❌ | ❌ | ✅ | ✅ |

## Integration Points

### Frontend Integration

1. **Job Creation Form**: Set initial status to `DRAFT`
2. **Employer Dashboard**: Show job status and available actions
3. **Admin Panel**: Approval queue, bulk operations, statistics
4. **Public Website**: Only show `ACTIVE` jobs

### Notification System

- **Job Submitted**: Notify admins when job submitted for approval
- **Job Approved**: Notify employer when job approved
- **Job Rejected**: Notify employer with rejection reason
- **Job Published**: Notify employer when job goes live
- **Job Flagged**: Notify relevant parties

### Analytics Integration

- Track workflow conversion rates
- Monitor approval times
- Identify common rejection reasons
- Measure time-to-publish metrics

## Error Handling

All workflow operations include comprehensive error handling:

- **Invalid State Transitions**: HTTP 400 with clear error message
- **Permission Denied**: HTTP 403 with role requirements
- **Resource Not Found**: HTTP 404 for non-existent jobs
- **Server Errors**: HTTP 500 with logged details

## Migration Guide

### Database Migration

1. Run the migration script:
```bash
cd d:\Remotehive
python -m alembic upgrade head
```

2. Update existing jobs:
```sql
-- Set default status for existing jobs
UPDATE job_posts SET status = 'active' WHERE status IS NULL;
```

### API Integration

1. Update frontend to use new workflow endpoints
2. Implement status-based UI components
3. Add admin workflow management interface
4. Update job listing to filter by `ACTIVE` status

## Monitoring and Maintenance

### Key Metrics to Monitor

- Jobs pending approval (should not accumulate)
- Average approval time
- Rejection rate and reasons
- Workflow action frequency
- System performance under load

### Regular Maintenance

- Archive old workflow logs (>1 year)
- Monitor for stuck jobs in workflow
- Review and update rejection reasons
- Optimize database indexes for workflow queries

## Troubleshooting

### Common Issues

1. **Jobs Stuck in Pending**: Check admin notification system
2. **Permission Errors**: Verify user roles and job ownership
3. **Invalid Transitions**: Review state transition rules
4. **Performance Issues**: Check database indexes and query optimization

### Debug Endpoints

```http
# Get detailed job status
GET /api/v1/jobs/{job_id}

# Get workflow history
GET /api/v1/jobs/job-workflow/history/{job_id}

# Get system statistics
GET /api/v1/jobs/job-workflow/admin/workflow-stats
```

This comprehensive workflow system ensures quality control, proper authorization, and complete audit trails for all job management operations in the RemoteHive platform.