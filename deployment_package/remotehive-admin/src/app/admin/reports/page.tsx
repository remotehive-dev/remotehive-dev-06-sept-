'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats } from '@/lib/supabase';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Building2,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  description 
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: any;
  description?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <div className="flex items-center text-xs text-muted-foreground">
              {changeType === 'increase' ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              <span className={changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                {change}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ReportCard = ({ 
  title, 
  description, 
  lastGenerated, 
  format = 'PDF' 
}: {
  title: string;
  description: string;
  lastGenerated?: string;
  format?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Badge variant="outline">{format}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastGenerated ? (
                <>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Last generated: {formatDate(lastGenerated)}
                </>
              ) : (
                'Never generated'
              )}
            </div>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await getDashboardStats();
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }
      
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const reports = [
    {
      title: 'User Activity Report',
      description: 'Detailed analysis of user engagement and platform usage',
      lastGenerated: '2024-01-15T10:30:00Z',
      format: 'PDF'
    },
    {
      title: 'Job Posting Analytics',
      description: 'Comprehensive overview of job posting trends and performance',
      lastGenerated: '2024-01-14T15:45:00Z',
      format: 'Excel'
    },
    {
      title: 'Revenue Report',
      description: 'Financial summary including subscription and posting fees',
      lastGenerated: '2024-01-13T09:15:00Z',
      format: 'PDF'
    },
    {
      title: 'Scraper Performance',
      description: 'Analysis of job scraping operations and data quality',
      lastGenerated: '2024-01-12T14:20:00Z',
      format: 'CSV'
    },
    {
      title: 'Application Trends',
      description: 'Insights into job application patterns and success rates',
      format: 'PDF'
    },
    {
      title: 'Platform Health Report',
      description: 'System performance, uptime, and technical metrics',
      lastGenerated: '2024-01-11T11:00:00Z',
      format: 'PDF'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate insights and export platform data
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Custom Report
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Time Period:</span>
            <div className="flex space-x-2">
              {[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 3 months' },
                { value: '1y', label: 'Last year' }
              ].map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Users"
              value={formatNumber(stats?.total_users || 0)}
              change="+12.5%"
              changeType="increase"
              icon={Users}
              description="Active platform users"
            />
            <MetricCard
              title="Job Posts"
              value={formatNumber(stats?.total_jobs || 0)}
              change="+8.2%"
              changeType="increase"
              icon={Briefcase}
              description="Total job listings"
            />
            <MetricCard
              title="Employers"
              value={formatNumber(stats?.total_employers || 0)}
              change="+15.3%"
              changeType="increase"
              icon={Building2}
              description="Registered companies"
            />
            <MetricCard
              title="Applications"
              value={formatNumber(stats?.total_applications || 0)}
              change="-2.1%"
              changeType="decrease"
              icon={FileText}
              description="Job applications submitted"
            />
            <MetricCard
              title="Active Jobs"
              value={formatNumber(stats?.active_jobs || 0)}
              change="+5.7%"
              changeType="increase"
              icon={Briefcase}
              description="Currently open positions"
            />
            <MetricCard
              title="New Signups"
              value={formatNumber(stats?.new_users_this_month || 0)}
              change="+18.9%"
              changeType="increase"
              icon={Users}
              description="This month"
            />
            <MetricCard
              title="Job Views"
              value={formatNumber(stats?.total_job_views || 0)}
              change="+22.4%"
              changeType="increase"
              icon={LineChart}
              description="Total job page views"
            />
            <MetricCard
              title="Success Rate"
              value="24.3%"
              change="+1.2%"
              changeType="increase"
              icon={TrendingUp}
              description="Application to hire ratio"
            />
          </div>
        )}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="w-5 h-5 mr-2" />
              User Growth Trend
            </CardTitle>
            <CardDescription>
              Monthly user registration and activity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-center text-muted-foreground">
                <LineChart className="w-12 h-12 mx-auto mb-2" />
                <p>Chart visualization would appear here</p>
                <p className="text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Job Categories Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of job postings by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-center text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-2" />
                <p>Chart visualization would appear here</p>
                <p className="text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <ReportCard
              key={index}
              title={report.title}
              description={report.description}
              lastGenerated={report.lastGenerated}
              format={report.format}
            />
          ))}
        </div>
      </div>
    </div>
  );
}