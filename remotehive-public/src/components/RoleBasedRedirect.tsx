import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Component that redirects authenticated users to their role-based dashboard
 * Used on login/register pages to prevent authenticated users from accessing them
 */
const RoleBasedRedirect: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If not authenticated, this component shouldn't be rendered
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Redirect based on user role
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'employer':
        return '/dashboard/employer'
      case 'job_seeker':
        return '/dashboard/jobseeker'
      case 'admin':
      case 'super_admin':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  const redirectPath = getRedirectPath(user.role)
  
  return <Navigate to={redirectPath} replace />
}

export default RoleBasedRedirect