import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  Globe,
  RefreshCw,
  Download
} from 'lucide-react';

interface AnalyticsData {
  sessionMetrics: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
    averageSuccessRate: number;
    averageResponseTime: number;
    totalWebsitesScraped: number;
    totalDataExtracted: number;
  };
  performanceData: Array<{
    date: string;
    successRate: number;
    responseTime: number;
    websitesScraped: number;
    dataExtracted: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topDomains: Array<{
    domain: string;
    count: number;
    successRate: number;
    avgResponseTime: number;
  }>;
  mlInsights: {
    patternAccuracy: number;
    optimizationSuggestions: number;
    adaptiveLearningScore: number;
    confidenceScore: number;
  };
  hourlyActivity: Array<{
    hour: string;
    sessions: number;
    websites: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API calls
  const mockAnalyticsData: AnalyticsData = {
    sessionMetrics: {
      totalSessions: 1247,
      activeSessions: 23,
      completedSessions: 1156,
      failedSessions: 68,
      averageSuccessRate: 94.2,
      averageResponseTime: 1250,
      totalWebsitesScraped: 45678,
      totalDataExtracted: 2.4 // GB
    },
    performanceData: [
      { date: '2024-12-09', successRate: 92.5, responseTime: 1320, websitesScraped: 1250, dataExtracted: 0.8 },
      { date: '2024-12-10', successRate: 94.1, responseTime: 1180, websitesScraped: 1450, dataExtracted: 0.9 },
      { date: '2024-12-11', successRate: 93.8, responseTime: 1290, websitesScraped: 1380, dataExtracted: 0.7 },
      { date: '2024-12-12', successRate: 95.2, responseTime: 1150, websitesScraped: 1620, dataExtracted: 1.1 },
      { date: '2024-12-13', successRate: 94.7, responseTime: 1200, websitesScraped: 1550, dataExtracted: 1.0 },
      { date: '2024-12-14', successRate: 96.1, responseTime: 1080, websitesScraped: 1720, dataExtracted: 1.2 },
      { date: '2024-12-15', successRate: 94.9, responseTime: 1250, websitesScraped: 1480, dataExtracted: 0.9 }
    ],
    statusDistribution: [
      { name: 'Completed', value: 1156, color: '#10b981' },
      { name: 'Failed', value: 68, color: '#ef4444' },
      { name: 'Active', value: 23, color: '#3b82f6' }
    ],
    topDomains: [
      { domain: 'e-commerce.com', count: 2450, successRate: 96.8, avgResponseTime: 980 },
      { domain: 'news-site.com', count: 1890, successRate: 94.2, avgResponseTime: 1150 },
      { domain: 'marketplace.com', count: 1650, successRate: 92.5, avgResponseTime: 1320 },
      { domain: 'blog-platform.com', count: 1420, successRate: 97.1, avgResponseTime: 890 },
      { domain: 'social-media.com', count: 1280, successRate: 89.3, avgResponseTime: 1580 }
    ],
    mlInsights: {
      patternAccuracy: 87.3,
      optimizationSuggestions: 156,
      adaptiveLearningScore: 92.1,
      confidenceScore: 89.7
    },
    hourlyActivity: [
      { hour: '00:00', sessions: 12, websites: 145 },
      { hour: '02:00', sessions: 8, websites: 98 },
      { hour: '04:00', sessions: 15, websites: 180 },
      { hour: '06:00', sessions: 25, websites: 320 },
      { hour: '08:00', sessions: 45, websites: 580 },
      { hour: '10:00', sessions: 62, websites: 750 },
      { hour: '12:00', sessions: 58, websites: 690 },
      { hour: '14:00', sessions: 71, websites: 850 },
      { hour: '16:00', sessions: 68, websites: 820 },
      { hour: '18:00', sessions: 52, websites: 640 },
      { hour: '20:00', sessions: 38, websites: 480 },
      { hour: '22:00', sessions: 28, websites: 350 }
    ]
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockAnalyticsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };



  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-gray-600 mb-4">Unable to fetch analytics data. Please try again.</p>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive scraping performance insights and ML analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={analyticsData.sessionMetrics.totalSessions.toLocaleString()}
          change={12.5}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Success Rate"
          value={`${analyticsData.sessionMetrics.averageSuccessRate}%`}
          change={2.1}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${analyticsData.sessionMetrics.averageResponseTime}ms`}
          change={-5.3}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Websites Scraped"
          value={analyticsData.sessionMetrics.totalWebsitesScraped.toLocaleString()}
          change={18.7}
          icon={<Globe className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[85, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session Status & Hourly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">ML Intelligence Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.mlInsights.patternAccuracy}%</p>
            <p className="text-sm text-gray-600">Pattern Accuracy</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.mlInsights.optimizationSuggestions}</p>
            <p className="text-sm text-gray-600">Optimization Suggestions</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.mlInsights.adaptiveLearningScore}%</p>
            <p className="text-sm text-gray-600">Adaptive Learning</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.mlInsights.confidenceScore}%</p>
            <p className="text-sm text-gray-600">Confidence Score</p>
          </div>
        </div>
      </div>

      {/* Top Performing Domains */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Domains</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scraped Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.topDomains.map((domain, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{domain.domain}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {domain.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      domain.successRate >= 95 ? 'bg-green-100 text-green-800' :
                      domain.successRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {domain.successRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {domain.avgResponseTime}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;