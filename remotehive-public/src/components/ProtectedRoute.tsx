import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'job_seeker' | 'employer' | 'admin' | 'super_admin'
  allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // Store the attempted URL for redirect after login
    localStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // If user has wrong role, redirect to their appropriate dashboard
    const redirectPath = getRoleBasedRedirectPath(user.role)
    return <Navigate to={redirectPath} replace />
  }

  // Check allowed roles (for more flexible access control)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = getRoleBasedRedirectPath(user.role)
    return <Navigate to={redirectPath} replace />
  }

  // User is authenticated and has correct role
  return <>{children}</>
}

// Helper function to get role-based redirect path
const getRoleBasedRedirectPath = (role: string): string => {
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

export default ProtectedRoute