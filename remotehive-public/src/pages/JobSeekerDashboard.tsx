import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { jobSeekerApi, JobApplication, SavedJob, JobRecommendation, ProfileStrengthAnalysis, AutoApplySettings, InterviewSchedule } from '../lib/api'
import {
  Search, Bookmark, Eye, MessageSquare, Calendar, TrendingUp, Target, Settings,
  Brain, FileText, BarChart3, Clock, MapPin, DollarSign, Star, ChevronRight,
  Plus, Filter, Download, Bot, Zap, Award, Users, CheckCircle, AlertCircle,
  Play, Pause, Edit, Trash2, ExternalLink, BookOpen, Video, Phone
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardStats {
  applications_sent: number
  saved_jobs: number
  profile_views: number
  messages: number
  interview_requests: number
  response_rate: number
}

const JobSeekerDashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    applications_sent: 0,
    saved_jobs: 0,
    profile_views: 0,
    messages: 0,
    interview_requests: 0,
    response_rate: 0
  })
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [profileStrength, setProfileStrength] = useState<ProfileStrengthAnalysis | null>(null)
  const [autoApplySettings, setAutoApplySettings] = useState<AutoApplySettings | null>(null)
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, applicationsData, savedJobsData, recommendationsData, profileStrengthData, autoApplyData, interviewsData] = await Promise.all([
        jobSeekerApi.getDashboardStats(),
        jobSeekerApi.getMyApplications(),
        jobSeekerApi.getSavedJobs(),
        jobSeekerApi.getJobRecommendations(5),
        jobSeekerApi.getProfileStrength(),
        jobSeekerApi.getAutoApplySettings(),
        jobSeekerApi.getInterviewSchedule()
      ])

      setStats(statsData)
      setApplications(applicationsData)
      setSavedJobs(savedJobsData)
      setRecommendations(recommendationsData)
      setProfileStrength(profileStrengthData)
      setAutoApplySettings(autoApplyData)
      setInterviews(interviewsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleAiQuestion = async () => {
    if (!aiQuestion.trim()) return
    
    try {
      setAiLoading(true)
      const response = await jobSeekerApi.askCareerAssistant(aiQuestion)
      setAiResponse(response.response)
      setAiQuestion('')
    } catch (error) {
      console.error('Error asking AI assistant:', error)
      toast.error('Failed to get AI response')
    } finally {
      setAiLoading(false)
    }
  }

  const toggleAutoApply = async () => {
    if (!autoApplySettings) return
    
    try {
      const updatedSettings = await jobSeekerApi.updateAutoApplySettings({
        ...autoApplySettings,
        enabled: !autoApplySettings.enabled
      })
      setAutoApplySettings(updatedSettings)
      toast.success(`Auto-apply ${updatedSettings.enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error toggling auto-apply:', error)
      toast.error('Failed to update auto-apply settings')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'reviewing': return 'text-blue-600 bg-blue-100'
      case 'shortlisted': return 'text-purple-600 bg-purple-100'
      case 'interviewed': return 'text-indigo-600 bg-indigo-100'
      case 'accepted': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'in_person': return <Users className="w-4 h-4" />
      case 'technical': return <Brain className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Seeker Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.first_name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'applications', label: 'Applications', icon: FileText },
              { id: 'recommendations', label: 'Recommendations', icon: Target },
              { id: 'saved-jobs', label: 'Saved Jobs', icon: Bookmark },
              { id: 'interviews', label: 'Interviews', icon: Calendar },
              { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Applications Sent', value: stats.applications_sent, icon: Search, color: 'bg-blue-500', change: '+12%' },
                { label: 'Saved Jobs', value: stats.saved_jobs, icon: Bookmark, color: 'bg-green-500', change: '+8%' },
                { label: 'Profile Views', value: stats.profile_views, icon: Eye, color: 'bg-purple-500', change: '+24%' },
                { label: 'Interview Requests', value: stats.interview_requests, icon: Calendar, color: 'bg-orange-500', change: '+15%' }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Profile Strength */}
            {profileStrength && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Strength</h3>
                  <span className="text-2xl font-bold text-blue-600">{profileStrength.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${profileStrength.percentage}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileStrength.sections.map((section, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {section.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{section.name}</p>
                        <p className="text-xs text-gray-500">{section.score}/{section.max_score} points</p>
                      </div>
                    </div>
                  ))}
                </div>
                {profileStrength.next_actions.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Next Actions:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {profileStrength.next_actions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Search Jobs', icon: Search, color: 'bg-blue-500' },
                  { label: 'Update Profile', icon: Edit, color: 'bg-green-500' },
                  { label: 'View Analytics', icon: BarChart3, color: 'bg-purple-500' },
                  { label: 'Build Resume', icon: FileText, color: 'bg-orange-500' }
                ].map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`${action.color} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Auto-Apply Status */}
            {autoApplySettings && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Auto-Apply</h3>
                  <button
                    onClick={toggleAutoApply}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      autoApplySettings.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {autoApplySettings.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{autoApplySettings.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Job Types</p>
                    <p className="font-medium">{autoApplySettings.job_types.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Locations</p>
                    <p className="font-medium">{autoApplySettings.locations.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Daily Limit</p>
                    <p className="font-medium">{autoApplySettings.max_applications_per_day} applications</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
                <button 
                  onClick={() => setActiveTab('recommendations')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{rec.job_post.title}</h4>
                        <p className="text-sm text-gray-600">{rec.job_post.company_name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{rec.job_post.location}</span>
                          </span>
                          {rec.job_post.salary_range && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{rec.job_post.salary_range}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{rec.match_score}%</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">My Applications</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.job_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        <button className="text-gray-600 hover:text-gray-900">Notes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Job Recommendations</h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{rec.job_post.title}</h4>
                          <div className="flex items-center space-x-1">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-600">{rec.match_score}% match</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{rec.job_post.company_name}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{rec.job_post.location}</span>
                          </span>
                          {rec.job_post.salary_range && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{rec.job_post.salary_range}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{rec.job_post.job_type}</span>
                          </span>
                        </div>
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Why this matches:</h5>
                          <div className="flex flex-wrap gap-2">
                            {rec.match_reasons.map((reason, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-green-700 mb-1">Skills Match:</h5>
                            <div className="flex flex-wrap gap-1">
                              {rec.skills_match.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          {rec.missing_skills.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-orange-700 mb-1">Skills to Develop:</h5>
                              <div className="flex flex-wrap gap-1">
                                {rec.missing_skills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Apply Now
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Save Job
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Analyze Skills
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === 'saved-jobs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {savedJobs.map((savedJob) => (
                  <div key={savedJob.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{savedJob.job_post.title}</h4>
                        <p className="text-sm text-gray-600">{savedJob.job_post.company_name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{savedJob.job_post.location}</span>
                          </span>
                          {savedJob.job_post.salary_range && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{savedJob.job_post.salary_range}</span>
                            </span>
                          )}
                        </div>
                        {savedJob.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                            <strong>Notes:</strong> {savedJob.notes}
                          </div>
                        )}
                        {savedJob.labels && savedJob.labels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {savedJob.labels.map((label, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Interview Schedule</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getInterviewTypeIcon(interview.interview_type)}
                          <h4 className="font-medium text-gray-900">{interview.job_title}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                            interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{interview.company_name}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(interview.scheduled_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(interview.scheduled_at).toLocaleTimeString()}</span>
                          </span>
                          <span>{interview.duration_minutes} minutes</span>
                        </div>
                        {interview.meeting_link && (
                          <div className="mt-2">
                            <a 
                              href={interview.meeting_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Join Meeting</span>
                            </a>
                          </div>
                        )}
                        {interview.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            <strong>Notes:</strong> {interview.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai-assistant' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Career Assistant</h3>
                <p className="text-sm text-gray-600">Get personalized career advice, resume tips, and interview preparation</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Improve Resume', icon: FileText, prompt: 'How can I improve my resume for remote software engineering roles?' },
                  { label: 'Interview Prep', icon: Users, prompt: 'Help me prepare for a technical interview at a startup.' },
                  { label: 'Career Advice', icon: TrendingUp, prompt: 'What skills should I develop to advance in my career?' }
                ].map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      onClick={() => setAiQuestion(action.prompt)}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Chat Interface */}
              <div className="border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex space-x-3">
                    <textarea
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Ask me anything about your career, resume, or job search..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <button
                      onClick={handleAiQuestion}
                      disabled={aiLoading || !aiQuestion.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {aiLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Ask AI'
                      )}
                    </button>
                  </div>
                </div>
                
                {aiResponse && (
                  <div className="p-4 bg-blue-50">
                    <div className="flex items-start space-x-3">
                      <Bot className="w-6 h-6 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-2">AI Assistant</h4>
                        <div className="text-blue-800 whitespace-pre-wrap">{aiResponse}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && autoApplySettings && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Apply Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Enable Auto-Apply</h4>
                    <p className="text-sm text-gray-600">Automatically apply to jobs that match your criteria</p>
                  </div>
                  <button
                    onClick={toggleAutoApply}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoApplySettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoApplySettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Types</label>
                    <div className="space-y-2">
                      {['full_time', 'part_time', 'contract', 'freelance'].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={autoApplySettings.job_types.includes(type)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Levels</label>
                    <div className="space-y-2">
                      {['entry', 'mid', 'senior', 'executive'].map((level) => (
                        <label key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={autoApplySettings.experience_levels.includes(level)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Application Limit</label>
                  <input
                    type="number"
                    value={autoApplySettings.max_applications_per_day}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter Template</label>
                  <textarea
                    value={autoApplySettings.cover_letter_template}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your default cover letter template..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobSeekerDashboard