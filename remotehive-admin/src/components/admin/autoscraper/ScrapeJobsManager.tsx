'use client';

import React, { useState, useEffect } from 'react';
import { autoScraperApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';

interface ScrapeJob {
  id: string;
  name: string;
  jobBoardId: string;
  jobBoardName: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'scheduled';
  mode: 'manual' | 'scheduled';
  schedule?: string;
  lastRun?: string;
  nextRun?: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  itemsScraped: number;
  successRate: number;
  avgDuration: number;
  createdAt: string;
  updatedAt: string;
  config: {
    maxItems?: number;
    filters?: Record<string, any>;
    retryCount?: number;
    timeout?: number;
  };
}

interface ScrapeRun {
  id: string;
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  itemsFound: number;
  itemsProcessed: number;
  itemsSaved: number;
  errors: string[];
  logs: string[];
}



export function ScrapeJobsManager() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showRunDetails, setShowRunDetails] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ScrapeRun | null>(null);
  
  // New state for list/card view and selection
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch jobs and runs on component mount
  useEffect(() => {
    fetchJobs();
    fetchRuns();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await autoScraperApi.getScrapeJobs();
      setJobs(response.data || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load scrape jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const response = await autoScraperApi.getScrapeJobRuns();
      setRuns(response.data || []);
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.jobBoardName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesMode = modeFilter === 'all' || job.mode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(new Set(paginatedJobs.map(job => job.id)));
    } else {
      setSelectedJobs(new Set());
    }
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    const newSelected = new Set(selectedJobs);
    if (checked) {
      newSelected.add(jobId);
    } else {
      newSelected.delete(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleBulkAction = async (action: 'start' | 'pause' | 'delete') => {
    const selectedJobIds = Array.from(selectedJobs);
    
    try {
      await autoScraperApi.bulkActionScrapeJobs(action, selectedJobIds);
      
      // Refresh jobs after bulk action
      await fetchJobs();
      setSelectedJobs(new Set());
    } catch (err) {
      console.error(`Failed to ${action} jobs:`, err);
      setError(`Failed to ${action} selected jobs`);
    }
  };

  const handleJobAction = async (jobId: string, action: 'start' | 'pause' | 'stop' | 'restart') => {
    try {
      switch (action) {
        case 'start':
          await autoScraperApi.startScrapeJob(jobId);
          break;
        case 'pause':
          await autoScraperApi.pauseScrapeJob(jobId);
          break;
        case 'stop':
          await autoScraperApi.stopScrapeJob(jobId);
          break;
        case 'restart':
          await autoScraperApi.stopScrapeJob(jobId);
          await autoScraperApi.startScrapeJob(jobId);
          break;
      }
      // Refresh jobs after action
      await fetchJobs();
    } catch (err) {
      console.error(`Failed to ${action} job:`, err);
      setError(`Failed to ${action} job`);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await autoScraperApi.deleteScrapeJob(jobId);
      setJobs(prev => prev.filter(job => job.id !== jobId));
      setSelectedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to delete job:', err);
      setError('Failed to delete job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return Activity;
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'paused': return Pause;
      case 'scheduled': return Clock;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'scheduled': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Scrape Jobs</h2>
          <p className="text-slate-400">Manage and monitor individual scraping jobs</p>
        </div>
        <Button onClick={() => setShowJobDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Filters and Controls */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20 bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={viewMode === 'card' ? 'default' : 'outline'}
              onClick={() => setViewMode('card')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Button size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Bulk Actions */}
        {selectedJobs.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-sm text-blue-400">
              {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('start')}
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
              >
                <Play className="w-4 h-4 mr-1" />
                Start All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('pause')}
                className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('delete')}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete All
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Jobs Display */}
      {viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {paginatedJobs.map((job) => {
              const StatusIcon = getStatusIcon(job.status);
              const isSelected = selectedJobs.has(job.id);
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className={`p-6 hover:bg-slate-800/60 transition-colors ${
                    isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectJob(job.id, checked as boolean)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-shrink-0">
                          <StatusIcon className={`w-6 h-6 ${job.status === 'running' ? 'text-blue-400' : 
                            job.status === 'completed' ? 'text-green-400' : 
                            job.status === 'failed' ? 'text-red-400' : 
                            job.status === 'paused' ? 'text-yellow-400' : 'text-purple-400'}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{job.name}</h3>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.mode.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-slate-400">
                            <span>Board: {job.jobBoardName}</span>
                            <span>Runs: {job.totalRuns}</span>
                            <span>Success Rate: {job.successRate}%</span>
                            <span>Items: {job.itemsScraped}</span>
                            {job.lastRun && <span>Last Run: {job.lastRun}</span>}
                            {job.nextRun && <span>Next Run: {job.nextRun}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {job.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJobAction(job.id, 'start')}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {job.status === 'running' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJobAction(job.id, 'pause')}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJobAction(job.id, 'restart')}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowJobDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const jobRuns = runs.filter(run => run.jobId === job.id);
                            setSelectedJob(job);
                            setShowRunDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Success Rate</span>
                        <span>{job.successRate}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.successRate}%` }}
                        />
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <GlassCard className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedJobs.length > 0 && paginatedJobs.every(job => selectedJobs.has(job.id))}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Job Name</TableHead>
                <TableHead className="text-slate-300">Job Board</TableHead>
                <TableHead className="text-slate-300">Mode</TableHead>
                <TableHead className="text-slate-300">Runs</TableHead>
                <TableHead className="text-slate-300">Success Rate</TableHead>
                <TableHead className="text-slate-300">Items</TableHead>
                <TableHead className="text-slate-300">Last Run</TableHead>
                <TableHead className="text-slate-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {paginatedJobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status);
                  const isSelected = selectedJobs.has(job.id);
                  return (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-slate-700 hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectJob(job.id, checked as boolean)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-4 h-4 ${job.status === 'running' ? 'text-blue-400' : 
                            job.status === 'completed' ? 'text-green-400' : 
                            job.status === 'failed' ? 'text-red-400' : 
                            job.status === 'paused' ? 'text-yellow-400' : 'text-purple-400'}`} />
                          <Badge className={getStatusColor(job.status)}>
                             {job.status.toUpperCase()}
                           </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">{job.name}</TableCell>
                      <TableCell className="text-slate-300">{job.jobBoardName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {job.mode.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{job.totalRuns}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center space-x-2">
                          <span>{job.successRate}%</span>
                          <div className="w-16 bg-slate-700 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full"
                              style={{ width: `${job.successRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{job.itemsScraped}</TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {job.lastRun ? new Date(job.lastRun).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {job.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleJobAction(job.id, 'start')}
                              className="h-8 w-8 p-0"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {job.status === 'running' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleJobAction(job.id, 'pause')}
                              className="h-8 w-8 p-0"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleJobAction(job.id, 'restart')}
                            className="h-8 w-8 p-0"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowJobDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const jobRuns = runs.filter(run => run.jobId === job.id);
                              setSelectedJob(job);
                              setShowRunDetails(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteJob(job.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </GlassCard>
      )}
      
      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <GlassCard className="p-12">
          <div className="text-center">
            <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-slate-400 mb-4">
              {searchTerm || statusFilter !== 'all' || modeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first scraping job to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && modeFilter === 'all' && (
              <Button onClick={() => setShowJobDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            )}
          </div>
        </GlassCard>
      )}
      
      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-slate-400">...</span>
                  <Button
                    size="sm"
                    variant={currentPage === totalPages ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Job Details/Runs Dialog */}
      <Dialog open={showRunDetails} onOpenChange={setShowRunDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Job Details: {selectedJob?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              View job execution history and run details
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <Tabs defaultValue="runs" className="space-y-4">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="runs">Recent Runs</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="runs" className="space-y-4">
                {runs.filter(run => run.jobId === selectedJob.id).map((run) => (
                  <div key={run.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(run.status)}>
                          {run.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-slate-400">{run.startTime}</span>
                        {run.duration && (
                          <span className="text-sm text-slate-400">
                            Duration: {formatDuration(run.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">{run.itemsFound}</div>
                        <div className="text-xs text-slate-400">Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">{run.itemsProcessed}</div>
                        <div className="text-xs text-slate-400">Processed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">{run.itemsSaved}</div>
                        <div className="text-xs text-slate-400">Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-400">{run.errors.length}</div>
                        <div className="text-xs text-slate-400">Errors</div>
                      </div>
                    </div>
                    
                    {run.errors.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-red-400 mb-1">Errors:</h4>
                        <ul className="text-xs text-red-300 space-y-1">
                          {run.errors.map((error, index) => (
                            <li key={`error-${run.id}-${index}`}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                        View Logs
                      </summary>
                      <div className="mt-2 p-2 bg-slate-900/50 rounded text-slate-300">
                        {run.logs.map((log, index) => (
                          <div key={`log-${run.id}-${index}`}>• {log}</div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="stats">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">{selectedJob.totalRuns}</div>
                    <div className="text-sm text-slate-400">Total Runs</div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{selectedJob.successfulRuns}</div>
                    <div className="text-sm text-slate-400">Successful</div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-400">{selectedJob.failedRuns}</div>
                    <div className="text-sm text-slate-400">Failed</div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{selectedJob.itemsScraped}</div>
                    <div className="text-sm text-slate-400">Items Scraped</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="config">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Job Configuration</h4>
                    <pre className="text-sm text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedJob.config, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedJob ? 'Edit Job' : 'Create New Job'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure scraping job parameters and schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-slate-300">Job Name</Label>
              <Input
                placeholder="Enter job name"
                className="mt-1 bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label className="text-sm text-slate-300">Job Board</Label>
              <Select>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select job board" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="board_1">RemoteOK</SelectItem>
                  <SelectItem value="board_2">AngelList</SelectItem>
                  <SelectItem value="board_3">Stack Overflow Jobs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm text-slate-300">Execution Mode</Label>
              <Select>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowJobDialog(false);
                  setSelectedJob(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {selectedJob ? 'Update Job' : 'Create Job'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}