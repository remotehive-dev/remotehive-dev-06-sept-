'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  FileText,
  Globe,
  MapPin,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  Move
} from 'lucide-react';
import { toast } from 'sonner';
import { useRetry, retryConditions } from '@/hooks/useRetry';
import { uploadFile } from '@/utils/api';
// Using HTML5 drag and drop API instead of external libraries for better React 19 compatibility

interface CSVField {
  id: string;
  name: string;
  value: string;
  required: boolean;
  type: 'text' | 'url' | 'select' | 'number';
  options?: string[];
}

interface ScraperField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'url' | 'select' | 'number' | 'boolean';
  required: boolean;
  description: string;
  category: 'basic' | 'advanced' | 'scheduling';
  options?: string[];
}

interface ConfigurationMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  complexity: 'simple' | 'intermediate' | 'advanced';
}

const AVAILABLE_FIELDS: ScraperField[] = [
  {
    id: 'source',
    name: 'source',
    label: 'Job Board',
    type: 'select',
    required: true,
    description: 'Select the job board to scrape from',
    category: 'basic',
    options: ['indeed', 'linkedin', 'glassdoor', 'monster', 'ziprecruiter']
  },
  {
    id: 'search_query',
    name: 'search_query',
    label: 'Search Keywords',
    type: 'text',
    required: true,
    description: 'Keywords to search for (e.g., "python developer")',
    category: 'basic'
  },
  {
    id: 'location',
    name: 'location',
    label: 'Location',
    type: 'text',
    required: true,
    description: 'Job location or "remote"',
    category: 'basic'
  },
  {
    id: 'scraper_name',
    name: 'scraper_name',
    label: 'Configuration Name',
    type: 'text',
    required: true,
    description: 'A descriptive name for this scraper configuration',
    category: 'basic'
  },
  {
    id: 'max_pages',
    name: 'max_pages',
    label: 'Maximum Pages',
    type: 'number',
    required: false,
    description: 'Maximum number of pages to scrape (1-50)',
    category: 'advanced'
  },
  {
    id: 'schedule_enabled',
    name: 'schedule_enabled',
    label: 'Enable Scheduling',
    type: 'boolean',
    required: false,
    description: 'Automatically run this scraper on a schedule',
    category: 'scheduling'
  },
  {
    id: 'schedule_interval_minutes',
    name: 'schedule_interval_minutes',
    label: 'Schedule Interval (minutes)',
    type: 'number',
    required: false,
    description: 'How often to run the scraper (15-1440 minutes)',
    category: 'scheduling'
  },
  {
    id: 'job_type',
    name: 'job_type',
    label: 'Job Type',
    type: 'select',
    required: false,
    description: 'Filter by job type',
    category: 'advanced',
    options: ['full-time', 'part-time', 'contract', 'internship', 'temporary']
  },
  {
    id: 'experience_level',
    name: 'experience_level',
    label: 'Experience Level',
    type: 'select',
    required: false,
    description: 'Filter by experience level',
    category: 'advanced',
    options: ['entry-level', 'mid-level', 'senior-level', 'executive']
  },
  {
    id: 'salary_min',
    name: 'salary_min',
    label: 'Minimum Salary',
    type: 'number',
    required: false,
    description: 'Minimum salary filter',
    category: 'advanced'
  }
];

const CONFIGURATION_MODES: ConfigurationMode[] = [
  {
    id: 'simple',
    name: 'Quick Setup',
    description: 'I just want to scrape jobs quickly with minimal configuration',
    icon: <Zap className="h-5 w-5" />,
    complexity: 'simple'
  },
  {
    id: 'csv',
    name: 'CSV Upload',
    description: 'I have a CSV file with job board URLs and configurations',
    icon: <Upload className="h-5 w-5" />,
    complexity: 'intermediate'
  },
  {
    id: 'advanced',
    name: 'Advanced Configuration',
    description: 'I want full control over scraper settings and field mapping',
    icon: <Settings className="h-5 w-5" />,
    complexity: 'advanced'
  }
];

export default function AdvancedConfigurationPage({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) {
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [csvData, setCsvData] = useState<CSVField[]>([]);
  const [selectedFields, setSelectedFields] = useState<ScraperField[]>([]);
  const [availableFields, setAvailableFields] = useState<ScraperField[]>(AVAILABLE_FIELDS);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Only keep the three required columns from the CSV rows
  const [csvRows, setCsvRows] = useState<Array<{ name: string; url: string; region: string }>>([]);
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Handle CSV file upload with improved error handling and progress
  const handleCsvUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      event.target.value = '';
      return;
    }

    onBusyChange?.(true);
    setIsUploading(true);
    setUploadProgress(0);
    setCsvFile(file);

    try {
      // Read CSV text directly to avoid FileReader async race
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

      if (lines.length === 0) {
        toast.error('Empty CSV file');
        setCsvRows([]);
        setCsvData([]);
        return;
      }

      // Parse and normalize headers, strip BOM if present
      let rawHeaders = lines[0].split(',').map(h => h.trim());
      if (rawHeaders.length > 0) {
        rawHeaders[0] = rawHeaders[0].replace(/^\uFEFF/, '');
      }
      const headers = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      const requiredHeaders = ['name', 'url', 'region'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));

      if (missing.length > 0) {
        toast.error(`Missing required columns: ${missing.join(', ')}`);
        setCsvRows([]);
        setCsvData([]);
        return;
      }

      const idx = {
        name: headers.indexOf('name'),
        url: headers.indexOf('url'),
        region: headers.indexOf('region'),
      };

      const rows = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
          name: (cols[idx.name] || '').trim(),
          url: (cols[idx.url] || '').trim(),
          region: (cols[idx.region] || '').trim(),
        };
      }).filter(r => r.name && r.url && r.region);

      if (rows.length === 0) {
        toast.error('No valid data rows found in CSV file');
        setCsvRows([]);
        setCsvData([]);
        return;
      }

      setCsvRows(rows);

      // Upload the original file to the scraper import API with progress
      const uploadResponse = await uploadFile(
        '/scraper/import',
        file,
        {
          mode: 'csv_upload',
          total_rows: rows.length
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (uploadResponse.success) {
        // Maintain a minimal mapping state for UI (only required fields)
        const data: CSVField[] = ['name', 'url', 'region'].map((header, index) => ({
          id: `csv_required_${index}`,
          name: header,
          value: '',
          required: true,
          type: header === 'url' ? 'url' : 'text'
        }));

        setCsvData(data);
        toast.success(`CSV upload successful! ${rows.length} scraper configurations imported to database.`);
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (err: any) {
      let errorMessage = 'CSV upload failed';
      if (err.response) {
        try {
          const errorResponse = JSON.parse(err.response);
          errorMessage = errorResponse.message || errorMessage;
        } catch {
          errorMessage = err.response;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      console.error('CSV upload failed:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      onBusyChange?.(false);
      // Allow re-uploading the same file by clearing input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onBusyChange]);

  // Handle drag and drop for field selection using HTML5 API
  const handleDragStart = (e: React.DragEvent, field: ScraperField, source: 'available' | 'selected') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ field, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: 'available' | 'selected') => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { field, source } = data;

    if (source === target) return;

    if (source === 'available' && target === 'selected') {
      setAvailableFields(prev => prev.filter(f => f.id !== field.id));
      setSelectedFields(prev => [...prev, field]);
    } else if (source === 'selected' && target === 'available') {
      setSelectedFields(prev => prev.filter(f => f.id !== field.id));
      setAvailableFields(prev => [...prev, field]);
    }
  };

  const moveFieldToSelected = (field: ScraperField) => {
    setAvailableFields(prev => prev.filter(f => f.id !== field.id));
    setSelectedFields(prev => [...prev, field]);
  };

  const moveFieldToAvailable = (field: ScraperField) => {
    setSelectedFields(prev => prev.filter(f => f.id !== field.id));
    setAvailableFields(prev => [...prev, field]);
  };

  // Handle configuration value changes
  const handleConfigChange = (fieldId: string, value: any) => {
    setConfigValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Handle quick setup
  const handleQuickSetup = () => {
    const basicFields = AVAILABLE_FIELDS.filter(field => field.category === 'basic');
    setSelectedFields(basicFields);
    setConfigValues({
      max_pages: 5,
      schedule_enabled: false,
      schedule_interval_minutes: 60
    });
  };

  // API call function for creating configuration
  const createConfigurationApi = useCallback(async () => {
    const config = {
      ...configValues,
      fields: selectedFields.map(field => field.name),
      csv_data: csvRows.length > 0 ? csvRows : null,
      mode: selectedMode
    };

    const response = await fetch('/api/scraper/configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }, [configValues, selectedFields, csvRows, selectedMode]);

  // Retry configuration for API calls
  const configRetry = useRetry(createConfigurationApi, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.warn(`Configuration creation attempt ${attempt} failed:`, error);
      toast.info(`Retrying configuration creation... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for configuration creation:', error);
      toast.error('Failed to create configuration after multiple attempts');
    }
  });

  // Handle configuration submission with retry
  const handleSubmitConfiguration = async () => {
    try {
      onBusyChange?.(true);
      await configRetry.execute();
      toast.success('Scraper configuration created successfully!');
      // Reset form
      setSelectedMode('');
      setSelectedFields([]);
      setConfigValues({});
      setCsvData([]);
      setCsvFile(null);
      setCsvRows([]);
    } catch (error) {
      console.error('Configuration creation failed:', error);
      // Error handling is done in the retry configuration
    } finally {
      onBusyChange?.(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Scraper Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Create intelligent job scraping configurations with advanced field mapping and CSV import
          </p>
        </div>
      </div>

      {/* Configuration Mode Selection */}
      {!selectedMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Choose Your Configuration Method
            </CardTitle>
            <CardDescription>
              Select how you'd like to set up your scraper configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONFIGURATION_MODES.map((mode) => (
                <Card 
                  key={mode.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                  onClick={() => {
                    setSelectedMode(mode.id);
                    if (mode.id === 'simple') handleQuickSetup();
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {mode.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{mode.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{mode.description}</p>
                        <Badge variant={mode.complexity === 'simple' ? 'default' : mode.complexity === 'intermediate' ? 'secondary' : 'outline'}>
                          {mode.complexity}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Upload Mode */}
      {selectedMode === 'csv' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CSV Upload Configuration
            </CardTitle>
            <CardDescription>
              Upload a CSV file with job board URLs, regions, and other configuration data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors ${
                isUploading ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 cursor-pointer'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/20">
                    <Upload className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Uploading CSV...</h3>
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Upload Progress</span>
                      <span>{uploadProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your CSV file...
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Required columns: name, url, region. Extra columns will be ignored.
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>

            {csvFile && !isUploading && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>File processed:</strong> {csvFile.name} - {csvRows.length} valid configurations imported to database
                </AlertDescription>
              </Alert>
            )}

            {/* CSV Field Mapping */}
            {csvData.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Field Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {csvData.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {field.name}
                        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </Label>
                      <Input
                        placeholder={`Enter ${field.name}`}
                        value={field.value}
                        onChange={(e) => {
                          setCsvData(prev => prev.map(f => 
                            f.id === field.id ? { ...f, value: e.target.value } : f
                          ));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Configuration Mode */}
      {selectedMode === 'advanced' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Field Configuration
            </CardTitle>
            <CardDescription>
              Drag and drop fields to customize your scraper configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Fields */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Available Fields
                </h3>
                <div
                  className="min-h-[400px] p-4 border-2 border-dashed rounded-lg border-muted-foreground/25"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'available')}
                >
                  {availableFields.map((field) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field, 'available')}
                      className="p-3 mb-2 bg-card border rounded-lg cursor-move hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center gap-2">
                        <Move className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-muted-foreground">{field.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={field.required ? 'destructive' : 'secondary'} className="text-xs">
                            {field.category}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveFieldToSelected(field)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableFields.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Move className="h-8 w-8 mx-auto mb-2" />
                      <p>All fields have been selected</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Fields */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Selected Fields
                </h3>
                <div
                  className="min-h-[400px] p-4 border-2 border-dashed rounded-lg border-muted-foreground/25"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'selected')}
                >
                  {selectedFields.map((field) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field, 'selected')}
                      className="p-3 mb-2 bg-primary/5 border border-primary/20 rounded-lg cursor-move hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center gap-2">
                        <Move className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-muted-foreground">{field.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={field.required ? 'destructive' : 'default'} className="text-xs">
                            {field.category}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveFieldToAvailable(field)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedFields.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <ArrowLeft className="h-8 w-8 mx-auto mb-2" />
                      <p>Drag fields here to configure</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Values */}
      {(selectedMode === 'simple' || selectedFields.length > 0 || csvData.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Values</CardTitle>
            <CardDescription>
              Set values for your selected fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.label}
                    {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select
                      value={configValues[field.name] || ''}
                      onValueChange={(value) => handleConfigChange(field.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={configValues[field.name] || false}
                        onCheckedChange={(checked) => handleConfigChange(field.name, checked)}
                      />
                      <span className="text-sm text-muted-foreground">{field.description}</span>
                    </div>
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : 'text'}
                      placeholder={field.description}
                      value={configValues[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, field.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedMode && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMode('');
              setSelectedFields([]);
              setConfigValues({});
              setCsvData([]);
              setCsvFile(null);
              setAvailableFields(AVAILABLE_FIELDS);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mode Selection
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Download sample CSV
                const csvContent = "name,url,region\nSample Config,https://example.com/jobs,US";
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sample_scraper_config.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
            
            <Button
              onClick={handleSubmitConfiguration}
              disabled={selectedFields.length === 0 && csvData.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}