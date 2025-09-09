import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Clock, DollarSign, Users, Building, Calendar, ArrowLeft, Bookmark, Share2, ExternalLink } from 'lucide-react'
import { jobsApi, JobPost } from '../lib/api'

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError('Job ID not provided')
        setLoading(false)
        return
      }

      try {
        const jobData = await jobsApi.getJobById(id)
        setJob(jobData)
      } catch (err) {
        setError('Failed to load job details')
        console.error('Error fetching job:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  const handleApply = () => {
    // In a real app, this would open an application modal or redirect to application page
    alert('Application feature coming soon!')
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    // In a real app, this would save/unsave the job in the database
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.company}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Job link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The job you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const formatSalary = (salary: string) => {
    return salary
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Jobs
        </motion.button>

        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {job.company?.charAt(0) || 'C'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Building className="h-5 w-5 mr-2" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-medium">{formatSalary(job.salary)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  <span>{job.jobType}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                  <span>Posted {getTimeAgo(job.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {job.requirements.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 lg:ml-8">
              <button
                onClick={handleApply}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Apply Now
              </button>
              <button
                onClick={handleSave}
                className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  isSaved
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bookmark className={`h-5 w-5 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save Job'}
              </button>
              <button
                onClick={handleShare}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">{job.description}</p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
                <ul className="space-y-2 mb-6">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">What We Offer</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">Competitive salary and benefits</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">Flexible working arrangements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">Professional development opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">Health and wellness programs</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Company Info & Similar Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Company Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">About {job.company}</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">Technology Company</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">501-1000 employees</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{job.location}</span>
                </div>
              </div>
              <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                {job.company} is a leading technology company focused on innovation and creating 
                exceptional user experiences. We're committed to building a diverse and inclusive 
                workplace where everyone can thrive.
              </p>
            </div>

            {/* Quick Apply */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Quick Apply</h3>
              <p className="text-blue-100 mb-4 text-sm">
                Don't miss out on this opportunity! Apply now and take the next step in your career.
              </p>
              <button
                onClick={handleApply}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Apply Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default JobDetails