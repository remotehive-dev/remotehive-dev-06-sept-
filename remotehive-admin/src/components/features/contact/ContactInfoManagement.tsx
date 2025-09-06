"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRetry, retryConditions } from '@/hooks/useRetry';

interface ContactInfo {
  id: number;
  category: string;
  label: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  office_hours?: string;
  timezone?: string;
  description?: string;
  is_active: boolean;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'press', label: 'Press' },
  { value: 'hr', label: 'Human Resources' }
];

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

export function ContactInfoManagement() {
  const [contactInfos, setContactInfos] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ContactInfo>>({});

  useEffect(() => {
    fetchContactInfos();
  }, []);

  // API function for fetching contact information
  const fetchContactInfosApi = async () => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch('/api/admin/contact-info', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contact information');
    }

    const data = await response.json();
    return data.contact_infos || data || [];
  };

  // Configure retry for fetching contact information
  const fetchRetry = useRetry(fetchContactInfosApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying fetch contact infos (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for fetch contact infos:', error);
      toast.error('Failed to load contact information after multiple attempts');
    }
  });

  const fetchContactInfos = async () => {
    try {
      const data = await fetchRetry.execute();
      setContactInfos(data);
    } catch (error) {
      console.error('Error fetching contact information:', error);
      // Error handling is done in the retry configuration
    } finally {
      setLoading(false);
    }
  };

  // API function for saving contact information
  const saveContactInfoApi = async (contactInfo: Partial<ContactInfo>) => {
    const token = localStorage.getItem('admin_token');
    const url = contactInfo.id 
      ? `/api/admin/contact-info/${contactInfo.id}`
      : '/api/admin/contact-info';
    
    const method = contactInfo.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactInfo)
    });

    if (!response.ok) {
      throw new Error('Failed to save contact information');
    }

    return { isUpdate: !!contactInfo.id };
  };

  // Configure retry for saving contact information
  const saveRetry = useRetry(saveContactInfoApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying save contact info (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for save contact info:', error);
      toast.error('Failed to save contact information after multiple attempts');
    }
  });

  const handleSave = async (contactInfo: Partial<ContactInfo>) => {
    try {
      const result = await saveRetry.execute(contactInfo);
      toast.success(result.isUpdate ? 'Contact information updated' : 'Contact information created');
      fetchContactInfos();
      setEditingId(null);
      setShowAddForm(false);
      setFormData({});
    } catch (error) {
      console.error('Error saving contact information:', error);
      // Error handling is done in the retry configuration
    }
  };

  // API function for deleting contact information
  const deleteContactInfoApi = async (id: number) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`/api/admin/contact-info/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete contact information');
    }
  };

  // Configure retry for deleting contact information
  const deleteRetry = useRetry(deleteContactInfoApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying delete contact info (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for delete contact info:', error);
      toast.error('Failed to delete contact information after multiple attempts');
    }
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact information?')) {
      return;
    }

    try {
      await deleteRetry.execute(id);
      toast.success('Contact information deleted');
      fetchContactInfos();
    } catch (error) {
      console.error('Error deleting contact information:', error);
      // Error handling is done in the retry configuration
    }
  };

  const startEdit = (contactInfo: ContactInfo) => {
    setEditingId(contactInfo.id);
    setFormData(contactInfo);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({});
  };

  const startAdd = () => {
    setShowAddForm(true);
    setFormData({
      category: 'general',
      is_active: true,
      is_primary: false,
      display_order: contactInfos.length + 1
    });
  };

  const updateFormData = (field: keyof ContactInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const ContactInfoForm = ({ contactInfo, onSave, onCancel }: {
    contactInfo: Partial<ContactInfo>;
    onSave: (data: Partial<ContactInfo>) => void;
    onCancel: () => void;
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{contactInfo.id ? 'Edit Contact Information' : 'Add New Contact Information'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={contactInfo.category} onValueChange={(value) => updateFormData('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={contactInfo.label || ''}
              onChange={(e) => updateFormData('label', e.target.value)}
              placeholder="e.g., General Inquiries"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email || ''}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="admin@remotehive.in"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={contactInfo.phone || ''}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address_line1">Address Line 1</Label>
          <Input
            id="address_line1"
            value={contactInfo.address_line1 || ''}
            onChange={(e) => updateFormData('address_line1', e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <Label htmlFor="address_line2">Address Line 2</Label>
          <Input
            id="address_line2"
            value={contactInfo.address_line2 || ''}
            onChange={(e) => updateFormData('address_line2', e.target.value)}
            placeholder="Suite 100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={contactInfo.city || ''}
              onChange={(e) => updateFormData('city', e.target.value)}
              placeholder="San Francisco"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={contactInfo.state || ''}
              onChange={(e) => updateFormData('state', e.target.value)}
              placeholder="CA"
            />
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={contactInfo.postal_code || ''}
              onChange={(e) => updateFormData('postal_code', e.target.value)}
              placeholder="94105"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={contactInfo.country || ''}
            onChange={(e) => updateFormData('country', e.target.value)}
            placeholder="United States"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="office_hours">Office Hours</Label>
            <Input
              id="office_hours"
              value={contactInfo.office_hours || ''}
              onChange={(e) => updateFormData('office_hours', e.target.value)}
              placeholder="Monday-Friday, 9 AM - 6 PM PST"
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={contactInfo.timezone} onValueChange={(value) => updateFormData('timezone', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={contactInfo.description || ''}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Additional information about this contact"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={contactInfo.is_active || false}
              onCheckedChange={(checked) => updateFormData('is_active', checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_primary"
              checked={contactInfo.is_primary || false}
              onCheckedChange={(checked) => updateFormData('is_primary', checked)}
            />
            <Label htmlFor="is_primary">Primary</Label>
          </div>
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={contactInfo.display_order || 0}
              onChange={(e) => updateFormData('display_order', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={() => onSave(contactInfo)} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contact Information</h2>
        <Button onClick={startAdd} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Contact Info</span>
        </Button>
      </div>

      {showAddForm && (
        <ContactInfoForm
          contactInfo={formData}
          onSave={handleSave}
          onCancel={cancelEdit}
        />
      )}

      <div className="grid gap-4">
        {contactInfos.map((contactInfo) => (
          <Card key={contactInfo.id}>
            {editingId === contactInfo.id ? (
              <ContactInfoForm
                contactInfo={formData}
                onSave={handleSave}
                onCancel={cancelEdit}
              />
            ) : (
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={contactInfo.is_active ? 'default' : 'secondary'}>
                      {CATEGORIES.find(c => c.value === contactInfo.category)?.label}
                    </Badge>
                    {contactInfo.is_primary && <Badge variant="outline">Primary</Badge>}
                    {!contactInfo.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(contactInfo)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(contactInfo.id)}
                      className="flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{contactInfo.label}</h3>
                    {contactInfo.email && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Email:</strong> {contactInfo.email}
                      </p>
                    )}
                    {contactInfo.phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Phone:</strong> {contactInfo.phone}
                      </p>
                    )}
                    {contactInfo.office_hours && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Hours:</strong> {contactInfo.office_hours}
                      </p>
                    )}
                  </div>
                  <div>
                    {(contactInfo.address_line1 || contactInfo.city) && (
                      <div className="text-sm text-gray-600">
                        <strong>Address:</strong>
                        <div className="ml-2">
                          {contactInfo.address_line1 && <div>{contactInfo.address_line1}</div>}
                          {contactInfo.address_line2 && <div>{contactInfo.address_line2}</div>}
                          {(contactInfo.city || contactInfo.state || contactInfo.postal_code) && (
                            <div>
                              {contactInfo.city}{contactInfo.state && `, ${contactInfo.state}`} {contactInfo.postal_code}
                            </div>
                          )}
                          {contactInfo.country && <div>{contactInfo.country}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {contactInfo.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <strong>Description:</strong> {contactInfo.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-400">
                  Order: {contactInfo.display_order} | 
                  Created: {new Date(contactInfo.created_at).toLocaleDateString()} | 
                  Updated: {new Date(contactInfo.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {contactInfos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No contact information found.</p>
            <Button onClick={startAdd} className="flex items-center space-x-2 mx-auto">
              <Plus className="h-4 w-4" />
              <span>Add First Contact Info</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}