import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Trash2, Filter, Search, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useNotifications, Notification } from '../contexts/NotificationContext'
import { Link } from 'react-router-dom'

const Notifications: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    loading 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([])

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.is_read) ||
      (filter === 'read' && notification.is_read)
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesType && matchesSearch
  })

  const handleSelectNotification = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    }
  }

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length > 0) {
      await markAsRead(selectedNotifications)
      setSelectedNotifications([])
    }
  }

  const handleBulkDelete = async () => {
    for (const id of selectedNotifications) {
      await deleteNotification(id)
    }
    setSelectedNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_status_update':
        return <Clock className="w-5 h-5" />
      case 'new_application':
        return <AlertCircle className="w-5 h-5" />
      case 'job_posted':
        return <Bell className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'normal':
        return 'border-l-blue-500 bg-blue-50'
      case 'low':
        return 'border-l-gray-500 bg-gray-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'application_status_update', label: 'Application Updates' },
    { value: 'new_application', label: 'New Applications' },
    { value: 'job_posted', label: 'Job Posts' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Mark as Read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedNotifications([])}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Select All Header */}
          {filteredNotifications.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Select all ({filteredNotifications.length})
                </span>
              </label>
            </div>
          )}

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'You\'ll see notifications here when you have new updates.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`px-6 py-4 hover:bg-gray-50 border-l-4 ${
                    notification.is_read ? 'opacity-75' : ''
                  } ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      notification.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      notification.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium text-gray-900 ${
                            !notification.is_read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              notification.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead([notification.id])}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Action Button */}
                      {notification.action_url && (
                        <div className="mt-3">
                          <Link
                            to={notification.action_url}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead([notification.id])
                              }
                            }}
                          >
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredNotifications.length > 0 && filteredNotifications.length % 20 === 0 && (
          <div className="mt-6 text-center">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications