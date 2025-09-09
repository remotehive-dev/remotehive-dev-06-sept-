'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Database,
  Zap,
  Plus,
  Globe,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';
import { JobBoardsManager } from '@/components/admin/autoscraper/JobBoardsManager';
import { ScrapeJobsManager } from '@/components/admin/autoscraper/ScrapeJobsManager';
import { LiveLogs } from '@/components/admin/autoscraper/LiveLogs';
import { AutoScraperSettings } from '@/components/admin/autoscraper/AutoScraperSettings';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  itemsScraped: number;
  totalScraped: number;
  successRate: number;
  engineStatus: string;
  lastRunTime: string;
}

// API endpoints for real data
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

// API service functions
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/autoscraper/dashboard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Map backend response to frontend interface
    return {
      totalJobs: data.stats.total_scrape_jobs || 0,
      activeJobs: data.stats.running_jobs || 0,
      itemsScraped: data.stats.total_jobs_scraped || 0,
      totalScraped: data.stats.total_jobs_scraped || 0,
      successRate: data.stats.success_rate || 0,
      engineStatus: data.engine_status?.status || 'idle',
      lastRunTime: data.engine_status?.last_activity ? new Date(data.engine_status.last_activity).toLocaleString() : 'Never'
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default stats on error
    return {
      totalJobs: 0,
      activeJobs: 0,
      itemsScraped: 0,
      totalScraped: 0,
      successRate: 0,
      engineStatus: 'idle',
      lastRunTime: 'Never'
    };
  }
};

const fetchScrapeJobs = async (): Promise<ScrapeJob[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/autoscraper/jobs`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scrape jobs:', error);
    // Return empty array on error
    return [];
  }
};

const updateEngineStatus = async (action: 'start' | 'pause' | 'reset'): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/autoscraper/engine/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} engine: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error ${action}ing engine:`, error);
    throw error;
  }
};

const updateJobStatus = async (jobId: string, action: 'start' | 'pause'): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/autoscraper/jobs/${jobId}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} job: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error ${action}ing job:`, error);
    throw error;
  }
};

interface ScrapeJob {
  id: string;
  name: string;
  jobBoard: string;
  status: string;
  lastRun: string;
  nextRun: string;
  itemsScraped: number;
  successRate: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-green-500';
    case 'paused': return 'bg-yellow-500';
    case 'completed': return 'bg-blue-500';
    case 'failed': return 'bg-red-500';
    case 'error': return 'bg-red-500';
    case 'pending': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return Activity;
    case 'paused': return Pause;
    case 'completed': return CheckCircle;
    case 'failed': return AlertTriangle;
    case 'error': return AlertTriangle;
    case 'pending': return Clock;
    default: return Clock;
  }
};

export default function AutoScraperPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    itemsScraped: 0,
    totalScraped: 0,
    successRate: 0,
    engineStatus: 'idle',
    lastRunTime: 'Loading...'
  });
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [statsData, jobsData] = await Promise.all([
          fetchDashboardStats(),
          fetchScrapeJobs()
        ]);
        
        setStats(statsData);
        setJobs(jobsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          fetchDashboardStats(),
          fetchScrapeJobs()
        ]);
        
        setStats(statsData);
        setJobs(jobsData);
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleEngineAction = async (action: 'start' | 'pause' | 'reset') => {
    setIsLoading(true);
    setError(null);
    
    try {
      await updateEngineStatus(action);
      
      // Update local state optimistically
      setStats(prev => ({
        ...prev,
        engineStatus: action === 'start' ? 'running' : action === 'pause' ? 'paused' : 'idle',
        lastRunTime: action === 'start' ? 'Just now' : prev.lastRunTime
      }));
      
      // Refresh data after action
      const [statsData, jobsData] = await Promise.all([
        fetchDashboardStats(),
        fetchScrapeJobs()
      ]);
      
      setStats(statsData);
      setJobs(jobsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Engine action failed';
      setError(errorMessage);
      console.error('Engine action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: 'start' | 'pause') => {
    try {
      await updateJobStatus(jobId, action);
      
      // Update local state optimistically
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: action === 'start' ? 'running' : 'paused' }
          : job
      ));
      
      // Refresh jobs data
      const jobsData = await fetchScrapeJobs();
      setJobs(jobsData);
    } catch (error) {
      console.error('Job action failed:', error);
      setError(error instanceof Error ? error.message : 'Job action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AutoScraper Dashboard</h1>
              <p className="text-slate-400">Intelligent job scraping management</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge 
              variant={stats.engineStatus === 'running' ? 'default' : 'secondary'}
              className="px-3 py-1"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(stats.engineStatus)}`} />
              Engine {stats.engineStatus.charAt(0).toUpperCase() + stats.engineStatus.slice(1)}
            </Badge>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
              </div>
              <Database className="w-8 h-8 text-blue-400" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Items Scraped</p>
                <p className="text-2xl font-bold text-white">{stats.totalScraped.toLocaleString()}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </GlassCard>
        </div>

        {/* Engine Controls */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Engine Controls</h2>
            <div className="text-sm text-slate-400">
              Last run: {stats.lastRunTime}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => handleEngineAction('start')}
              disabled={isLoading || stats.engineStatus === 'running'}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Engine
            </Button>
            
            <Button
              onClick={() => handleEngineAction('pause')}
              disabled={isLoading || stats.engineStatus !== 'running'}
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause Engine
            </Button>
            
            <Button
              onClick={() => handleEngineAction('reset')}
              disabled={isLoading}
              variant="destructive"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Hard Reset
            </Button>
          </div>
          
          {(stats.engineStatus === 'error' || error) && (
            <Alert className="mt-4 border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {error || 'Engine encountered an error. Check logs for details.'}
              </AlertDescription>
            </Alert>
          )}
          
          {isLoading && (
            <Alert className="mt-4 border-blue-500/50 bg-blue-500/10">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription className="text-blue-400">
                Loading dashboard data...
              </AlertDescription>
            </Alert>
          )}
        </GlassCard>

        {/* Jobs Management */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="jobs" className="data-[state=active]:bg-slate-700">
              Scrape Jobs
            </TabsTrigger>
            <TabsTrigger value="boards" className="data-[state=active]:bg-slate-700">
              Job Boards
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
              Live Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <ScrapeJobsManager />
          </TabsContent>

          <TabsContent value="boards">
            <JobBoardsManager />
          </TabsContent>

          <TabsContent value="logs">
            <LiveLogs />
          </TabsContent>

          <TabsContent value="settings">
            <AutoScraperSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}