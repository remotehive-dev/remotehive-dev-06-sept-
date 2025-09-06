import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Home, BarChart3, Upload, Settings, Play } from 'lucide-react'
import AdminDashboard from './components/AdminDashboard'
import AnalyticsDashboard from './components/admin/AnalyticsDashboard'
import MemoryUploadPanel from './components/admin/MemoryUploadPanel'
import ScrapingControlPanel from './components/admin/ScrapingControlPanel'
import WebsiteManagementPanel from './components/admin/WebsiteManagementPanel'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'Overview', icon: Home },
    { id: 'websites', name: 'Website Manager', icon: Settings },
    { id: 'memory', name: 'Memory Upload', icon: Upload },
    { id: 'scraping', name: 'Scraper Control', icon: Play },
    { id: 'analytics', name: 'Analytics & ML', icon: BarChart3 }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />
      case 'websites':
        return <WebsiteManagementPanel />
      case 'memory':
        return <MemoryUploadPanel />
      case 'scraping':
        return <ScrapingControlPanel />
      case 'analytics':
        return <AnalyticsDashboard />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">RemoteHive Admin</h1>
            </div>
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  )
}

export default App