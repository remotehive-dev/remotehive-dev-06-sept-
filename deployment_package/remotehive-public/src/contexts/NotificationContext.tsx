import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
// Using FastAPI backend for notification management
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

export interface Notification {
  id: number
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  action_url?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: number
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  application_updates: boolean
  new_job_alerts: boolean
  marketing_emails: boolean
  weekly_digest: boolean
  created_at: string
  updated_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationIds?: number[]) => Promise<void>
  deleteNotification: (notificationId: number) => Promise<void>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>
  showNotificationToast: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/notifications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch notification preferences
  const fetchPreferences = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error)
    }
  }

  // Mark notifications as read
  const markAsRead = async (notificationIds?: number[]) => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_ids: notificationIds })
      })

      if (response.ok) {
        // Update local state
        if (notificationIds) {
          setNotifications(prev => 
            prev.map(notification => 
              notificationIds.includes(notification.id) 
                ? { ...notification, is_read: true }
                : notification
            )
          )
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
        } else {
          // Mark all as read
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, is_read: true }))
          )
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`http://localhost:8000/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Update local state
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Update notification preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
    }
  }

  // Show notification toast
  const showNotificationToast = (notification: Notification) => {
    if (!preferences?.push_notifications) return

    const toastOptions = {
      duration: notification.priority === 'urgent' ? 8000 : 4000,
      position: 'top-right' as const,
      style: {
        background: notification.priority === 'urgent' ? '#ef4444' : 
                   notification.priority === 'high' ? '#f59e0b' : '#3b82f6',
        color: 'white',
      }
    }

    toast(notification.message, toastOptions)
  }

  // Set up real-time subscription
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setPreferences(null)
      return
    }

    // Initial fetch
    fetchNotifications()
    fetchPreferences()

    // Set up polling for notifications (replacing real-time subscriptions)
    const pollInterval = setInterval(() => {
      fetchNotifications()
    }, 30000) // Poll every 30 seconds

    return () => {
      clearInterval(pollInterval)
    }
  }, [user])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    updatePreferences,
    showNotificationToast
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}