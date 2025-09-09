import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Image, Video, FileText, Music, Search, Filter, Grid, List, Trash2, Edit, Eye, Download, FolderPlus, Tag } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  alt_text?: string;
  caption?: string;
  tags: string[];
  folder?: string;
  is_public: boolean;
  created_at: string;
  download_count: number;
}

interface MediaLibraryProps {
  onSelectMedia?: (media: MediaFile) => void;
  selectionMode?: boolean;
  allowMultiple?: boolean;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ 
  onSelectMedia, 
  selectionMode = false, 
  allowMultiple = false 
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);

  // Fetch media files
  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/cms/admin/media', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data);
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  // File upload with drag and drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
    fetchMediaFiles();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm', '.ogg'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md']
    }
  });

  const uploadFile = async (file: File, metadata?: { alt_text?: string; caption?: string; folder?: string; tags?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.alt_text) formData.append('alt_text', metadata.alt_text);
    if (metadata?.caption) formData.append('caption', metadata.caption);
    if (metadata?.folder) formData.append('folder', metadata.folder);
    if (metadata?.tags) formData.append('tags', metadata.tags);

    try {
      const response = await fetch('/api/v1/cms/admin/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const newMedia = await response.json();
        setMediaFiles(prev => [newMedia, ...prev]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Filter and search logic
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || file.media_type === filterType;
    const matchesFolder = filterFolder === 'all' || file.folder === filterFolder;
    return matchesSearch && matchesType && matchesFolder;
  });

  // Get unique folders for filter
  const folders = Array.from(new Set(mediaFiles.map(file => file.folder).filter(Boolean)));

  const getFileIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectFile = (file: MediaFile) => {
    if (selectionMode) {
      if (allowMultiple) {
        setSelectedFiles(prev => 
          prev.includes(file.id) 
            ? prev.filter(id => id !== file.id)
            : [...prev, file.id]
        );
      } else {
        onSelectMedia?.(file);
      }
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/v1/cms/admin/media/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setMediaFiles(prev => prev.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-500 hover:text-gray-700 border rounded-md"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
          <select
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Folders</option>
            {folders.map(folder => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        {...getRootProps()}
        className={`m-6 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-gray-500">or click to browse files</p>
      </div>

      {/* Media Grid/List */}
      <div className="p-6">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No media files found</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                } ${viewMode === 'list' ? 'flex items-center p-3' : 'aspect-square'}`}
                onClick={() => handleSelectFile(file)}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {file.media_type === 'image' ? (
                        <img
                          src={file.file_url}
                          alt={file.alt_text || file.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">
                          {getFileIcon(file.media_type)}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.original_filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                    </div>
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMedia(file);
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                        >
                          <Edit className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file.id);
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                      {file.media_type === 'image' ? (
                        <img
                          src={file.file_url}
                          alt={file.alt_text || file.filename}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-gray-400">
                          {getFileIcon(file.media_type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.original_filename}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)} • {file.media_type} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                          {file.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{file.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMedia(file);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection Actions */}
      {selectionMode && allowMultiple && selectedFiles.length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedFiles([])}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const selectedMedia = mediaFiles.filter(file => selectedFiles.includes(file.id));
                  onSelectMedia?.(selectedMedia[0]); // For now, just return the first selected
                }}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;