'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Search, 
  Mail, 
  Trash2, 
  Edit, 
  Key, 
  Send, 
  Users, 
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Star,
  Archive,
  Inbox,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface EmailUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_email?: string;
  role: 'admin' | 'user' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  html_content?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  is_starred: boolean;
  is_archived: boolean;
  is_spam: boolean;
  created_at: string;
  read_at?: string;
}

interface CreateUserForm {
  email: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  role: 'admin' | 'user';
  send_welcome_email: boolean;
}

interface ComposeEmailForm {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  content: string;
  html_content?: string;
  priority: 'low' | 'normal' | 'high';
}

export default function EmailUsersPage() {
  const [emailUsers, setEmailUsers] = useState<EmailUser[]>([]);
  const [emailMessages, setEmailMessages] = useState<EmailMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<EmailUser | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isViewMessageOpen, setIsViewMessageOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [emailFilter, setEmailFilter] = useState('all'); // all, inbox, sent, starred, archived, spam
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: '',
    first_name: '',
    last_name: '',
    personal_email: '',
    role: 'user',
    send_welcome_email: true
  });
  
  const [composeForm, setComposeForm] = useState<ComposeEmailForm>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: '',
    html_content: '',
    priority: 'normal'
  });
  
  const [passwordResetEmail, setPasswordResetEmail] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadEmailUsers();
    loadEmailMessages();
  }, []);

  // Reload messages when filter changes
  useEffect(() => {
    if (emailFilter !== 'all') {
      loadEmailMessages(emailFilter);
    }
  }, [emailFilter]);

  const loadEmailUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/admin/email-users');
      setEmailUsers(response || []);
    } catch (err) {
      setError('Failed to load email users');
      console.error('Error loading email users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailMessages = async (folder: string = 'inbox') => {
    try {
      const response = await apiClient.get(`/api/v1/admin/email-users/messages/${folder}`);
      setEmailMessages(response || []);
    } catch (err) {
      console.error('Error loading email messages:', err);
      // If no email account exists, set empty array
      setEmailMessages([]);
    }
  };

  const createEmailUser = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post('/api/v1/admin/email-users', createUserForm);
      
      if (response.success || response) {
        setSuccess('Email user created successfully!');
        setIsCreateUserOpen(false);
        setCreateUserForm({
          email: '',
          first_name: '',
          last_name: '',
          personal_email: '',
          role: 'user',
          send_welcome_email: true
        });
        loadEmailUsers();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create email user');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmailUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this email user?')) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/api/v1/admin/email-users/${userId}`);
      setSuccess('Email user deleted successfully!');
      loadEmailUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete email user');
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post('/api/v1/admin/email-users/reset-password', {
        email: passwordResetEmail
      });
      
      if (response.success || response) {
        setSuccess('Password reset email sent successfully!');
        setIsPasswordResetOpen(false);
        setPasswordResetEmail('');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    try {
      setIsSending(true);
      setError('');
      
      // Convert form data to match backend schema
      const emailData = {
        to_emails: [composeForm.to],
        subject: composeForm.subject,
        body: composeForm.content,
        cc_emails: composeForm.cc ? [composeForm.cc] : [],
        bcc_emails: composeForm.bcc ? [composeForm.bcc] : [],
        is_draft: false
      };
      
      const response = await apiClient.post('/api/v1/admin/email-users/send-email', emailData);
      
      if (response.success || response) {
        setSuccess('Email sent successfully!');
        setComposeForm({
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          content: '',
          html_content: '',
          priority: 'normal'
        });
        // Reload sent messages and switch to messages tab
        loadEmailMessages('sent');
        setEmailFilter('sent');
        setActiveTab('messages');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const toggleMessageStar = async (messageId: string) => {
    try {
      await apiClient.patch(`/api/v1/admin/email-users/messages/${messageId}/star`);
      loadEmailMessages(emailFilter === 'all' ? 'inbox' : emailFilter);
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const toggleMessageArchive = async (messageId: string) => {
    try {
      await apiClient.patch(`/api/v1/admin/email-messages/${messageId}/archive`);
      loadEmailMessages();
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  const markAsSpam = async (messageId: string) => {
    try {
      await apiClient.patch(`/api/v1/admin/email-messages/${messageId}/spam`);
      loadEmailMessages();
    } catch (err) {
      console.error('Error marking as spam:', err);
    }
  };

  // Filter functions
  const filteredUsers = emailUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter messages by search term only (folder filtering is done by API)
  const filteredMessages = emailMessages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.to.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Management System</h1>
          <p className="text-muted-foreground">Manage email users and messages</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Email User
          </Button>
          <Button onClick={() => setIsComposeOpen(true)} variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users or messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsPasswordResetOpen(true)} variant="outline">
          <Key className="h-4 w-4 mr-2" />
          Reset Password
        </Button>
        <Button onClick={() => { loadEmailUsers(); loadEmailMessages(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Email Users
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Mail className="h-4 w-4 mr-2" />
            Email Messages
          </TabsTrigger>
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" />
            Compose Email
          </TabsTrigger>
        </TabsList>

        {/* Email Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage organization email accounts and user access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Personal Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.personal_email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'super_admin' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.is_verified && (
                            <Badge variant="outline">Verified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteEmailUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {/* Email Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={emailFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailFilter('all')}
            >
              All
            </Button>
            <Button
              variant={emailFilter === 'inbox' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailFilter('inbox')}
            >
              <Inbox className="h-4 w-4 mr-1" />
              Inbox
            </Button>
            <Button
              variant={emailFilter === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailFilter('sent')}
            >
              <Send className="h-4 w-4 mr-1" />
              Sent
            </Button>
            <Button
              variant={emailFilter === 'starred' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailFilter('starred')}
            >
              <Star className="h-4 w-4 mr-1" />
              Starred
            </Button>
            <Button
              variant={emailFilter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailFilter('archived')}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archived
            </Button>
            <Button
              variant={emailFilter === 'spam' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEmailFilter('spam')}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Spam
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Messages ({filteredMessages.length})</CardTitle>
              <CardDescription>
                View and manage email communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>{message.from}</TableCell>
                      <TableCell>{message.to}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {message.is_starred && <Star className="h-4 w-4 text-yellow-500" />}
                          {message.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={message.status === 'delivered' ? 'default' : message.status === 'failed' ? 'destructive' : 'secondary'}>
                          {message.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(message.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMessage(message);
                              setIsViewMessageOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMessageStar(message.id)}
                          >
                            <Star className={`h-4 w-4 ${message.is_starred ? 'text-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMessageArchive(message.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsSpam(message.id)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compose Email Tab */}
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>
                Send emails to users or external recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="compose-to">To *</Label>
                    <Input
                      id="compose-to"
                      placeholder="ranjeettiwari105@gmail.com"
                      value={composeForm.to}
                      onChange={(e) => setComposeForm({...composeForm, to: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="compose-cc">CC</Label>
                    <Input
                      id="compose-cc"
                      placeholder="ranjeettiwary589@gmail.com"
                      value={composeForm.cc || ''}
                      onChange={(e) => setComposeForm({...composeForm, cc: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="compose-bcc">BCC</Label>
                    <Input
                      id="compose-bcc"
                      placeholder="admin@remotehive.in"
                      value={composeForm.bcc || ''}
                      onChange={(e) => setComposeForm({...composeForm, bcc: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="compose-subject">Subject *</Label>
                  <Input
                    id="compose-subject"
                    placeholder="Email subject"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({...composeForm, subject: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="compose-priority">Priority</Label>
                  <Select
                    value={composeForm.priority}
                    onValueChange={(value: 'low' | 'normal' | 'high') => setComposeForm({...composeForm, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="compose-content">Message *</Label>
                  <Textarea
                    id="compose-content"
                    placeholder="Type your message here..."
                    rows={8}
                    value={composeForm.content}
                    onChange={(e) => setComposeForm({...composeForm, content: e.target.value})}
                  />
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setComposeForm({
                      to: '',
                      cc: '',
                      bcc: '',
                      subject: '',
                      content: '',
                      priority: 'normal'
                    })}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={sendEmail}
                    disabled={!composeForm.to || !composeForm.subject || !composeForm.content || isSending}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Email User</DialogTitle>
            <DialogDescription>
              Create a new email account for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Organization Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                  placeholder="ranjeettiwary589@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="personal_email">Personal Email *</Label>
                <Input
                  id="personal_email"
                  type="email"
                  value={createUserForm.personal_email}
                  onChange={(e) => setCreateUserForm({...createUserForm, personal_email: e.target.value})}
                  placeholder="ranjeettiwari105@gmail.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={createUserForm.first_name}
                  onChange={(e) => setCreateUserForm({...createUserForm, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={createUserForm.last_name}
                  onChange={(e) => setCreateUserForm({...createUserForm, last_name: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={createUserForm.role} onValueChange={(value: 'admin' | 'user') => setCreateUserForm({...createUserForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send_welcome_email"
                checked={createUserForm.send_welcome_email}
                onChange={(e) => setCreateUserForm({...createUserForm, send_welcome_email: e.target.checked})}
              />
              <Label htmlFor="send_welcome_email">Send welcome email with password setup instructions</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>Cancel</Button>
            <Button onClick={createEmailUser} disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Send a new email message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm({...composeForm, to: e.target.value})}
                  placeholder="ranjeettiwari105@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  value={composeForm.cc}
                  onChange={(e) => setComposeForm({...composeForm, cc: e.target.value})}
                  placeholder="ranjeettiwary589@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="bcc">BCC</Label>
                <Input
                  id="bcc"
                  value={composeForm.bcc}
                  onChange={(e) => setComposeForm({...composeForm, bcc: e.target.value})}
                  placeholder="admin@remotehive.in"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({...composeForm, subject: e.target.value})}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={composeForm.priority} onValueChange={(value: 'low' | 'normal' | 'high') => setComposeForm({...composeForm, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Message *</Label>
              <Textarea
                id="content"
                value={composeForm.content}
                onChange={(e) => setComposeForm({...composeForm, content: e.target.value})}
                placeholder="Type your message here..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
            <Button onClick={sendEmail} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Send a password reset email to a user's personal email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reset_email">User Email</Label>
              <Input
                id="reset_email"
                type="email"
                value={passwordResetEmail}
                onChange={(e) => setPasswordResetEmail(e.target.value)}
                placeholder="ranjeettiwary589@gmail.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordResetOpen(false)}>Cancel</Button>
            <Button onClick={resetUserPassword} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={isViewMessageOpen} onOpenChange={setIsViewMessageOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Message</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <p className="text-sm">{selectedMessage.from}</p>
                </div>
                <div>
                  <Label>To</Label>
                  <p className="text-sm">{selectedMessage.to}</p>
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <p className="text-sm font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
              <Separator />
              <div>
                <Label>Message Content</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  {selectedMessage.html_content ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.html_content }} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">{selectedMessage.content}</pre>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewMessageOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}