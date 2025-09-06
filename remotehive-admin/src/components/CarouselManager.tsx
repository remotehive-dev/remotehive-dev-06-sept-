import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Image as ImageIcon, Link, Type, AlignLeft } from 'lucide-react';
import MediaLibrary from './MediaLibrary';

interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  link_url?: string;
  link_text?: string;
  order: number;
  is_active: boolean;
  carousel_type: 'hero' | 'testimonial' | 'product' | 'gallery';
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface CarouselManagerProps {
  carouselType?: 'hero' | 'testimonial' | 'product' | 'gallery';
}

const CarouselManager: React.FC<CarouselManagerProps> = ({ carouselType = 'hero' }) => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectedImageField, setSelectedImageField] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    link_url: '',
    link_text: '',
    is_active: true
  });

  // Fetch carousel items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/cms/admin/carousel?carousel_type=${carouselType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.sort((a: CarouselItem, b: CarouselItem) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching carousel items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [carouselType]);

  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setItems(updatedItems);

    // Save new order to backend
    try {
      for (const item of updatedItems) {
        await fetch(`/api/v1/cms/admin/carousel/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ order: item.order })
        });
      }
    } catch (error) {
      console.error('Error updating item order:', error);
    }
  };

  // Create or update item
  const saveItem = async () => {
    try {
      const itemData = {
        ...formData,
        carousel_type: carouselType,
        order: editingItem ? editingItem.order : items.length + 1
      };

      const url = editingItem 
        ? `/api/v1/cms/admin/carousel/${editingItem.id}`
        : '/api/v1/cms/admin/carousel';
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        await fetchItems();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving carousel item:', error);
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this carousel item?')) return;

    try {
      const response = await fetch(`/api/v1/cms/admin/carousel/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting carousel item:', error);
    }
  };

  // Toggle item active status
  const toggleActive = async (item: CarouselItem) => {
    try {
      const response = await fetch(`/api/v1/cms/admin/carousel/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !item.is_active })
      });

      if (response.ok) {
        setItems(items.map(i => 
          i.id === item.id ? { ...i, is_active: !i.is_active } : i
        ));
      }
    } catch (error) {
      console.error('Error toggling item status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      link_url: '',
      link_text: '',
      is_active: true
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  const openEditModal = (item: CarouselItem) => {
    setFormData({
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      image_url: item.image_url,
      link_url: item.link_url || '',
      link_text: item.link_text || '',
      is_active: item.is_active
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleMediaSelect = (media: any) => {
    setFormData(prev => ({
      ...prev,
      [selectedImageField]: media.file_url
    }));
    setShowMediaLibrary(false);
    setSelectedImageField('');
  };

  const openMediaLibrary = (field: string) => {
    setSelectedImageField(field);
    setShowMediaLibrary(true);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {carouselType} Carousel Manager
            </h2>
            <p className="text-gray-600 mt-1">
              Manage and reorder carousel items with drag & drop
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Carousel Items */}
      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No carousel items yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="carousel-items">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white border rounded-lg p-4 transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                          } ${!item.is_active ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center space-x-4">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-600 cursor-grab"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Image Preview */}
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {item.title}
                              </h3>
                              {item.subtitle && (
                                <p className="text-sm text-gray-600 truncate">{item.subtitle}</p>
                              )}
                              {item.description && (
                                <p className="text-sm text-gray-500 truncate mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-500">Order: {item.order}</span>
                                {item.link_url && (
                                  <span className="inline-flex items-center text-xs text-blue-600">
                                    <Link className="w-3 h-3 mr-1" />
                                    {item.link_text || 'Link'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleActive(item)}
                                className={`p-2 rounded-md ${
                                  item.is_active
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                                title={item.is_active ? 'Hide item' : 'Show item'}
                              >
                                {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
                                title="Edit item"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                title="Delete item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Carousel Item' : 'Add Carousel Item'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter title"
                    required
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter subtitle"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter image URL or select from library"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaLibrary('image_url')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Browse</span>
                  </button>
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Link Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Learn More"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active (visible on website)
                </label>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={!formData.title || !formData.image_url}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItem ? 'Update' : 'Create'} Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Select Image</h3>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="h-[70vh] overflow-y-auto">
              <MediaLibrary
                onSelectMedia={handleMediaSelect}
                selectionMode={true}
                allowMultiple={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselManager;