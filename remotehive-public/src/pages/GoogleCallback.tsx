import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        // Extract role from state
        let role: 'job_seeker' | 'employer' = 'job_seeker'
        let redirectPath = '/'

        if (state) {
          const decodedState = decodeURIComponent(state)
          const parts = decodedState.split('|')
          
          for (const part of parts) {
            if (part.startsWith('role:')) {
              const extractedRole = part.split(':', 2)[1] as 'job_seeker' | 'employer'
              if (extractedRole === 'employer' || extractedRole === 'job_seeker') {
                role = extractedRole
              }
            } else if (part.startsWith('redirect:')) {
              redirectPath = decodeURIComponent(part.split(':', 2)[1])
            }
          }
        }

        // Sign in with the authorization code
        try {
          const user = await signInWithGoogle({
            token: code, // This is the authorization code
            role,
          })

          // If we get here, authentication was successful
          if (user) {
            // Redirect based on user's actual role from the backend response
            console.log('User authenticated:', user)
            console.log('User role from backend:', user.role)
            console.log('Role from state:', role)
            
            if (user.role === 'employer') {
              console.log('Redirecting to employer dashboard')
              navigate('/dashboard/employer')
            } else {
              console.log('Redirecting to job seeker dashboard')
              navigate('/dashboard/jobseeker')
            }
          } else {
            throw new Error('Authentication failed - no user returned')
          }
        } catch (authError) {
          console.error('Authentication error details:', authError)
          
          // Check if it's a 400 Bad Request error
          if (authError instanceof Error && authError.message.includes('400')) {
            throw new Error('Invalid authorization code. Please try signing in again.')
          }
          
          // Check if it's a Request failed error
          if (authError instanceof Error && authError.message.includes('Request failed')) {
            throw new Error('Authentication server error. Please try again later.')
          }
          
          // Re-throw the original error
          throw authError
        }
      } catch (err) {
        console.error('Google OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, navigate, signInWithGoogle])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Failed</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Completing Sign In</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we complete your authentication...</p>
        </div>
      </div>
    </div>
  )
}