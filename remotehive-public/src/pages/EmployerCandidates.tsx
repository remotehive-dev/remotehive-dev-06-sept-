import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  Eye, 
  MessageSquare, 
  FileText, 
  ExternalLink,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Users,
  TrendingUp,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Send,
  Video,
  Calendar as CalendarIcon,
  Plus,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  experience: number;
  education: string;
  skills: string[];
  salary_expectation: {
    min: number;
    max: number;
    currency: string;
  };
  availability: string;
  resume_url: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  applied_jobs: {
    job_id: string;
    job_title: string;
    applied_date: string;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'rejected' | 'hired';
    stage: string;
    notes: string;
    rating: number;
  }[];
  profile_picture?: string;
  summary: string;
  remote_preference: boolean;
  visa_status?: string;
  languages: string[];
  certifications: string[];
  last_active: string;
  match_score: number;
  bookmarked: boolean;
}

const EmployerCandidates: React.FC = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [skillsFilter, setSkillsFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('match_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  // Mock data - replace with actual API calls
  const mockCandidates: Candidate[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      title: 'Senior Frontend Developer',
      experience: 5,
      education: 'BS Computer Science - Stanford University',
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
      salary_expectation: { min: 120000, max: 150000, currency: 'USD' },
      availability: 'Immediately',
      resume_url: '/resumes/sarah-johnson.pdf',
      portfolio_url: 'https://sarahjohnson.dev',
      linkedin_url: 'https://linkedin.com/in/sarahjohnson',
      github_url: 'https://github.com/sarahjohnson',
      applied_jobs: [
        {
          job_id: '1',
          job_title: 'Senior React Developer',
          applied_date: '2024-01-15',
          status: 'shortlisted',
          stage: 'Technical Interview',
          notes: 'Strong technical skills, great portfolio',
          rating: 4.5
        }
      ],
      profile_picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      summary: 'Passionate frontend developer with 5+ years of experience building scalable web applications.',
      remote_preference: true,
      visa_status: 'US Citizen',
      languages: ['English', 'Spanish'],
      certifications: ['AWS Certified Developer', 'React Professional'],
      last_active: '2024-01-20',
      match_score: 95,
      bookmarked: true
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
      title: 'Full Stack Developer',
      experience: 3,
      education: 'MS Software Engineering - MIT',
      skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker'],
      salary_expectation: { min: 90000, max: 120000, currency: 'USD' },
      availability: '2 weeks notice',
      resume_url: '/resumes/michael-chen.pdf',
      linkedin_url: 'https://linkedin.com/in/michaelchen',
      github_url: 'https://github.com/michaelchen',
      applied_jobs: [
        {
          job_id: '2',
          job_title: 'Product Manager',
          applied_date: '2024-01-10',
          status: 'reviewed',
          stage: 'Initial Review',
          notes: 'Good technical background, considering for PM role',
          rating: 4.0
        }
      ],
      profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      summary: 'Full-stack developer with strong problem-solving skills and experience in agile environments.',
      remote_preference: false,
      visa_status: 'H1B',
      languages: ['English', 'Mandarin'],
      certifications: ['Google Cloud Professional'],
      last_active: '2024-01-19',
      match_score: 88,
      bookmarked: false
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      title: 'UX/UI Designer',
      experience: 4,
      education: 'BFA Design - Art Institute',
      skills: ['Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'HTML/CSS'],
      salary_expectation: { min: 75000, max: 95000, currency: 'USD' },
      availability: 'Immediately',
      resume_url: '/resumes/emily-rodriguez.pdf',
      portfolio_url: 'https://emilyrodriguez.design',
      linkedin_url: 'https://linkedin.com/in/emilyrodriguez',
      applied_jobs: [
        {
          job_id: '3',
          job_title: 'UX/UI Designer',
          applied_date: '2024-01-05',
          status: 'interviewed',
          stage: 'Final Interview',
          notes: 'Excellent design portfolio, strong user research skills',
          rating: 4.8
        }
      ],
      profile_picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      summary: 'Creative UX/UI designer focused on creating intuitive and accessible user experiences.',
      remote_preference: true,
      visa_status: 'US Citizen',
      languages: ['English', 'Spanish'],
      certifications: ['Google UX Design Certificate'],
      last_active: '2024-01-18',
      match_score: 92,
      bookmarked: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCandidates(mockCandidates);
      setFilteredCandidates(mockCandidates);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = candidates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        candidate.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => 
        candidate.applied_jobs.some(job => job.status === statusFilter)
      );
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      const [min, max] = experienceFilter.split('-').map(Number);
      filtered = filtered.filter(candidate => {
        if (max) {
          return candidate.experience >= min && candidate.experience <= max;
        } else {
          return candidate.experience >= min;
        }
      });
    }

    // Location filter
    if (locationFilter !== 'all') {
      if (locationFilter === 'remote') {
        filtered = filtered.filter(candidate => candidate.remote_preference);
      } else {
        filtered = filtered.filter(candidate => 
          candidate.location.toLowerCase().includes(locationFilter.toLowerCase())
        );
      }
    }

    // Skills filter
    if (skillsFilter) {
      filtered = filtered.filter(candidate => 
        candidate.skills.some(skill => 
          skill.toLowerCase().includes(skillsFilter.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'experience':
          aValue = a.experience;
          bValue = b.experience;
          break;
        case 'match_score':
          aValue = a.match_score;
          bValue = b.match_score;
          break;
        case 'last_active':
          aValue = new Date(a.last_active).getTime();
          bValue = new Date(b.last_active).getTime();
          break;
        case 'applied_date':
          aValue = a.applied_jobs.length > 0 ? new Date(a.applied_jobs[0].applied_date).getTime() : 0;
          bValue = b.applied_jobs.length > 0 ? new Date(b.applied_jobs[0].applied_date).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    setFilteredCandidates(filtered);
  }, [candidates, searchQuery, statusFilter, experienceFilter, locationFilter, skillsFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'reviewed': return 'text-blue-600 bg-blue-100';
      case 'shortlisted': return 'text-purple-600 bg-purple-100';
      case 'interviewed': return 'text-indigo-600 bg-indigo-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'hired': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'shortlisted': return <Star className="h-4 w-4" />;
      case 'interviewed': return <Video className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleCandidateAction = (action: string, candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    
    switch (action) {
      case 'view':
        setSelectedCandidate(candidate || null);
        setShowCandidateModal(true);
        break;
      case 'message':
        setSelectedCandidate(candidate || null);
        setMessageSubject(`Regarding your application for ${candidate?.applied_jobs[0]?.job_title || 'our position'}`);
        setShowMessageModal(true);
        break;
      case 'bookmark':
        setCandidates(candidates.map(c => 
          c.id === candidateId ? { ...c, bookmarked: !c.bookmarked } : c
        ));
        toast.success(candidate?.bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
        break;
      case 'shortlist':
        setCandidates(candidates.map(c => 
          c.id === candidateId ? {
            ...c,
            applied_jobs: c.applied_jobs.map(job => ({ ...job, status: 'shortlisted' as const }))
          } : c
        ));
        toast.success('Candidate shortlisted');
        break;
      case 'reject':
        setCandidates(candidates.map(c => 
          c.id === candidateId ? {
            ...c,
            applied_jobs: c.applied_jobs.map(job => ({ ...job, status: 'rejected' as const }))
          } : c
        ));
        toast.success('Candidate rejected');
        break;
      case 'schedule_interview':
        toast.success('Interview scheduling modal would open here');
        break;
      case 'download_resume':
        toast.success('Downloading resume...');
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'shortlist':
        setCandidates(candidates.map(c => 
          selectedCandidates.includes(c.id) ? {
            ...c,
            applied_jobs: c.applied_jobs.map(job => ({ ...job, status: 'shortlisted' as const }))
          } : c
        ));
        toast.success(`${selectedCandidates.length} candidates shortlisted`);
        break;
      case 'reject':
        setCandidates(candidates.map(c => 
          selectedCandidates.includes(c.id) ? {
            ...c,
            applied_jobs: c.applied_jobs.map(job => ({ ...job, status: 'rejected' as const }))
          } : c
        ));
        toast.success(`${selectedCandidates.length} candidates rejected`);
        break;
      case 'message':
        toast.success('Bulk messaging modal would open here');
        break;
      case 'export':
        toast.success('Exporting candidate data...');
        break;
    }
    setSelectedCandidates([]);
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const sendMessage = () => {
    if (!messageContent.trim() || !selectedCandidate) return;
    
    toast.success(`Message sent to ${selectedCandidate.name}`);
    setShowMessageModal(false);
    setMessageContent('');
    setMessageSubject('');
    setSelectedCandidate(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
              <p className="text-gray-600 mt-1">Discover and manage talented candidates</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Grid
                </button>
              </div>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900">{candidates.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                <p className="text-3xl font-bold text-purple-600">
                  {candidates.filter(c => c.applied_jobs.some(job => job.status === 'shortlisted')).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interviewed</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {candidates.filter(c => c.applied_jobs.some(job => job.status === 'interviewed')).length}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Video className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hired</p>
                <p className="text-3xl font-bold text-green-600">
                  {candidates.filter(c => c.applied_jobs.some(job => job.status === 'hired')).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search candidates by name, title, skills, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="match_score">Best Match</option>
                  <option value="name">Name</option>
                  <option value="experience">Experience</option>
                  <option value="last_active">Last Active</option>
                  <option value="applied_date">Application Date</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interviewed">Interviewed</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Levels</option>
                      <option value="0-1">0-1 years</option>
                      <option value="2-3">2-3 years</option>
                      <option value="4-5">4-5 years</option>
                      <option value="6-10">6-10 years</option>
                      <option value="10">10+ years</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Locations</option>
                      <option value="remote">Remote Only</option>
                      <option value="san francisco">San Francisco</option>
                      <option value="new york">New York</option>
                      <option value="austin">Austin</option>
                      <option value="seattle">Seattle</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Python"
                      value={skillsFilter}
                      onChange={(e) => setSkillsFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setExperienceFilter('all');
                        setLocationFilter('all');
                        setSkillsFilter('');
                        setSortBy('match_score');
                        setSortOrder('desc');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCandidates.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCandidates.length} candidate(s) selected
                </span>
                <button
                  onClick={() => setSelectedCandidates([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Deselect all
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('shortlist')}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => handleBulkAction('message')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Message
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates List/Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredCandidates.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all' || experienceFilter !== 'all' || locationFilter !== 'all' || skillsFilter
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No candidates have applied to your jobs yet.'}
                </p>
              </div>
            </div>
          ) : (
            filteredCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'p-6' : 'p-4'
                }`}
              >
                {viewMode === 'list' ? (
                  // List View
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-shrink-0">
                        {candidate.profile_picture ? (
                          <img
                            src={candidate.profile_picture}
                            alt={candidate.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">
                                  {'★'.repeat(Math.floor(candidate.match_score / 20))}
                                </span>
                                <span className="text-sm text-gray-500">({candidate.match_score}% match)</span>
                              </div>
                              {candidate.bookmarked && (
                                <BookmarkCheck className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-2">{candidate.title}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{candidate.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Briefcase className="h-4 w-4" />
                                <span>{candidate.experience} years exp</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{candidate.availability}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {candidate.skills.slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{candidate.skills.length - 4} more
                                </span>
                              )}
                            </div>
                            
                            {candidate.applied_jobs.length > 0 && (
                              <div className="flex items-center space-x-4 text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(candidate.applied_jobs[0].status)}`}>
                                  {getStatusIcon(candidate.applied_jobs[0].status)}
                                  <span className="capitalize">{candidate.applied_jobs[0].status}</span>
                                </span>
                                <span className="text-gray-500">
                                  Applied to {candidate.applied_jobs[0].job_title}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCandidateAction('view', candidate.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleCandidateAction('message', candidate.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Send Message"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleCandidateAction('bookmark', candidate.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                candidate.bookmarked 
                                  ? 'text-blue-600 bg-blue-50' 
                                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title={candidate.bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                            >
                              {candidate.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                            </button>
                            
                            <button
                              onClick={() => handleCandidateAction('download_resume', candidate.id)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Download Resume"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            
                            <div className="relative group">
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button
                                  onClick={() => handleCandidateAction('shortlist', candidate.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Star className="h-4 w-4" />
                                  <span>Shortlist</span>
                                </button>
                                <button
                                  onClick={() => handleCandidateAction('schedule_interview', candidate.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>Schedule Interview</span>
                                </button>
                                <button
                                  onClick={() => handleCandidateAction('reject', candidate.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Grid View
                  <div className="text-center">
                    <div className="flex justify-between items-start mb-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleCandidateAction('bookmark', candidate.id)}
                        className={`p-1 rounded transition-colors ${
                          candidate.bookmarked 
                            ? 'text-blue-600' 
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        {candidate.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      {candidate.profile_picture ? (
                        <img
                          src={candidate.profile_picture}
                          alt={candidate.name}
                          className="w-16 h-16 rounded-full object-cover mx-auto"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{candidate.name}</h3>
                    <p className="text-gray-600 mb-2">{candidate.title}</p>
                    
                    <div className="flex items-center justify-center space-x-1 mb-3">
                      <span className="text-yellow-500">
                        {'★'.repeat(Math.floor(candidate.match_score / 20))}
                      </span>
                      <span className="text-sm text-gray-500">({candidate.match_score}%)</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{candidate.location}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{candidate.experience} years</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4 justify-center">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    {candidate.applied_jobs.length > 0 && (
                      <div className="mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center space-x-1 ${getStatusColor(candidate.applied_jobs[0].status)}`}>
                          {getStatusIcon(candidate.applied_jobs[0].status)}
                          <span className="capitalize">{candidate.applied_jobs[0].status}</span>
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleCandidateAction('view', candidate.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleCandidateAction('message', candidate.id)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredCandidates.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">2</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">3</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  {selectedCandidate.profile_picture ? (
                    <img
                      src={selectedCandidate.profile_picture}
                      alt={selectedCandidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                    <p className="text-gray-600">{selectedCandidate.title}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedCandidate.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{selectedCandidate.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{selectedCandidate.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCandidateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                      <p className="text-gray-600">{selectedCandidate.summary}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Application History</h3>
                      <div className="space-y-3">
                        {selectedCandidate.applied_jobs.map((job, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{job.job_title}</h4>
                                <p className="text-sm text-gray-500">Applied on {new Date(job.applied_date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-600 mt-1">{job.notes}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                  {job.status}
                                </span>
                                <div className="flex items-center mt-1">
                                  <span className="text-yellow-500">{'★'.repeat(Math.floor(job.rating))}</span>
                                  <span className="text-sm text-gray-500 ml-1">({job.rating})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Experience:</span>
                          <span className="text-gray-900">{selectedCandidate.experience} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Education:</span>
                          <span className="text-gray-900">{selectedCandidate.education}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Availability:</span>
                          <span className="text-gray-900">{selectedCandidate.availability}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Salary Range:</span>
                          <span className="text-gray-900">
                            {selectedCandidate.salary_expectation.currency} {selectedCandidate.salary_expectation.min.toLocaleString()} - {selectedCandidate.salary_expectation.max.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Remote:</span>
                          <span className="text-gray-900">{selectedCandidate.remote_preference ? 'Yes' : 'No'}</span>
                        </div>
                        {selectedCandidate.visa_status && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Visa Status:</span>
                            <span className="text-gray-900">{selectedCandidate.visa_status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.languages.map((language, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                      <div className="space-y-2">
                        {selectedCandidate.certifications.map((cert, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-700">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Links</h3>
                      <div className="space-y-2">
                        <a href={selectedCandidate.resume_url} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                          <FileText className="h-4 w-4" />
                          <span>Resume</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {selectedCandidate.portfolio_url && (
                          <a href={selectedCandidate.portfolio_url} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4" />
                            <span>Portfolio</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {selectedCandidate.linkedin_url && (
                          <a href={selectedCandidate.linkedin_url} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4" />
                            <span>LinkedIn</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {selectedCandidate.github_url && (
                          <a href={selectedCandidate.github_url} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4" />
                            <span>GitHub</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowCandidateModal(false);
                          handleCandidateAction('message', selectedCandidate.id);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Send Message</span>
                      </button>
                      
                      <button
                        onClick={() => handleCandidateAction('shortlist', selectedCandidate.id)}
                        className="w-full px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center space-x-2"
                      >
                        <Star className="h-4 w-4" />
                        <span>Shortlist</span>
                      </button>
                      
                      <button
                        onClick={() => handleCandidateAction('schedule_interview', selectedCandidate.id)}
                        className="w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 flex items-center justify-center space-x-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>Schedule Interview</span>
                      </button>
                      
                      <button
                        onClick={() => handleCandidateAction('reject', selectedCandidate.id)}
                        className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Send Message to {selectedCandidate.name}</h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter message subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message here..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!messageContent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployerCandidates;