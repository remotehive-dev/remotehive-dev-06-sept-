'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Flag,
  Clock,
  Building2,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckSquare,
  FileText,
  Globe,
  MapPin,
  DollarSign,
  Star,
  Zap,
  Archive,
  History
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Import our enhanced API services
import {
  advancedWorkflowApi,
  EmployerWithStats,
  EnhancedJobPost,
  WorkflowStatistics,
  WorkflowAction,
  BulkWorkflowAction,
  EmployerSearchParams,
  JobSearchParams,
  WorkflowLog
} from '@/services/api/advanced-workflow-api';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface FilterState {
  search: string;
  employerNumber: string;
  status: string;
  workflowStage: string;
  priority: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SelectedJobs {
  [key: string]: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    published: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-orange-100 text-orange-800',
    closed: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    flagged: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority: number): string => {
  if (priority >= 8) return 'bg-red-100 text-red-800';
  if (priority >= 5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdvancedJobManagementPage() {
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const router = useRouter();
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [employers, setEmployers] = useState<EmployerWithStats[]>([]);
  const [jobs, setJobs] = useState<EnhancedJobPost[]>([]);
  const [statistics, setStatistics] = useState<WorkflowStatistics | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerWithStats | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<SelectedJobs>({});
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [employersLoading, setEmployersLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedJobForAction, setSelectedJobForAction] = useState<EnhancedJobPost | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    employerNumber: '',
    status: '',
    workflowStage: '',
    priority: '',
    dateRange: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  const [workflowAction, setWorkflowAction] = useState<WorkflowAction>({
    action: 'approve',
    reason: '',
    notes: ''
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedJobsCount = useMemo(() => {
    return Object.values(selectedJobs).filter(Boolean).length;
  }, [selectedJobs]);

  const selectedJobIds = useMemo(() => {
    return Object.keys(selectedJobs).filter(id => selectedJobs[id]);
  }, [selectedJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !job.employer_number.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && job.status !== filters.status) return false;
      if (filters.workflowStage && filters.workflowStage !== 'all' && job.workflow_stage !== filters.workflowStage) return false;
      if (filters.priority && filters.priority !== 'all') {
        const priority = parseInt(filters.priority);
        if (priority === 1 && job.admin_priority >= 8) return true;
        if (priority === 2 && job.admin_priority >= 5 && job.admin_priority < 8) return true;
        if (priority === 3 && job.admin_priority < 5) return true;
        return false;
      }
      return true;
    });
  }, [jobs, filters]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchEmployers = async (searchParams: EmployerSearchParams = {}) => {
    try {
      setEmployersLoading(true);
      const response = await advancedWorkflowApi.getEmployersWithStats({
        ...searchParams,
        per_page: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      setEmployers(response.employers || []);
    } catch (error) {
      console.error('Error fetching employers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employers',
        variant: 'destructive',
      });
    } finally {
      setEmployersLoading(false);
    }
  };

  const fetchJobsByEmployer = async (employerNumber: string, searchParams: JobSearchParams = {}) => {
    try {
      setJobsLoading(true);
      const response = await advancedWorkflowApi.getJobsByEmployer(employerNumber, {
        ...searchParams,
        page: currentPage,
        per_page: 20,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      });
      setJobs(response.jobs || []);
      setTotalJobs(response.total || 0);
      setTotalPages(response.pages || 1);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await advancedWorkflowApi.getWorkflowStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchWorkflowHistory = async (jobId: string) => {
    try {
      const response = await advancedWorkflowApi.getJobWorkflowHistory(jobId);
      setWorkflowHistory(response.workflow_history || []);
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workflow history',
        variant: 'destructive',
      });
    }
  };

  // ============================================================================
  // WORKFLOW ACTIONS
  // ============================================================================

  const handleWorkflowAction = async (job: EnhancedJobPost, action: WorkflowAction) => {
    try {
      setActionLoading(true);
      await advancedWorkflowApi.performWorkflowAction(job.id, action);
      
      toast({
        title: 'Success',
        description: `Job ${action.action} successfully`,
      });
      
      // Refresh jobs list
      if (selectedEmployer) {
        await fetchJobsByEmployer(selectedEmployer.employer_number);
      }
      
      setShowWorkflowDialog(false);
      setSelectedJobForAction(null);
    } catch (error) {
      console.error('Error performing workflow action:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action.action} job`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: WorkflowAction) => {
    try {
      setActionLoading(true);
      const bulkAction: BulkWorkflowAction = {
        job_ids: selectedJobIds,
        action
      };
      
      await advancedWorkflowApi.performBulkWorkflowAction(bulkAction);
      
      toast({
        title: 'Success',
        description: `Bulk ${action.action} completed for ${selectedJobsCount} jobs`,
      });
      
      // Clear selections and refresh
      setSelectedJobs({});
      if (selectedEmployer) {
        await fetchJobsByEmployer(selectedEmployer.employer_number);
      }
      
      setShowBulkActionDialog(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: `Failed to perform bulk ${action.action}`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleEmployerSelect = async (employer: EmployerWithStats) => {
    setSelectedEmployer(employer);
    setActiveTab('jobs');
    setCurrentPage(1);
    await fetchJobsByEmployer(employer.employer_number);
  };

  const handleJobSelect = (jobId: string, checked: boolean) => {
    setSelectedJobs(prev => ({
      ...prev,
      [jobId]: checked
    }));
  };

  const handleSelectAllJobs = (checked: boolean) => {
    const newSelection: SelectedJobs = {};
    if (checked) {
      filteredJobs.forEach(job => {
        newSelection[job.id] = true;
      });
    }
    setSelectedJobs(newSelection);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (selectedEmployer) {
      fetchJobsByEmployer(selectedEmployer.employer_number);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchEmployers(),
      fetchStatistics(),
      selectedEmployer ? fetchJobsByEmployer(selectedEmployer.employer_number) : Promise.resolve()
    ]);
  };

  const handleCreateJob = () => {
    router.push('/admin/jobs/create');
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployers(),
        fetchStatistics()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (selectedEmployer && (filters.status || filters.workflowStage)) {
      fetchJobsByEmployer(selectedEmployer.employer_number, {
        status: filters.status || undefined,
        workflow_stage: filters.workflowStage || undefined
      });
    }
  }, [filters.status, filters.workflowStage, selectedEmployer]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatisticsCards = () => {
    if (!statistics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.workflow_stats.total_jobs}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.workflow_stats.pending_approval} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.employer_stats.total_employers}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.employer_stats.verified_employers} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.workflow_stats.approved_today}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.workflow_stats.rejected_today} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest RH Number</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.employer_stats.latest_rh_number}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.employer_stats.new_employers_this_month} new this month
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEmployersList = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employers by name, email, or RH number..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => fetchEmployers()} disabled={employersLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${employersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map((employer) => (
            <Card 
              key={employer.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEmployerSelect(employer)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{employer.company_name}</CardTitle>
                  <Badge variant={employer.is_verified ? 'default' : 'secondary'}>
                    {employer.employer_number}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{employer.company_email}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total Jobs</p>
                    <p className="text-2xl font-bold text-blue-600">{employer.total_jobs}</p>
                  </div>
                  <div>
                    <p className="font-medium">Active Jobs</p>
                    <p className="text-2xl font-bold text-green-600">{employer.active_jobs}</p>
                  </div>
                  <div>
                    <p className="font-medium">Pending</p>
                    <p className="text-lg font-semibold text-yellow-600">{employer.pending_jobs}</p>
                  </div>
                  <div>
                    <p className="font-medium">Verified</p>
                    <p className="text-lg font-semibold">
                      {employer.is_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderJobsList = () => {
    if (!selectedEmployer) {
      return (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Employer Selected</h3>
          <p className="text-gray-500">Select an employer from the overview to view their jobs.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Employer Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedEmployer.company_name}</CardTitle>
                <p className="text-muted-foreground">
                  {selectedEmployer.employer_number} • {selectedEmployer.company_email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedEmployer.is_verified ? 'default' : 'secondary'}>
                  {selectedEmployer.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                >
                  Back to Overview
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.workflowStage} onValueChange={(value) => handleFilterChange('workflowStage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Workflow Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {advancedWorkflowApi.getWorkflowStageOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="1">High (8-10)</SelectItem>
                    <SelectItem value="2">Medium (5-7)</SelectItem>
                    <SelectItem value="3">Low (1-4)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="updated_at">Updated Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="admin_priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                {selectedJobsCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkActionDialog(true)}
                  >
                    Bulk Actions ({selectedJobsCount})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => selectedEmployer && fetchJobsByEmployer(selectedEmployer.employer_number)}
                  disabled={jobsLoading || !selectedEmployer}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${jobsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredJobs.length > 0 && filteredJobs.every(job => selectedJobs[job.id])}
                      onCheckedChange={handleSelectAllJobs}
                    />
                  </TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedJobs[job.id] || false}
                        onCheckedChange={(checked) => handleJobSelect(job.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.job_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {job.workflow_stage.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(job.admin_priority)}>
                        {job.admin_priority >= 8 ? 'High' : job.admin_priority >= 5 ? 'Medium' : 'Low'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.salary_min && job.salary_max ? (
                        <span>
                          {formatCurrency(job.salary_min, job.salary_currency)} - {formatCurrency(job.salary_max, job.salary_currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {job.is_remote ? (
                          <Globe className="h-4 w-4 text-blue-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm">
                          {job.is_remote ? 'Remote' : `${job.location_city}, ${job.location_state}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(job.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedJobForAction(job);
                              setShowWorkflowDialog(true);
                            }}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Workflow Action
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              fetchWorkflowHistory(job.id);
                              setShowHistoryDialog(true);
                            }}
                          >
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Job
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
                <p className="text-gray-500">No jobs match your current filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalJobs)} of {totalJobs} jobs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // DIALOGS
  // ============================================================================

  const renderWorkflowDialog = () => (
    <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Workflow Action</DialogTitle>
          <DialogDescription>
            Perform a workflow action on "{selectedJobForAction?.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="action">Action</label>
            <Select
              value={workflowAction.action}
              onValueChange={(value) => setWorkflowAction(prev => ({ ...prev, action: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {advancedWorkflowApi.getWorkflowActionOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="reason">Reason (Optional)</label>
            <Input
              id="reason"
              value={workflowAction.reason || ''}
              onChange={(e) => setWorkflowAction(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for this action"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="notes">Notes (Optional)</label>
            <Textarea
              id="notes"
              value={workflowAction.notes || ''}
              onChange={(e) => setWorkflowAction(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedJobForAction && handleWorkflowAction(selectedJobForAction, workflowAction)}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Confirm Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderBulkActionDialog = () => (
    <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Workflow Action</DialogTitle>
          <DialogDescription>
            Perform a workflow action on {selectedJobsCount} selected jobs
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="bulk-action">Action</label>
            <Select
              value={workflowAction.action}
              onValueChange={(value) => setWorkflowAction(prev => ({ ...prev, action: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {advancedWorkflowApi.getWorkflowActionOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="bulk-reason">Reason (Optional)</label>
            <Input
              id="bulk-reason"
              value={workflowAction.reason || ''}
              onChange={(e) => setWorkflowAction(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for this action"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="bulk-notes">Notes (Optional)</label>
            <Textarea
              id="bulk-notes"
              value={workflowAction.notes || ''}
              onChange={(e) => setWorkflowAction(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkActionDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleBulkAction(workflowAction)}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : `Apply to ${selectedJobsCount} Jobs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderHistoryDialog = () => (
    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow History</DialogTitle>
          <DialogDescription>
            Complete workflow history for this job
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {workflowHistory.map((log, index) => (
            <div key={log.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className={getStatusColor(log.action)}>
                  {log.action.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(log.created_at)}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Performed by:</strong> {log.performed_by}</p>
                {log.from_status && log.to_status && (
                  <p><strong>Status change:</strong> {log.from_status} → {log.to_status}</p>
                )}
                {log.reason && (
                  <p><strong>Reason:</strong> {log.reason}</p>
                )}
                {log.notes && (
                  <p><strong>Notes:</strong> {log.notes}</p>
                )}
                {log.automated_action && (
                  <Badge variant="outline" className="text-xs">
                    Automated
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {workflowHistory.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No workflow history available</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setShowHistoryDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading advanced job management system...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Job Management</h1>
            <p className="text-muted-foreground">
              Comprehensive job workflow management with RH00 employer integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
            <Button onClick={handleCreateJob}>
              <Upload className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {renderStatisticsCards()}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Employers Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderEmployersList()}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            {renderJobsList()}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Analytics</CardTitle>
                <CardDescription>
                  Detailed analytics and insights for job workflow management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500">Advanced analytics and reporting features will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {renderWorkflowDialog()}
        {renderBulkActionDialog()}
        {renderHistoryDialog()}
      </div>
    </TooltipProvider>
  );
}