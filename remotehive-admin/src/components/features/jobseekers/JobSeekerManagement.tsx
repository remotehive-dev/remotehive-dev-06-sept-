'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  Star,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  FileText,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  TrendingUp,
  Target,
  DollarSign,
  Building2
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
import { USER_STATUS, EXPERIENCE_LEVELS, JOB_TYPES, REMOTE_TYPES, POPULAR_SKILLS } from '@/lib/constants/admin';

interface JobSeekerManagementProps {
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

// Mock data for job seekers
const jobSeekerStats = {
  total: 1247,
  active: 892,
  inactive: 245,
  premium: 156,
  newThisWeek: 34,
  growth: 15.2
};

const mockJobSeekers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    location: 'San Francisco, CA',
    title: 'Senior Frontend Developer',
    experience: 'Senior (5+ years)',
    status: 'active',
    isPremium: true,
    joinedAt: new Date('2024-01-10'),
    lastActive: new Date('2024-01-20'),
    profileViews: 245,
    applicationsSubmitted: 12,
    interviewsScheduled: 3,
    jobOffers: 1,
    skills: ['React', 'TypeScript', 'Node.js', 'Python'],
    preferredJobType: 'Full-time',
    preferredRemote: 'Remote',
    expectedSalary: '$120,000 - $150,000',
    avatar: '/api/placeholder/40/40',
    resumeUrl: '/resumes/john-doe-resume.pdf',
    portfolioUrl: 'https://johndoe.dev',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    bio: 'Passionate frontend developer with 6+ years of experience building scalable web applications.',
    rating: 4.8
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0124',
    location: 'New York, NY',
    title: 'UX/UI Designer',
    experience: 'Mid-level (3-5 years)',
    status: 'active',
    isPremium: false,
    joinedAt: new Date('2024-01-15'),
    lastActive: new Date('2024-01-19'),
    profileViews: 189,
    applicationsSubmitted: 8,
    interviewsScheduled: 2,
    jobOffers: 0,
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
    preferredJobType: 'Full-time',
    preferredRemote: 'Hybrid',
    expectedSalary: '$80,000 - $100,000',
    avatar: '/api/placeholder/40/40',
    resumeUrl: '/resumes/sarah-johnson-resume.pdf',
    portfolioUrl: 'https://sarahdesigns.com',
    linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
    bio: 'Creative UX/UI designer focused on user-centered design and accessibility.',
    rating: 4.6
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@email.com',
    phone: '+1-555-0125',
    location: 'Austin, TX',
    title: 'Data Scientist',
    experience: 'Senior (5+ years)',
    status: 'inactive',
    isPremium: true,
    joinedAt: new Date('2023-12-20'),
    lastActive: new Date('2024-01-10'),
    profileViews: 312,
    applicationsSubmitted: 15,
    interviewsScheduled: 5,
    jobOffers: 2,
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    preferredJobType: 'Full-time',
    preferredRemote: 'Remote',
    expectedSalary: '$140,000 - $180,000',
    avatar: '/api/placeholder/40/40',
    resumeUrl: '/resumes/mike-chen-resume.pdf',
    portfolioUrl: 'https://mikechen.ai',
    linkedinUrl: 'https://linkedin.com/in/mikechen',
    bio: 'Data scientist with expertise in machine learning and predictive analytics.',
    rating: 4.9
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '+1-555-0126',
    location: 'Seattle, WA',
    title: 'Product Manager',
    experience: 'Mid-level (3-5 years)',
    status: 'active',
    isPremium: false,
    joinedAt: new Date('2024-01-08'),
    lastActive: new Date('2024-01-20'),
    profileViews: 156,
    applicationsSubmitted: 6,
    interviewsScheduled: 1,
    jobOffers: 0,
    skills: ['Product Strategy', 'Agile', 'Analytics', 'User Research'],
    preferredJobType: 'Full-time',
    preferredRemote: 'Hybrid',
    expectedSalary: '$110,000 - $130,000',
    avatar: '/api/placeholder/40/40',
    resumeUrl: '/resumes/emily-davis-resume.pdf',
    portfolioUrl: 'https://emilydavis.pm',
    linkedinUrl: 'https://linkedin.com/in/emilydavis',
    bio: 'Product manager passionate about building user-centric products that solve real problems.',
    rating: 4.4
  }
];

export function JobSeekerManagement({ className }: JobSeekerManagementProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [remoteFilter, setRemoteFilter] = useState('all');
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<any>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const filteredJobSeekers = mockJobSeekers.filter(jobSeeker => {
    const matchesSearch = jobSeeker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobSeeker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobSeeker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobSeeker.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || jobSeeker.status === statusFilter;
    const matchesExperience = experienceFilter === 'all' || jobSeeker.experience === experienceFilter;
    const matchesRemote = remoteFilter === 'all' || jobSeeker.preferredRemote === remoteFilter;
    return matchesSearch && matchesStatus && matchesExperience && matchesRemote;
  });

  const handleStatusChange = (jobSeekerId: string, newStatus: string) => {
    toast({
      title: 'Status Updated',
      description: `Job seeker status changed to ${newStatus}.`
    });
  };

  const handlePremiumToggle = (jobSeekerId: string, isPremium: boolean) => {
    toast({
      title: isPremium ? 'Premium Activated' : 'Premium Deactivated',
      description: `Premium access has been ${isPremium ? 'granted' : 'removed'}.`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case 'inactive': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Inactive</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Suspended</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const jobSeekerColumns = [
    {
      key: 'profile',
      label: 'Profile',
      render: (jobSeeker: any) => (
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={jobSeeker.avatar} alt={`${jobSeeker.firstName} ${jobSeeker.lastName}`} />
            <AvatarFallback>{jobSeeker.firstName.charAt(0)}{jobSeeker.lastName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-slate-900 dark:text-white">
                {jobSeeker.firstName} {jobSeeker.lastName}
              </p>
              {jobSeeker.isPremium && <Star className="w-4 h-4 text-yellow-500" />}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{jobSeeker.title}</p>
            <p className="text-xs text-slate-500 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {jobSeeker.location}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (jobSeeker: any) => (
        <div>
          <p className="text-sm text-slate-900 dark:text-white">{jobSeeker.email}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{jobSeeker.phone}</p>
        </div>
      )
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (jobSeeker: any) => (
        <div>
          <p className="text-sm text-slate-900 dark:text-white">{jobSeeker.experience}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{jobSeeker.preferredJobType}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{jobSeeker.preferredRemote}</p>
        </div>
      )
    },
    {
      key: 'activity',
      label: 'Activity',
      render: (jobSeeker: any) => (
        <div className="text-center">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{jobSeeker.profileViews}</p>
              <p className="text-slate-600 dark:text-slate-400">Views</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{jobSeeker.applicationsSubmitted}</p>
              <p className="text-slate-600 dark:text-slate-400">Apps</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{jobSeeker.interviewsScheduled}</p>
              <p className="text-slate-600 dark:text-slate-400">Interviews</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{jobSeeker.jobOffers}</p>
              <p className="text-slate-600 dark:text-slate-400">Offers</p>
            </div>
          </div>
          <div className="flex items-center justify-center mt-2">
            <Star className="w-3 h-3 text-yellow-500 mr-1" />
            <span className="text-xs font-medium">{jobSeeker.rating}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (jobSeeker: any) => (
        <div className="text-center">
          {getStatusBadge(jobSeeker.status)}
          <p className="text-xs text-slate-500 mt-1">
            Joined {jobSeeker.joinedAt.toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500">
            Last active {jobSeeker.lastActive.toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (jobSeeker: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedJobSeeker(jobSeeker);
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
                setSelectedJobSeeker(jobSeeker);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(jobSeeker.resumeUrl, '_blank')}>
                <FileText className="w-4 h-4 mr-2" />
                View Resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePremiumToggle(jobSeeker.id, !jobSeeker.isPremium)}>
                <Star className="w-4 h-4 mr-2" />
                {jobSeeker.isPremium ? 'Remove Premium' : 'Grant Premium'}
              </DropdownMenuItem>
              {jobSeeker.status === 'active' ? (
                <DropdownMenuItem onClick={() => handleStatusChange(jobSeeker.id, 'suspended')}>
                  <UserX className="w-4 h-4 mr-2" />
                  Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleStatusChange(jobSeeker.id, 'active')}>
                  <UserCheck className="w-4 h-4 mr-2" />
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
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Job Seeker Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage job seeker profiles, activity, and premium access
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
            <Button className="bg-gradient-to-r from-green-500 to-teal-600">
              <Users className="w-4 h-4 mr-2" />
              Invite Job Seekers
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <StatsCard
          title="Total Job Seekers"
          value={jobSeekerStats.total}
          change={jobSeekerStats.growth}
          trend="up"
          icon={Users}
          description="Registered users"
        />
        <StatsCard
          title="Active"
          value={jobSeekerStats.active}
          change={8.2}
          trend="up"
          icon={UserCheck}
          description="Currently active"
          variant="success"
        />
        <StatsCard
          title="Inactive"
          value={jobSeekerStats.inactive}
          change={-3.1}
          trend="down"
          icon={Clock}
          description="Inactive users"
          variant="warning"
        />
        <StatsCard
          title="Premium"
          value={jobSeekerStats.premium}
          change={12.5}
          trend="up"
          icon={Star}
          description="Premium subscribers"
          variant="premium"
        />
        <StatsCard
          title="New This Week"
          value={jobSeekerStats.newThisWeek}
          change={25.0}
          trend="up"
          icon={TrendingUp}
          description="Recent signups"
        />
        <StatsCard
          title="Avg Rating"
          value="4.6"
          change={2.1}
          trend="up"
          icon={Award}
          description="Platform rating"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Job Seeker List</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights & Trends</TabsTrigger>
          </TabsList>

          {/* Job Seeker List Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search job seekers..."
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
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Experience</SelectItem>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={remoteFilter} onValueChange={setRemoteFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by remote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Remote Types</SelectItem>
                    {REMOTE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </GlassCard>

            {/* Job Seekers Table */}
            <DataTable
              data={filteredJobSeekers}
              columns={jobSeekerColumns}
              searchable={false}
              pagination={true}
              emptyState={{
                title: 'No job seekers found',
                description: 'No job seekers match your current filters.',
                icon: Users
              }}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Experience Level Distribution
                </h3>
                <div className="space-y-3">
                  {EXPERIENCE_LEVELS.map((level, index) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{level}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-teal-600 rounded-full"
                            style={{ width: `${Math.random() * 80 + 20}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{Math.floor(Math.random() * 200 + 50)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Top Skills in Demand
                </h3>
                <div className="space-y-3">
                  {POPULAR_SKILLS.slice(0, 8).map((skill, index) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{skill}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            style={{ width: `${(8 - index) * 12 + 20}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(8 - index) * 25 + 100}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Remote Work Preferences
                </h3>
                <div className="space-y-3">
                  {REMOTE_TYPES.map((type, index) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                            style={{ width: `${Math.random() * 60 + 30}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{Math.floor(Math.random() * 300 + 100)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Application Success Rate
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">68%</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average Success Rate</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Applications Submitted</span>
                      <span className="font-medium">2,847</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Interviews Scheduled</span>
                      <span className="font-medium">1,936</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Job Offers Received</span>
                      <span className="font-medium">892</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Top Performers</h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-3">
                  {mockJobSeekers.slice(0, 3).map((jobSeeker, index) => (
                    <div key={jobSeeker.id} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        'bg-orange-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={jobSeeker.avatar} />
                        <AvatarFallback>{jobSeeker.firstName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{jobSeeker.firstName} {jobSeeker.lastName}</p>
                        <p className="text-xs text-slate-500">{jobSeeker.profileViews} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <p className="text-sm">34 new registrations this week</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <p className="text-sm">156 applications submitted today</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <p className="text-sm">23 interviews scheduled</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <p className="text-sm">8 job offers accepted</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Platform Health</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">User Satisfaction</span>
                    <span className="text-sm font-medium">4.6/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Profile Completion</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Active Users</span>
                    <span className="text-sm font-medium">71.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Response Rate</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Job Seeker Details Modal */}
      <AnimatedModal
        isOpen={detailsModal}
        onClose={() => setDetailsModal(false)}
        title="Job Seeker Profile"
        size="xl"
      >
        {selectedJobSeeker && (
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={selectedJobSeeker.avatar} alt={`${selectedJobSeeker.firstName} ${selectedJobSeeker.lastName}`} />
                <AvatarFallback>{selectedJobSeeker.firstName.charAt(0)}{selectedJobSeeker.lastName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedJobSeeker.firstName} {selectedJobSeeker.lastName}
                  </h3>
                  {selectedJobSeeker.isPremium && <Star className="w-5 h-5 text-yellow-500" />}
                  {getStatusBadge(selectedJobSeeker.status)}
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">{selectedJobSeeker.title}</p>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{selectedJobSeeker.bio}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Experience Level</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJobSeeker.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Preferred Job Type</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJobSeeker.preferredJobType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Remote Preference</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJobSeeker.preferredRemote}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Expected Salary</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJobSeeker.expectedSalary}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedJobSeeker.profileViews}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Profile Views</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedJobSeeker.applicationsSubmitted}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Applications</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedJobSeeker.interviewsScheduled}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Interviews</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Award className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedJobSeeker.jobOffers}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Job Offers</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedJobSeeker.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => window.open(selectedJobSeeker.resumeUrl, '_blank')}>
                <FileText className="w-4 h-4 mr-2" />
                View Resume
              </Button>
              <Button variant="outline" onClick={() => setDetailsModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setDetailsModal(false);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Edit Job Seeker Modal */}
      <AnimatedModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Job Seeker Profile"
        size="lg"
      >
        {selectedJobSeeker && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <Input defaultValue={selectedJobSeeker.firstName} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <Input defaultValue={selectedJobSeeker.lastName} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input defaultValue={selectedJobSeeker.email} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input defaultValue={selectedJobSeeker.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input defaultValue={selectedJobSeeker.title} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <Select defaultValue={selectedJobSeeker.experience}>
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <Textarea defaultValue={selectedJobSeeker.bio} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch defaultChecked={selectedJobSeeker.isPremium} />
                <label className="text-sm font-medium">Premium Access</label>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Status:</label>
                <Select defaultValue={selectedJobSeeker.status}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
                toast({ title: 'Success', description: 'Job seeker profile updated successfully.' });
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