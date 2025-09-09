import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Move, X, Eye, Upload } from 'lucide-react';
import MediaLibrary from './MediaLibrary';

interface GalleryImage {
  id: string;
  media_id: string;
  gallery_id: string;
  order_index: number;
  caption?: string;
  alt_text?: string;
  media?: {
    id: string;
    filename: string;
    file_url: string;
    file_type: string;
    file_size: number;
    alt_text?: string;
  };
}

interface Gallery {
  id: string;
  name: string;
  description?: string;
  type: 'hero' | 'testimonial' | 'product' | 'general';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: GalleryImage[];
}

interface ImageGalleryProps {
  onSelectGallery?: (gallery: Gallery) => void;
  selectionMode?: boolean;
  allowMultiple?: boolean;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  onSelectGallery,
  selectionMode = false,
  allowMultiple = false,
  className = ''
}) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGalleries, setSelectedGalleries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [draggedImage, setDraggedImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general' as const,
    is_active: true
  });

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      // Sample data for demonstration
      const sampleGalleries: Gallery[] = [
        {
          id: '1',
          name: 'Hero Section Gallery',
          description: 'Images for the main hero section',
          type: 'hero',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [
            {
              id: '1',
              media_id: '1',
              gallery_id: '1',
              order_index: 0,
              caption: 'Hero image 1',
              alt_text: 'Main hero image',
              media: {
                id: '1',
                filename: 'hero-1.jpg',
                file_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
                file_type: 'image/jpeg',
                file_size: 1024000,
                alt_text: 'Office workspace'
              }
            },
            {
              id: '2',
              media_id: '2',
              gallery_id: '1',
              order_index: 1,
              caption: 'Hero image 2',
              alt_text: 'Secondary hero image',
              media: {
                id: '2',
                filename: 'hero-2.jpg',
                file_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
                file_type: 'image/jpeg',
                file_size: 1024000,
                alt_text: 'Team collaboration'
              }
            }
          ]
        },
        {
          id: '2',
          name: 'Product Showcase',
          description: 'Product images and screenshots',
          type: 'product',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [
            {
              id: '3',
              media_id: '3',
              gallery_id: '2',
              order_index: 0,
              caption: 'Product screenshot 1',
              alt_text: 'Dashboard view',
              media: {
                id: '3',
                filename: 'product-1.jpg',
                file_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
                file_type: 'image/jpeg',
                file_size: 1024000,
                alt_text: 'Analytics dashboard'
              }
            }
          ]
        },
        {
          id: '3',
          name: 'Testimonial Images',
          description: 'Customer and team photos',
          type: 'testimonial',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: []
        }
      ];
      setGalleries(sampleGalleries);
    } catch (err) {
      setError('Failed to load galleries');
      console.error('Error loading galleries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGallery = async () => {
    try {
      const newGallery: Gallery = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: []
      };
      
      setGalleries(prev => [...prev, newGallery]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create gallery');
      console.error('Error creating gallery:', err);
    }
  };

  const handleUpdateGallery = async () => {
    if (!currentGallery) return;
    
    try {
      const updatedGallery = {
        ...currentGallery,
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      setGalleries(prev => prev.map(g => g.id === currentGallery.id ? updatedGallery : g));
      setShowEditModal(false);
      setCurrentGallery(null);
      resetForm();
    } catch (err) {
      setError('Failed to update gallery');
      console.error('Error updating gallery:', err);
    }
  };

  const handleDeleteGallery = async (galleryId: string) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;
    
    try {
      setGalleries(prev => prev.filter(g => g.id !== galleryId));
    } catch (err) {
      setError('Failed to delete gallery');
      console.error('Error deleting gallery:', err);
    }
  };

  const handleAddImages = (media: any[]) => {
    if (!currentGallery) return;
    
    const newImages: GalleryImage[] = media.map((m, index) => ({
      id: Date.now().toString() + index,
      media_id: m.id,
      gallery_id: currentGallery.id,
      order_index: currentGallery.images.length + index,
      caption: '',
      alt_text: m.alt_text || m.filename,
      media: m
    }));
    
    const updatedGallery = {
      ...currentGallery,
      images: [...currentGallery.images, ...newImages],
      updated_at: new Date().toISOString()
    };
    
    setGalleries(prev => prev.map(g => g.id === currentGallery.id ? updatedGallery : g));
    setCurrentGallery(updatedGallery);
    setShowMediaLibrary(false);
  };

  const handleRemoveImage = (imageId: string) => {
    if (!currentGallery) return;
    
    const updatedGallery = {
      ...currentGallery,
      images: currentGallery.images.filter(img => img.id !== imageId),
      updated_at: new Date().toISOString()
    };
    
    setGalleries(prev => prev.map(g => g.id === currentGallery.id ? updatedGallery : g));
    setCurrentGallery(updatedGallery);
  };

  const handleImageDrop = (draggedId: string, targetId: string) => {
    if (!currentGallery || draggedId === targetId) return;
    
    const images = [...currentGallery.images];
    const draggedIndex = images.findIndex(img => img.id === draggedId);
    const targetIndex = images.findIndex(img => img.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder images
    const [draggedImage] = images.splice(draggedIndex, 1);
    images.splice(targetIndex, 0, draggedImage);
    
    // Update order indices
    const reorderedImages = images.map((img, index) => ({
      ...img,
      order_index: index
    }));
    
    const updatedGallery = {
      ...currentGallery,
      images: reorderedImages,
      updated_at: new Date().toISOString()
    };
    
    setGalleries(prev => prev.map(g => g.id === currentGallery.id ? updatedGallery : g));
    setCurrentGallery(updatedGallery);
  };

  const handleGallerySelect = (gallery: Gallery) => {
    if (selectionMode) {
      if (allowMultiple) {
        setSelectedGalleries(prev => 
          prev.includes(gallery.id) 
            ? prev.filter(id => id !== gallery.id)
            : [...prev, gallery.id]
        );
      } else {
        onSelectGallery?.(gallery);
      }
    } else {
      setCurrentGallery(gallery);
      setShowPreviewModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'general',
      is_active: true
    });
  };

  const openEditModal = (gallery: Gallery) => {
    setCurrentGallery(gallery);
    setFormData({
      name: gallery.name,
      description: gallery.description || '',
      type: gallery.type,
      is_active: gallery.is_active
    });
    setShowEditModal(true);
  };

  const filteredGalleries = galleries.filter(gallery => {
    const matchesSearch = gallery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gallery.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || gallery.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Image Galleries</h2>
          <p className="text-gray-600 mt-1">Manage reusable image galleries for different sections</p>
        </div>
        {!selectionMode && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Gallery</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search galleries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="hero">Hero</option>
          <option value="product">Product</option>
          <option value="testimonial">Testimonial</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Galleries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGalleries.map((gallery) => (
          <div
            key={gallery.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all cursor-pointer ${
              selectedGalleries.includes(gallery.id)
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleGallerySelect(gallery)}
          >
            {/* Gallery Preview */}
            <div className="aspect-video bg-gray-100 relative">
              {gallery.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 h-full">
                  {gallery.images.slice(0, 4).map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.media?.file_url}
                        alt={image.alt_text}
                        className="w-full h-full object-cover"
                      />
                      {index === 3 && gallery.images.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">+{gallery.images.length - 3}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Type Badge */}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  gallery.type === 'hero' ? 'bg-purple-100 text-purple-800' :
                  gallery.type === 'product' ? 'bg-green-100 text-green-800' :
                  gallery.type === 'testimonial' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {gallery.type}
                </span>
              </div>
              
              {/* Status Badge */}
              {!gallery.is_active && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Inactive
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Info */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{gallery.name}</h3>
                {!selectionMode && (
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(gallery);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit gallery"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGallery(gallery.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete gallery"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {gallery.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{gallery.description}</p>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{gallery.images.length} images</span>
                <span>{new Date(gallery.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGalleries.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first image gallery to get started.'}
          </p>
          {!selectionMode && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Gallery
            </button>
          )}
        </div>
      )}

      {/* Create Gallery Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Create New Gallery</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter gallery name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter gallery description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="hero">Hero</option>
                  <option value="product">Product</option>
                  <option value="testimonial">Testimonial</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGallery}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gallery Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Gallery</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter gallery name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter gallery description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="hero">Hero</option>
                  <option value="product">Product</option>
                  <option value="testimonial">Testimonial</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentGallery(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGallery}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Preview Modal */}
      {showPreviewModal && currentGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentGallery.name}</h3>
                <p className="text-sm text-gray-600">{currentGallery.images.length} images</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowMediaLibrary(true);
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Upload className="w-4 h-4" />
                  <span>Add Images</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 h-[70vh] overflow-y-auto">
              {currentGallery.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentGallery.images
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((image) => (
                    <div
                      key={image.id}
                      className="relative group cursor-move"
                      draggable
                      onDragStart={() => setDraggedImage(image.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedImage) {
                          handleImageDrop(draggedImage, image.id);
                          setDraggedImage(null);
                        }
                      }}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.media?.file_url}
                          alt={image.alt_text}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                          <button
                            onClick={() => handleRemoveImage(image.id)}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-gray-600 text-white p-2 rounded-full hover:bg-gray-700"
                            title="Drag to reorder"
                          >
                            <Move className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {image.caption && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No images in this gallery</h3>
                  <p className="text-gray-600 mb-4">Add some images to get started.</p>
                  <button
                    onClick={() => setShowMediaLibrary(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Images
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Select Images</h3>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-[70vh] overflow-y-auto">
              <MediaLibrary
                onSelectMedia={handleAddImages}
                selectionMode={true}
                allowMultiple={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;