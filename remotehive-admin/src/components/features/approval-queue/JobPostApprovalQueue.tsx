'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Flag,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  Globe,
  Star,
  Shield,
  Zap,
  TrendingUp,
  FileText,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckSquare,
  X
} from 'lucide-react';
import { GlassCard, StatsCard } from '@/components/ui/advanced/glass-card';
import { DataTable } from '@/components/ui/advanced/data-table';
import { AnimatedModal } from '@/components/ui/advanced/animated-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { JOB_TYPES, EXPERIENCE_LEVELS, REMOTE_TYPES, POPULAR_SKILLS } from '@/lib/constants/admin';

interface JobPostApprovalQueueProps {
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock data for approval queue stats
const approvalStats = {
  pending: 23,
  approved: 156,
  rejected: 12,
  flagged: 5,
  avgApprovalTime: '2.4 hours',
  todayProcessed: 18
};

// Mock data for pending job posts
const mockPendingJobs = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    companyLogo: '/api/placeholder/40/40',
    employerId: 'emp_001',
    employerName: 'John Smith',
    employerEmail: 'john@techcorp.com',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    experienceLevel: 'Senior (5+ years)',
    remoteType: 'Remote',
    salaryRange: '$120,000 - $150,000',
    description: 'We are looking for a Senior React Developer to join our growing team. You will be responsible for developing and maintaining our web applications using React, TypeScript, and modern web technologies.',
    requirements: ['5+ years of React experience', 'TypeScript proficiency', 'Experience with Node.js', 'Strong problem-solving skills'],
    benefits: ['Health insurance', 'Remote work', '401k matching', 'Flexible hours'],
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    submittedAt: new Date('2024-01-20T10:30:00'),
    priority: 'high',
    status: 'pending',
    riskScore: 15,
    autoFlags: [],
    category: 'Technology',
    applicationDeadline: new Date('2024-02-20'),
    isUrgent: false,
    companySize: '50-200 employees',
    industry: 'Technology'
  },
  {
    id: '2',
    title: 'UX/UI Designer',
    company: 'Design Studio Pro',
    companyLogo: '/api/placeholder/40/40',
    employerId: 'emp_002',
    employerName: 'Sarah Johnson',
    employerEmail: 'sarah@designstudio.com',
    location: 'New York, NY',
    jobType: 'Full-time',
    experienceLevel: 'Mid-level (3-5 years)',
    remoteType: 'Hybrid',
    salaryRange: '$80,000 - $100,000',
    description: 'Join our creative team as a UX/UI Designer. You will work on exciting projects for various clients, creating user-centered designs that solve real problems.',
    requirements: ['3+ years of UX/UI design experience', 'Proficiency in Figma and Adobe Creative Suite', 'Strong portfolio', 'Understanding of user research'],
    benefits: ['Creative environment', 'Professional development', 'Health benefits', 'Flexible schedule'],
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
    submittedAt: new Date('2024-01-20T14:15:00'),
    priority: 'medium',
    status: 'pending',
    riskScore: 8,
    autoFlags: [],
    category: 'Design',
    applicationDeadline: new Date('2024-02-15'),
    isUrgent: false,
    companySize: '10-50 employees',
    industry: 'Design'
  },
  {
    id: '3',
    title: 'Make $5000/week working from home!!!',
    company: 'QuickCash Solutions',
    companyLogo: '/api/placeholder/40/40',
    employerId: 'emp_003',
    employerName: 'Mike Scammer',
    employerEmail: 'mike@quickcash.fake',
    location: 'Remote',
    jobType: 'Part-time',
    experienceLevel: 'Entry level',
    remoteType: 'Remote',
    salaryRange: '$260,000+',
    description: 'AMAZING OPPORTUNITY!!! Make thousands of dollars working from home with no experience required! Just send us your personal information and start earning TODAY!!!',
    requirements: ['No experience needed!', 'Must be willing to work hard', 'Send SSN for verification'],
    benefits: ['Work from home', 'Unlimited earning potential', 'No boss'],
    skills: ['Motivation', 'Computer'],
    submittedAt: new Date('2024-01-20T16:45:00'),
    priority: 'low',
    status: 'flagged',
    riskScore: 95,
    autoFlags: ['suspicious_salary', 'spam_keywords', 'suspicious_requirements', 'new_employer'],
    category: 'Other',
    applicationDeadline: new Date('2024-01-25'),
    isUrgent: true,
    companySize: 'Unknown',
    industry: 'Unknown'
  },
  {
    id: '4',
    title: 'Data Scientist',
    company: 'Analytics Pro',
    companyLogo: '/api/placeholder/40/40',
    employerId: 'emp_004',
    employerName: 'Emily Chen',
    employerEmail: 'emily@analyticspro.com',
    location: 'Austin, TX',
    jobType: 'Full-time',
    experienceLevel: 'Senior (5+ years)',
    remoteType: 'Remote',
    salaryRange: '$130,000 - $160,000',
    description: 'We are seeking a talented Data Scientist to join our analytics team. You will work with large datasets to extract insights and build predictive models.',
    requirements: ['PhD or Masters in Data Science/Statistics', '5+ years of experience', 'Python and R proficiency', 'Machine learning expertise'],
    benefits: ['Competitive salary', 'Stock options', 'Health insurance', 'Learning budget'],
    skills: ['Python', 'R', 'Machine Learning', 'SQL'],
    submittedAt: new Date('2024-01-19T09:20:00'),
    priority: 'high',
    status: 'pending',
    riskScore: 12,
    autoFlags: [],
    category: 'Technology',
    applicationDeadline: new Date('2024-02-28'),
    isUrgent: false,
    companySize: '200-500 employees',
    industry: 'Technology'
  }
];

export function JobPostApprovalQueue({ className }: JobPostApprovalQueueProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [approvalModal, setApprovalModal] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const filteredJobs = mockPendingJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.employerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || job.category === categoryFilter;
    const matchesRisk = riskFilter === 'all' || 
                       (riskFilter === 'low' && job.riskScore < 30) ||
                       (riskFilter === 'medium' && job.riskScore >= 30 && job.riskScore < 70) ||
                       (riskFilter === 'high' && job.riskScore >= 70);
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'pending' && job.status === 'pending') ||
                      (selectedTab === 'flagged' && job.status === 'flagged') ||
                      (selectedTab === 'urgent' && job.isUrgent);
    return matchesSearch && matchesPriority && matchesCategory && matchesRisk && matchesTab;
  });

  const handleApprove = (jobId: string, notes?: string) => {
    toast({
      title: 'Job Post Approved',
      description: 'The job post has been approved and is now live.'
    });
    setApprovalModal(false);
    setApprovalNotes('');
  };

  const handleReject = (jobId: string, reason: string) => {
    toast({
      title: 'Job Post Rejected',
      description: 'The job post has been rejected and the employer has been notified.'
    });
    setRejectionModal(false);
    setRejectionReason('');
  };

  const handleFlag = (jobId: string, flagReason: string) => {
    toast({
      title: 'Job Post Flagged',
      description: `Job post flagged for: ${flagReason}`
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore < 30) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low Risk</Badge>;
    } else if (riskScore < 70) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High Risk</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pending</Badge>;
      case 'flagged': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Flagged</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected': return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Rejected</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const jobColumns = [
    {
      key: 'job',
      label: 'Job Details',
      render: (job: any) => (
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={job.companyLogo} alt={job.company} />
            <AvatarFallback>{job.company.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-slate-900 dark:text-white">{job.title}</h3>
              {job.isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{job.company}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-slate-500 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {job.location}
              </span>
              <span className="text-xs text-slate-500 flex items-center">
                <Briefcase className="w-3 h-3 mr-1" />
                {job.jobType}
              </span>
              <span className="text-xs text-slate-500 flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                {job.remoteType}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'employer',
      label: 'Employer',
      render: (job: any) => (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{job.employerName}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{job.employerEmail}</p>
          <p className="text-xs text-slate-500">{job.industry}</p>
        </div>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (job: any) => (
        <div>
          <p className="text-sm text-slate-900 dark:text-white">{job.experienceLevel}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{job.salaryRange}</p>
          <p className="text-xs text-slate-500">Deadline: {job.applicationDeadline.toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'risk',
      label: 'Risk Assessment',
      render: (job: any) => (
        <div className="text-center">
          <div className="mb-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{job.riskScore}%</div>
            {getRiskBadge(job.riskScore)}
          </div>
          {job.autoFlags.length > 0 && (
            <div className="space-y-1">
              {job.autoFlags.slice(0, 2).map((flag: string) => (
                <Badge key={flag} variant="destructive" className="text-xs">
                  {flag.replace('_', ' ')}
                </Badge>
              ))}
              {job.autoFlags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{job.autoFlags.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (job: any) => (
        <div className="text-center">
          <div className="mb-2">
            {getStatusBadge(job.status)}
            {getPriorityBadge(job.priority)}
          </div>
          <p className="text-xs text-slate-500">
            Submitted {job.submittedAt.toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500">
            {job.submittedAt.toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (job: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedJob(job);
              setDetailsModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                setSelectedJob(job);
                setApprovalModal(true);
              }}>
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedJob(job);
                setRejectionModal(true);
              }}>
                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                Reject
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedJob(job);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFlag(job.id, 'manual_review')}>
                <Flag className="w-4 h-4 mr-2 text-yellow-600" />
                Flag for Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Job Post Approval Queue
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Review, approve, and manage job post submissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Zap className="w-4 h-4 mr-2" />
              Bulk Actions
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <StatsCard
          title="Pending Review"
          value={approvalStats.pending}
          change={-5.2}
          trend="down"
          icon={Clock}
          description="Awaiting approval"
          variant="warning"
        />
        <StatsCard
          title="Approved Today"
          value={approvalStats.todayProcessed}
          change={12.3}
          trend="up"
          icon={CheckCircle}
          description="Processed today"
          variant="success"
        />
        <StatsCard
          title="Flagged Posts"
          value={approvalStats.flagged}
          change={-8.1}
          trend="down"
          icon={Flag}
          description="Requires attention"
          variant="danger"
        />
        <StatsCard
          title="Rejected"
          value={approvalStats.rejected}
          change={-15.4}
          trend="down"
          icon={XCircle}
          description="This month"
        />
        <StatsCard
          title="Avg Approval Time"
          value={approvalStats.avgApprovalTime}
          change={-18.2}
          trend="down"
          icon={TrendingUp}
          description="Getting faster"
          variant="success"
        />
        <StatsCard
          title="Total Approved"
          value={approvalStats.approved}
          change={8.7}
          trend="up"
          icon={ThumbsUp}
          description="This month"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending ({approvalStats.pending})</TabsTrigger>
            <TabsTrigger value="flagged">Flagged ({approvalStats.flagged})</TabsTrigger>
            <TabsTrigger value="urgent">Urgent</TabsTrigger>
            <TabsTrigger value="all">All Posts</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search job posts, companies, or employers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk (0-30%)</SelectItem>
                  <SelectItem value="medium">Medium Risk (30-70%)</SelectItem>
                  <SelectItem value="high">High Risk (70%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Job Posts Table */}
          <TabsContent value={selectedTab} className="space-y-6">
            <DataTable
              data={filteredJobs}
              columns={jobColumns}
              searchable={false}
              pagination={true}
              emptyState={{
                title: 'No job posts found',
                description: 'No job posts match your current filters.',
                icon: Briefcase
              }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Job Details Modal */}
      <AnimatedModal
        isOpen={detailsModal}
        onClose={() => setDetailsModal(false)}
        title="Job Post Details"
        size="xl"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedJob.companyLogo} alt={selectedJob.company} />
                  <AvatarFallback>{selectedJob.company.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {selectedJob.title}
                    </h3>
                    {selectedJob.isUrgent && <AlertTriangle className="w-5 h-5 text-red-500" />}
                  </div>
                  <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">{selectedJob.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedJob.location}
                    </span>
                    <span className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {selectedJob.jobType}
                    </span>
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      {selectedJob.remoteType}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {selectedJob.salaryRange}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                {getStatusBadge(selectedJob.status)}
                {getPriorityBadge(selectedJob.priority)}
                {getRiskBadge(selectedJob.riskScore)}
              </div>
            </div>

            {/* Risk Assessment */}
            {selectedJob.autoFlags.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-900 dark:text-red-200">Automated Flags Detected</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.autoFlags.map((flag: string) => (
                    <Badge key={flag} variant="destructive">
                      {flag.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Job Description */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Job Description</h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedJob.description}</p>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Requirements</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedJob.requirements.map((req: string, index: number) => (
                  <li key={index} className="text-slate-700 dark:text-slate-300">{req}</li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {selectedJob.benefits.map((benefit: string) => (
                  <Badge key={benefit} variant="secondary">{benefit}</Badge>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedJob.skills.map((skill: string) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>

            {/* Employer Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Employer Information</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Name: {selectedJob.employerName}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email: {selectedJob.employerEmail}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Company Size: {selectedJob.companySize}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Industry: {selectedJob.industry}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Submission Details</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Submitted: {selectedJob.submittedAt.toLocaleString()}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Deadline: {selectedJob.applicationDeadline.toLocaleDateString()}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Experience: {selectedJob.experienceLevel}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Risk Score: {selectedJob.riskScore}%</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDetailsModal(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => {
                setDetailsModal(false);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => {
                setDetailsModal(false);
                setRejectionModal(true);
              }}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => {
                setDetailsModal(false);
                setApprovalModal(true);
              }}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Approval Modal */}
      <AnimatedModal
        isOpen={approvalModal}
        onClose={() => setApprovalModal(false)}
        title="Approve Job Post"
        size="md"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900 dark:text-green-200">Approve Job Post</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                You are about to approve "{selectedJob.title}" by {selectedJob.company}. This job post will be published and visible to job seekers.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Approval Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setApprovalModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleApprove(selectedJob.id, approvalNotes)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Job Post
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Rejection Modal */}
      <AnimatedModal
        isOpen={rejectionModal}
        onClose={() => setRejectionModal(false)}
        title="Reject Job Post"
        size="md"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-900 dark:text-red-200">Reject Job Post</h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                You are about to reject "{selectedJob.title}" by {selectedJob.company}. The employer will be notified with your reason.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason for rejection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_information">Incomplete Information</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="spam_or_scam">Spam or Scam</SelectItem>
                  <SelectItem value="duplicate_posting">Duplicate Posting</SelectItem>
                  <SelectItem value="unrealistic_requirements">Unrealistic Requirements</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Additional Comments</label>
              <Textarea
                placeholder="Provide additional details about the rejection..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRejectionModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleReject(selectedJob.id, rejectionReason)}
                disabled={!rejectionReason}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Job Post
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Edit Job Modal */}
      <AnimatedModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Job Post"
        size="xl"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <Input defaultValue={selectedJob.title} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input defaultValue={selectedJob.company} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input defaultValue={selectedJob.location} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <Select defaultValue={selectedJob.jobType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <Select defaultValue={selectedJob.experienceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Remote Type</label>
                <Select defaultValue={selectedJob.remoteType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMOTE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Salary Range</label>
              <Input defaultValue={selectedJob.salaryRange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Job Description</label>
              <Textarea defaultValue={selectedJob.description} rows={4} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: 'Success', description: 'Job post updated successfully.' });
                setEditModal(false);
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>
    </motion.div>
  );
}