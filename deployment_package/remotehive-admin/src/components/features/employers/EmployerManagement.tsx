'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MapPin,
  Users,
  Briefcase,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Settings,
  Shield,
  Crown
} from 'lucide-react';
import { GlassCard, StatsCard } from '@/components/ui/advanced/glass-card';
import { DataTable } from '@/components/ui/advanced/data-table';
import { AnimatedModal } from '@/components/ui/advanced/animated-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { EMPLOYER_STATUS, COMPANY_SIZES, INDUSTRIES } from '@/lib/constants/admin';

interface EmployerManagementProps {
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

// Mock data for employers
const employerStats = {
  total: 89,
  active: 67,
  pending: 12,
  suspended: 8,
  premium: 23,
  growth: 12.5
};

const mockEmployers = [
  {
    id: '1',
    companyName: 'TechCorp Inc.',
    contactPerson: 'John Smith',
    email: 'john@techcorp.com',
    phone: '+1-555-0123',
    website: 'https://techcorp.com',
    industry: 'Technology',
    companySize: '51-200',
    location: 'San Francisco, CA',
    status: 'active',
    isPremium: true,
    joinedAt: new Date('2024-01-15'),
    lastActive: new Date('2024-01-20'),
    jobPosts: 15,
    totalHires: 8,
    rating: 4.8,
    logo: '/api/placeholder/40/40',
    description: 'Leading technology company specializing in AI and machine learning solutions.'
  },
  {
    id: '2',
    companyName: 'StartupXYZ',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@startupxyz.com',
    phone: '+1-555-0124',
    website: 'https://startupxyz.com',
    industry: 'Fintech',
    companySize: '11-50',
    location: 'New York, NY',
    status: 'pending',
    isPremium: false,
    joinedAt: new Date('2024-01-18'),
    lastActive: new Date('2024-01-19'),
    jobPosts: 3,
    totalHires: 1,
    rating: 4.2,
    logo: '/api/placeholder/40/40',
    description: 'Innovative fintech startup revolutionizing digital payments.'
  },
  {
    id: '3',
    companyName: 'InnovateLab',
    contactPerson: 'Mike Chen',
    email: 'mike@innovatelab.com',
    phone: '+1-555-0125',
    website: 'https://innovatelab.com',
    industry: 'Healthcare',
    companySize: '201-500',
    location: 'Boston, MA',
    status: 'active',
    isPremium: true,
    joinedAt: new Date('2023-12-10'),
    lastActive: new Date('2024-01-20'),
    jobPosts: 22,
    totalHires: 12,
    rating: 4.9,
    logo: '/api/placeholder/40/40',
    description: 'Healthcare innovation lab developing cutting-edge medical technologies.'
  },
  {
    id: '4',
    companyName: 'GreenTech Solutions',
    contactPerson: 'Emily Davis',
    email: 'emily@greentech.com',
    phone: '+1-555-0126',
    website: 'https://greentech.com',
    industry: 'Clean Energy',
    companySize: '51-200',
    location: 'Austin, TX',
    status: 'suspended',
    isPremium: false,
    joinedAt: new Date('2024-01-05'),
    lastActive: new Date('2024-01-15'),
    jobPosts: 7,
    totalHires: 2,
    rating: 3.8,
    logo: '/api/placeholder/40/40',
    description: 'Sustainable technology company focused on renewable energy solutions.'
  }
];

export function EmployerManagement({ className }: EmployerManagementProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedEmployer, setSelectedEmployer] = useState<any>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [createJobModal, setCreateJobModal] = useState(false);

  const filteredEmployers = mockEmployers.filter(employer => {
    const matchesSearch = employer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || employer.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || employer.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const handleStatusChange = (employerId: string, newStatus: string) => {
    toast({
      title: 'Status Updated',
      description: `Employer status changed to ${newStatus}.`
    });
  };

  const handlePremiumToggle = (employerId: string, isPremium: boolean) => {
    toast({
      title: isPremium ? 'Premium Activated' : 'Premium Deactivated',
      description: `Premium access has been ${isPremium ? 'granted' : 'removed'}.`
    });
  };

  const handleCreateJob = (employerId: string) => {
    setSelectedEmployer(mockEmployers.find(e => e.id === employerId));
    setCreateJobModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Suspended</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const employerColumns = [
    {
      key: 'company',
      label: 'Company',
      render: (employer: any) => (
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={employer.logo} alt={employer.companyName} />
            <AvatarFallback>{employer.companyName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-slate-900 dark:text-white">{employer.companyName}</p>
              {employer.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{employer.contactPerson}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (employer: any) => (
        <div>
          <p className="text-sm text-slate-900 dark:text-white">{employer.email}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{employer.phone}</p>
        </div>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (employer: any) => (
        <div>
          <p className="text-sm text-slate-900 dark:text-white">{employer.industry}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{employer.companySize} employees</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {employer.location}
          </p>
        </div>
      )
    },
    {
      key: 'stats',
      label: 'Stats',
      render: (employer: any) => (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{employer.jobPosts}</p>
              <p className="text-slate-600 dark:text-slate-400">Jobs</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{employer.totalHires}</p>
              <p className="text-slate-600 dark:text-slate-400">Hires</p>
            </div>
          </div>
          <div className="flex items-center justify-center mt-1">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">{employer.rating}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (employer: any) => (
        <div className="text-center">
          {getStatusBadge(employer.status)}
          <p className="text-xs text-slate-500 mt-1">
            Joined {employer.joinedAt.toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (employer: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedEmployer(employer);
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
                setSelectedEmployer(employer);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateJob(employer.id)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Job Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePremiumToggle(employer.id, !employer.isPremium)}>
                <Crown className="w-4 h-4 mr-2" />
                {employer.isPremium ? 'Remove Premium' : 'Grant Premium'}
              </DropdownMenuItem>
              {employer.status === 'active' ? (
                <DropdownMenuItem onClick={() => handleStatusChange(employer.id, 'suspended')}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleStatusChange(employer.id, 'active')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </DropdownMenuItem>
              )}
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
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Employer Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage employer accounts, approvals, and premium access
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Employer
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="Total Employers"
          value={employerStats.total}
          change={employerStats.growth}
          trend="up"
          icon={Building2}
          description="Registered companies"
        />
        <StatsCard
          title="Active"
          value={employerStats.active}
          change={5.2}
          trend="up"
          icon={CheckCircle}
          description="Currently active"
          variant="success"
        />
        <StatsCard
          title="Pending"
          value={employerStats.pending}
          change={-2}
          trend="down"
          icon={Clock}
          description="Awaiting approval"
          variant="warning"
        />
        <StatsCard
          title="Suspended"
          value={employerStats.suspended}
          change={1}
          trend="up"
          icon={XCircle}
          description="Temporarily suspended"
          variant="error"
        />
        <StatsCard
          title="Premium"
          value={employerStats.premium}
          change={8.3}
          trend="up"
          icon={Crown}
          description="Premium subscribers"
          variant="premium"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Employer List</TabsTrigger>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Employer List Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search employers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </GlassCard>

            {/* Employers Table */}
            <DataTable
              data={filteredEmployers}
              columns={employerColumns}
              searchable={false}
              pagination={true}
              emptyState={{
                title: 'No employers found',
                description: 'No employers match your current filters.',
                icon: Building2
              }}
            />
          </TabsContent>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pending Employer Approvals
                </h3>
                <Badge variant="destructive">{mockEmployers.filter(e => e.status === 'pending').length}</Badge>
              </div>
              <div className="space-y-4">
                {mockEmployers.filter(e => e.status === 'pending').map((employer) => (
                  <div key={employer.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={employer.logo} alt={employer.companyName} />
                          <AvatarFallback>{employer.companyName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {employer.companyName}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {employer.contactPerson} • {employer.email}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {employer.industry} • {employer.companySize} employees
                          </p>
                          <p className="text-xs text-slate-500">
                            Applied: {employer.joinedAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEmployer(employer);
                            setDetailsModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(employer.id, 'active')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(employer.id, 'suspended')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Industry Distribution
                </h3>
                <div className="space-y-3">
                  {['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'].map((industry, index) => (
                    <div key={industry} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{industry}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            style={{ width: `${(5 - index) * 20}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(5 - index) * 4}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Company Size Distribution
                </h3>
                <div className="space-y-3">
                  {COMPANY_SIZES.map((size, index) => (
                    <div key={size} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{size}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full"
                            style={{ width: `${Math.random() * 80 + 20}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{Math.floor(Math.random() * 20 + 5)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Employer Details Modal */}
      <AnimatedModal
        isOpen={detailsModal}
        onClose={() => setDetailsModal(false)}
        title="Employer Details"
        size="xl"
      >
        {selectedEmployer && (
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={selectedEmployer.logo} alt={selectedEmployer.companyName} />
                <AvatarFallback>{selectedEmployer.companyName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedEmployer.companyName}
                  </h3>
                  {selectedEmployer.isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
                  {getStatusBadge(selectedEmployer.status)}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {selectedEmployer.description}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Contact Person</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedEmployer.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Industry</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedEmployer.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Company Size</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedEmployer.companySize}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Location</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedEmployer.location}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEmployer.jobPosts}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Job Posts</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Users className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEmployer.totalHires}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Hires</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEmployer.rating}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Rating</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDetailsModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setDetailsModal(false);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Edit Employer Modal */}
      <AnimatedModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Employer"
        size="lg"
      >
        {selectedEmployer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input defaultValue={selectedEmployer.companyName} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Person</label>
                <Input defaultValue={selectedEmployer.contactPerson} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input defaultValue={selectedEmployer.email} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input defaultValue={selectedEmployer.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <Select defaultValue={selectedEmployer.industry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Size</label>
                <Select defaultValue={selectedEmployer.companySize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea defaultValue={selectedEmployer.description} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch defaultChecked={selectedEmployer.isPremium} />
                <label className="text-sm font-medium">Premium Access</label>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Status:</label>
                <Select defaultValue={selectedEmployer.status}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: 'Success', description: 'Employer details updated successfully.' });
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