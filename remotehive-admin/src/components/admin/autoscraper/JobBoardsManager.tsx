'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Rss,
  Code,
  Save,
  X,
  Upload,
  FileText,
  Download
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';
import { autoScraperApi } from '@/lib/api';

interface JobBoard {
  id: string;
  name: string;
  type: 'RSS' | 'HTML';
  url: string;
  isActive: boolean;
  lastScraped: string;
  totalJobs: number;
  successRate: number;
  config: {
    selectors?: {
      title?: string;
      company?: string;
      location?: string;
      description?: string;
      salary?: string;
      link?: string;
    };
    rssConfig?: {
      titleField?: string;
      descriptionField?: string;
      linkField?: string;
      dateField?: string;
    };
    schedule: {
      interval: number;
      unit: 'minutes' | 'hours' | 'days';
    };
    rateLimiting: {
      requestsPerMinute: number;
      delayBetweenRequests: number;
    };
    region?: string; // Region information from CSV
  };
}



interface JobBoardsManagerProps {
  onJobBoardUpdate?: (jobBoard: JobBoard) => void;
}

export function JobBoardsManager({ onJobBoardUpdate }: JobBoardsManagerProps) {
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<JobBoard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch job boards on component mount
  useEffect(() => {
    fetchJobBoards();
  }, []);

  const fetchJobBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await autoScraperApi.getJobBoards();
      setJobBoards(response.data || []);
    } catch (err) {
      console.error('Failed to fetch job boards:', err);
      setError('Failed to load job boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = () => {
    const newBoard: JobBoard = {
      id: Date.now().toString(),
      name: '',
      type: 'RSS',
      url: '',
      isActive: false,
      lastScraped: 'Never',
      totalJobs: 0,
      successRate: 0,
      config: {
        schedule: {
          interval: 2,
          unit: 'hours'
        },
        rateLimiting: {
          requestsPerMinute: 30,
          delayBetweenRequests: 2000
        }
      }
    };
    setSelectedBoard(newBoard);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleEditBoard = (board: JobBoard) => {
    setSelectedBoard({ ...board });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSaveBoard = async () => {
    if (!selectedBoard) return;

    try {
      const isExisting = jobBoards.find(b => b.id === selectedBoard.id);
      
      if (isExisting) {
        // Update existing job board
        await autoScraperApi.updateJobBoard(selectedBoard.id, selectedBoard);
        setJobBoards(prev => prev.map(b => b.id === selectedBoard.id ? selectedBoard : b));
      } else {
        // Create new job board
        const response = await autoScraperApi.createJobBoard(selectedBoard);
        const newBoard = response.data || selectedBoard;
        setJobBoards(prev => [...prev, newBoard]);
      }

      onJobBoardUpdate?.(selectedBoard);
      setIsDialogOpen(false);
      setSelectedBoard(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save job board:', err);
      setError('Failed to save job board');
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await autoScraperApi.deleteJobBoard(boardId);
      setJobBoards(prev => prev.filter(b => b.id !== boardId));
    } catch (err) {
      console.error('Failed to delete job board:', err);
      setError('Failed to delete job board');
    }
  };

  const handleToggleActive = async (boardId: string) => {
    try {
      const board = jobBoards.find(b => b.id === boardId);
      if (!board) return;
      
      const newStatus = !board.isActive;
      await autoScraperApi.toggleJobBoardStatus(boardId, newStatus);
      setJobBoards(prev => prev.map(b => 
        b.id === boardId ? { ...b, isActive: newStatus } : b
      ));
    } catch (err) {
      console.error('Failed to toggle job board status:', err);
      setError('Failed to update job board status');
    }
  };

  const getStatusColor = (isActive: boolean, successRate: number) => {
    if (!isActive) return 'bg-gray-500';
    if (successRate >= 95) return 'bg-green-500';
    if (successRate >= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: string) => {
    return type === 'RSS' ? Rss : Code;
  };

  const handleCSVUpload = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (csvText: string): Array<{name: string, url: string, region?: string}> => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const jobBoardData: Array<{name: string, url: string, region?: string}> = [];
    let headers: string[] = [];
    
    lines.forEach((line, index) => {
      // Parse CSV line properly handling quoted values
      const columns = line.match(/(?:"[^"]*"|[^,])+/g)?.map(col => col.trim().replace(/^"|"$/g, '')) || [];
      
      if (index === 0) {
        // Check if first row is header
        const firstCol = columns[0]?.toLowerCase();
        if (firstCol && (firstCol.includes('name') || firstCol.includes('job') || firstCol.includes('board'))) {
          headers = columns.map(h => h.toLowerCase());
          return;
        }
      }
      
      // Process data rows
      if (columns.length >= 2) {
        const name = columns[0];
        const url = columns[1];
        const region = columns[2] || undefined;
        
        if (name && name.length > 0 && url && url.length > 0) {
          jobBoardData.push({ name, url, region });
        }
      }
    });
    
    return jobBoardData;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadStatus('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Processing CSV file...');

    try {
      const text = await file.text();
      const jobBoardData = parseCSV(text);
      
      if (jobBoardData.length === 0) {
        setUploadStatus('No valid job board data found in CSV');
        setIsUploading(false);
        return;
      }

      // Create job boards from CSV data with proper field mapping
      const newJobBoards: JobBoard[] = jobBoardData.map((data, index) => ({
        id: `csv-${Date.now()}-${index}`,
        name: data.name,
        type: 'HTML' as const, // Default to HTML scraping
        url: data.url,
        isActive: false,
        lastScraped: 'Never',
        totalJobs: 0,
        successRate: 0,
        config: {
          schedule: {
            interval: 2,
            unit: 'hours' as const
          },
          rateLimiting: {
            requestsPerMinute: 30,
            delayBetweenRequests: 2000
          },
          region: data.region // Store region information
        }
      }));

      // Send CSV file to backend API for permanent storage
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('test_accessibility', 'false'); // Skip accessibility testing for faster import

        const result = await autoScraperApi.uploadJobBoardsCSV(formData);
        
        // Add new job boards to existing ones (for UI display)
        setJobBoards(prev => [...prev, ...newJobBoards]);
        setUploadStatus(`Successfully uploaded CSV to database. Processing ${result.total_rows} job boards (Upload ID: ${result.upload_id})`);
        
        // Optionally poll for status updates
        if (result.upload_id) {
          setTimeout(() => checkUploadStatus(result.upload_id), 2000);
        }
        
      } catch (error) {
        console.error('API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Still add to UI but show warning about database
        setJobBoards(prev => [...prev, ...newJobBoards]);
        setUploadStatus(`Imported ${jobBoardData.length} job boards to UI. Warning: Database upload failed - ${errorMessage}`);
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setUploadStatus('');
      }, 5000);
      
    } catch (error) {
      setUploadStatus('Error processing CSV file');
      console.error('CSV parsing error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const generateSampleCSV = () => {
    const sampleData = [
      'name,url,region',
      'Indeed,https://indeed.com,Worldwide',
      'LinkedIn Jobs,https://linkedin.com,Worldwide',
      'Glassdoor,https://glassdoor.com,Worldwide',
      'Monster,https://monster.com,USA',
      'CareerBuilder,https://careerbuilder.com,USA',
      'ZipRecruiter,https://ziprecruiter.com,USA',
      'SimplyHired,https://simplyhired.com,Worldwide',
      'AngelList,https://angel.co,Worldwide',
      'Stack Overflow Jobs,https://stackoverflow.com/jobs,Worldwide',
      'RemoteOK,https://remoteok.io,Worldwide'
    ];
    
    const csvContent = sampleData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'job_boards_sample.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const checkUploadStatus = async (uploadId: string) => {
    try {
      const response = await fetch(`/api/v1/csv/job-boards/status/${uploadId}`);
      if (response.ok) {
        const status = await response.json();
        if (status.status === 'completed') {
          setUploadStatus(`Upload completed: ${status.created} created, ${status.updated} updated, ${status.skipped} skipped`);
        } else if (status.status === 'failed') {
          setUploadStatus(`Upload failed: ${status.errors?.join(', ') || 'Unknown error'}`);
        } else {
          setUploadStatus(`Processing: ${status.processed}/${status.total_rows} rows processed`);
          // Continue polling if still processing
          setTimeout(() => checkUploadStatus(uploadId), 3000);
        }
      }
    } catch (error) {
      console.error('Error checking upload status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Job Boards</h2>
          <p className="text-slate-400">Manage job board configurations and scraping settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={generateSampleCSV}
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
          <Button 
            onClick={handleCSVUpload} 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={isUploading}
          >
            {isUploading ? (
              <FileText className="w-4 h-4 mr-2 animate-pulse" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Processing...' : 'Upload CSV'}
          </Button>
          <Button onClick={handleCreateBoard} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Job Board
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload status */}
      {uploadStatus && (
        <Alert className={`${uploadStatus.includes('Successfully') ? 'border-green-500 bg-green-500/10' : uploadStatus.includes('Error') || uploadStatus.includes('Please') ? 'border-red-500 bg-red-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
          <AlertDescription className={`${uploadStatus.includes('Successfully') ? 'text-green-400' : uploadStatus.includes('Error') || uploadStatus.includes('Please') ? 'text-red-400' : 'text-blue-400'}`}>
            {uploadStatus}
          </AlertDescription>
        </Alert>
      )}

      {/* Job Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {jobBoards.map((board) => {
            const TypeIcon = getTypeIcon(board.type);
            return (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{board.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {board.type}
                        </Badge>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(board.isActive, board.successRate)}`} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Jobs</span>
                      <span className="text-white font-medium">{board.totalJobs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Success Rate</span>
                      <span className="text-white font-medium">{board.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Last Scraped</span>
                      <span className="text-white font-medium text-xs">{board.lastScraped}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Schedule</span>
                      <span className="text-white font-medium text-xs">
                        Every {board.config.schedule.interval} {board.config.schedule.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={board.isActive}
                        onCheckedChange={() => handleToggleActive(board.id)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <span className="text-sm text-slate-400">
                        {board.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditBoard(board)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteBoard(board.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Job Board Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isEditing ? 'Edit Job Board' : 'Add Job Board'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure job board settings and scraping parameters
            </DialogDescription>
          </DialogHeader>

          {selectedBoard && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Name</Label>
                    <Input
                      id="name"
                      value={selectedBoard.name}
                      onChange={(e) => setSelectedBoard(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Job board name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-slate-300">Type</Label>
                    <Select
                      value={selectedBoard.type}
                      onValueChange={(value: 'RSS' | 'HTML') => 
                        setSelectedBoard(prev => prev ? { ...prev, type: value } : null)
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="RSS">RSS Feed</SelectItem>
                        <SelectItem value="HTML">HTML Scraping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-slate-300">URL</Label>
                  <Input
                    id="url"
                    value={selectedBoard.url}
                    onChange={(e) => setSelectedBoard(prev => prev ? { ...prev, url: e.target.value } : null)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="https://example.com/jobs"
                  />
                </div>
              </div>

              {/* Scraping Configuration */}
              {selectedBoard.type === 'HTML' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">HTML Selectors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Title Selector</Label>
                      <Input
                        value={selectedBoard.config.selectors?.title || ''}
                        onChange={(e) => setSelectedBoard(prev => prev ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            selectors: { ...prev.config.selectors, title: e.target.value }
                          }
                        } : null)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder=".job-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Company Selector</Label>
                      <Input
                        value={selectedBoard.config.selectors?.company || ''}
                        onChange={(e) => setSelectedBoard(prev => prev ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            selectors: { ...prev.config.selectors, company: e.target.value }
                          }
                        } : null)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder=".company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Location Selector</Label>
                      <Input
                        value={selectedBoard.config.selectors?.location || ''}
                        onChange={(e) => setSelectedBoard(prev => prev ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            selectors: { ...prev.config.selectors, location: e.target.value }
                          }
                        } : null)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder=".location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Link Selector</Label>
                      <Input
                        value={selectedBoard.config.selectors?.link || ''}
                        onChange={(e) => setSelectedBoard(prev => prev ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            selectors: { ...prev.config.selectors, link: e.target.value }
                          }
                        } : null)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder=".job-link a"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Interval</Label>
                    <Input
                      type="number"
                      value={selectedBoard.config.schedule.interval}
                      onChange={(e) => setSelectedBoard(prev => prev ? {
                        ...prev,
                        config: {
                          ...prev.config,
                          schedule: { ...prev.config.schedule, interval: parseInt(e.target.value) }
                        }
                      } : null)}
                      className="bg-slate-800 border-slate-600 text-white"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Unit</Label>
                    <Select
                      value={selectedBoard.config.schedule.unit}
                      onValueChange={(value: 'minutes' | 'hours' | 'days') => 
                        setSelectedBoard(prev => prev ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            schedule: { ...prev.config.schedule, unit: value }
                          }
                        } : null)
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Rate Limiting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Requests per Minute</Label>
                    <Input
                      type="number"
                      value={selectedBoard.config.rateLimiting.requestsPerMinute}
                      onChange={(e) => setSelectedBoard(prev => prev ? {
                        ...prev,
                        config: {
                          ...prev.config,
                          rateLimiting: { ...prev.config.rateLimiting, requestsPerMinute: parseInt(e.target.value) }
                        }
                      } : null)}
                      className="bg-slate-800 border-slate-600 text-white"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Delay Between Requests (ms)</Label>
                    <Input
                      type="number"
                      value={selectedBoard.config.rateLimiting.delayBetweenRequests}
                      onChange={(e) => setSelectedBoard(prev => prev ? {
                        ...prev,
                        config: {
                          ...prev.config,
                          rateLimiting: { ...prev.config.rateLimiting, delayBetweenRequests: parseInt(e.target.value) }
                        }
                      } : null)}
                      className="bg-slate-800 border-slate-600 text-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveBoard} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Job Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}