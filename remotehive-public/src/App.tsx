import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { User } from './lib/api'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleBasedRedirect from './components/RoleBasedRedirect'

// Pages
import Home from './pages/Home'
import JobFeed from './pages/JobFeed'
import JobDetails from './pages/JobDetails'
import Blogs from './pages/Blogs'
import About from './pages/About'
import Contact from './pages/Contact'
import Pricing from './pages/Pricing'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import Login from './pages/Login'
import Register from './pages/Register'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerMyJobs from './pages/EmployerMyJobs'
import EmployerCandidates from './pages/EmployerCandidates'
import EmployerMessages from './pages/EmployerMessages'
import EmployerAnalytics from './pages/EmployerAnalytics'
import EmployerSchedule from './pages/EmployerSchedule'
import EmployerSettings from './pages/EmployerSettings'
import JobSeekerDashboard from './pages/JobSeekerDashboard'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/AdminDashboard'
import AdminUserManagement from './pages/AdminUserManagement'
import AdminSettings from './pages/AdminSettings'
import AdminAnalytics from './pages/AdminAnalytics'
import EmailVerification from './pages/EmailVerification'
import GoogleCallback from './pages/GoogleCallback'
import LinkedInCallback from './pages/LinkedInCallback'



// Component to conditionally render Navbar and Footer
function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isDashboardRoute = location.pathname.includes('/dashboard') || 
                          location.pathname.includes('/admin') ||
                          location.pathname.includes('/employer') ||
                          location.pathname.includes('/jobseeker')

  return (
    <>
      {!isDashboardRoute && <Navbar />}
      {children}
      {!isDashboardRoute && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  // Enhanced Protected route component with role-based navigation guards
  const ProtectedRoute: React.FC<{ 
    children: React.ReactNode, 
    requiredRole?: string,
    allowedRoles?: string[]
  }> = ({ 
    children, 
    requiredRole,
    allowedRoles 
  }) => {
    if (loading) {
      return <LoadingSpinner />
    }

    if (!user) {
      // Store the attempted URL for redirect after login
      const currentPath = window.location.pathname
      localStorage.setItem('redirectAfterLogin', currentPath)
      return <Navigate to="/login" replace />
    }

    // Check if user has required role or is in allowed roles
    if (requiredRole || allowedRoles) {
      let hasAccess = false

      if (requiredRole) {
        // Allow both admin and super_admin for admin routes
        if (requiredRole === 'admin' && ['admin', 'super_admin'].includes(user.role)) {
          hasAccess = true
        }
        // For other roles, exact match required
        else if (user.role === requiredRole) {
          hasAccess = true
        }
      }

      if (allowedRoles && allowedRoles.includes(user.role)) {
        hasAccess = true
      }

      if (!hasAccess) {
        // Redirect to appropriate dashboard based on user role
        if (user.role === 'admin' || user.role === 'super_admin') {
          return <Navigate to="/admin/dashboard" replace />
        } else if (user.role === 'employer') {
          return <Navigate to="/dashboard/employer" replace />
        } else if (user.role === 'job_seeker') {
          return <Navigate to="/dashboard/jobseeker" replace />
        } else {
          return <Navigate to="/" replace />
        }
      }
    }

    return <>{children}</>
  }

  // Redirect based on user role
  const RoleBasedRedirect: React.FC = () => {
    if (loading) {
      return <LoadingSpinner />
    }

    if (!user) {
      return <Navigate to="/login" replace />
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user.role === 'employer') {
      return <Navigate to="/dashboard/employer" replace />
    } else if (user.role === 'job_seeker') {
      return <Navigate to="/dashboard/jobseeker" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
      <NotificationProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <ConditionalLayout>
              <main className="flex-1">
                <AnimatePresence mode="wait">
                  <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<JobFeed />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                
                {/* Auth Routes */}
                <Route 
                  path="/login" 
                  element={user ? <RoleBasedRedirect /> : <Login />} 
                />
                <Route 
                  path="/register" 
                  element={user ? <RoleBasedRedirect /> : <Register />} 
                />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/auth/google/callback" element={<GoogleCallback />} />
                <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
                {/* Redirect old Clerk routes */}
                <Route path="/clerk-login" element={<Navigate to="/login" replace />} />
                <Route path="/clerk-register" element={<Navigate to="/register" replace />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard/employer" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/jobseeker" 
                  element={
                    <ProtectedRoute requiredRole="job_seeker">
                      <JobSeekerDashboard />
                    </ProtectedRoute>
                  } 
                />
                {/* Legacy employer routes - redirect to new paths */}
                <Route 
                  path="/employer/dashboard" 
                  element={<Navigate to="/dashboard/employer" replace />}
                />
                <Route 
                  path="/employer/my-jobs" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerMyJobs />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employer/candidates" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerCandidates />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employer/messages" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerMessages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employer/analytics" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerAnalytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employer/schedule" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerSchedule />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employer/settings" 
                  element={
                    <ProtectedRoute requiredRole="employer">
                      <EmployerSettings />
                    </ProtectedRoute>
                  } 
                />
                {/* Legacy jobseeker routes - redirect to new paths */}
                <Route 
                  path="/jobseeker/dashboard" 
                  element={<Navigate to="/dashboard/jobseeker" replace />}
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUserManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } 
                />
                
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </main>
            </ConditionalLayout>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </NotificationProvider>
  )
}

export default App
