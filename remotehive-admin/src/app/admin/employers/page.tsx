'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/providers/ToastProvider';
// Using FastAPI backend for all data operations
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  Mail,
  Calendar,
  Users,
  Briefcase
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

// Define Employer interface for our FastAPI backend
interface Employer {
  id: string;
  company_name: string;
  company_email: string;
  company_website?: string;
  company_description?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at?: string;
  updated_at?: string;
  job_posts_count?: number;
  avatar_url?: string;
  full_name?: string;
  email?: string;
}

const EmployerCard = ({ employer }: { employer: Employer }) => {
  const statusColors = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'destructive',
    pending: 'warning'
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employer.avatar_url || ''} />
                <AvatarFallback>
                  {getInitials(employer.company_name || employer.company_email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {employer.company_name || 'Unnamed Company'}
                </CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Building2 className="w-4 h-4 mr-1" />
                  {employer.industry || 'No industry specified'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusColors[employer.status || 'active']}>
              {employer.status || 'active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-2" />
              {employer.company_email}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Joined {formatDate(employer.created_at)}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 mr-2" />
              {employer.job_posts_count || 0} job posts
            </div>
            
            {employer.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                {employer.location}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Company size: {employer.company_size || 'Not specified'}
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EmployersPage() {
  const { addToast } = useToast();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_website: '',
    industry: '',
    company_size: '',
    location: '',
    company_description: ''
  });
  const employersPerPage = 12;

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: employersPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/employers?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Map the backend response to our frontend format
      const mappedEmployers = (result.data || []).map((emp: any) => ({
        ...emp,
        full_name: emp.company_name,
        email: emp.company_email,
        status: 'active' as const, // Default status since backend doesn't have this field yet
        job_posts_count: 0 // Default value since backend doesn't have this field yet
      }));
      
      setEmployers(mappedEmployers);
      setTotalEmployers(result.total || 0);
    } catch (error) {
      console.error('Error fetching employers:', error);
      setEmployers([]);
      setTotalEmployers(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployer = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.company_name || !formData.company_email) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          description: 'Company name and email are required'
        });
        return;
      }
      
      const response = await fetch('/api/employers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employer');
      }
      
      const newEmployer = await response.json();
      
      // Add to employers list
      setEmployers(prev => [newEmployer, ...prev]);
      setTotalEmployers(prev => prev + 1);
      
      // Reset form and close modal
      setFormData({
        company_name: '',
        company_email: '',
        company_website: '',
        industry: '',
        company_size: '',
        location: '',
        company_description: ''
      });
      setIsCreateModalOpen(false);
      
      addToast({
        type: 'success',
        title: 'Success',
        description: 'Employer created successfully'
      });
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    fetchEmployers();
  }, [currentPage, searchTerm]);

  const totalPages = Math.ceil(totalEmployers / employersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Employers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employer accounts and company profiles
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employer
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search employers by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalEmployers}</div>
            <p className="text-xs text-muted-foreground">Total Employers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{employers.filter(e => e.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Active Employers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{employers.filter(e => e.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{employers.reduce((sum, e) => sum + (e.job_posts_count || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Total Job Posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Employers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employers.map((employer) => (
            <EmployerCard key={employer.id} employer={employer} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No employers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No employer accounts available yet.'}
            </p>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Employer
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Create Employer Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Employer</DialogTitle>
            <DialogDescription>
              Add a new employer account to the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_email">Company Email *</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_email: e.target.value }))}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_website">Company Website</Label>
              <Input
                id="company_website"
                value={formData.company_website}
                onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                placeholder="https://company.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select value={formData.company_size} onValueChange={(value) => setFormData(prev => ({ ...prev, company_size: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                    <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                    <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                    <SelectItem value="201-500 employees">201-500 employees</SelectItem>
                    <SelectItem value="500+ employees">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_description">Company Description</Label>
              <Textarea
                id="company_description"
                value={formData.company_description}
                onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                placeholder="Brief description of the company..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEmployer}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Employer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}