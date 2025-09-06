import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Globe, Search, Edit, Trash2, Eye, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface Website {
  id: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'active' | 'inactive' | 'error';
  lastScraped?: string;
  successRate?: number;
  notes?: string;
  createdAt: string;
}

interface BulkUploadProgress {
  uploadId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  totalWebsites?: number;
  processedWebsites?: number;
  successCount?: number;
  errorCount?: number;
}

interface WebsiteManagementPanelProps {
  onWebsiteSelect?: (website: Website) => void;
  onBulkUploadComplete?: (uploadId: string) => void;
}

const WebsiteManagementPanel: React.FC<WebsiteManagementPanelProps> = ({
  onWebsiteSelect,
  onBulkUploadComplete
}) => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([]);
  const [uploads, setUploads] = useState<BulkUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockWebsites: Website[] = [
      {
        id: '1',
        url: 'https://example.com',
        priority: 'high',
        category: 'ecommerce',
        status: 'active',
        lastScraped: '2024-12-15T10:30:00Z',
        successRate: 95,
        notes: 'Main product catalog',
        createdAt: '2024-12-10T08:00:00Z'
      },
      {
        id: '2',
        url: 'https://news.example.com',
        priority: 'medium',
        category: 'news',
        status: 'active',
        lastScraped: '2024-12-15T09:15:00Z',
        successRate: 87,
        createdAt: '2024-12-12T14:20:00Z'
      },
      {
        id: '3',
        url: 'https://blog.example.com',
        priority: 'low',
        category: 'blog',
        status: 'error',
        lastScraped: '2024-12-14T16:45:00Z',
        successRate: 45,
        notes: 'Frequent timeout issues',
        createdAt: '2024-12-11T11:30:00Z'
      }
    ];
    setWebsites(mockWebsites);
    setFilteredWebsites(mockWebsites);
  }, []);

  // Filter websites based on search and filters
  useEffect(() => {
    let filtered = websites;

    if (searchTerm) {
      filtered = filtered.filter(website => 
        website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        website.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        website.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(website => website.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(website => website.priority === filterPriority);
    }

    setFilteredWebsites(filtered);
  }, [websites, searchTerm, filterStatus, filterPriority]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    const uploadId = `upload_${Date.now()}`;
    
    const newUpload: BulkUploadProgress = {
      uploadId,
      filename: file.name,
      progress: 0,
      status: 'uploading'
    };
    
    setUploads(prev => [...prev, newUpload]);

    try {
      // Simulate bulk upload process
      const updateProgress = (progress: number, status: BulkUploadProgress['status'], message?: string, stats?: Partial<BulkUploadProgress>) => {
        setUploads(prev => prev.map(upload => 
          upload.uploadId === uploadId 
            ? { ...upload, progress, status, message, ...stats }
            : upload
        ));
      };

      updateProgress(10, 'uploading', 'Uploading CSV file...');
      
      setTimeout(() => {
        updateProgress(30, 'processing', 'Validating website URLs...', { totalWebsites: 150 });
      }, 1000);

      setTimeout(() => {
        updateProgress(60, 'processing', 'Processing websites...', { processedWebsites: 90 });
      }, 2500);

      setTimeout(() => {
        updateProgress(85, 'processing', 'Finalizing import...', { processedWebsites: 140, successCount: 135, errorCount: 5 });
      }, 4000);

      setTimeout(() => {
        updateProgress(100, 'completed', 'Bulk upload completed successfully', { 
          processedWebsites: 150, 
          successCount: 145, 
          errorCount: 5 
        });
        onBulkUploadComplete?.(uploadId);
        setIsUploading(false);
        
        // Simulate adding new websites to the list
        const newWebsites: Website[] = [
          {
            id: `new_${Date.now()}`,
            url: 'https://newsite.example.com',
            priority: 'medium',
            category: 'ecommerce',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        setWebsites(prev => [...prev, ...newWebsites]);
      }, 5500);

    } catch (error) {
      setUploads(prev => prev.map(upload => 
        upload.uploadId === uploadId 
          ? { ...upload, status: 'error', message: 'Upload failed' }
          : upload
      ));
      setIsUploading(false);
    }
  }, [onBulkUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isUploading
  });

  const downloadTemplate = () => {
    const csvContent = `website_url,priority,category,notes\nhttps://example.com,high,ecommerce,Sample website\nhttps://news.example.com,medium,news,News website\nhttps://blog.example.com,low,blog,Blog website`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'websites_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleWebsiteSelect = (websiteId: string) => {
    if (selectedWebsites.includes(websiteId)) {
      setSelectedWebsites(prev => prev.filter(id => id !== websiteId));
    } else {
      setSelectedWebsites(prev => [...prev, websiteId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedWebsites.length === filteredWebsites.length) {
      setSelectedWebsites([]);
    } else {
      setSelectedWebsites(filteredWebsites.map(w => w.id));
    }
  };

  const getStatusIcon = (status: Website['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: Website['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Website Management</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Template
          </button>
          {selectedWebsites.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Bulk Actions ({selectedWebsites.length})
            </button>
          )}
        </div>
      </div>

      {/* Bulk Upload Area */}
      <div className="mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className={`mx-auto h-8 w-8 mb-2 ${
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-sm font-medium text-gray-900 mb-1">
            {isDragActive ? 'Drop CSV file here' : 'Bulk Upload Websites'}
          </p>
          <p className="text-xs text-gray-500">
            Drag and drop CSV file or click to browse
          </p>
        </div>

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mt-4 space-y-3">
            {uploads.map((upload) => (
              <div key={upload.uploadId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{upload.filename}</span>
                  <span className="text-xs text-gray-500">{upload.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      upload.status === 'error' ? 'bg-red-600' : 
                      upload.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{upload.message}</span>
                  {upload.totalWebsites && (
                    <span>
                      {upload.processedWebsites || 0}/{upload.totalWebsites} websites
                      {upload.successCount !== undefined && (
                        <span className="ml-2 text-green-600">✓{upload.successCount}</span>
                      )}
                      {upload.errorCount !== undefined && upload.errorCount > 0 && (
                        <span className="ml-1 text-red-600">✗{upload.errorCount}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search websites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="error">Error</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedWebsites.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedWebsites.length} websites selected
            </span>
            <button className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700">
              Activate
            </button>
            <button className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700">
              Deactivate
            </button>
            <button className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Websites Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedWebsites.length === filteredWebsites.length && filteredWebsites.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Website</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Priority</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Category</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Success Rate</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Last Scraped</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWebsites.map((website) => (
              <tr key={website.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedWebsites.includes(website.id)}
                    onChange={() => handleWebsiteSelect(website.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{website.url}</div>
                      {website.notes && (
                        <div className="text-xs text-gray-500">{website.notes}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(website.status)}
                    <span className="text-sm text-gray-900 capitalize">{website.status}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(website.priority)}`}>
                    {website.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-900 capitalize">{website.category}</span>
                </td>
                <td className="py-3 px-4">
                  {website.successRate !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            website.successRate >= 80 ? 'bg-green-600' :
                            website.successRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${website.successRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{website.successRate}%</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {website.lastScraped ? (
                    <span className="text-sm text-gray-600">
                      {new Date(website.lastScraped).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Never</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onWebsiteSelect?.(website)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-yellow-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredWebsites.length === 0 && (
        <div className="text-center py-8">
          <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No websites found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload a CSV file to get started'}
          </p>
        </div>
      )}
    </div>
  );
};

export default WebsiteManagementPanel;