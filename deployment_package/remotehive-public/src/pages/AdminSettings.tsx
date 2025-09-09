import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  RefreshCw, 
  Settings, 
  Globe, 
  Mail, 
  DollarSign, 
  Shield, 
  Bell,
  Database,
  Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
  category: string
  data_type: 'string' | 'number' | 'boolean' | 'json'
  is_public: boolean
  updated_at: string
}

interface SettingCategory {
  name: string
  icon: React.ComponentType<any>
  description: string
  settings: SystemSetting[]
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('general')
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        toast.error('Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setModifiedSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSetting = async (key: string) => {
    if (!modifiedSettings[key]) return
    
    try {
      setSaving(true)
      
      const response = await fetch(`/api/v1/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: modifiedSettings[key]
        })
      })
      
      if (response.ok) {
        toast.success('Setting updated successfully')
        setModifiedSettings(prev => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
        loadSettings() // Reload to get updated data
      } else {
        toast.error('Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  const saveAllModified = async () => {
    const keys = Object.keys(modifiedSettings)
    if (keys.length === 0) {
      toast.error('No changes to save')
      return
    }
    
    setSaving(true)
    let successCount = 0
    
    for (const key of keys) {
      try {
        const response = await fetch(`/api/v1/admin/settings/${key}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            value: modifiedSettings[key]
          })
        })
        
        if (response.ok) {
          successCount++
        }
      } catch (error) {
        console.error(`Error updating setting ${key}:`, error)
      }
    }
    
    setSaving(false)
    
    if (successCount === keys.length) {
      toast.success('All settings updated successfully')
      setModifiedSettings({})
      loadSettings()
    } else {
      toast.error(`Updated ${successCount} of ${keys.length} settings`)
    }
  }

  const renderSettingInput = (setting: SystemSetting) => {
    const currentValue = modifiedSettings[setting.key] ?? setting.value
    const hasChanges = modifiedSettings[setting.key] !== undefined
    
    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={currentValue === 'true'}
              onChange={(e) => handleSettingChange(setting.key, e.target.checked.toString())}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {currentValue === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasChanges ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
            }`}
          />
        )
      
      case 'json':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              hasChanges ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
            }`}
            placeholder="Enter valid JSON"
          />
        )
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasChanges ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
            }`}
          />
        )
    }
  }

  const categorizeSettings = (): SettingCategory[] => {
    const categories: SettingCategory[] = [
      {
        name: 'general',
        icon: Settings,
        description: 'General application settings',
        settings: settings.filter(s => s.category === 'general')
      },
      {
        name: 'email',
        icon: Mail,
        description: 'Email and notification settings',
        settings: settings.filter(s => s.category === 'email')
      },
      {
        name: 'payment',
        icon: DollarSign,
        description: 'Payment and billing settings',
        settings: settings.filter(s => s.category === 'payment')
      },
      {
        name: 'security',
        icon: Shield,
        description: 'Security and authentication settings',
        settings: settings.filter(s => s.category === 'security')
      },
      {
        name: 'api',
        icon: Zap,
        description: 'API and integration settings',
        settings: settings.filter(s => s.category === 'api')
      },
      {
        name: 'database',
        icon: Database,
        description: 'Database and performance settings',
        settings: settings.filter(s => s.category === 'database')
      }
    ]
    
    return categories.filter(cat => cat.settings.length > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const categories = categorizeSettings()
  const activeSettings = categories.find(cat => cat.name === activeCategory)?.settings || []
  const hasModifications = Object.keys(modifiedSettings).length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure your RemoteHive platform</p>
            </div>
            <div className="flex items-center space-x-4">
              {hasModifications && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={saveAllModified}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save All Changes</span>
                </motion.button>
              )}
              <button
                onClick={loadSettings}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeCategory === category.name
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <div className="text-left">
                        <div className="capitalize">{category.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {category.settings.length} setting{category.settings.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  {(() => {
                    const category = categories.find(cat => cat.name === activeCategory)
                    if (!category) return null
                    const Icon = category.icon
                    return (
                      <>
                        <Icon className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 capitalize">
                            {activeCategory} Settings
                          </h2>
                          <p className="text-gray-600 mt-1">
                            {category.description}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="p-6">
                {activeSettings.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No settings found in this category</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeSettings.map((setting) => {
                      const hasChanges = modifiedSettings[setting.key] !== undefined
                      return (
                        <div
                          key={setting.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            hasChanges ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                {hasChanges && (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Modified
                                  </span>
                                )}
                                {!setting.is_public && (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    Private
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {setting.description}
                              </p>
                            </div>
                            {hasChanges && (
                              <button
                                onClick={() => saveSetting(setting.key)}
                                disabled={saving}
                                className="ml-4 bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                              >
                                {saving ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                <span>Save</span>
                              </button>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            {renderSettingInput(setting)}
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Last updated: {new Date(setting.updated_at).toLocaleString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings