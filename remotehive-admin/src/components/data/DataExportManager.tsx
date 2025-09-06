'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  Upload,
  FileText,
  Calendar,
  Clock,
  Mail,
  Settings,
  Play,
  Pause,
  Stop,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Search,
  Save,
  X,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Archive,
  Database,
  Table,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Users,
  Globe,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Activity,
  Zap,
  Target,
  Layers,
  Grid,
  List,
  Columns,
  Rows,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  ExternalLink,
  Share,
  Link,
  QrCode,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Export interfaces
interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  supportsScheduling: boolean;
  maxFileSize: number; // in MB
  features: string[];
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  dataSource: string;
  columns: {
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'json';
    format?: string;
    transform?: string;
    required: boolean;
  }[];
  filters: {
    field: string;
    operator: string;
    value: any;
    type: 'include' | 'exclude';
  }[];
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  grouping: {
    field: string;
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  }[];
  options: {
    includeHeaders: boolean;
    dateFormat: string;
    numberFormat: string;
    encoding: string;
    compression: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduledExport {
  id: string;
  name: string;
  description: string;
  templateId: string;
  templateName: string;
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    cronExpression?: string; // for custom
    timezone: string;
  };
  delivery: {
    method: 'download' | 'email' | 'webhook' | 'ftp' | 's3';
    recipients?: string[];
    webhookUrl?: string;
    ftpConfig?: {
      host: string;
      username: string;
      password: string;
      path: string;
    };
    s3Config?: {
      bucket: string;
      key: string;
      region: string;
    };
  };
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExportJob {
  id: string;
  name: string;
  type: 'manual' | 'scheduled';
  templateId?: string;
  templateName?: string;
  scheduledExportId?: string;
  format: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalRecords?: number;
  processedRecords?: number;
  fileSize?: number;
  filePath?: string;
  downloadUrl?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  metadata: {
    filters?: any;
    columns?: string[];
    options?: any;
  };
}

interface ExportStats {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  totalDataExported: number; // in MB
  avgExportTime: number; // in seconds
  popularFormats: {
    format: string;
    count: number;
    percentage: number;
  }[];
  recentActivity: {
    date: Date;
    exports: number;
    dataSize: number;
  }[];
}

interface DataExportManagerProps {
  refreshInterval?: number;
  maxJobHistory?: number;
  enableRealTime?: boolean;
  apiUrl?: string;
}

const DataExportManager: React.FC<DataExportManagerProps> = ({
  refreshInterval = 5000,
  maxJobHistory = 100,
  enableRealTime = true,
  apiUrl = '/api/exports'
}) => {
  const [activeTab, setActiveTab] = useState('exports');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Export system state
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
  const [exportTemplates, setExportTemplates] = useState<ExportTemplate[]>([]);
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  
  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledExport | null>(null);
  
  // Export wizard state
  const [exportWizardStep, setExportWizardStep] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [exportFilters, setExportFilters] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState<any>({});

  // Generate mock export formats
  const generateMockFormats = useCallback((): ExportFormat[] => {
    return [
      {
        id: 'csv',
        name: 'CSV (Comma Separated Values)',
        extension: 'csv',
        mimeType: 'text/csv',
        description: 'Simple comma-separated format, compatible with Excel and most tools',
        supportsScheduling: true,
        maxFileSize: 500,
        features: ['Headers', 'Custom Delimiter', 'Encoding Options', 'Compression']
      },
      {
        id: 'excel',
        name: 'Microsoft Excel',
        extension: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        description: 'Excel workbook with formatting, formulas, and multiple sheets',
        supportsScheduling: true,
        maxFileSize: 100,
        features: ['Multiple Sheets', 'Formatting', 'Charts', 'Formulas', 'Pivot Tables']
      },
      {
        id: 'json',
        name: 'JSON (JavaScript Object Notation)',
        extension: 'json',
        mimeType: 'application/json',
        description: 'Structured data format, ideal for APIs and web applications',
        supportsScheduling: true,
        maxFileSize: 1000,
        features: ['Nested Objects', 'Arrays', 'Data Types', 'Compression']
      },
      {
        id: 'xml',
        name: 'XML (Extensible Markup Language)',
        extension: 'xml',
        mimeType: 'application/xml',
        description: 'Structured markup format with schema validation',
        supportsScheduling: true,
        maxFileSize: 800,
        features: ['Schema Validation', 'Namespaces', 'Attributes', 'XSLT Support']
      },
      {
        id: 'pdf',
        name: 'PDF Report',
        extension: 'pdf',
        mimeType: 'application/pdf',
        description: 'Formatted report with charts, tables, and custom layouts',
        supportsScheduling: true,
        maxFileSize: 50,
        features: ['Custom Layout', 'Charts', 'Images', 'Headers/Footers', 'Watermarks']
      },
      {
        id: 'parquet',
        name: 'Apache Parquet',
        extension: 'parquet',
        mimeType: 'application/octet-stream',
        description: 'Columnar storage format optimized for analytics',
        supportsScheduling: true,
        maxFileSize: 2000,
        features: ['Compression', 'Schema Evolution', 'Predicate Pushdown', 'Column Pruning']
      }
    ];
  }, []);

  // Generate mock export templates
  const generateMockTemplates = useCallback((): ExportTemplate[] => {
    return [
      {
        id: 'template-1',
        name: 'Daily Scraping Report',
        description: 'Daily summary of all scraping activities with success rates and errors',
        format: 'excel',
        dataSource: 'scraping_jobs',
        columns: [
          { field: 'job_id', label: 'Job ID', type: 'string', required: true },
          { field: 'job_name', label: 'Job Name', type: 'string', required: true },
          { field: 'status', label: 'Status', type: 'string', required: true },
          { field: 'start_time', label: 'Start Time', type: 'date', format: 'yyyy-MM-dd HH:mm:ss', required: true },
          { field: 'end_time', label: 'End Time', type: 'date', format: 'yyyy-MM-dd HH:mm:ss', required: false },
          { field: 'records_scraped', label: 'Records Scraped', type: 'number', required: true },
          { field: 'success_rate', label: 'Success Rate (%)', type: 'number', format: '0.00', required: true },
          { field: 'errors', label: 'Error Count', type: 'number', required: true }
        ],
        filters: [
          { field: 'start_time', operator: 'gte', value: '{{today}}', type: 'include' },
          { field: 'start_time', operator: 'lt', value: '{{tomorrow}}', type: 'include' }
        ],
        sorting: [
          { field: 'start_time', direction: 'desc' }
        ],
        grouping: [],
        options: {
          includeHeaders: true,
          dateFormat: 'yyyy-MM-dd HH:mm:ss',
          numberFormat: '#,##0.00',
          encoding: 'utf-8',
          compression: false
        },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'template-2',
        name: 'Performance Metrics Export',
        description: 'System performance metrics for analysis and monitoring',
        format: 'json',
        dataSource: 'performance_metrics',
        columns: [
          { field: 'timestamp', label: 'Timestamp', type: 'date', required: true },
          { field: 'cpu_usage', label: 'CPU Usage (%)', type: 'number', format: '0.00', required: true },
          { field: 'memory_usage', label: 'Memory Usage (%)', type: 'number', format: '0.00', required: true },
          { field: 'disk_usage', label: 'Disk Usage (%)', type: 'number', format: '0.00', required: true },
          { field: 'network_in', label: 'Network In (MB)', type: 'number', format: '0.00', required: true },
          { field: 'network_out', label: 'Network Out (MB)', type: 'number', format: '0.00', required: true },
          { field: 'response_time', label: 'Response Time (ms)', type: 'number', format: '0', required: true }
        ],
        filters: [],
        sorting: [
          { field: 'timestamp', direction: 'asc' }
        ],
        grouping: [],
        options: {
          includeHeaders: false,
          dateFormat: 'iso',
          numberFormat: '0.00',
          encoding: 'utf-8',
          compression: true
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'template-3',
        name: 'Error Analysis Report',
        description: 'Detailed error analysis with categorization and trends',
        format: 'csv',
        dataSource: 'error_logs',
        columns: [
          { field: 'error_id', label: 'Error ID', type: 'string', required: true },
          { field: 'timestamp', label: 'Timestamp', type: 'date', format: 'yyyy-MM-dd HH:mm:ss', required: true },
          { field: 'error_type', label: 'Error Type', type: 'string', required: true },
          { field: 'error_message', label: 'Error Message', type: 'string', required: true },
          { field: 'source_url', label: 'Source URL', type: 'string', required: false },
          { field: 'job_id', label: 'Job ID', type: 'string', required: false },
          { field: 'severity', label: 'Severity', type: 'string', required: true },
          { field: 'resolved', label: 'Resolved', type: 'boolean', required: true }
        ],
        filters: [
          { field: 'severity', operator: 'in', value: ['high', 'critical'], type: 'include' }
        ],
        sorting: [
          { field: 'timestamp', direction: 'desc' },
          { field: 'severity', direction: 'asc' }
        ],
        grouping: [
          { field: 'error_type', aggregation: 'count' }
        ],
        options: {
          includeHeaders: true,
          dateFormat: 'yyyy-MM-dd HH:mm:ss',
          numberFormat: '#,##0',
          encoding: 'utf-8',
          compression: false
        },
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Generate mock scheduled exports
  const generateMockScheduledExports = useCallback((): ScheduledExport[] => {
    return [
      {
        id: 'schedule-1',
        name: 'Daily Operations Report',
        description: 'Daily report sent to operations team every morning',
        templateId: 'template-1',
        templateName: 'Daily Scraping Report',
        schedule: {
          type: 'daily',
          time: '08:00',
          timezone: 'UTC'
        },
        delivery: {
          method: 'email',
          recipients: ['ops@example.com', 'manager@example.com']
        },
        enabled: true,
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 8 * 60 * 60 * 1000),
        runCount: 45,
        successCount: 43,
        failureCount: 2,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'schedule-2',
        name: 'Weekly Performance Analysis',
        description: 'Weekly performance metrics for system analysis',
        templateId: 'template-2',
        templateName: 'Performance Metrics Export',
        schedule: {
          type: 'weekly',
          time: '09:00',
          dayOfWeek: 1, // Monday
          timezone: 'UTC'
        },
        delivery: {
          method: 'webhook',
          webhookUrl: 'https://api.example.com/reports/performance'
        },
        enabled: true,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        runCount: 12,
        successCount: 11,
        failureCount: 1,
        createdAt: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'schedule-3',
        name: 'Monthly Error Summary',
        description: 'Monthly error analysis report for quality assurance',
        templateId: 'template-3',
        templateName: 'Error Analysis Report',
        schedule: {
          type: 'monthly',
          time: '10:00',
          dayOfMonth: 1,
          timezone: 'UTC'
        },
        delivery: {
          method: 'email',
          recipients: ['qa@example.com']
        },
        enabled: false,
        lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        runCount: 3,
        successCount: 3,
        failureCount: 0,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ];
  }, []);

  // Generate mock export jobs
  const generateMockJobs = useCallback((): ExportJob[] => {
    const jobs: ExportJob[] = [];
    const statuses: ('pending' | 'running' | 'completed' | 'failed' | 'cancelled')[] = ['completed', 'completed', 'completed', 'failed', 'running'];
    const formats = ['csv', 'excel', 'json', 'xml', 'pdf'];
    const types: ('manual' | 'scheduled')[] = ['manual', 'scheduled'];
    
    for (let i = 0; i < 20; i++) {
      const startedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const duration = status === 'completed' ? Math.random() * 300 + 10 : undefined;
      const completedAt = status === 'completed' && duration ? new Date(startedAt.getTime() + duration * 1000) : undefined;
      
      jobs.push({
        id: `job-${i + 1}`,
        name: `Export Job ${i + 1}`,
        type: types[Math.floor(Math.random() * types.length)],
        templateId: Math.random() > 0.5 ? `template-${Math.floor(Math.random() * 3) + 1}` : undefined,
        templateName: Math.random() > 0.5 ? `Template ${Math.floor(Math.random() * 3) + 1}` : undefined,
        scheduledExportId: Math.random() > 0.7 ? `schedule-${Math.floor(Math.random() * 3) + 1}` : undefined,
        format: formats[Math.floor(Math.random() * formats.length)],
        status,
        progress: status === 'running' ? Math.floor(Math.random() * 80) + 10 : (status === 'completed' ? 100 : 0),
        totalRecords: Math.floor(Math.random() * 100000) + 1000,
        processedRecords: status === 'completed' ? Math.floor(Math.random() * 100000) + 1000 : (status === 'running' ? Math.floor(Math.random() * 50000) : 0),
        fileSize: status === 'completed' ? Math.random() * 50 + 1 : undefined,
        filePath: status === 'completed' ? `/exports/export-${i + 1}.${formats[Math.floor(Math.random() * formats.length)]}` : undefined,
        downloadUrl: status === 'completed' ? `https://api.example.com/downloads/export-${i + 1}` : undefined,
        startedAt,
        completedAt,
        duration,
        error: status === 'failed' ? 'Database connection timeout' : undefined,
        metadata: {
          filters: { date_range: '2024-01-01 to 2024-01-31' },
          columns: ['id', 'name', 'status', 'created_at'],
          options: { format: 'csv', encoding: 'utf-8' }
        }
      });
    }
    
    return jobs.sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }, []);

  // Generate mock stats
  const generateMockStats = useCallback((): ExportStats => {
    const recentActivity = [];
    for (let i = 29; i >= 0; i--) {
      recentActivity.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        exports: Math.floor(Math.random() * 10) + 2,
        dataSize: Math.random() * 100 + 10
      });
    }
    
    return {
      totalExports: 1247,
      successfulExports: 1198,
      failedExports: 49,
      totalDataExported: 15678.5,
      avgExportTime: 45.2,
      popularFormats: [
        { format: 'CSV', count: 487, percentage: 39.1 },
        { format: 'Excel', count: 324, percentage: 26.0 },
        { format: 'JSON', count: 236, percentage: 18.9 },
        { format: 'PDF', count: 134, percentage: 10.7 },
        { format: 'XML', count: 66, percentage: 5.3 }
      ],
      recentActivity
    };
  }, []);

  // Initialize data
  useEffect(() => {
    setExportFormats(generateMockFormats());
    setExportTemplates(generateMockTemplates());
    setScheduledExports(generateMockScheduledExports());
    setExportJobs(generateMockJobs());
    setExportStats(generateMockStats());
  }, [generateMockFormats, generateMockTemplates, generateMockScheduledExports, generateMockJobs, generateMockStats]);

  // Auto-refresh effect
  useEffect(() => {
    if (enableRealTime) {
      const interval = setInterval(() => {
        // Update running jobs progress
        setExportJobs(prev => prev.map(job => {
          if (job.status === 'running' && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 10, 100);
            if (newProgress >= 100) {
              return {
                ...job,
                status: 'completed',
                progress: 100,
                completedAt: new Date(),
                duration: job.startedAt ? (Date.now() - job.startedAt.getTime()) / 1000 : undefined,
                fileSize: Math.random() * 50 + 1,
                downloadUrl: `https://api.example.com/downloads/${job.id}`
              };
            }
            return { ...job, progress: newProgress };
          }
          return job;
        }));
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enableRealTime, refreshInterval]);

  // Filter export jobs
  const filteredJobs = useMemo(() => {
    return exportJobs.filter(job => {
      const matchesSearch = searchQuery === '' || 
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.templateName && job.templateName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
      const matchesFormat = filterFormat === 'all' || job.format === filterFormat;
      
      const jobDate = job.startedAt?.toISOString().split('T')[0] || '';
      const matchesDateRange = jobDate >= dateRange.start && jobDate <= dateRange.end;
      
      return matchesSearch && matchesStatus && matchesFormat && matchesDateRange;
    });
  }, [exportJobs, searchQuery, filterStatus, filterFormat, dateRange]);

  // Export actions
  const startExport = useCallback(async (templateId?: string) => {
    setIsLoading(true);
    // Simulate export start
    const newJob: ExportJob = {
      id: `job-${Date.now()}`,
      name: `Manual Export ${new Date().toLocaleString()}`,
      type: 'manual',
      templateId,
      templateName: templateId ? exportTemplates.find(t => t.id === templateId)?.name : undefined,
      format: selectedFormat || 'csv',
      status: 'running',
      progress: 0,
      totalRecords: Math.floor(Math.random() * 100000) + 1000,
      processedRecords: 0,
      startedAt: new Date(),
      metadata: {
        filters: exportFilters,
        columns: selectedColumns,
        options: exportOptions
      }
    };
    
    setExportJobs(prev => [newJob, ...prev]);
    setIsLoading(false);
    setShowExportDialog(false);
  }, [selectedFormat, exportFilters, selectedColumns, exportOptions, exportTemplates]);

  const cancelExport = useCallback((jobId: string) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId && job.status === 'running'
        ? { ...job, status: 'cancelled' }
        : job
    ));
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  // Template actions
  const deleteTemplate = useCallback((templateId: string) => {
    setExportTemplates(prev => prev.filter(template => template.id !== templateId));
  }, []);

  // Schedule actions
  const toggleSchedule = useCallback((scheduleId: string) => {
    setScheduledExports(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, enabled: !schedule.enabled, updatedAt: new Date() }
        : schedule
    ));
  }, []);

  const runScheduleNow = useCallback(async (scheduleId: string) => {
    const schedule = scheduledExports.find(s => s.id === scheduleId);
    if (schedule) {
      await startExport(schedule.templateId);
    }
  }, [scheduledExports, startExport]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-50';
      case 'running': return 'text-blue-500 bg-blue-50';
      case 'failed': return 'text-red-500 bg-red-50';
      case 'cancelled': return 'text-orange-500 bg-orange-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'csv': return <Table className="h-4 w-4" />;
      case 'excel': return <Grid className="h-4 w-4" />;
      case 'json': return <Database className="h-4 w-4" />;
      case 'xml': return <FileText className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'parquet': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Export Manager</h2>
          <p className="text-muted-foreground">
            Export data in multiple formats with scheduling and automation
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
          <Button onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportStats?.totalExports || 0}</div>
            <p className="text-xs text-muted-foreground">
              {exportStats?.successfulExports || 0} successful
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {exportStats ? ((exportStats.successfulExports / exportStats.totalExports) * 100).toFixed(1) : 0}%
            </div>
            <Progress value={exportStats ? (exportStats.successfulExports / exportStats.totalExports) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Exported</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exportStats?.totalDataExported.toFixed(1) || 0} MB
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Export Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exportStats?.avgExportTime.toFixed(1) || 0}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exports">Export Jobs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="formats">Formats</TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search exports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select value={filterFormat} onValueChange={setFilterFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Export Jobs ({filteredJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        {getFormatIcon(job.format)}
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{job.name}</span>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <Badge variant="secondary">
                              {job.format.toUpperCase()}
                            </Badge>
                            {job.type === 'scheduled' && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mt-1">
                            {job.templateName && `Template: ${job.templateName} • `}
                            {job.startedAt?.toLocaleString()}
                            {job.duration && ` • Duration: ${job.duration.toFixed(1)}s`}
                            {job.fileSize && ` • Size: ${job.fileSize.toFixed(1)} MB`}
                          </div>
                          
                          {job.status === 'running' && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress: {job.processedRecords?.toLocaleString()} / {job.totalRecords?.toLocaleString()}</span>
                                <span>{job.progress}%</span>
                              </div>
                              <Progress value={job.progress} className="mt-1" />
                            </div>
                          )}
                          
                          {job.error && (
                            <div className="text-sm text-red-500 mt-1">
                              Error: {job.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {job.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelExport(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {job.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(job.downloadUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {exportTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{template.name}</span>
                        <Badge variant="outline">
                          {template.format.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">
                          {template.columns.length} columns
                        </Badge>
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startExport(template.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Data Source</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {template.dataSource}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Filters</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {template.filters.length} filter(s) applied
                      </div>
                    </div>
                    
                    <div>
                      <Label>Last Updated</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {template.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Columns</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.columns.slice(0, 8).map((column) => (
                        <Badge key={column.field} variant="secondary" className="text-xs">
                          {column.label}
                        </Badge>
                      ))}
                      {template.columns.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.columns.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scheduled Exports</h3>
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
          
          <div className="grid gap-4">
            {scheduledExports.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{schedule.name}</span>
                        <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">
                          {schedule.schedule.type}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{schedule.description}</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={() => toggleSchedule(schedule.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runScheduleNow(schedule.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setShowScheduleDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label>Template</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.templateName}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Schedule</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.schedule.type} at {schedule.schedule.time}
                        {schedule.schedule.dayOfWeek !== undefined && ` (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][schedule.schedule.dayOfWeek]})`}
                        {schedule.schedule.dayOfMonth && ` (${schedule.schedule.dayOfMonth}th)`}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Delivery</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.delivery.method}
                        {schedule.delivery.recipients && ` (${schedule.delivery.recipients.length} recipients)`}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Success Rate</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.runCount > 0 ? ((schedule.successCount / schedule.runCount) * 100).toFixed(1) : 0}%
                        ({schedule.successCount}/{schedule.runCount})
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Last Run</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.lastRun ? schedule.lastRun.toLocaleString() : 'Never'}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Next Run</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.nextRun ? schedule.nextRun.toLocaleString() : 'Not scheduled'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6">
          <div className="grid gap-4">
            {exportFormats.map((format) => (
              <Card key={format.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getFormatIcon(format.id)}
                        <span>{format.name}</span>
                        <Badge variant="outline">
                          .{format.extension}
                        </Badge>
                        {format.supportsScheduling && (
                          <Badge variant="secondary">
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedulable
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{format.description}</CardDescription>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">Max Size: {format.maxFileSize} MB</div>
                      <div className="text-xs text-muted-foreground">{format.mimeType}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Features</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {format.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataExportManager;
export type { ExportFormat, ExportTemplate, ScheduledExport, ExportJob, ExportStats };