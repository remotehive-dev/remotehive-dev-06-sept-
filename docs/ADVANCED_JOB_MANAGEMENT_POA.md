# Advanced Job Management System - Plan of Action (POA)

## Current System Analysis

### Existing Database Structure

#### 1. User Management
- **Users Table**: Basic user authentication with roles (job_seeker, employer, admin, super_admin)
- **User ID**: UUID format (36 characters)
- **Roles**: Enum-based role system

#### 2. Employer/Company Structure
- **Employers Table**: Company information linked to users
- **Current ID System**: UUID format (not RH00 series)
- **Fields**: company_name, company_email, company_description, industry, company_size, location, etc.
- **Verification**: is_verified boolean field

#### 3. Job Posts Structure
- **Job Posts Table**: Comprehensive job posting system
- **Workflow Fields**: status, priority, approval timestamps, publishing controls
- **Current Status Values**: draft, pending_approval, approved, active, paused, closed, rejected
- **Workflow Logging**: JobWorkflowLog table for audit trail

### Current Frontend Implementation

#### 1. Admin Job Management Page
- **Location**: `/admin/jobs`
- **Features**: Basic job listing, filtering, search
- **Missing**: Advanced workflow controls, company-based filtering, bulk operations

#### 2. API Services
- **JobPostApiService**: Basic CRUD operations
- **Workflow APIs**: Partial implementation (approve, reject, feature)
- **Missing**: Complete workflow integration, company-based queries

#### 3. Backend APIs
- **Job Workflow Endpoints**: Comprehensive workflow API
- **Employer Management**: Basic employer CRUD
- **Missing**: RH00 ID system, enhanced company management

## Required Enhancements

### 1. Database Restructuring

#### A. Employer Unique ID System (RH00 Series)
```sql
-- Add unique employer number field
ALTER TABLE employers ADD COLUMN employer_number VARCHAR(20) UNIQUE;

-- Create sequence for RH00 series
CREATE SEQUENCE employer_number_seq START 1;

-- Create function to generate RH00 series numbers
CREATE OR REPLACE FUNCTION generate_employer_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_num INTEGER;
    formatted_num VARCHAR(20);
BEGIN
    SELECT nextval('employer_number_seq') INTO next_num;
    formatted_num := 'RH' || LPAD(next_num::TEXT, 4, '0');
    RETURN formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate employer numbers
CREATE OR REPLACE FUNCTION set_employer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employer_number IS NULL THEN
        NEW.employer_number := generate_employer_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employer_number_trigger
    BEFORE INSERT ON employers
    FOR EACH ROW
    EXECUTE FUNCTION set_employer_number();
```

#### B. Enhanced Job Posts Schema
```sql
-- Add missing workflow fields if not present
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS employer_number VARCHAR(20);
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'draft';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_posts_employer_number ON job_posts(employer_number);
CREATE INDEX IF NOT EXISTS idx_job_posts_workflow_stage ON job_posts(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
```

### 2. Frontend Enhancements

#### A. Advanced Job Management Dashboard
- **Company-based filtering**: Filter jobs by employer/company
- **Workflow status indicators**: Visual status badges and progress
- **Bulk operations**: Multi-select with bulk approve/reject/publish
- **Advanced search**: Search by company name, employer number, job details
- **Workflow actions**: One-click approve, reject, publish, unpublish

#### B. Enhanced Job Creation/Editing
- **Company selection**: Dropdown to select employer/company
- **Workflow controls**: Submit for approval, schedule publishing
- **Auto-publish options**: Set automatic publishing after approval
- **Preview mode**: Preview how job will appear on website

#### C. Company Management Integration
- **Employer selector**: Component to search and select employers
- **Company profiles**: Quick view of company information
- **Job statistics**: Per-company job statistics

### 3. Backend API Enhancements

#### A. Enhanced Employer APIs
```python
# Add employer number to responses
# Add search by employer number
# Add company-based job queries
```

#### B. Enhanced Job Workflow APIs
```python
# Add bulk operations
# Add company-based filtering
# Add workflow statistics
# Add auto-publish scheduling
```

### 4. New Features Implementation

#### A. Workflow Dashboard
- **Pending approvals queue**: List of jobs awaiting approval
- **Workflow statistics**: Charts and metrics
- **Recent activity**: Timeline of workflow actions
- **Performance metrics**: Approval times, success rates

#### B. Company Management
- **Add new employers**: Admin can create employer profiles
- **Employer verification**: Verification workflow
- **Company statistics**: Job posting statistics per company
- **Employer communication**: Contact and notification system

#### C. Advanced Job Controls
- **Scheduled publishing**: Set future publish dates
- **Auto-expiry**: Automatic job expiration
- **Job templates**: Reusable job post templates
- **Bulk import/export**: CSV/Excel import/export

## Implementation Phases

### Phase 1: Database Enhancement (Week 1)
1. Add employer_number field and RH00 series generation
2. Update existing employers with RH00 numbers
3. Add missing job workflow fields
4. Create database indexes for performance

### Phase 2: Backend API Enhancement (Week 2)
1. Update employer APIs to include employer_number
2. Enhance job workflow APIs with bulk operations
3. Add company-based filtering to job queries
4. Implement auto-publish scheduling

### Phase 3: Frontend Core Features (Week 3)
1. Enhance admin job management page
2. Add company-based filtering and search
3. Implement workflow status indicators
4. Add bulk operation controls

### Phase 4: Advanced Features (Week 4)
1. Implement workflow dashboard
2. Add company management features
3. Create job creation/editing enhancements
4. Add scheduling and automation features

### Phase 5: Testing and Optimization (Week 5)
1. Comprehensive testing of all features
2. Performance optimization
3. User acceptance testing
4. Documentation and training

## Success Metrics

1. **Workflow Efficiency**: Reduce job approval time by 50%
2. **User Experience**: Improve admin productivity with bulk operations
3. **Data Organization**: All employers have unique RH00 identifiers
4. **System Performance**: Fast filtering and searching by company
5. **Feature Adoption**: 90% of jobs use the new workflow system

## Risk Mitigation

1. **Data Migration**: Backup database before implementing changes
2. **Backward Compatibility**: Ensure existing APIs continue to work
3. **Performance**: Monitor database performance after adding indexes
4. **User Training**: Provide documentation and training for new features
5. **Rollback Plan**: Ability to revert changes if issues arise

## Technical Requirements

### Database
- PostgreSQL with UUID and sequence support
- Proper indexing for performance
- Trigger functions for auto-generation

### Backend
- FastAPI with SQLAlchemy ORM
- Pydantic schemas for validation
- Proper error handling and logging

### Frontend
- React with TypeScript
- Modern UI components (shadcn/ui)
- State management for complex workflows
- Real-time updates for workflow changes

## Conclusion

This POA provides a comprehensive roadmap for implementing an advanced job management workflow system that meets all the specified requirements. The phased approach ensures minimal disruption to existing operations while delivering significant improvements in functionality and user experience.