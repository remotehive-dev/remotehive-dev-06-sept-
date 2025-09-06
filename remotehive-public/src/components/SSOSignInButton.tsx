import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Building2 } from 'lucide-react'

interface SSOSignInButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  role?: 'employer' | 'job_seeker'
}

const SSOSignInButton: React.FC<SSOSignInButtonProps> = ({ 
  onSuccess, 
  onError, 
  role = 'job_seeker' 
}) => {
  const { signInWithSSO } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showSSOOptions, setShowSSOOptions] = useState(false)

  const ssoProviders = [
    { id: 'okta', name: 'Okta', color: 'bg-blue-600' },
    { id: 'azure', name: 'Microsoft Azure AD', color: 'bg-blue-500' },
    { id: 'auth0', name: 'Auth0', color: 'bg-orange-500' },
    { id: 'onelogin', name: 'OneLogin', color: 'bg-green-600' },
    { id: 'ping', name: 'PingIdentity', color: 'bg-purple-600' },
    { id: 'saml', name: 'Generic SAML', color: 'bg-gray-600' }
  ]

  const handleSSOSignIn = async (provider: string) => {
    try {
      setIsLoading(true)
      
      // Generate SSO URL based on provider
      const ssoUrl = `${window.location.origin}/auth/sso/${provider}?role=${role}&redirect_uri=${encodeURIComponent(window.location.href)}`
      
      // Open SSO in a popup
      const popup = window.open(
        ssoUrl,
        'sso-signin',
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
        
        if (event.data.type === 'SSO_AUTH_SUCCESS') {
          try {
            await signInWithSSO({
              provider,
              token: event.data.token,
              role
            })
            onSuccess?.()
          } catch (error) {
            const message = error instanceof Error ? error.message : 'SSO sign-in failed'
            onError?.(message)
          } finally {
            popup?.close()
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            setIsLoading(false)
            setShowSSOOptions(false)
          }
        } else if (event.data.type === 'SSO_AUTH_ERROR') {
          onError?.(event.data.error || 'SSO sign-in failed')
          popup?.close()
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setIsLoading(false)
          setShowSSOOptions(false)
        }
      }
      
      window.addEventListener('message', messageListener)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize SSO sign-in'
      onError?.(message)
      setIsLoading(false)
    }
  }

  if (showSSOOptions) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Choose your SSO provider:</div>
        {ssoProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSSOSignIn(provider.id)}
            disabled={isLoading}
            className={`w-full ${provider.color} text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Signing in...' : provider.name}
          </button>
        ))}
        <button
          onClick={() => setShowSSOOptions(false)}
          className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 text-sm"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowSSOOptions(true)}
      disabled={isLoading}
      className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      <Building2 className="h-5 w-5 mr-3" />
      Continue with SSO
    </button>
  )
}

export default SSOSignInButton