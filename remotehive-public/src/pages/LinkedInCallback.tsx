import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const LinkedInCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signInWithLinkedIn } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        const state = searchParams.get('state')

        console.log('LinkedIn Callback Debug:', {
          code: code ? 'present' : 'missing',
          error,
          errorDescription,
          state,
          fullUrl: window.location.href,
          searchParams: Object.fromEntries(searchParams.entries())
        })

        if (error) {
          console.error('LinkedIn OAuth Error:', { error, errorDescription })
          // Send error to parent window if in popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'LINKEDIN_AUTH_ERROR',
              error: error,
              error_description: errorDescription
            }, window.location.origin)
            window.close()
          } else {
            // If not in popup, show error and redirect
            throw new Error(`LinkedIn OAuth error: ${error} - ${errorDescription}`)
          }
          return
        }

        if (!code) {
          console.error('LinkedIn OAuth - No code received')
          if (window.opener) {
            window.opener.postMessage({
              type: 'LINKEDIN_AUTH_ERROR',
              error: 'no_code',
              error_description: 'No authorization code received'
            }, window.location.origin)
            window.close()
          } else {
            throw new Error('No authorization code received from LinkedIn')
          }
          return
        }

        // Extract role from state
        let role: 'job_seeker' | 'employer' = 'job_seeker'
        if (state) {
          const decodedState = decodeURIComponent(state)
          const parts = decodedState.split('|')
          
          for (const part of parts) {
            if (part.startsWith('role:')) {
              const extractedRole = part.split(':', 2)[1] as 'job_seeker' | 'employer'
              if (extractedRole === 'employer' || extractedRole === 'job_seeker') {
                role = extractedRole
              }
            }
          }
        }

        // If in popup, send success to parent window
        if (window.opener) {
          console.log('LinkedIn OAuth Success - Code received (popup mode)')
          window.opener.postMessage({
            type: 'LINKEDIN_AUTH_SUCCESS',
            code: code,
            state: state,
            role: role
          }, window.location.origin)
          window.close()
          return
        }

        // If not in popup, handle authentication directly
        console.log('LinkedIn OAuth Success - Processing authentication (direct mode)')
        const user = await signInWithLinkedIn({
          token: code,
          role,
        })

        if (user) {
          // Redirect based on user's actual role from the backend response
          console.log('LinkedIn User authenticated:', user)
          console.log('LinkedIn User role from backend:', user.role)
          console.log('LinkedIn Role from state:', role)
          
          if (user.role === 'employer') {
            console.log('Redirecting to employer dashboard')
            navigate('/dashboard/employer')
          } else {
            console.log('Redirecting to job seeker dashboard')
            navigate('/dashboard/jobseeker')
          }
        } else {
          throw new Error('LinkedIn authentication failed')
        }

      } catch (err) {
        console.error('LinkedIn OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'LinkedIn authentication failed')
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, navigate, signInWithLinkedIn])

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
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Processing LinkedIn authentication...</p>
        <div className="mt-4 text-xs text-gray-400">
          Debug: Check browser console for details
        </div>
      </div>
    </div>
  )
}

export default LinkedInCallback