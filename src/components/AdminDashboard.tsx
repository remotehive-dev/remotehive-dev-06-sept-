import React from 'react';
import { BarChart3, Users, Globe, Activity, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  totalWebsites: number;
  activeScrapingSessions: number;
  successRate: number;
  avgResponseTime: number;
  totalDataPoints: number;
  mlAccuracy: number;
}

const AdminDashboard: React.FC = () => {
  const stats: DashboardStats = {
    totalWebsites: 847,
    activeScrapingSessions: 12,
    successRate: 94.2,
    avgResponseTime: 1.8,
    totalDataPoints: 156789,
    mlAccuracy: 91.7
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    color: string;
  }> = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">RemoteHive Overview</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Websites"
          value={stats.totalWebsites.toLocaleString()}
          icon={Globe}
          trend="+12% this week"
          color="text-blue-600"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeScrapingSessions}
          icon={Activity}
          trend="+3 since yesterday"
          color="text-green-600"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          trend="+2.1% improvement"
          color="text-emerald-600"
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats.avgResponseTime}s`}
          icon={Clock}
          trend="-0.3s faster"
          color="text-orange-600"
        />
        <StatCard
          title="Data Points"
          value={stats.totalDataPoints.toLocaleString()}
          icon={BarChart3}
          trend="+5.2K today"
          color="text-purple-600"
        />
        <StatCard
          title="ML Accuracy"
          value={`${stats.mlAccuracy}%`}
          icon={Users}
          trend="+1.8% this month"
          color="text-indigo-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Globe className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Add Websites</h3>
            <p className="text-sm text-gray-600">Upload new websites to scrape</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Activity className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Start Scraping</h3>
            <p className="text-sm text-gray-600">Begin new scraping session</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Analytics</h3>
            <p className="text-sm text-gray-600">Check performance metrics</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 text-indigo-600 mb-2" />
            <h3 className="font-medium text-gray-900">ML Training</h3>
            <p className="text-sm text-gray-600">Improve scraping accuracy</p>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Scraping Engine</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">ML Processing</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Database</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">API Gateway</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Maintenance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;