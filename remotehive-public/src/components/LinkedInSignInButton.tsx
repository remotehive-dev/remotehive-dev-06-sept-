import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface LinkedInSignInButtonProps {
  onSuccess?: (data: { code: string; role: 'employer' | 'job_seeker' }) => void
  onError?: (error: string) => void
  role?: 'employer' | 'job_seeker'
}

const LinkedInSignInButton: React.FC<LinkedInSignInButtonProps> = ({ 
  onSuccess, 
  onError, 
  role = 'job_seeker' 
}) => {
  const { signInWithLinkedIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLinkedInSignIn = async () => {
    try {
      setIsLoading(true)
      
      // LinkedIn OAuth URL
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${import.meta.env.VITE_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/linkedin/callback')}&scope=r_liteprofile r_emailaddress`
      
      // Open LinkedIn OAuth in a popup
      const popup = window.open(
        linkedInAuthUrl,
        'linkedin-signin',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      )
      
      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          setIsLoading(false)
        }
      }, 1000)
      
      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
          try {
            const data = {
              code: event.data.code,
              role
            }
            onSuccess?.(data)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'LinkedIn sign-in failed'
            onError?.(message)
          } finally {
            popup?.close()
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            setIsLoading(false)
          }
        } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
          onError?.(event.data.error || 'LinkedIn sign-in failed')
          popup?.close()
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setIsLoading(false)
        }
      }
      
      window.addEventListener('message', messageListener)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize LinkedIn sign-in'
      onError?.(message)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLinkedInSignIn}
      disabled={isLoading}
      className="w-full bg-[#0077B5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#005885] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
      ) : (
        <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )}
      {isLoading ? 'Signing in...' : 'Continue with LinkedIn'}
    </button>
  )
}

export default LinkedInSignInButton