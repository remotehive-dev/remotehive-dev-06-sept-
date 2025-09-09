import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase, Users, TrendingUp, ArrowRight, Star, CheckCircle } from 'lucide-react'
import { jobsApi, JobPost, companiesApi, Company } from '../lib/api'
import { cmsApi, CMSPage, Review, SEOSettings } from '../lib/cms'
import LoadingSpinner from '../components/LoadingSpinner'
import CompanyLogosCarousel from '../components/CompanyLogosCarousel'

const Home: React.FC = () => {
  const [featuredJobs, setFeaturedJobs] = useState<JobPost[]>([])
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([])
  const [trendingCompanies, setTrendingCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  
  // CMS Data
  const [cmsPages, setCmsPages] = useState<CMSPage[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [seoSettings, setSeoSettings] = useState<SEOSettings | null>(null)
  const [cmsLoading, setCmsLoading] = useState(true)

  useEffect(() => {
    loadFeaturedJobs()
    loadCompanies()
    loadCMSData()
  }, [])

  const loadFeaturedJobs = async () => {
    try {
      const jobs = await jobsApi.getFeaturedJobs(6)
      setFeaturedJobs(jobs)
    } catch (error) {
      console.error('Error loading featured jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const [featured, trending] = await Promise.all([
        companiesApi.getFeaturedCompanies(4),
        companiesApi.getTrendingCompanies(4)
      ])
      setFeaturedCompanies(featured)
      setTrendingCompanies(trending)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setCompaniesLoading(false)
    }
  }

  const loadCMSData = async () => {
    try {
      const [pages, reviewsData, seoData] = await Promise.all([
        cmsApi.getPages(),
        cmsApi.getReviews(true), // Get featured reviews
        cmsApi.getSEOSettings()
      ])
      setCmsPages(pages)
      setReviews(reviewsData)
      setSeoSettings(seoData)
    } catch (error) {
      console.error('Error loading CMS data:', error)
    } finally {
      setCmsLoading(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('search', searchQuery)
    if (searchLocation) params.append('location', searchLocation)
    window.location.href = `/jobs?${params.toString()}`
  }

  const stats = [
    { label: 'Active Jobs', value: '10,000+', icon: Briefcase },
    { label: 'Companies', value: '2,500+', icon: Users },
    { label: 'Success Rate', value: '95%', icon: TrendingUp },
    { label: 'Countries', value: '50+', icon: MapPin },
  ]

  const features = [
    {
      title: 'Remote-First Jobs',
      description: 'Curated remote opportunities from top companies worldwide',
      icon: '🌍',
    },
    {
      title: 'Smart Matching',
      description: 'AI-powered job recommendations based on your skills and preferences',
      icon: '🤖',
    },
    {
      title: 'Instant Applications',
      description: 'Apply to multiple jobs with one click using your profile',
      icon: '⚡',
    },
    {
      title: 'Career Growth',
      description: 'Access to mentorship, courses, and career development resources',
      icon: '📈',
    },
  ]

  // Use CMS reviews data or fallback to sample testimonials
  const testimonials = reviews.length > 0 ? reviews.slice(0, 3).map(review => ({
    name: review.author_name,
    role: 'RemoteHive User',
    company: '',
    content: review.content,
    avatar: '👤',
    rating: review.rating
  })) : [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'TechCorp',
      content: 'RemoteHive helped me find my dream remote job in just 2 weeks. The platform is amazing!',
      avatar: '👩‍💻',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'StartupXYZ',
      content: 'As an employer, RemoteHive connects us with top talent from around the world.',
      avatar: '👨‍💼',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      company: 'DesignStudio',
      content: 'The quality of remote opportunities on RemoteHive is unmatched.',
      avatar: '👩‍🎨',
      rating: 5
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Find Your Dream
              <span className="text-gradient block">Remote Job</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with top companies offering remote opportunities worldwide. 
              Your next career move is just a click away.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Location (optional for remote)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
              >
                Search Jobs
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 shadow-lg">
                    <Icon className="h-8 w-8 text-blue-600 mx-auto" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Remote Jobs</h2>
            <p className="text-xl text-gray-600">Discover amazing opportunities from top companies</p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="job-card p-6 job-card-3d"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title || 'No title'}</h3>
                      <p className="text-blue-600 font-medium">{job.company_name || 'Unknown company'}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {job.work_location || 'Remote'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {job.description ? job.description.substring(0, 150) + '...' : 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location || 'Location not specified'}
                    </span>
                    {job.salary_min && job.salary_max && (
                      <span className="text-green-600 font-semibold">
                        ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills_required && job.skills_required.length > 0 && job.skills_required.slice(0, 3).map((skill) => (
                      <span key={skill} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    to={`/jobs/${job.id}`}
                    className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    View Details
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/jobs"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              View All Jobs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Company Logos Carousel */}
      <CompanyLogosCarousel />

      {/* Featured & Trending Companies */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Top Companies Hiring</h2>
            <p className="text-xl text-gray-600">Discover amazing companies offering remote opportunities</p>
          </div>

          {companiesLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-16">
              {/* Featured Companies */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Featured Companies</h3>
                  <Link
                    to="/companies"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
                          {company.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{company.name}</h4>
                          {company.is_verified && (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {company.company_description || 'Leading company in the industry'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {company.industry || 'Technology'}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {company.company_size || 'Medium'}
                        </span>
                      </div>
                      
                      <Link
                        to={`/companies/${company.id}`}
                        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg mt-4 transition-all duration-200 text-sm font-medium"
                      >
                        View Jobs
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Trending Companies */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Trending Companies</h3>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    🔥 Hot
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 relative"
                    >
                      <div className="absolute top-3 right-3">
                        <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                          Trending
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
                          {company.company_name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{company.company_name}</h4>
                          {company.is_verified && (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {company.company_description || 'Rapidly growing company with new opportunities'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {company.industry || 'Technology'}
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          {company.company_size || 'Growing'}
                        </span>
                      </div>
                      
                      <Link
                        to={`/companies/${company.id}`}
                        className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg mt-4 hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium"
                      >
                        View Jobs
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/companies"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Explore All Companies
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Discover Jobs by Popular Roles */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Illustration and content */}
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-3xl p-8 lg:p-12">
                <div className="flex items-center justify-center mb-8">
                  <div className="relative">
                    {/* Simple illustration using CSS */}
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">💼</span>
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✨</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    Discover jobs across popular roles
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Select a role and we'll show you relevant jobs for it!
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Popular roles grid */}
            <div className="order-1 lg:order-2">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Full Stack Developer', jobs: '20.1K+ Jobs', color: 'from-blue-500 to-blue-600' },
                  { title: 'Mobile / App Developer', jobs: '3.1K+ Jobs', color: 'from-green-500 to-green-600' },
                  { title: 'Front End Developer', jobs: '5.1K+ Jobs', color: 'from-purple-500 to-purple-600' },
                  { title: 'DevOps Engineer', jobs: '3.2K+ Jobs', color: 'from-orange-500 to-orange-600' },
                  { title: 'Engineering Manager', jobs: '1.5K+ Jobs', color: 'from-red-500 to-red-600' },
                  { title: 'Technical Lead', jobs: '10.9K+ Jobs', color: 'from-indigo-500 to-indigo-600' }
                ].map((role, index) => (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 cursor-pointer group hover:scale-105"
                    onClick={() => {
                      // Navigate to jobs page with role filter
                      window.location.href = `/jobs?role=${encodeURIComponent(role.title)}`;
                    }}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${role.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base group-hover:text-blue-600 transition-colors duration-200">
                      {role.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm flex items-center">
                      {role.jobs}
                      <ArrowRight className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </p>
                  </motion.div>
                ))}
              </div>
              
              {/* View all roles button */}
              <div className="mt-8 text-center">
                <Link
                  to="/jobs"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  View all roles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hire from RemoteHive */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Hire from RemoteHive?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with top remote talent and build your dream team with our comprehensive hiring platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left side - Benefits list */}
            <div className="space-y-8">
              {[
                {
                  icon: '🎯',
                  title: 'Pre-screened Talent',
                  description: 'Access a curated pool of verified remote professionals with proven track records and skills assessments.'
                },
                {
                  icon: '🌍',
                  title: 'Global Reach',
                  description: 'Tap into worldwide talent without geographical limitations. Find the perfect fit regardless of location.'
                },
                {
                  icon: '⚡',
                  title: 'Fast Hiring Process',
                  description: 'Streamlined recruitment with AI-powered matching, reducing time-to-hire by up to 60%.'
                },
                {
                  icon: '💰',
                  title: 'Cost-Effective Solutions',
                  description: 'Reduce hiring costs with competitive pricing and no hidden fees. Pay only for successful placements.'
                }
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right side - Stats and CTA */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Join 500+ Companies</h3>
                <p className="text-gray-600 mb-6">
                  Already hiring successfully through RemoteHive
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  { number: '10K+', label: 'Active Candidates' },
                  { number: '95%', label: 'Success Rate' },
                  { number: '48hrs', label: 'Avg. Response Time' },
                  { number: '500+', label: 'Companies Hiring' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-blue-600 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link
                  to="/register?type=employer"
                  className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Start Hiring Today
                </Link>
                <Link
                  to="/pricing"
                  className="block w-full text-center border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200"
                >
                  View Pricing Plans
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    No Setup Fees
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    24/7 Support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-lg text-gray-700 italic mb-4">
              "RemoteHive helped us build our entire development team in just 3 weeks. The quality of candidates and the streamlined process exceeded our expectations."
            </blockquote>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Sarah Chen</div>
                <div className="text-gray-600 text-sm">CTO at TechFlow Inc.</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose RemoteHive?</h2>
            <p className="text-xl text-gray-600">Everything you need to find or post remote jobs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied job seekers and employers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Remote Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who have found their perfect remote job through RemoteHive
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center justify-center"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 inline-flex items-center justify-center"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home