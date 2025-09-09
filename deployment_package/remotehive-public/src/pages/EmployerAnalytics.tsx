import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointer, 
  Calendar, 
  DollarSign, 
  Clock, 
  Target, 
  Award, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download, 
  Filter, 
  RefreshCw, 
  Share, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Star, 
  MessageSquare, 
  FileText, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet,
  Search,
  Calendar as CalendarIcon,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Activity,
  Database,
  Layers,
  Grid,
  List,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description: string;
  trend: number[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
}

interface JobPerformance {
  id: string;
  title: string;
  views: number;
  applications: number;
  conversion_rate: number;
  avg_time_to_apply: number;
  quality_score: number;
  status: 'active' | 'paused' | 'closed';
  posted_date: string;
  location: string;
  department: string;
  salary_range: string;
  engagement_metrics: {
    clicks: number;
    saves: number;
    shares: number;
    time_on_page: number;
  };
}

interface CandidateInsight {
  total_applications: number;
  qualified_candidates: number;
  interview_scheduled: number;
  offers_made: number;
  hires_completed: number;
  avg_time_to_hire: number;
  candidate_sources: {
    source: string;
    count: number;
    quality_score: number;
  }[];
  demographics: {
    experience_levels: { level: string; count: number }[];
    locations: { location: string; count: number }[];
    education: { degree: string; count: number }[];
    skills: { skill: string; count: number }[];
  };
}

const EmployerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['all']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const [metrics, setMetrics] = useState<MetricCard[]>([
    {
      id: 'total_views',
      title: 'Total Job Views',
      value: '12,847',
      change: 15.3,
      changeType: 'increase',
      icon: <Eye className="h-6 w-6" />,
      description: 'Total views across all job postings',
      trend: [100, 120, 140, 130, 160, 180, 200]
    },
    {
      id: 'applications',
      title: 'Applications Received',
      value: '1,234',
      change: 8.7,
      changeType: 'increase',
      icon: <Users className="h-6 w-6" />,
      description: 'Total applications received',
      trend: [80, 90, 100, 95, 110, 120, 130]
    },
    {
      id: 'conversion_rate',
      title: 'View to Application Rate',
      value: '9.6%',
      change: -2.1,
      changeType: 'decrease',
      icon: <Target className="h-6 w-6" />,
      description: 'Percentage of views that convert to applications',
      trend: [12, 11, 10, 9.5, 9.8, 9.6, 9.6]
    },
    {
      id: 'avg_time_to_hire',
      title: 'Average Time to Hire',
      value: '18 days',
      change: -12.5,
      changeType: 'increase',
      icon: <Clock className="h-6 w-6" />,
      description: 'Average time from posting to hire',
      trend: [25, 23, 21, 20, 19, 18, 18]
    },
    {
      id: 'quality_score',
      title: 'Candidate Quality Score',
      value: '8.4/10',
      change: 5.2,
      changeType: 'increase',
      icon: <Star className="h-6 w-6" />,
      description: 'Average quality rating of candidates',
      trend: [7.8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.4]
    },
    {
      id: 'cost_per_hire',
      title: 'Cost per Hire',
      value: '$2,450',
      change: -8.3,
      changeType: 'increase',
      icon: <DollarSign className="h-6 w-6" />,
      description: 'Average cost to hire one candidate',
      trend: [2800, 2700, 2600, 2550, 2500, 2450, 2450]
    }
  ]);

  const [jobPerformance, setJobPerformance] = useState<JobPerformance[]>([
    {
      id: 'job_1',
      title: 'Senior React Developer',
      views: 2847,
      applications: 234,
      conversion_rate: 8.2,
      avg_time_to_apply: 3.5,
      quality_score: 8.7,
      status: 'active',
      posted_date: '2024-01-15',
      location: 'San Francisco, CA',
      department: 'Engineering',
      salary_range: '$120k - $160k',
      engagement_metrics: {
        clicks: 3200,
        saves: 456,
        shares: 89,
        time_on_page: 4.2
      }
    },
    {
      id: 'job_2',
      title: 'Product Manager',
      views: 1923,
      applications: 156,
      conversion_rate: 8.1,
      avg_time_to_apply: 4.1,
      quality_score: 7.9,
      status: 'active',
      posted_date: '2024-01-10',
      location: 'New York, NY',
      department: 'Product',
      salary_range: '$130k - $170k',
      engagement_metrics: {
        clicks: 2100,
        saves: 298,
        shares: 45,
        time_on_page: 3.8
      }
    },
    {
      id: 'job_3',
      title: 'UX/UI Designer',
      views: 1654,
      applications: 189,
      conversion_rate: 11.4,
      avg_time_to_apply: 2.8,
      quality_score: 8.3,
      status: 'active',
      posted_date: '2024-01-08',
      location: 'Remote',
      department: 'Design',
      salary_range: '$90k - $130k',
      engagement_metrics: {
        clicks: 1800,
        saves: 367,
        shares: 78,
        time_on_page: 5.1
      }
    }
  ]);

  const [candidateInsights, setCandidateInsights] = useState<CandidateInsight>({
    total_applications: 1234,
    qualified_candidates: 456,
    interview_scheduled: 123,
    offers_made: 34,
    hires_completed: 12,
    avg_time_to_hire: 18,
    candidate_sources: [
      { source: 'Job Boards', count: 456, quality_score: 7.8 },
      { source: 'Company Website', count: 234, quality_score: 8.9 },
      { source: 'LinkedIn', count: 189, quality_score: 8.5 },
      { source: 'Referrals', count: 167, quality_score: 9.2 },
      { source: 'Social Media', count: 123, quality_score: 6.9 },
      { source: 'Recruiters', count: 65, quality_score: 8.7 }
    ],
    demographics: {
      experience_levels: [
        { level: 'Entry Level (0-2 years)', count: 234 },
        { level: 'Mid Level (3-5 years)', count: 456 },
        { level: 'Senior Level (6-10 years)', count: 345 },
        { level: 'Lead/Principal (10+ years)', count: 199 }
      ],
      locations: [
        { location: 'San Francisco, CA', count: 289 },
        { location: 'New York, NY', count: 234 },
        { location: 'Remote', count: 345 },
        { location: 'Austin, TX', count: 156 },
        { location: 'Seattle, WA', count: 123 },
        { location: 'Other', count: 87 }
      ],
      education: [
        { degree: "Bachelor's Degree", count: 567 },
        { degree: "Master's Degree", count: 345 },
        { degree: 'PhD', count: 89 },
        { degree: 'Associate Degree', count: 123 },
        { degree: 'High School', count: 67 },
        { degree: 'Other/None', count: 43 }
      ],
      skills: [
        { skill: 'JavaScript', count: 456 },
        { skill: 'React', count: 389 },
        { skill: 'Python', count: 234 },
        { skill: 'Node.js', count: 198 },
        { skill: 'TypeScript', count: 167 },
        { skill: 'AWS', count: 145 }
      ]
    }
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Data refreshed successfully');
    }, 2000);
  };

  const exportData = () => {
    toast.success('Analytics data exported successfully');
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderMiniChart = (trend: number[]) => {
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const range = max - min;
    
    return (
      <div className="flex items-end space-x-1 h-8">
        {trend.map((value, index) => {
          const height = range === 0 ? 50 : ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className="bg-blue-200 rounded-sm w-1"
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your recruitment performance and insights</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="product">Product</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Status</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Locations</option>
                  <option value="remote">Remote</option>
                  <option value="sf">San Francisco</option>
                  <option value="ny">New York</option>
                  <option value="austin">Austin</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
              { id: 'jobs', name: 'Job Performance', icon: <Briefcase className="h-4 w-4" /> },
              { id: 'candidates', name: 'Candidate Insights', icon: <Users className="h-4 w-4" /> },
              { id: 'sources', name: 'Traffic Sources', icon: <Globe className="h-4 w-4" /> },
              { id: 'funnel', name: 'Hiring Funnel', icon: <Target className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      {metric.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(metric.changeType)}
                      <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      {renderMiniChart(metric.trend)}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-3">{metric.description}</p>
              </motion.div>
            ))}
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Trends */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Application Trends</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Application trends chart would be here</p>
                  <p className="text-xs text-gray-400">Integration with charting library needed</p>
                </div>
              </div>
            </div>
            
            {/* Source Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {candidateInsights.candidate_sources.slice(0, 5).map((source, index) => {
                  const percentage = (source.count / candidateInsights.total_applications) * 100;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-600" style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}></div>
                        <span className="text-sm font-medium text-gray-900">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">{source.count}</span>
                        <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Performance Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Job Performance Analysis</h2>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {jobPerformance.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${viewMode === 'list' ? 'flex items-center space-x-6' : ''}`}
              >
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'active' ? 'bg-green-100 text-green-800' :
                          job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-500">{job.department}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-lg font-semibold text-gray-900">{job.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Applications</p>
                      <p className="text-lg font-semibold text-gray-900">{job.applications}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conversion Rate</p>
                      <p className="text-lg font-semibold text-gray-900">{job.conversion_rate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quality Score</p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-lg font-semibold text-gray-900">{job.quality_score}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-900">{job.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Salary:</span>
                      <span className="text-gray-900">{job.salary_range}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Posted:</span>
                      <span className="text-gray-900">{new Date(job.posted_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {viewMode === 'list' && (
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{job.views.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{job.applications}</p>
                      <p className="text-xs text-gray-500">Applications</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{job.conversion_rate}%</p>
                      <p className="text-xs text-gray-500">Conversion</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Insights Tab */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Candidate Insights</h2>
          
          {/* Hiring Funnel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiring Funnel</h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: 'Applications', value: candidateInsights.total_applications, color: 'bg-blue-500' },
                { label: 'Qualified', value: candidateInsights.qualified_candidates, color: 'bg-green-500' },
                { label: 'Interviews', value: candidateInsights.interview_scheduled, color: 'bg-yellow-500' },
                { label: 'Offers', value: candidateInsights.offers_made, color: 'bg-orange-500' },
                { label: 'Hires', value: candidateInsights.hires_completed, color: 'bg-purple-500' }
              ].map((stage, index) => (
                <div key={index} className="text-center">
                  <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                    <p className="text-2xl font-bold">{stage.value}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{stage.label}</p>
                  {index > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {((stage.value / candidateInsights.total_applications) * 100).toFixed(1)}% conversion
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience Levels */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Levels</h3>
              <div className="space-y-3">
                {candidateInsights.demographics.experience_levels.map((level, index) => {
                  const percentage = (level.count / candidateInsights.total_applications) * 100;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{level.level}</span>
                        <span className="text-sm text-gray-600">{level.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Top Skills */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills</h3>
              <div className="space-y-3">
                {candidateInsights.demographics.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{skill.skill}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(skill.count / candidateInsights.demographics.skills[0].count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{skill.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Traffic Sources Analysis</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {candidateInsights.candidate_sources.map((source, index) => {
              const percentage = (source.count / candidateInsights.total_applications) * 100;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{source.source}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{source.quality_score}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Applications</span>
                        <span className="text-lg font-bold text-gray-900">{source.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total applications</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Avg. Quality</p>
                        <p className="text-sm font-semibold text-gray-900">{source.quality_score}/10</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost per App</p>
                        <p className="text-sm font-semibold text-gray-900">$12.50</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hiring Funnel Tab */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Hiring Funnel Analysis</h2>
          
          {/* Funnel Visualization */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {[
                  { stage: 'Job Views', count: 12847, color: 'bg-blue-500', width: '100%' },
                  { stage: 'Applications Started', count: 2456, color: 'bg-green-500', width: '80%' },
                  { stage: 'Applications Completed', count: 1234, color: 'bg-yellow-500', width: '60%' },
                  { stage: 'Qualified Candidates', count: 456, color: 'bg-orange-500', width: '40%' },
                  { stage: 'Interviews Scheduled', count: 123, color: 'bg-red-500', width: '25%' },
                  { stage: 'Offers Made', count: 34, color: 'bg-purple-500', width: '15%' },
                  { stage: 'Hires Completed', count: 12, color: 'bg-indigo-500', width: '10%' }
                ].map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{stage.stage}</h4>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{stage.count.toLocaleString()}</span>
                        {index > 0 && (
                          <p className="text-sm text-gray-500">
                            {((stage.count / 12847) * 100).toFixed(1)}% of initial views
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className={`${stage.color} h-8 rounded-full transition-all duration-1000 flex items-center justify-center`}
                        style={{ width: stage.width }}
                      >
                        <span className="text-white font-medium text-sm">
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {index < 6 && (
                      <div className="flex justify-center mt-2">
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Conversion Rates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View to Application</h3>
                  <p className="text-3xl font-bold text-green-600">9.6%</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Percentage of job views that convert to applications</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Application to Interview</h3>
                  <p className="text-3xl font-bold text-blue-600">10.0%</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Percentage of applications that lead to interviews</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Interview to Hire</h3>
                  <p className="text-3xl font-bold text-purple-600">9.8%</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Percentage of interviews that result in hires</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerAnalytics;