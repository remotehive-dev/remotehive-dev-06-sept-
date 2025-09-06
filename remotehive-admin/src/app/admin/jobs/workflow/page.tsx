'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Send,
  Copy,
  Archive,
  Star,
  Flag,
  Globe,
  Target,
  Zap,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  Calendar as CalendarIcon,
  FileText,
  PieChart,
  Activity,
  List,
  Grid,
  X,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  Share2,
  BookmarkPlus,
  MessageSquare,
  Heart,
  ThumbsUp,
  Award,
  Shield,
  Verified,
  Trending,
  Flame,
  Crown,
  Diamond,
  PlayCircle,
  PauseCircle,
  StopCircle,
  FastForward,
  Rewind,
  SkipForward,
  SkipBack,
  History,
  GitBranch,
  Workflow,
  CheckSquare,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { JobPost } from '@/lib/api';
import { JobPostApiService } from '@/services/api/jobposts-api';
import { EmployerApiService, Employer } from '@/services/api/employers-api';
import {
  JobWorkflowApiService,
  JobApprovalAction,
  JobRejectionAction,
  JobPublishAction,
  JobFlagAction,
  WorkflowStats,
  JobWorkflowLog,
} from '@/services/api/job-workflow-api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CompanySelector } from '@/components/ui/company-selector';

// Workflow Status Colors and Icons
const statusConfig = {
  draft: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FileText,
    label: 'Draft',
  },
  pending_approval: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending Approval',
  },
  under_review: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Eye,
    label: 'Under Review',
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved',
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected',
  },
  active: {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: PlayCircle,
    label: 'Active',
  },
  paused: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: PauseCircle,
    label: 'Paused',
  },
  closed: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: StopCircle,
    label: 'Closed',
  },
  expired: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Calendar,
    label: 'Expired',
  },
  flagged: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Flag,
    label: 'Flagged',
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X,
    label: 'Cancelled',
  },
};

// Enhanced Job Card with Workflow Actions
const WorkflowJobCard = ({
  job,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onWorkflowAction,
  onViewHistory,
}: {
  job: JobPost;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onView: (job: JobPost) => void;
  onEdit: (job: JobPost) => void;
  onDelete: (job: JobPost) => void;
  onWorkflowAction: (job: JobPost, action: string) => void;
  onViewHistory: (job: JobPost) => void;
}) => {
  const config = statusConfig[job.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  const getAvailableActions = (status: string) => {
    const actions = [];
    
    switch (status) {
      case 'draft':
        actions.push({ key: 'submit', label: 'Submit for Approval', icon: Send });
        break;
      case 'pending_approval':
      case 'under_review':
        actions.push(
          { key: 'approve', label: 'Approve', icon: CheckCircle },
          { key: 'reject', label: 'Reject', icon: XCircle }
        );
        break;
      case 'approved':
        actions.push(
          { key: 'publish', label: 'Publish', icon: PlayCircle },
          { key: 'reject', label: 'Reject', icon: XCircle }
        );
        break;
      case 'active':
        actions.push(
          { key: 'pause', label: 'Pause', icon: PauseCircle },
          { key: 'close', label: 'Close', icon: StopCircle },
          { key: 'flag', label: 'Flag', icon: Flag },
          { key: 'unpublish', label: 'Unpublish', icon: Rewind }
        );
        break;
      case 'paused':
        actions.push(
          { key: 'resume', label: 'Resume', icon: PlayCircle },
          { key: 'close', label: 'Close', icon: StopCircle }
        );
        break;
      case 'closed':
        actions.push({ key: 'reopen', label: 'Reopen', icon: PlayCircle });
        break;
      case 'flagged':
        actions.push(
          { key: 'unflag', label: 'Unflag', icon: CheckCircle },
          { key: 'review', label: 'Review', icon: Eye }
        );
        break;
    }
    
    return actions;
  };

  const availableActions = getAvailableActions(job.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <Card
        className={`h-full transition-all duration-200 hover:shadow-lg ${
          isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(job.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                  {job.is_featured && <Star className="w-4 h-4 text-yellow-500" />}
                  {job.is_urgent && <Zap className="w-4 h-4 text-red-500" />}
                </div>
                <CardDescription className="flex items-center mt-1">
                  <Building2 className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.company}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`flex items-center space-x-1 ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{config.label}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Job Details */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="truncate">{job.location_city || 'Remote'}</span>
              </div>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                <span className="truncate">{job.job_type}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="truncate">
                  {formatDate(job.created_at)}
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="truncate">
                  {job.salary_min && job.salary_max
                    ? `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`
                    : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.key}
                    size="sm"
                    variant="outline"
                    onClick={() => onWorkflowAction(job, action.key)}
                    className="flex items-center space-x-1"
                  >
                    <ActionIcon className="w-3 h-3" />
                    <span>{action.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Standard Actions */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" onClick={() => onView(job)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(job)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onViewHistory(job)}>
                  <History className="w-4 h-4 mr-1" />
                  History
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(job)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Workflow Statistics Component
const WorkflowStatsCards = ({ stats }: { stats: WorkflowStats | null }) => {
  if (!stats) return null;

  const statItems = [
    { key: 'pending_approval', label: 'Pending Approval', icon: Clock, color: 'text-yellow-600' },
    { key: 'under_review', label: 'Under Review', icon: Eye, color: 'text-blue-600' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
    { key: 'active', label: 'Active', icon: PlayCircle, color: 'text-emerald-600' },
    { key: 'flagged', label: 'Flagged', icon: Flag, color: 'text-red-600' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key] || 0;
        
        return (
          <Card key={item.key} className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-100 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default function AdvancedJobWorkflowPage() {
  const { toast } = useToast();
  
  // Core state
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 12;
  
  // Workflow state
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<JobWorkflowLog[]>([]);
  
  // Dialog states
  const [showWorkflowAction, setShowWorkflowAction] = useState(false);
  const [showWorkflowHistory, setShowWorkflowHistory] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [currentAction, setCurrentAction] = useState<string>('');
  
  // Form states
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);

  // Fetch functions
  const fetchJobs = async () => {
    try {
      setLoading(true);
      let response;
      
      if (activeTab === 'all') {
        const filters = {
          page: currentPage,
          per_page: jobsPerPage,
          ...(searchTerm && { search: searchTerm }),
          ...(filterStatus !== 'all' && { status: filterStatus }),
        };
        response = await JobPostApiService.getJobPosts(filters);
      } else {
        // Fetch jobs by specific status
        const offset = (currentPage - 1) * jobsPerPage;
        response = await JobWorkflowApiService.getJobsByStatus(
          activeTab,
          jobsPerPage,
          offset
        );
      }
      
      if (response.jobs) {
        setJobs(response.jobs);
        setTotalJobs(response.total || 0);
      } else {
        setJobs([]);
        setTotalJobs(0);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowStats = async () => {
    try {
      const stats = await JobWorkflowApiService.getWorkflowStats();
      setWorkflowStats(stats);
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    }
  };

  const fetchWorkflowHistory = async (jobId: string) => {
    try {
      const history = await JobWorkflowApiService.getWorkflowHistory(jobId);
      setWorkflowHistory(history);
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workflow history',
        variant: 'destructive',
      });
    }
  };

  // Event handlers
  const handleSelectJob = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const handleWorkflowAction = (job: JobPost, action: string) => {
    setSelectedJob(job);
    setCurrentAction(action);
    setShowWorkflowAction(true);
    
    // Reset form states
    setActionNotes('');
    setRejectionReason('');
    setPublishImmediately(false);
    setPriority('NORMAL');
    setIsFeatured(false);
    setIsUrgent(false);
    setFlagReason('');
  };

  const handleViewHistory = async (job: JobPost) => {
    setSelectedJob(job);
    await fetchWorkflowHistory(job.id.toString());
    setShowWorkflowHistory(true);
  };

  const executeWorkflowAction = async () => {
    if (!selectedJob) return;
    
    try {
      setIsSubmitting(true);
      let updatedJob: JobPost;
      
      switch (currentAction) {
        case 'submit':
          updatedJob = await JobWorkflowApiService.submitForApproval(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        case 'approve':
          const approvalData: JobApprovalAction = {
            notes: actionNotes,
            publish_immediately: publishImmediately,
          };
          updatedJob = await JobWorkflowApiService.approveJob(
            selectedJob.id.toString(),
            approvalData
          );
          break;
          
        case 'reject':
          const rejectionData: JobRejectionAction = {
            notes: actionNotes,
            rejection_reason: rejectionReason,
          };
          updatedJob = await JobWorkflowApiService.rejectJob(
            selectedJob.id.toString(),
            rejectionData
          );
          break;
          
        case 'publish':
          const publishData: JobPublishAction = {
            notes: actionNotes,
            priority,
            is_featured: isFeatured,
            is_urgent: isUrgent,
          };
          updatedJob = await JobWorkflowApiService.publishJob(
            selectedJob.id.toString(),
            publishData
          );
          break;
          
        case 'unpublish':
          updatedJob = await JobWorkflowApiService.unpublishJob(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        case 'pause':
          updatedJob = await JobWorkflowApiService.pauseJob(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        case 'resume':
          updatedJob = await JobWorkflowApiService.resumeJob(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        case 'close':
          updatedJob = await JobWorkflowApiService.closeJob(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        case 'cancel':
          updatedJob = await JobWorkflowApiService.cancelJob(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        case 'flag':
          const flagData: JobFlagAction = {
            notes: actionNotes,
            reason: flagReason,
          };
          updatedJob = await JobWorkflowApiService.flagJob(
            selectedJob.id.toString(),
            flagData
          );
          break;
          
        case 'unflag':
          updatedJob = await JobWorkflowApiService.unflagJob(
            selectedJob.id.toString(),
            actionNotes
          );
          break;
          
        default:
          throw new Error(`Unknown action: ${currentAction}`);
      }
      
      // Update the job in the list
      setJobs(prev => prev.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      ));
      
      // Refresh stats
      await fetchWorkflowStats();
      
      toast({
        title: 'Success',
        description: `Job ${currentAction} completed successfully`,
      });
      
      setShowWorkflowAction(false);
    } catch (error) {
      console.error(`Error executing ${currentAction}:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${currentAction} job`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchJobs();
  }, [currentPage, activeTab, filterStatus, searchTerm]);

  useEffect(() => {
    fetchWorkflowStats();
  }, []);

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Job Workflow Management</h1>
          <p className="text-muted-foreground">
            Comprehensive job lifecycle management with advanced analytics and bulk operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => fetchJobs()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/admin/jobs'}>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Workflow Statistics */}
      <WorkflowStatsCards stats={workflowStats} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Workflow className="w-5 h-5" />
            <span>Job Workflow Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedJobs.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkActions(true)}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Bulk Actions ({selectedJobs.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="under_review">Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Select All */}
          {jobs.length > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                checked={selectedJobs.length === jobs.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {selectedJobs.length === jobs.length ? 'Deselect all' : 'Select all'}
                {selectedJobs.length > 0 && ` (${selectedJobs.length} selected)`}
              </span>
            </div>
          )}

          {/* Jobs Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Briefcase className="w-12 h-12 text-gray-400" />
                <h3 className="text-lg font-semibold">No jobs found</h3>
                <p className="text-gray-600">No job postings match your current filters.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <WorkflowJobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobs.includes(job.id)}
                  onSelect={handleSelectJob}
                  onView={(job) => console.log('View job:', job)}
                  onEdit={(job) => console.log('Edit job:', job)}
                  onDelete={(job) => console.log('Delete job:', job)}
                  onWorkflowAction={handleWorkflowAction}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workflow Action Dialog */}
      <Dialog open={showWorkflowAction} onOpenChange={setShowWorkflowAction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentAction.charAt(0).toUpperCase() + currentAction.slice(1)} Job
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.title} - {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Common Notes Field */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes for this action..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>

            {/* Action-specific fields */}
            {currentAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate Content</SelectItem>
                    <SelectItem value="INCOMPLETE_INFORMATION">Incomplete Information</SelectItem>
                    <SelectItem value="DUPLICATE_POSTING">Duplicate Posting</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY">Suspicious Activity</SelectItem>
                    <SelectItem value="POLICY_VIOLATION">Policy Violation</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentAction === 'approve' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="publish-immediately"
                  checked={publishImmediately}
                  onCheckedChange={setPublishImmediately}
                />
                <Label htmlFor="publish-immediately">Publish immediately</Label>
              </div>
            )}

            {currentAction === 'publish' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-featured"
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                  <Label htmlFor="is-featured">Featured job</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-urgent"
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                  />
                  <Label htmlFor="is-urgent">Urgent job</Label>
                </div>
              </div>
            )}

            {currentAction === 'flag' && (
              <div>
                <Label htmlFor="flag-reason">Flag Reason</Label>
                <Input
                  id="flag-reason"
                  placeholder="Reason for flagging this job"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowWorkflowAction(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={executeWorkflowAction}
              disabled={isSubmitting || (currentAction === 'reject' && !rejectionReason) || (currentAction === 'flag' && !flagReason)}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow History Dialog */}
      <Dialog open={showWorkflowHistory} onOpenChange={setShowWorkflowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Workflow History</span>
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.title} - {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {workflowHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No workflow history available</p>
            ) : (
              <div className="space-y-4">
                {workflowHistory.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{log.action}</h4>
                        <p className="text-sm text-gray-600">
                          {log.from_status} → {log.to_status}
                        </p>
                        {log.notes && (
                          <p className="text-sm mt-2">{log.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{formatDate(log.performed_at)}</p>
                        <p>by {log.performed_by}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}