import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import { authAPI, User, SignUpData, SignInData, GoogleAuthData, LinkedInAuthData, SSOAuthData } from '../lib/auth-api'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (data: SignUpData) => Promise<void>
  signIn: (data: SignInData) => Promise<User>
  signInWithGoogle: (data: GoogleAuthData) => Promise<User>
  signInWithLinkedIn: (data: LinkedInAuthData) => Promise<User>
  signInWithSSO: (data: SSOAuthData) => Promise<User>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerificationEmail: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user && authAPI.isAuthenticated()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const currentUser = await authAPI.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        authAPI.clearToken()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Auto-refresh token
  useEffect(() => {
    if (!isAuthenticated) return

    const refreshInterval = setInterval(async () => {
      try {
        await authAPI.refreshToken()
      } catch (error) {
        console.error('Token refresh failed:', error)
        await signOut()
      }
    }, 15 * 60 * 1000) // Refresh every 15 minutes

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated])

  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true)
      const response = await authAPI.signUp(data)
      setUser(response.user)
      toast.success('Account created successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: SignInData) => {
    try {
      setLoading(true)
      const response = await authAPI.signIn(data)
      setUser(response.user)
      toast.success('Signed in successfully!')
      return response.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async (data: GoogleAuthData) => {
    try {
      setLoading(true)
      const response = await authAPI.signInWithGoogle(data)
      setUser(response.user)
      toast.success('Signed in with Google successfully!')
      return response.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithLinkedIn = async (data: LinkedInAuthData) => {
    try {
      setLoading(true)
      const response = await authAPI.signInWithLinkedIn(data)
      setUser(response.user)
      toast.success('Signed in with LinkedIn successfully!')
      return response.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with LinkedIn'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithSSO = async (data: SSOAuthData) => {
    try {
      setLoading(true)
      const response = await authAPI.signInWithSSO(data)
      setUser(response.user)
      toast.success('Signed in with SSO successfully!')
      return response.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with SSO'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await authAPI.signOut()
      setUser(null)
      toast.success('Signed out successfully!')
    } catch (error) {
      console.error('Sign out error:', error)
      // Still clear local state even if API call fails
      setUser(null)
      authAPI.clearToken()
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword(email)
      toast.success('Password reset email sent!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email'
      toast.error(message)
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      await authAPI.resetPassword(token, password)
      toast.success('Password reset successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password'
      toast.error(message)
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      await authAPI.verifyEmail(token)
      toast.success('Email verified successfully!')
      await refreshUser()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify email'
      toast.error(message)
      throw error
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      await authAPI.resendVerificationEmail(email)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification email'
      toast.error(message)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const currentUser = await authAPI.getCurrentUser()
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      await signOut()
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithSSO,
    signOut,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}