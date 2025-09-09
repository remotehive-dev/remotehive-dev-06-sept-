'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Pause, Play, X } from 'lucide-react';
import { toast } from 'sonner';

interface CSVImport {
  id: string;
  filename: string;
  status: 'pending' | 'validating' | 'validated' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

interface ImportLog {
  id: string;
  row_number: number;
  status: 'success' | 'failed' | 'skipped';
  job_title?: string;
  company_name?: string;
  error_message?: string;
  created_at: string;
}

const CSVImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imports, setImports] = useState<CSVImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<CSVImport | null>(null);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback((uploadId: string) => {
    const ws = new WebSocket(`ws://localhost:8001/api/v1/ws/csv-import/${uploadId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for import:', uploadId);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        setImports(prev => prev.map(imp => 
          imp.id === uploadId ? { ...imp, ...data.data } : imp
        ));
      } else if (data.type === 'log') {
        setImportLogs(prev => [...prev, data.data]);
      } else if (data.type === 'completed') {
        setImports(prev => prev.map(imp => 
          imp.id === uploadId ? { ...imp, status: 'completed', completed_at: new Date().toISOString() } : imp
        ));
        toast.success('CSV import completed successfully!');
      } else if (data.type === 'error') {
        setImports(prev => prev.map(imp => 
          imp.id === uploadId ? { ...imp, status: 'failed', error_message: data.message } : imp
        ));
        toast.error(`Import failed: ${data.message}`);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error occurred');
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setWsConnection(ws);
    return ws;
  }, []);

  // Handle file drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      setSelectedFile(csvFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/v1/admin/csv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const newImport: CSVImport = {
        id: result.upload_id,
        filename: selectedFile.name,
        status: 'pending',
        total_rows: 0,
        processed_rows: 0,
        successful_rows: 0,
        failed_rows: 0,
        created_at: new Date().toISOString(),
      };

      setImports(prev => [newImport, ...prev]);
      setSelectedFile(null);
      
      // Connect WebSocket for real-time updates
      connectWebSocket(result.upload_id);
      
      toast.success('File uploaded successfully! Processing started.');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel import
  const handleCancelImport = async (importId: string) => {
    try {
      const response = await fetch(`/api/v1/admin/csv/${importId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        setImports(prev => prev.map(imp => 
          imp.id === importId ? { ...imp, status: 'cancelled' } : imp
        ));
        toast.success('Import cancelled successfully');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel import');
    }
  };

  // Get status badge color
  const getStatusBadge = (status: CSVImport['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: AlertCircle },
      validating: { variant: 'secondary' as const, icon: AlertCircle },
      validated: { variant: 'secondary' as const, icon: CheckCircle },
      processing: { variant: 'default' as const, icon: Play },
      completed: { variant: 'default' as const, icon: CheckCircle },
      failed: { variant: 'destructive' as const, icon: XCircle },
      cancelled: { variant: 'secondary' as const, icon: X },
    };
    
    const { variant, icon: Icon } = variants[status];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Load import history
  const loadImports = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/admin/csv/history');
      if (response.ok) {
        const data = await response.json();
        setImports(data.imports || data || []);
      }
    } catch (error) {
      console.error('Failed to load import history:', error);
    }
  }, []);

  // Load import details
  const loadImportDetails = async (importItem: CSVImport) => {
    setSelectedImport(importItem);
    
    try {
      const response = await fetch(`/api/v1/admin/csv/${importItem.id}/logs`);
      if (response.ok) {
        const logs = await response.json();
        setImportLogs(logs);
      }
    } catch (error) {
      console.error('Failed to load import logs:', error);
    }
  };

  // Load imports on component mount
  useEffect(() => {
    loadImports();
  }, [loadImports]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CSV Import</h1>
          <p className="text-muted-foreground">Upload and manage bulk job imports</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
          <TabsTrigger value="logs">Import Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing job data for bulk import. The file should include columns for job title, company, location, description, and other job details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Drop your CSV file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="outline" className="mt-4" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>
              </div>
              
              {selectedFile && (
                <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="ml-4"
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Process'}
                  </Button>
                </div>
              )}

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>CSV Format Requirements:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                    <li>Required columns: title, company, location, description</li>
                    <li>Optional columns: salary, job_type, experience_level, skills, requirements</li>
                    <li>Maximum file size: 50MB</li>
                    <li>Maximum rows: 10,000</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View and manage your CSV import history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No imports found. Upload a CSV file to get started.
                  </div>
                ) : (
                  imports.map((importItem) => (
                    <div
                      key={importItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => loadImportDetails(importItem)}
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{importItem.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(importItem.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {importItem.processed_rows} / {importItem.total_rows} rows
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {importItem.successful_rows} success, {importItem.failed_rows} failed
                          </p>
                        </div>
                        
                        {importItem.status === 'processing' && (
                          <Progress 
                            value={(importItem.processed_rows / importItem.total_rows) * 100} 
                            className="w-24"
                          />
                        )}
                        
                        {getStatusBadge(importItem.status)}
                        
                        {(importItem.status === 'processing' || importItem.status === 'pending') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelImport(importItem.id);
                            }}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {selectedImport ? (
            <Card>
              <CardHeader>
                <CardTitle>Import Logs - {selectedImport.filename}</CardTitle>
                <CardDescription>
                  Detailed logs for each row processed during import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {getStatusBadge(selectedImport.status)}
                    <Separator orientation="vertical" className="h-6" />
                    <div className="text-sm text-muted-foreground">
                      Total: {selectedImport.total_rows} | 
                      Processed: {selectedImport.processed_rows} | 
                      Success: {selectedImport.successful_rows} | 
                      Failed: {selectedImport.failed_rows}
                    </div>
                  </div>
                  
                  {selectedImport.error_message && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{selectedImport.error_message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <ScrollArea className="h-96 border rounded-lg">
                    <div className="p-4 space-y-2">
                      {importLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No logs available
                        </div>
                      ) : (
                        importLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`flex items-center justify-between p-3 rounded border-l-4 ${
                              log.status === 'success' 
                                ? 'border-l-green-500 bg-green-50' 
                                : log.status === 'failed'
                                ? 'border-l-red-500 bg-red-50'
                                : 'border-l-yellow-500 bg-yellow-50'
                            }`}
                          >
                            <div>
                              <p className="font-medium">
                                Row {log.row_number}: {log.job_title} at {log.company_name}
                              </p>
                              {log.error_message && (
                                <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                              )}
                            </div>
                            <Badge 
                              variant={log.status === 'success' ? 'default' : 'destructive'}
                            >
                              {log.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select an import from the history to view detailed logs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSVImportPage;