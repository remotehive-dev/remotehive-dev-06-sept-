import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  UserCheck, 
  DollarSign,
  Activity,
  Bell
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

interface DashboardStats {
  total_users: number
  active_users: number
  total_jobs: number
  active_jobs: number
  total_applications: number
  pending_applications: number
  total_revenue: number
  monthly_revenue: number
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  database_status: 'connected' | 'disconnected'
  api_response_time: number
  memory_usage: number
  cpu_usage: number
  disk_usage: number
  last_backup: string
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/v1/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
      
      // Fetch system health
      const healthResponse = await fetch('/api/v1/admin/system-health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setHealth(healthData)
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your RemoteHive platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'settings', name: 'Settings', icon: Settings },
              { id: 'security', name: 'Security', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {stats.active_users} active
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_jobs.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {stats.active_jobs} active
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Applications</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_applications.toLocaleString()}</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        {stats.pending_applications} pending
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">${stats.total_revenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">
                        ${stats.monthly_revenue.toLocaleString()} this month
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
            )}

            {/* System Health */}
            {health && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(health.status)}`}>
                    {health.status?.charAt(0).toUpperCase() + health.status?.slice(1) || 'Unknown'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database</span>
                      <span className={`text-sm font-medium ${
                        health.database_status === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {health.database_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Response</span>
                      <span className="text-sm font-medium text-gray-900">
                        {health.api_response_time}ms
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {health.memory_usage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {health.cpu_usage}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Disk Usage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {health.disk_usage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Backup</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(health.last_backup).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Manage Users</span>
                </button>
                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">System Settings</span>
                </button>
                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Bell className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Send Announcement</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
            <p className="text-gray-600">User management interface will be implemented here.</p>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
            <p className="text-gray-600">System settings interface will be implemented here.</p>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Logs</h3>
            <p className="text-gray-600">Security monitoring and admin logs will be implemented here.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard