import React, { useState, useEffect } from 'react'
import { SignUp, useUser, useClerk } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Building, User, ArrowLeft, AlertCircle } from 'lucide-react'
import { clerkAuthApi } from '../lib/clerk-api'
import { toast } from 'react-hot-toast'

interface RoleSelectionProps {
  onRoleSelect: (role: 'employer' | 'jobseeker') => void
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-12">
          <div className="text-4xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join RemoteHive</h1>
          <p className="text-xl text-gray-600">Choose your account type to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Job Seeker Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-300"
            onClick={() => onRoleSelect('jobseeker')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Job Seeker</h3>
              <p className="text-gray-600 mb-6">
                Find your dream remote job with personalized recommendations and AI-powered career assistance.
              </p>
              <ul className="text-left text-gray-600 space-y-2 mb-8">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Browse thousands of remote jobs
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Get personalized job recommendations
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  AI-powered career assistance
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Track applications and interviews
                </li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Sign Up as Job Seeker
              </button>
            </div>
          </motion.div>

          {/* Employer Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer border-2 border-transparent hover:border-green-500 transition-all duration-300"
            onClick={() => onRoleSelect('employer')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Employer</h3>
              <p className="text-gray-600 mb-6">
                Find top remote talent with advanced filtering, AI-powered matching, and comprehensive hiring tools.
              </p>
              <ul className="text-left text-gray-600 space-y-2 mb-8">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Post unlimited job listings
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  AI-powered candidate matching
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Advanced applicant tracking
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Analytics and insights
                </li>
              </ul>
              <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Sign Up as Employer
              </button>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in here
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

interface ClerkSignUpProps {
  role: 'employer' | 'jobseeker'
  onBack: () => void
}

const ClerkSignUpForm: React.FC<ClerkSignUpProps> = ({ role, onBack }) => {
  const { user, isLoaded } = useUser()
  const [clerkError, setClerkError] = useState<string | null>(null)
  
  useEffect(() => {
    const createLeadForEmployer = async () => {
      if (isLoaded && user && role === 'employer') {
        try {
          // Call the backend to sync user and create lead
          await clerkAuthApi.syncUserWithBackend({
            clerkUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: 'employer'
          })
          
          toast.success('Account created successfully! Lead has been created in admin panel.')
        } catch (error) {
          console.error('Error creating lead:', error)
          toast.error('Account created but failed to create lead. Please contact support.')
        }
      }
    }
    
    createLeadForEmployer()
  }, [user, isLoaded, role])
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to role selection
          </button>
          <div className="text-4xl mb-4">{role === 'employer' ? '🏢' : '👨‍💼'}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sign up as {role === 'employer' ? 'Employer' : 'Job Seeker'}
          </h1>
          <p className="text-gray-600">Create your RemoteHive account</p>
        </div>
        
        {clerkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {clerkError === 'ERROR_ZERO_BALANCE' 
                    ? 'Account creation is temporarily unavailable. Please try again later or contact support.'
                    : clerkError
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignUp 
            routing="path"
            path="/clerk-register"
            signInUrl="/clerk-login"
            appearance={{
              elements: {
                formButtonPrimary: `${role === 'employer' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-sm normal-case`,
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border border-gray-300 rounded-lg px-3 py-2',
                footerActionLink: `${role === 'employer' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'}`
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

const ClerkRegister: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'employer' | 'jobseeker' | null>(null)

  const handleRoleSelect = (role: 'employer' | 'jobseeker') => {
    setSelectedRole(role)
  }

  const handleBack = () => {
    setSelectedRole(null)
  }

  if (selectedRole) {
    return <ClerkSignUpForm role={selectedRole} onBack={handleBack} />
  }

  return <RoleSelection onRoleSelect={handleRoleSelect} />
}

export default ClerkRegister