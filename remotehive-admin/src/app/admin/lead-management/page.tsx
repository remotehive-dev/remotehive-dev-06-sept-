'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserPlus,
  Building2,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  UserCheck,
  Bell,
  RefreshCw,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  source: 'website_registration';
  type: 'employer' | 'jobseeker';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  last_activity?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  employerLeads: number;
  jobseekerLeads: number;
}

interface Notification {
  id: string;
  message: string;
  type: 'new_lead' | 'lead_assigned' | 'lead_updated';
  created_at: string;
  read: boolean;
}

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
    employerLeads: 0,
    jobseekerLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'employer' | 'jobseeker'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Lead['status']>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  // Sample data - In real implementation, this would come from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Sample leads data
        const sampleLeads: Lead[] = [
          {
            id: 'lead_001',
            name: 'John Smith',
            email: 'john.smith@techcorp.com',
            phone: '+1-555-0123',
            company_name: 'TechCorp Solutions',
            address: '123 Business Ave, New York, NY 10001',
            source: 'website_registration',
            type: 'employer',
            status: 'new',
            created_at: '2024-12-25T10:30:00Z',
            updated_at: '2024-12-25T10:30:00Z',
            notes: 'Interested in posting multiple developer positions',
            last_activity: '2024-12-25T10:30:00Z'
          },
          {
            id: 'lead_002',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '+1-555-0124',
            address: '456 Residential St, Los Angeles, CA 90210',
            source: 'website_registration',
            type: 'jobseeker',
            status: 'contacted',
            assigned_to: 'emp_001',
            assigned_to_name: 'Mike Wilson',
            created_at: '2024-12-24T15:20:00Z',
            updated_at: '2024-12-25T09:15:00Z',
            notes: 'Looking for remote frontend developer positions',
            last_activity: '2024-12-25T09:15:00Z'
          },
          {
            id: 'lead_003',
            name: 'Robert Davis',
            email: 'robert.davis@startup.io',
            phone: '+1-555-0125',
            company_name: 'Startup Innovations',
            address: '789 Innovation Blvd, Austin, TX 78701',
            source: 'website_registration',
            type: 'employer',
            status: 'qualified',
            assigned_to: 'emp_002',
            assigned_to_name: 'Lisa Chen',
            created_at: '2024-12-23T11:45:00Z',
            updated_at: '2024-12-24T16:30:00Z',
            notes: 'Ready to post premium job listings',
            last_activity: '2024-12-24T16:30:00Z'
          },
          {
            id: 'lead_004',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@gmail.com',
            phone: '+1-555-0126',
            address: '321 Career Lane, Miami, FL 33101',
            source: 'website_registration',
            type: 'jobseeker',
            status: 'new',
            created_at: '2024-12-25T08:00:00Z',
            updated_at: '2024-12-25T08:00:00Z',
            notes: 'Experienced project manager seeking remote opportunities',
            last_activity: '2024-12-25T08:00:00Z'
          },
          {
            id: 'lead_005',
            name: 'David Kim',
            email: 'david.kim@enterprise.com',
            phone: '+1-555-0127',
            company_name: 'Enterprise Solutions Inc',
            address: '555 Corporate Dr, Seattle, WA 98101',
            source: 'website_registration',
            type: 'employer',
            status: 'converted',
            assigned_to: 'emp_001',
            assigned_to_name: 'Mike Wilson',
            created_at: '2024-12-20T14:20:00Z',
            updated_at: '2024-12-22T10:45:00Z',
            notes: 'Successfully onboarded as premium employer',
            last_activity: '2024-12-22T10:45:00Z'
          }
        ];

        // Sample employees data
        const sampleEmployees: Employee[] = [
          {
            id: 'emp_001',
            name: 'Mike Wilson',
            email: 'mike.wilson@remotehive.com',
            role: 'Lead Sales Representative'
          },
          {
            id: 'emp_002',
            name: 'Lisa Chen',
            email: 'lisa.chen@remotehive.com',
            role: 'Senior Account Manager'
          },
          {
            id: 'emp_003',
            name: 'Alex Thompson',
            email: 'alex.thompson@remotehive.com',
            role: 'Business Development Manager'
          },
          {
            id: 'emp_004',
            name: 'Jessica Brown',
            email: 'jessica.brown@remotehive.com',
            role: 'Customer Success Manager'
          }
        ];

        // Sample notifications
        const sampleNotifications: Notification[] = [
          {
            id: 'notif_001',
            message: 'New employer lead: John Smith from TechCorp Solutions',
            type: 'new_lead',
            created_at: '2024-12-25T10:30:00Z',
            read: false
          },
          {
            id: 'notif_002',
            message: 'New jobseeker lead: Emily Rodriguez',
            type: 'new_lead',
            created_at: '2024-12-25T08:00:00Z',
            read: false
          },
          {
            id: 'notif_003',
            message: 'Lead Sarah Johnson assigned to Mike Wilson',
            type: 'lead_assigned',
            created_at: '2024-12-24T15:30:00Z',
            read: true
          }
        ];

        setLeads(sampleLeads);
        setEmployees(sampleEmployees);
        setNotifications(sampleNotifications);

        // Calculate stats
        const newStats: LeadStats = {
          total: sampleLeads.length,
          new: sampleLeads.filter(l => l.status === 'new').length,
          contacted: sampleLeads.filter(l => l.status === 'contacted').length,
          qualified: sampleLeads.filter(l => l.status === 'qualified').length,
          converted: sampleLeads.filter(l => l.status === 'converted').length,
          lost: sampleLeads.filter(l => l.status === 'lost').length,
          employerLeads: sampleLeads.filter(l => l.type === 'employer').length,
          jobseekerLeads: sampleLeads.filter(l => l.type === 'jobseeker').length
        };
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching lead data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || lead.type === filterType;
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle lead transfer
  const handleTransferLead = async () => {
    if (!selectedLead || !selectedEmployee) return;

    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      // Update lead assignment
      const updatedLeads = leads.map(lead => {
        if (lead.id === selectedLead.id) {
          return {
            ...lead,
            assigned_to: employee.id,
            assigned_to_name: employee.name,
            updated_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          };
        }
        return lead;
      });

      setLeads(updatedLeads);

      // Add notification
      const newNotification: Notification = {
        id: `notif_${Date.now()}`,
        message: `Lead ${selectedLead.name} assigned to ${employee.name}`,
        type: 'lead_assigned',
        created_at: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);

      setTransferDialogOpen(false);
      setSelectedLead(null);
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error transferring lead:', error);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const updatedLeads = leads.map(lead => {
        if (lead.id === leadId) {
          return {
            ...lead,
            status: newStatus,
            updated_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          };
        }
        return lead;
      });

      setLeads(updatedLeads);

      // Update stats
      const newStats: LeadStats = {
        total: updatedLeads.length,
        new: updatedLeads.filter(l => l.status === 'new').length,
        contacted: updatedLeads.filter(l => l.status === 'contacted').length,
        qualified: updatedLeads.filter(l => l.status === 'qualified').length,
        converted: updatedLeads.filter(l => l.status === 'converted').length,
        lost: updatedLeads.filter(l => l.status === 'lost').length,
        employerLeads: updatedLeads.filter(l => l.type === 'employer').length,
        jobseekerLeads: updatedLeads.filter(l => l.type === 'jobseeker').length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'qualified': return 'outline';
      case 'converted': return 'default';
      case 'lost': return 'destructive';
      default: return 'default';
    }
  };

  // Get type badge variant
  const getTypeBadgeVariant = (type: Lead['type']) => {
    return type === 'employer' ? 'default' : 'secondary';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Lead Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage leads from employer and jobseeker registrations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationDialogOpen(true)}
            className="relative"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.employerLeads} employers, {stats.jobseekerLeads} jobseekers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground">
              Ready for conversion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.converted} converted leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>
            Search, filter, and manage your leads from website registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="employer">Employers</SelectItem>
                <SelectItem value="jobseeker">Jobseekers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leads Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Company/Address</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <UserPlus className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">No leads found</p>
                        <p className="text-sm text-gray-400">
                          Leads will appear here when users register on the website
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-mono text-sm">
                        {lead.id.split('_')[1]}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {lead.company_name && (
                            <div className="flex items-center text-sm font-medium">
                              <Building2 className="w-3 h-3 mr-1 text-gray-400" />
                              {lead.company_name}
                            </div>
                          )}
                          {lead.address && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                              {lead.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Website Registration</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(lead.type)}>
                          {lead.type === 'employer' ? (
                            <><Building2 className="w-3 h-3 mr-1" />Employer</>
                          ) : (
                            <><Users className="w-3 h-3 mr-1" />Jobseeker</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value: Lead['status']) => handleStatusUpdate(lead.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {lead.assigned_to_name ? (
                          <div className="text-sm">
                            <div className="font-medium">{lead.assigned_to_name}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                          {formatDate(lead.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLead(lead);
                                setTransferDialogOpen(true);
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Transfer Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Lead Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Lead</DialogTitle>
            <DialogDescription>
              Assign this lead to another team member. They will receive a notification.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium">{selectedLead.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLead.email}</p>
                <Badge variant={getTypeBadgeVariant(selectedLead.type)} className="mt-2">
                  {selectedLead.type}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex flex-col">
                          <span>{employee.name}</span>
                          <span className="text-xs text-gray-500">{employee.role}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferLead} disabled={!selectedEmployee}>
              Transfer Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Recent lead management notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    notification.read ? "bg-gray-50 dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="ml-2">New</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
            >
              Mark All as Read
            </Button>
            <Button onClick={() => setNotificationDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}