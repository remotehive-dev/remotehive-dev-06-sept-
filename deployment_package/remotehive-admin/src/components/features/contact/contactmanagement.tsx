'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Eye, Mail, MessageSquare, Phone, User, Calendar, Filter, Search, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  response?: string;
  tags?: string[];
  admin_notes?: string;
  last_reply_at?: string;
  inquiry_type?: string;
  company_name?: string;
}

interface ContactResponse {
  id: string;
  contact_id: string;
  message: string;
  created_at: string;
  created_by: string;
}

const ContactManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [responses, setResponses] = useState<ContactResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch contact submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/v1/contact/admin/submissions');
      // Extract submissions array from the response object
      setSubmissions(data.submissions || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch responses for a specific contact
  const fetchResponses = async (contactId: string) => {
    try {
      const data = await apiClient.get(`/api/v1/contact/admin/submissions/${contactId}/responses`);
      // Extract responses array from the response object
      setResponses(data.responses || data || []);
    } catch (err) {
      console.error('Error fetching responses:', err);
    }
  };

  // Update submission status
  const updateSubmissionStatus = async (id: string, status: ContactSubmission['status']) => {
    try {
      await apiClient.patch(`/api/v1/contact/admin/submissions/${id}`, { status });
      
      // Refresh submissions
      fetchSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Update submission priority
  const updateSubmissionPriority = async (id: string, priority: ContactSubmission['priority']) => {
    try {
      await apiClient.patch(`/api/v1/contact/admin/submissions/${id}`, { priority });
      
      // Refresh submissions
      fetchSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  // Send email reply to contact
  const sendEmailReply = async () => {
    if (!selectedSubmission || !emailSubject.trim() || !emailMessage.trim()) {
      return;
    }

    try {
      setEmailSending(true);
      
      await apiClient.post(`/api/v1/contact/admin/submissions/${selectedSubmission.id}/reply`, {
        subject: emailSubject,
        message: emailMessage,
        reply_type: 'reply'
      });
      
      // Reset form and close dialog
      setEmailSubject('');
      setEmailMessage('');
      setIsEmailDialogOpen(false);
      
      // Update status to in_progress if it was new
      if (selectedSubmission.status === 'new') {
        await updateSubmissionStatus(selectedSubmission.id, 'in_progress');
      }
      
      // Refresh data
      fetchSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email reply');
    } finally {
      setEmailSending(false);
    }
  };

  // Update admin notes
  const updateAdminNotes = async (id: string, notes: string) => {
    try {
      await apiClient.put(`/api/v1/contact/admin/submissions/${id}`, { admin_notes: notes });
      
      // Refresh submissions
      fetchSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin notes');
    }
  };

  // Send response to contact (legacy function - keeping for compatibility)
  const sendResponse = async () => {
    if (!selectedSubmission || !responseMessage.trim()) {
      return;
    }

    try {
      await apiClient.post(`/api/v1/contact/admin/submissions/${selectedSubmission.id}/respond`, {
        message: responseMessage
      });
      
      // Reset form and close dialog
      setResponseMessage('');
      setIsResponseDialogOpen(false);
      
      // Update status to in_progress if it was new
      if (selectedSubmission.status === 'new') {
        await updateSubmissionStatus(selectedSubmission.id, 'in_progress');
      }
      
      // Refresh data
      fetchSubmissions();
      if (selectedSubmission) {
        fetchResponses(selectedSubmission.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || submission.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Get status badge variant
  const getStatusBadgeVariant = (status: ContactSubmission['status']) => {
    switch (status) {
      case 'new': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'outline';
      case 'closed': return 'destructive';
      default: return 'default';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: ContactSubmission['priority']) => {
    switch (priority) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'default';
      case 'urgent': return 'destructive';
      default: return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ContactSubmission['status']) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
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

  // Load data on component mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSubmissions();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Load responses when a submission is selected
  useEffect(() => {
    if (selectedSubmission) {
      fetchResponses(selectedSubmission.id);
      setAdminNotes(selectedSubmission.admin_notes || '');
    }
  }, [selectedSubmission]);

  // Set email subject when submission is selected
  useEffect(() => {
    if (selectedSubmission && isEmailDialogOpen) {
      setEmailSubject(`Re: ${selectedSubmission.subject}`);
    }
  }, [selectedSubmission, isEmailDialogOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading contact submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Management</h1>
          <p className="text-muted-foreground">
            Manage and respond to contact form submissions ({filteredSubmissions.length} submissions)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button onClick={fetchSubmissions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority-filter">Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="grid gap-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No contact submissions found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{submission.subject}</h3>
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1 capitalize">{submission.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(submission.priority)}>
                        <span className="capitalize">{submission.priority}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{submission.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{submission.email}</span>
                      </div>
                      {submission.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{submission.phone}</span>
                        </div>
                      )}
                      {submission.company_name && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">Company:</span>
                          <span>{submission.company_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(submission.created_at)}</span>
                      </div>
                      {submission.last_reply_at && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">Last reply: {formatDate(submission.last_reply_at)}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Dialog open={isEmailDialogOpen && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                      setIsEmailDialogOpen(open);
                      if (open) setSelectedSubmission(submission);
                      if (!open) {
                        setEmailSubject('');
                        setEmailMessage('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Send Email Reply</DialogTitle>
                          <DialogDescription>
                            Replying to {submission.name} ({submission.email})
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email-subject">Subject</Label>
                            <Input
                              id="email-subject"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="Email subject"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email-message">Message</Label>
                            <Textarea
                              id="email-message"
                              placeholder="Type your email message here..."
                              value={emailMessage}
                              onChange={(e) => setEmailMessage(e.target.value)}
                              rows={8}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={sendEmailReply} 
                            disabled={!emailSubject.trim() || !emailMessage.trim() || emailSending}
                          >
                            {emailSending ? 'Sending...' : 'Send Email'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isDetailsDialogOpen && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                      setIsDetailsDialogOpen(open);
                      if (open) setSelectedSubmission(submission);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Contact Submission Details</DialogTitle>
                          <DialogDescription>
                            Submitted on {formatDate(submission.created_at)}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Tabs defaultValue="details" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="responses">Responses</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Name</Label>
                                <p className="text-sm font-medium">{submission.name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm font-medium">{submission.email}</p>
                              </div>
                              {submission.phone && (
                                <div>
                                  <Label>Phone</Label>
                                  <p className="text-sm font-medium">{submission.phone}</p>
                                </div>
                              )}
                              {submission.company_name && (
                                <div>
                                  <Label>Company</Label>
                                  <p className="text-sm font-medium">{submission.company_name}</p>
                                </div>
                              )}
                              {submission.inquiry_type && (
                                <div>
                                  <Label>Inquiry Type</Label>
                                  <p className="text-sm font-medium capitalize">{submission.inquiry_type.replace('_', ' ')}</p>
                                </div>
                              )}
                              <div>
                                <Label>Subject</Label>
                                <p className="text-sm font-medium">{submission.subject}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Message</Label>
                              <p className="text-sm mt-1 p-3 bg-muted rounded-md">{submission.message}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Status</Label>
                                <Select 
                                  value={submission.status} 
                                  onValueChange={(value) => updateSubmissionStatus(submission.id, value as ContactSubmission['status'])}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Priority</Label>
                                <Select 
                                  value={submission.priority} 
                                  onValueChange={(value) => updateSubmissionPriority(submission.id, value as ContactSubmission['priority'])}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Admin Notes</Label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                onBlur={() => updateAdminNotes(submission.id, adminNotes)}
                                placeholder="Add internal notes about this submission..."
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                            
                            {submission.last_reply_at && (
                              <div>
                                <Label>Last Reply</Label>
                                <p className="text-sm font-medium">{formatDate(submission.last_reply_at)}</p>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="responses" className="space-y-4">
                            <div className="space-y-3">
                              {responses.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No responses yet.
                                </p>
                              ) : (
                                responses.map((response) => (
                                  <div key={response.id} className="p-3 bg-muted rounded-md">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-sm font-medium">{response.created_by}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(response.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm">{response.message}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isResponseDialogOpen && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                      setIsResponseDialogOpen(open);
                      if (open) setSelectedSubmission(submission);
                      if (!open) setResponseMessage('');
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Response</DialogTitle>
                          <DialogDescription>
                            Responding to {submission.name} ({submission.email})
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="response-message">Response Message</Label>
                            <Textarea
                              id="response-message"
                              placeholder="Type your response here..."
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              rows={6}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={sendResponse} disabled={!responseMessage.trim()}>
                            Send Response
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactManagement;