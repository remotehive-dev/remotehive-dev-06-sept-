import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Star, 
  BookmarkPlus,
  Eye,
  Filter,
  TrendingUp,
  Users,
  Building,
  Calendar,
  Bell,
  Settings,
  User,
  FileText,
  Heart
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  type: 'full-time' | 'part-time' | 'contract' | 'freelance'
  posted: string
  description: string
  requirements: string[]
  benefits: string[]
  remote: boolean
  featured: boolean
}

interface DashboardStats {
  appliedJobs: number
  savedJobs: number
  profileViews: number
  interviewsScheduled: number
}

const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    appliedJobs: 0,
    savedJobs: 0,
    profileViews: 0,
    interviewsScheduled: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock jobs data
        const mockJobs: Job[] = [
          {
            id: '1',
            title: 'Senior Frontend Developer',
            company: 'TechCorp Inc.',
            location: 'Remote',
            salary: '$80,000 - $120,000',
            type: 'full-time',
            posted: '2 days ago',
            description: 'We are looking for a senior frontend developer to join our team...',
            requirements: ['React', 'TypeScript', '5+ years experience'],
            benefits: ['Health insurance', 'Remote work', '401k'],
            remote: true,
            featured: true
          },
          {
            id: '2',
            title: 'Full Stack Developer',
            company: 'StartupXYZ',
            location: 'San Francisco, CA',
            salary: '$90,000 - $130,000',
            type: 'full-time',
            posted: '1 week ago',
            description: 'Join our growing startup as a full stack developer...',
            requirements: ['Node.js', 'React', 'MongoDB'],
            benefits: ['Equity', 'Flexible hours', 'Health insurance'],
            remote: false,
            featured: false
          },
          {
            id: '3',
            title: 'React Developer',
            company: 'Digital Agency',
            location: 'Remote',
            salary: '$60,000 - $85,000',
            type: 'contract',
            posted: '3 days ago',
            description: 'Contract position for an experienced React developer...',
            requirements: ['React', 'JavaScript', '3+ years experience'],
            benefits: ['Flexible schedule', 'Remote work'],
            remote: true,
            featured: false
          }
        ]

        // Mock stats
        const mockStats: DashboardStats = {
          appliedJobs: 12,
          savedJobs: 8,
          profileViews: 45,
          interviewsScheduled: 3
        }

        setJobs(mockJobs)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesType = !jobTypeFilter || job.type === jobTypeFilter
    
    return matchesSearch && matchesLocation && matchesType
  })

  const handleSaveJob = (jobId: string) => {
    // Implement save job functionality
    console.log('Saving job:', jobId)
  }

  const handleApplyJob = (jobId: string) => {
    // Implement apply job functionality
    console.log('Applying to job:', jobId)
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
                Welcome back, {user?.first_name || 'Job Seeker'}!
              </h1>
              <p className="text-gray-600">Find your next remote opportunity</p>
            </div>
            <div className="flex items-center space-x-4">
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
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applied Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.appliedJobs}</p>
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
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.savedJobs}</p>
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
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.profileViews}</p>
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
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.interviewsScheduled}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Job Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>

            <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </motion.div>

        {/* Job Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Job List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Recommended Jobs ({filteredJobs.length})
              </h2>
              <Link 
                to="/jobs" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Jobs
              </Link>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                    job.featured ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-2">
                          {job.title}
                        </h3>
                        {job.featured && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building className="h-4 w-4 mr-1" />
                        <span className="mr-4">{job.company}</span>
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="mr-4">{job.location}</span>
                        {job.remote && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Remote
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 mb-3">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="mr-4">{job.salary}</span>
                        <Briefcase className="h-4 w-4 mr-1" />
                        <span className="mr-4 capitalize">{job.type.replace('-', ' ')}</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{job.posted}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveJob(job.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <BookmarkPlus className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requirements.slice(0, 3).map((req, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        +{job.requirements.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleApplyJob(job.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
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
                  to="/profile"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="h-5 w-5 mr-3" />
                  Update Profile
                </Link>
                <Link
                  to="/applications"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  My Applications
                </Link>
                <Link
                  to="/saved-jobs"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Heart className="h-5 w-5 mr-3" />
                  Saved Jobs
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

            {/* Job Market Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">New Jobs Today</span>
                  <span className="font-semibold text-green-600">+24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Remote Jobs</span>
                  <span className="font-semibold text-blue-600">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Salary</span>
                  <span className="font-semibold text-gray-900">$95k</span>
                </div>
              </div>
            </motion.div>

            {/* Profile Completion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
              <p className="text-blue-100 mb-4">
                Increase your chances of getting hired by 3x
              </p>
              <div className="w-full bg-blue-400 rounded-full h-2 mb-4">
                <div className="bg-white h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-sm text-blue-100 mb-4">65% Complete</p>
              <Link
                to="/profile"
                className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Complete Profile
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobSeekerDashboard