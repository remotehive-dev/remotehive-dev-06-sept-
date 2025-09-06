import React, { useState, useEffect } from 'react';
import { BarChart3, Globe, Upload, Activity, Settings, Users, Database, TrendingUp, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import MemoryUploadPanel from './MemoryUploadPanel';
import WebsiteManagementPanel from './WebsiteManagementPanel';
import ScrapingControlPanel from './ScrapingControlPanel';

interface DashboardStats {
  totalWebsites: number;
  activeSessions: number;
  successfulScrapes: number;
  failedScrapes: number;
  memoryFilesUploaded: number;
  averageSuccessRate: number;
  totalDataPoints: number;
  mlModelsActive: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeWorkers: number;
  queueSize: number;
  lastUpdate: string;
}

type ActiveTab = 'overview' | 'memory' | 'websites' | 'scraping' | 'analytics' | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalWebsites: 0,
    activeSessions: 0,
    successfulScrapes: 0,
    failedScrapes: 0,
    memoryFilesUploaded: 0,
    averageSuccessRate: 0,
    totalDataPoints: 0,
    mlModelsActive: 0
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeWorkers: 0,
    queueSize: 0,
    lastUpdate: new Date().toISOString()
  });

  // Simulate real-time data updates
  useEffect(() => {
    const updateStats = () => {
      setStats({
        totalWebsites: 1247 + Math.floor(Math.random() * 100),
        activeSessions: Math.floor(Math.random() * 5),
        successfulScrapes: 8934 + Math.floor(Math.random() * 50),
        failedScrapes: 156 + Math.floor(Math.random() * 10),
        memoryFilesUploaded: 23 + Math.floor(Math.random() * 5),
        averageSuccessRate: 92 + Math.random() * 6,
        totalDataPoints: 45678 + Math.floor(Math.random() * 1000),
        mlModelsActive: 3 + Math.floor(Math.random() * 2)
      });

      setSystemHealth({
        status: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'warning' : 'error',
        cpuUsage: 20 + Math.random() * 60,
        memoryUsage: 40 + Math.random() * 40,
        diskUsage: 30 + Math.random() * 30,
        activeWorkers: Math.floor(Math.random() * 8),
        queueSize: Math.floor(Math.random() * 25),
        lastUpdate: new Date().toISOString()
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: 'overview' as ActiveTab, label: 'Overview', icon: BarChart3 },
    { id: 'memory' as ActiveTab, label: 'Memory Upload', icon: Upload },
    { id: 'websites' as ActiveTab, label: 'Website Management', icon: Globe },
    { id: 'scraping' as ActiveTab, label: 'Scraping Control', icon: Activity },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: TrendingUp },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(systemHealth.status)}`}>
            {getHealthIcon(systemHealth.status)}
            {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{systemHealth.cpuUsage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">CPU Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{systemHealth.memoryUsage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Memory Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{systemHealth.diskUsage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Disk Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{systemHealth.activeWorkers}</div>
            <div className="text-xs text-gray-500">Active Workers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{systemHealth.queueSize}</div>
            <div className="text-xs text-gray-500">Queue Size</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Last Update</div>
            <div className="text-xs font-medium text-gray-700">
              {new Date(systemHealth.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Websites</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWebsites.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeSessions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>Real-time monitoring</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageSuccessRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+2.3% improvement</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ML Models Active</p>
              <p className="text-3xl font-bold text-gray-900">{stats.mlModelsActive}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-blue-600">
              <Database className="h-4 w-4 mr-1" />
              <span>Learning enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scraping Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Successful Scrapes</span>
              <span className="text-lg font-semibold text-green-600">{stats.successfulScrapes.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed Scrapes</span>
              <span className="text-lg font-semibold text-red-600">{stats.failedScrapes.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Data Points</span>
              <span className="text-lg font-semibold text-blue-600">{stats.totalDataPoints.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memory Files Uploaded</span>
              <span className="text-lg font-semibold text-purple-600">{stats.memoryFilesUploaded}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('memory')}
              className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Upload className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Upload Memory File</div>
                <div className="text-sm text-blue-600">Add new training data</div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('websites')}
              className="w-full flex items-center gap-3 p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Globe className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Manage Websites</div>
                <div className="text-sm text-green-600">Add or configure websites</div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('scraping')}
              className="w-full flex items-center gap-3 p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900">Start Scraping</div>
                <div className="text-sm text-purple-600">Begin new scraping session</div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className="w-full flex items-center gap-3 p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">View Analytics</div>
                <div className="text-sm text-orange-600">Performance insights</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics Dashboard</h2>
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Comprehensive analytics dashboard with performance metrics, ML insights, and detailed reporting will be available in the next phase.
        </p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
      <div className="text-center py-12">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Panel Coming Soon</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Advanced system configuration, user management, and ML model settings will be available in future updates.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'memory':
        return <MemoryUploadPanel />;
      case 'websites':
        return <WebsiteManagementPanel />;
      case 'scraping':
        return <ScrapingControlPanel />;
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RemoteHive Admin</h1>
                <p className="text-sm text-gray-500">ML-Powered Web Scraping Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(systemHealth.status)}`}>
                {getHealthIcon(systemHealth.status)}
                System {systemHealth.status}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Admin Panel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;