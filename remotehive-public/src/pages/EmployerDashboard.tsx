import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Users, 
  Eye, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Star,
  Edit,
  Trash2,
  Bell,
  Settings,
  User,
  Building,
  FileText,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  salary: string
  type: 'full-time' | 'part-time' | 'contract' | 'freelance'
  status: 'active' | 'paused' | 'closed'
  posted: string
  applications: number
  views: number
  featured: boolean
}

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  appliedDate: string
  status: 'new' | 'reviewing' | 'interview' | 'hired' | 'rejected'
  rating: number
  avatar?: string
}

interface DashboardStats {
  activeJobs: number
  totalApplications: number
  scheduledInterviews: number
  hiredCandidates: number
}

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    scheduledInterviews: 0,
    hiredCandidates: 0
  })
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs')
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock jobs data
        const mockJobs: JobPosting[] = [
          {
            id: '1',
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            location: 'Remote',
            salary: '$80,000 - $120,000',
            type: 'full-time',
            status: 'active',
            posted: '2 days ago',
            applications: 24,
            views: 156,
            featured: true
          },
          {
            id: '2',
            title: 'Product Manager',
            department: 'Product',
            location: 'San Francisco, CA',
            salary: '$100,000 - $140,000',
            type: 'full-time',
            status: 'active',
            posted: '1 week ago',
            applications: 18,
            views: 89,
            featured: false
          },
          {
            id: '3',
            title: 'UX Designer',
            department: 'Design',
            location: 'Remote',
            salary: '$70,000 - $95,000',
            type: 'contract',
            status: 'paused',
            posted: '3 days ago',
            applications: 12,
            views: 67,
            featured: false
          }
        ]

        // Mock candidates data
        const mockCandidates: Candidate[] = [
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            position: 'Senior Frontend Developer',
            appliedDate: '2024-01-15',
            status: 'new',
            rating: 4.5
          },
          {
            id: '2',
            name: 'Michael Chen',
            email: 'michael.chen@email.com',
            position: 'Product Manager',
            appliedDate: '2024-01-14',
            status: 'interview',
            rating: 4.8
          },
          {
            id: '3',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@email.com',
            position: 'UX Designer',
            appliedDate: '2024-01-13',
            status: 'reviewing',
            rating: 4.2
          }
        ]

        // Mock stats
        const mockStats: DashboardStats = {
          activeJobs: 5,
          totalApplications: 54,
          scheduledInterviews: 8,
          hiredCandidates: 12
        }

        setJobs(mockJobs)
        setCandidates(mockCandidates)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'reviewing':
        return 'bg-purple-100 text-purple-800'
      case 'interview':
        return 'bg-orange-100 text-orange-800'
      case 'hired':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleJobAction = (jobId: string, action: 'edit' | 'pause' | 'delete') => {
    console.log(`${action} job:`, jobId)
    // Implement job actions
  }

  const handleCandidateAction = (candidateId: string, action: 'view' | 'interview' | 'hire' | 'reject') => {
    console.log(`${action} candidate:`, candidateId)
    // Implement candidate actions
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.first_name || 'Employer'}!
              </h1>
              <p className="text-gray-600">Manage your job postings and candidates</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/post-job"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Post New Job
              </Link>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              <Link 
                to="/profile" 
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <User className="h-6 w-6" />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduledInterviews}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hiredCandidates}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Job Postings ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Candidates ({candidates.length})
              </button>
            </nav>
          </div>

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Job Postings</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="h-5 w-5 mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      job.featured ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {job.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                          {job.featured && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-3">
                          <Building className="h-4 w-4 mr-1" />
                          <span className="mr-4">{job.department}</span>
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="mr-4">{job.location}</span>
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="mr-4">{job.salary}</span>
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Posted {job.posted}</span>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            <span>{job.applications} applications</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{job.views} views</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleJobAction(job.id, 'edit')}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <Link
                        to={`/jobs/${job.id}/applications`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Applications ({job.applications})
                      </Link>
                      <div className="flex space-x-2">
                        {job.status === 'active' && (
                          <button
                            onClick={() => handleJobAction(job.id, 'pause')}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Pause
                          </button>
                        )}
                        <Link
                          to={`/jobs/${job.id}/edit`}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Edit Job
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Candidates Tab */}
          {activeTab === 'candidates' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Candidates</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="h-5 w-5 mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {candidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-gray-600">{candidate.email}</p>
                          <p className="text-sm text-gray-500">Applied for {candidate.position}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{candidate.rating}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                          </span>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Applied on {new Date(candidate.appliedDate).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCandidateAction(candidate.id, 'view')}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          View Profile
                        </button>
                        {candidate.status === 'new' && (
                          <button
                            onClick={() => handleCandidateAction(candidate.id, 'interview')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Schedule Interview
                          </button>
                        )}
                        {candidate.status === 'interview' && (
                          <button
                            onClick={() => handleCandidateAction(candidate.id, 'hire')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Hire
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New application for Senior Frontend Developer</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Interview scheduled with Michael Chen</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Job posting "UX Designer" received 5 new views</p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/post-job"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Post New Job
                </Link>
                <Link
                  to="/candidates"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Browse Candidates
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  View Analytics
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
              </div>
            </motion.div>

            {/* Hiring Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-sm p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-2">Hiring Tips</h3>
              <p className="text-purple-100 mb-4">
                Improve your job posting visibility and attract top talent
              </p>
              <Link
                to="/hiring-guide"
                className="inline-block bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployerDashboard