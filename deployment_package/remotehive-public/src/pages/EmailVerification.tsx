import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail, resendVerificationEmail } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. No token provided.')
      return
    }

    const handleVerification = async () => {
      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Your email has been successfully verified! You can now access all features.')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      } catch (error) {
        console.error('Verification error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Verification failed'
        
        if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
          setStatus('expired')
          setMessage('This verification link has expired or is invalid. Please request a new one.')
        } else {
          setStatus('error')
          setMessage(errorMessage)
        }
      }
    }

    handleVerification()
  }, [token, verifyEmail, navigate])

  const handleResendVerification = async () => {
    const email = searchParams.get('email')
    if (!email) {
      toast.error('Email address not found. Please try registering again.')
      return
    }

    setIsResending(true)
    try {
      await resendVerificationEmail(email)
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <ArrowPathIcon className="h-16 w-16 text-blue-500 animate-spin" />
        )
      case 'success':
        return (
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        )
      case 'error':
      case 'expired':
        return (
          <XCircleIcon className="h-16 w-16 text-red-500" />
        )
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'expired':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Your Email...'
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Verification Failed'
      case 'expired':
        return 'Link Expired'
      default:
        return 'Email Verification'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex items-center justify-center"
            >
              {getStatusIcon()}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`mt-6 text-3xl font-extrabold ${getStatusColor()}`}
            >
              {getStatusTitle()}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-sm text-gray-600"
            >
              {message}
            </motion.p>

            {status === 'success' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-2 text-xs text-gray-500"
              >
                Redirecting to login page in 3 seconds...
              </motion.p>
            )}

            {(status === 'expired' || status === 'error') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 space-y-4"
              >
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Login
                </button>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={() => navigate('/login')}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue to Login
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EmailVerification