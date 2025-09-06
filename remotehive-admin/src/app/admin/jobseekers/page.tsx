'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUsers, User } from '@/lib/supabase';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  User as UserIcon,
  Mail,
  Calendar,
  Users,
  FileText,
  MapPin
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

const JobseekerCard = ({ jobseeker }: { jobseeker: User }) => {
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
                <AvatarImage src={jobseeker.avatar_url || ''} />
                <AvatarFallback>
                  {getInitials(jobseeker.full_name || jobseeker.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {jobseeker.full_name || 'Unnamed User'}
                </CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <UserIcon className="w-4 h-4 mr-1" />
                  {jobseeker.job_title || 'Job Seeker'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusColors[jobseeker.status || 'active']}>
              {jobseeker.status || 'active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-2" />
              {jobseeker.email}
            </div>
            
            {jobseeker.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                {jobseeker.location}
              </div>
            )}
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Joined {formatDate(jobseeker.created_at)}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="w-4 h-4 mr-2" />
              {jobseeker.applications_count || 0} applications
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Last active: {jobseeker.last_sign_in_at ? formatDate(jobseeker.last_sign_in_at) : 'Never'}
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

export default function JobseekersPage() {
  const [jobseekers, setJobseekers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobseekers, setTotalJobseekers] = useState(0);
  const jobseekersPerPage = 12;

  const fetchJobseekers = async () => {
    try {
      setLoading(true);
      const { data, error, count } = await getUsers('jobseeker', currentPage, jobseekersPerPage, searchTerm);
      
      if (error) {
        console.error('Error fetching jobseekers:', error);
        return;
      }
      
      setJobseekers(data || []);
      setTotalJobseekers(count || 0);
    } catch (error) {
      console.error('Error fetching jobseekers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobseekers();
  }, [currentPage, searchTerm]);

  const totalPages = Math.ceil(totalJobseekers / jobseekersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Job Seekers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage job seeker accounts and profiles
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Job Seeker
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search job seekers by name, email, or location..."
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
            <div className="text-2xl font-bold">{totalJobseekers}</div>
            <p className="text-xs text-muted-foreground">Total Job Seekers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{jobseekers.filter(j => j.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{jobseekers.filter(j => j.resume_url).length}</div>
            <p className="text-xs text-muted-foreground">With Resume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{jobseekers.reduce((sum, j) => sum + (j.applications_count || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Seekers Grid */}
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
      ) : jobseekers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobseekers.map((jobseeker) => (
            <JobseekerCard key={jobseeker.id} jobseeker={jobseeker} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No job seekers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No job seeker accounts available yet.'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add First Job Seeker
            </Button>
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
    </div>
  );
}