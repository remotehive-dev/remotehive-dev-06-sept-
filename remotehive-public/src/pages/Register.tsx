import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Building, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import GoogleSignInButton from '../components/GoogleSignInButton'
import LinkedInSignInButton from '../components/LinkedInSignInButton'
import SSOSignInButton from '../components/SSOSignInButton'
import LoadingSpinner from '../components/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  role: 'job_seeker' | 'employer'
  companyName?: string
  agreeToTerms: boolean
}

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  
  const [step, setStep] = useState(1) // 1: Role Selection, 2: Account Details
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'job_seeker',
    companyName: '',
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) setError('') // Clear error when user starts typing

    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value)
    }
  }

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    setPasswordStrength(strength)
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Weak', color: 'text-red-500' }
      case 2:
      case 3:
        return { text: 'Medium', color: 'text-yellow-500' }
      case 4:
      case 5:
        return { text: 'Strong', color: 'text-green-500' }
      default:
        return { text: '', color: '' }
    }
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (formData.role === 'employer' && !formData.companyName) {
      setError('Company name is required for employer accounts')
      return false
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        company_name: formData.companyName,
      }
      
      await signUp(signUpData)
      
      // Show success toast notification
      const roleDisplayName = formData.role === 'job_seeker' ? 'Job Seeker' : 'Employer'
      toast.success(`${roleDisplayName} account created successfully! Welcome to RemoteHive.`, {
        duration: 4000,
        position: 'top-right',
        icon: '🎉'
      })
        
        // Small delay to show the toast before navigation
        setTimeout(() => {
          // Redirect based on role using new dashboard paths
          if (formData.role === 'employer') {
            navigate('/dashboard/employer')
          } else if (formData.role === 'job_seeker') {
            navigate('/dashboard/jobseeker')
          } else {
            navigate('/')
          }
        }, 500)
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }



  const roleOptions = [
    {
      value: 'job_seeker',
      title: 'Job Seeker',
      description: 'Looking for remote job opportunities',
      icon: User,
      features: ['Browse thousands of remote jobs', 'Create professional profile', 'Apply with one click', 'Get job recommendations'],
    },
    {
      value: 'employer',
      title: 'Employer',
      description: 'Hiring remote talent for your company',
      icon: Building,
      features: ['Post unlimited job listings', 'Access talent database', 'Manage applications', 'Company branding tools'],
    },
  ]

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Join RemoteHive</h1>
            <p className="text-xl text-gray-600">Choose your account type to get started</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roleOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 ${
                    formData.role === option.value
                      ? 'border-blue-500 ring-4 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: option.value as 'job_seeker' | 'employer' }))}
                >
                  <div className="text-center mb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{option.title}</h3>
                    <p className="text-gray-600">{option.description}</p>
                  </div>

                  <div className="space-y-3">
                    {option.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {formData.role === option.value && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center justify-center text-blue-700 font-medium">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Selected
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setStep(2)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Continue
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center mx-auto"
            >
              ← Back to role selection
            </button>
            <div className="text-4xl mb-4">
              {formData.role === 'employer' ? '🏢' : '👤'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create {formData.role === 'employer' ? 'Employer' : 'Job Seeker'} Account
            </h1>
            <p className="text-gray-600">Fill in your details to get started</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Company Name (for employers) */}
            {formData.role === 'employer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={getPasswordStrengthText().color}>
                      {getPasswordStrengthText().text}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength <= 2 ? 'bg-red-500' :
                        passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label className="ml-3 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Social Sign Up Options */}
          <div className="space-y-3">
            <GoogleSignInButton 
              role={formData.role}
              onSuccess={() => {
                // Success handling is done in GoogleCallback component
              }}
              onError={(error) => setError(error)}
            />
            <LinkedInSignInButton />
            <SSOSignInButton />
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register