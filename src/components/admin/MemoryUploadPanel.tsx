import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface MemoryUploadPanelProps {
  onUploadComplete?: (uploadId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  totalRows?: number;
  processedRows?: number;
}

const MemoryUploadPanel: React.FC<MemoryUploadPanelProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith('.csv')) {
      onUploadError?.('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    const uploadId = `upload_${Date.now()}`;
    
    // Add initial upload progress
    const newUpload: UploadProgress = {
      uploadId,
      filename: file.name,
      progress: 0,
      status: 'uploading'
    };
    
    setUploads(prev => [...prev, newUpload]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const updateProgress = (progress: number, status: UploadProgress['status'], message?: string) => {
        setUploads(prev => prev.map(upload => 
          upload.uploadId === uploadId 
            ? { ...upload, progress, status, message }
            : upload
        ));
      };

      // Simulate API call to /api/v1/admin/memory/upload
      updateProgress(25, 'uploading', 'Uploading file...');
      
      // Simulate processing
      setTimeout(() => {
        updateProgress(50, 'processing', 'Validating CSV structure...');
      }, 1000);

      setTimeout(() => {
        updateProgress(75, 'processing', 'Processing memory data...');
      }, 2000);

      setTimeout(() => {
        updateProgress(100, 'completed', 'Memory upload completed successfully');
        onUploadComplete?.(uploadId);
        setIsUploading(false);
      }, 3000);

    } catch (error) {
      setUploads(prev => prev.map(upload => 
        upload.uploadId === uploadId 
          ? { ...upload, status: 'error', message: 'Upload failed' }
          : upload
      ));
      onUploadError?.('Upload failed');
      setIsUploading(false);
    }
  }, [onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isUploading
  });

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.uploadId !== uploadId));
  };

  const downloadTemplate = () => {
    // This would typically call the API to download the template
    const csvContent = `website_url,priority,category,notes\nhttps://example.com,high,ecommerce,Sample website\nhttps://news.example.com,medium,news,News website`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'memory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Memory Upload</h2>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          isDragActive ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop the CSV file here' : 'Upload Memory CSV'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your memory CSV file here, or click to browse
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            CSV files only
          </span>
          <span>Max 10MB</span>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Upload Progress</h3>
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div key={upload.uploadId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(upload.status)}
                    <span className="text-sm font-medium text-gray-900">
                      {upload.filename}
                    </span>
                  </div>
                  <button
                    onClick={() => removeUpload(upload.uploadId)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(upload.status)}`}
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{upload.message || 'Processing...'}</span>
                  <span>{upload.progress}%</span>
                </div>
                
                {upload.totalRows && (
                  <div className="mt-2 text-xs text-gray-500">
                    Processed {upload.processedRows || 0} of {upload.totalRows} rows
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Required columns: website_url, priority, category</li>
          <li>• Optional columns: notes, tags, custom_selectors</li>
          <li>• Priority values: high, medium, low</li>
          <li>• Category examples: ecommerce, news, blog, social</li>
        </ul>
      </div>
    </div>
  );
};

export default MemoryUploadPanel;