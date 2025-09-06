import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Download,
  Share2,
  Copy,
  ExternalLink,
  Pause,
  Play,
  Archive,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'active' | 'paused' | 'closed' | 'draft';
  applications: number;
  views: number;
  posted_date: string;
  expires_date: string;
  description: string;
  requirements: string[];
  benefits: string[];
  remote: boolean;
  featured: boolean;
  urgent: boolean;
}

const EmployerMyJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock data - replace with actual API calls
  const mockJobs: JobPost[] = [
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'TechCorp Solutions',
      location: 'Remote',
      type: 'full-time',
      salary: { min: 80000, max: 120000, currency: 'USD' },
      status: 'active',
      applications: 45,
      views: 1250,
      posted_date: '2024-01-15',
      expires_date: '2024-02-15',
      description: 'We are looking for a senior React developer...',
      requirements: ['React', 'TypeScript', 'Node.js', '5+ years experience'],
      benefits: ['Health Insurance', 'Remote Work', '401k', 'Flexible Hours'],
      remote: true,
      featured: true,
      urgent: false
    },
    {
      id: '2',
      title: 'Product Manager',
      company: 'TechCorp Solutions',
      location: 'New York, NY',
      type: 'full-time',
      salary: { min: 90000, max: 140000, currency: 'USD' },
      status: 'active',
      applications: 32,
      views: 890,
      posted_date: '2024-01-10',
      expires_date: '2024-02-10',
      description: 'Seeking an experienced product manager...',
      requirements: ['Product Management', 'Agile', 'Analytics', '3+ years experience'],
      benefits: ['Health Insurance', 'Stock Options', 'Gym Membership'],
      remote: false,
      featured: false,
      urgent: true
    },
    {
      id: '3',
      title: 'UX/UI Designer',
      company: 'TechCorp Solutions',
      location: 'Remote',
      type: 'contract',
      salary: { min: 60, max: 80, currency: 'USD' },
      status: 'paused',
      applications: 28,
      views: 650,
      posted_date: '2024-01-05',
      expires_date: '2024-02-05',
      description: 'Looking for a creative UX/UI designer...',
      requirements: ['Figma', 'Adobe Creative Suite', 'User Research', '2+ years experience'],
      benefits: ['Flexible Schedule', 'Remote Work', 'Professional Development'],
      remote: true,
      featured: false,
      urgent: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobs(mockJobs);
      setFilteredJobs(mockJobs);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
        case 'oldest':
          return new Date(a.posted_date).getTime() - new Date(b.posted_date).getTime();
        case 'applications':
          return b.applications - a.applications;
        case 'views':
          return b.views - a.views;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, statusFilter, typeFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleJobAction = (action: string, jobId: string) => {
    switch (action) {
      case 'view':
        toast.success('Opening job details...');
        break;
      case 'edit':
        toast.success('Opening job editor...');
        break;
      case 'pause':
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: 'paused' as const } : job
        ));
        toast.success('Job paused successfully');
        break;
      case 'activate':
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: 'active' as const } : job
        ));
        toast.success('Job activated successfully');
        break;
      case 'close':
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: 'closed' as const } : job
        ));
        toast.success('Job closed successfully');
        break;
      case 'delete':
        setJobs(jobs.filter(job => job.id !== jobId));
        toast.success('Job deleted successfully');
        break;
      case 'duplicate':
        const jobToDuplicate = jobs.find(job => job.id === jobId);
        if (jobToDuplicate) {
          const newJob = {
            ...jobToDuplicate,
            id: Date.now().toString(),
            title: `${jobToDuplicate.title} (Copy)`,
            status: 'draft' as const,
            applications: 0,
            views: 0,
            posted_date: new Date().toISOString().split('T')[0]
          };
          setJobs([newJob, ...jobs]);
          toast.success('Job duplicated successfully');
        }
        break;
      case 'share':
        navigator.clipboard.writeText(`https://remotehive.com/jobs/${jobId}`);
        toast.success('Job link copied to clipboard');
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'activate':
        setJobs(jobs.map(job => 
          selectedJobs.includes(job.id) ? { ...job, status: 'active' as const } : job
        ));
        toast.success(`${selectedJobs.length} jobs activated`);
        break;
      case 'pause':
        setJobs(jobs.map(job => 
          selectedJobs.includes(job.id) ? { ...job, status: 'paused' as const } : job
        ));
        toast.success(`${selectedJobs.length} jobs paused`);
        break;
      case 'close':
        setJobs(jobs.map(job => 
          selectedJobs.includes(job.id) ? { ...job, status: 'closed' as const } : job
        ));
        toast.success(`${selectedJobs.length} jobs closed`);
        break;
      case 'delete':
        setJobs(jobs.filter(job => !selectedJobs.includes(job.id)));
        toast.success(`${selectedJobs.length} jobs deleted`);
        break;
    }
    setSelectedJobs([]);
    setShowBulkActions(false);
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAllJobs = () => {
    setSelectedJobs(filteredJobs.map(job => job.id));
  };

  const deselectAllJobs = () => {
    setSelectedJobs([]);
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
              <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
              <p className="text-gray-600 mt-1">Manage your job postings and track performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Post New Job</span>
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
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-green-600">
                  {jobs.filter(job => job.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-3xl font-bold text-purple-600">
                  {jobs.reduce((sum, job) => sum + job.applications, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
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
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-orange-600">
                  {jobs.reduce((sum, job) => sum + job.views, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Eye className="h-6 w-6 text-orange-600" />
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
                    placeholder="Search jobs by title or location..."
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="applications">Most Applications</option>
                  <option value="views">Most Views</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setSortBy('newest');
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
        {selectedJobs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedJobs.length} job(s) selected
                </span>
                <button
                  onClick={deselectAllJobs}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Deselect all
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Pause
                </button>
                <button
                  onClick={() => handleBulkAction('close')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Close
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Get started by posting your first job.'}
                </p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  <span>Post Your First Job</span>
                </button>
              </div>
            </div>
          ) : (
            filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={() => toggleJobSelection(job.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                              {job.featured && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>Featured</span>
                                </span>
                              )}
                              {job.urgent && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                  Urgent
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span className="capitalize">{job.type.replace('-', ' ')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                                  {job.type === 'contract' || job.type === 'freelance' ? '/hour' : '/year'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{job.applications} applications</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{job.views} views</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {new Date(job.posted_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Expires {new Date(job.expires_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              <span className="capitalize">{job.status}</span>
                            </span>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleJobAction('view', job.id)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleJobAction('edit', job.id)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit Job"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleJobAction('share', job.id)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Share Job"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              
                              {job.status === 'active' ? (
                                <button
                                  onClick={() => handleJobAction('pause', job.id)}
                                  className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                  title="Pause Job"
                                >
                                  <Pause className="h-4 w-4" />
                                </button>
                              ) : job.status === 'paused' ? (
                                <button
                                  onClick={() => handleJobAction('activate', job.id)}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Activate Job"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              ) : null}
                              
                              <div className="relative group">
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  <button
                                    onClick={() => handleJobAction('duplicate', job.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Copy className="h-4 w-4" />
                                    <span>Duplicate</span>
                                  </button>
                                  <button
                                    onClick={() => handleJobAction('close', job.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    <span>Close Job</span>
                                  </button>
                                  <button
                                    onClick={() => handleJobAction('delete', job.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredJobs.length} of {jobs.length} jobs
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
    </div>
  );
};

export default EmployerMyJobs;