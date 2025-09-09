'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/services/api/client';
import { useRetry, retryConditions } from '@/hooks/useRetry';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Plus,
  Settings,
  BarChart3,
  Users,
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Save,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  template_type: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: number;
  recipient_email: string;
  subject: string;
  template_name: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
  error_message?: string;
}

interface EmailStats {
  total_sent: number;
  total_failed: number;
  total_pending: number;
  delivery_rate: number;
  avg_delivery_time: number;
}

interface SMTPSettings {
  email_host: string;
  email_port: number;
  email_username: string;
  email_password: string;
  email_from: string;
  email_use_tls: boolean;
  email_use_ssl: boolean;
}

interface TemplateFormData {
  name: string;
  subject: string;
  template_type: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
}

// API functions
const api = {
  // Templates
  getTemplates: async (page = 1, size = 10, search = '', category = '', is_active?: boolean) => {
    const params = {
      page: page.toString(),
      size: size.toString(),
      ...(search && { search }),
      ...(category && { category }),
      ...(is_active !== undefined && { is_active: is_active.toString() })
    };
    return await apiClient.get('/api/v1/admin/email/templates', params);
  },

  getTemplate: async (id: number) => {
    return await apiClient.get(`/api/v1/admin/email/templates/${id}`);
  },

  createTemplate: async (data: TemplateFormData) => {
    return await apiClient.post('/api/v1/admin/email/templates', data);
  },

  updateTemplate: async (id: number, data: Partial<TemplateFormData>) => {
    return await apiClient.put(`/api/v1/admin/email/templates/${id}`, data);
  },

  deleteTemplate: async (id: number) => {
    return await apiClient.delete(`/api/v1/admin/email/templates/${id}`);
  },

  previewTemplate: async (id: number, templateData?: any) => {
    return await apiClient.post(`/api/v1/admin/email/templates/${id}/preview`, { template_data: templateData });
  },

  // Email logs
  getLogs: async (page = 1, size = 20, search = '', status = '', template_name = '') => {
    const params = {
      page: page.toString(),
      size: size.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(template_name && { template_name })
    };
    return await apiClient.get('/api/v1/admin/email/logs', params);
  },

  // Stats
  getStats: async (days = 30) => {
    return await apiClient.get('/api/v1/admin/email/stats', { days });
  },

  // SMTP Settings
  getSMTPSettings: async () => {
    return await apiClient.get('/api/v1/admin/email/smtp-settings');
  },

  updateSMTPSettings: async (data: Partial<SMTPSettings>) => {
    return await apiClient.put('/api/v1/admin/email/smtp-settings', data);
  },

  // Test email
  testEmail: async (data: { recipient_email: string; template_id?: number; subject?: string; html_content?: string; template_data?: any }) => {
    return await apiClient.post('/api/v1/admin/email/test', data);
  }
};

export default function EmailManagementPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    name: '',
    subject: '',
    template_type: 'custom',
    html_content: '',
    text_content: '',
    is_active: true
  });
  const [testEmailForm, setTestEmailForm] = useState({
    recipient_email: '',
    template_id: undefined as number | undefined,
    subject: '',
    html_content: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadTemplates();
    loadLogs();
    loadStats();
    loadSMTPSettings();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplates(1, 100); // Load all templates
      setTemplates(response.items || []);
    } catch (error) {
      toast.error('Failed to load templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await api.getLogs(1, 50);
      setLogs(response.items || []);
    } catch (error) {
      toast.error('Failed to load email logs');
      console.error(error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getStats();
      setStats(response);
    } catch (error) {
      toast.error('Failed to load statistics');
      console.error(error);
    }
  };

  const loadSMTPSettings = async () => {
    try {
      const response = await api.getSMTPSettings();
      setSMTPSettings(response);
    } catch (error) {
      toast.error('Failed to load SMTP settings');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter(item => {
    const matchesSearch = item.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesTemplate = templateFilter === 'all' || item.template_name === templateFilter;
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      name: '',
      subject: '',
      template_type: 'custom',
      html_content: '',
      text_content: '',
      is_active: true
    });
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      template_type: template.template_type,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_active: template.is_active
    });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      if (selectedTemplate) {
        await api.updateTemplate(selectedTemplate.id, templateForm);
        toast.success('Template updated successfully');
      } else {
        await api.createTemplate(templateForm);
        toast.success('Template created successfully');
      }
      setIsTemplateDialogOpen(false);
      loadTemplates();
    } catch (error) {
      toast.error(selectedTemplate ? 'Failed to update template' : 'Failed to create template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // API function for deleting email template
  const deleteTemplateApi = async (templateId: string) => {
    await api.deleteTemplate(templateId);
  };

  // Configure retry for deleting email template
  const deleteTemplateRetry = useRetry(deleteTemplateApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying delete template (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for delete template:', error);
      toast.error('Failed to delete template after multiple attempts');
    }
  });

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteTemplateRetry.execute(template.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      // Error handling is done in the retry configuration
    }
  };

  const handlePreviewTemplate = async (template: EmailTemplate) => {
    try {
      setLoading(true);
      const response = await api.previewTemplate(template.id);
      setPreviewContent(response);
      setSelectedTemplate(template);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to preview template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setLoading(true);
      await api.testEmail(testEmailForm);
      toast.success('Test email sent successfully');
      setIsTestDialogOpen(false);
      setTestEmailForm({
        recipient_email: '',
        template_id: undefined,
        subject: '',
        html_content: ''
      });
      loadLogs(); // Refresh logs to show the test email
    } catch (error) {
      toast.error('Failed to send test email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // API function for updating SMTP settings
  const updateSMTPSettingsApi = async (updatedSettings: Partial<SMTPSettings>) => {
    const response = await api.updateSMTPSettings(updatedSettings);
    return response;
  };

  // Configure retry for updating SMTP settings
  const updateSMTPRetry = useRetry(updateSMTPSettingsApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying update SMTP settings (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for update SMTP settings:', error);
      toast.error('Failed to update SMTP settings after multiple attempts');
    }
  });

  const handleUpdateSMTPSettings = async (updatedSettings: Partial<SMTPSettings>) => {
    try {
      setLoading(true);
      const response = await updateSMTPRetry.execute(updatedSettings);
      setSMTPSettings(response);
      toast.success('SMTP settings updated successfully');
    } catch (error) {
      console.error('Error updating SMTP settings:', error);
      // Error handling is done in the retry configuration
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
          <p className="text-muted-foreground">
            Manage email templates, monitor delivery queue, and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
          <Button variant="outline" onClick={() => setIsTestDialogOpen(true)}>
            <TestTube className="h-4 w-4 mr-2" />
            Test Email
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Emails delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivery_rate}%</div>
              <Progress value={stats.delivery_rate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pending}</div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_failed}</div>
              <p className="text-xs text-muted-foreground">Delivery errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="settings">SMTP Settings</TabsTrigger>
          <TabsTrigger value="email-users">
            <Users className="h-4 w-4 mr-2" />
            Email Users
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{template.template_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email Logs ({filteredLogs.length})</CardTitle>
              <CardDescription>
                Monitor email delivery status and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                            {log.status}
                          </Badge>
                          <span className="font-medium">{log.recipient_email}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.subject}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Template: {log.template_name}</span>
                          <span>
                            Created: {new Date(log.created_at).toLocaleString()}
                          </span>
                          {log.sent_at && (
                            <span>
                              Sent: {new Date(log.sent_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {smtpSettings && (
            <Card>
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>
                  Configure email server settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email_host">SMTP Host</Label>
                    <Input
                      id="email_host"
                      value={smtpSettings.email_host}
                      onChange={(e) => setSMTPSettings(prev => prev ? {...prev, email_host: e.target.value} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_port">SMTP Port</Label>
                    <Input
                      id="email_port"
                      type="number"
                      value={smtpSettings.email_port}
                      onChange={(e) => setSMTPSettings(prev => prev ? {...prev, email_port: parseInt(e.target.value)} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_username">Username</Label>
                    <Input
                      id="email_username"
                      value={smtpSettings.email_username}
                      onChange={(e) => setSMTPSettings(prev => prev ? {...prev, email_username: e.target.value} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_password">Password</Label>
                    <Input
                      id="email_password"
                      type="password"
                      value={smtpSettings.email_password}
                      onChange={(e) => setSMTPSettings(prev => prev ? {...prev, email_password: e.target.value} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_from">From Email</Label>
                    <Input
                      id="email_from"
                      type="email"
                      value={smtpSettings.email_from}
                      onChange={(e) => setSMTPSettings(prev => prev ? {...prev, email_from: e.target.value} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="email_use_tls"
                        checked={smtpSettings.email_use_tls}
                        onCheckedChange={(checked) => setSMTPSettings(prev => prev ? {...prev, email_use_tls: checked} : null)}
                      />
                      <Label htmlFor="email_use_tls">Use TLS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="email_use_ssl"
                        checked={smtpSettings.email_use_ssl}
                        onCheckedChange={(checked) => setSMTPSettings(prev => prev ? {...prev, email_use_ssl: checked} : null)}
                      />
                      <Label htmlFor="email_use_ssl">Use SSL</Label>
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleUpdateSMTPSettings(smtpSettings)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Email Users Tab */}
        <TabsContent value="email-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Users Management</CardTitle>
              <CardDescription>
                Manage organization email accounts and user access. Click the button below to access the full Email Users management interface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Users className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Email Users Management</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Access the dedicated Email Users interface to create, manage, and configure organization email accounts, send emails, and view message history.
                  </p>
                </div>
                <Button 
                  onClick={() => window.open('/admin/email-users', '_blank')}
                  className="mt-4"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Open Email Users Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Update the email template' : 'Create a new email template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template_type">Type</Label>
                <Select value={templateForm.template_type} onValueChange={(value) => setTemplateForm(prev => ({...prev, template_type: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verification">Verification</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="job_alert">Job Alert</SelectItem>
                    <SelectItem value="application_status">Application Status</SelectItem>
                    <SelectItem value="support_request">Support Request</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({...prev, subject: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="html_content">HTML Content</Label>
              <Textarea
                id="html_content"
                rows={10}
                value={templateForm.html_content}
                onChange={(e) => setTemplateForm(prev => ({...prev, html_content: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text_content">Text Content (Optional)</Label>
              <Textarea
                id="text_content"
                rows={5}
                value={templateForm.text_content}
                onChange={(e) => setTemplateForm(prev => ({...prev, text_content: e.target.value}))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={templateForm.is_active}
                onCheckedChange={(checked) => setTemplateForm(prev => ({...prev, is_active: checked}))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {selectedTemplate ? 'Update' : 'Create'} Template
              </Button>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div>
                <Label>Subject:</Label>
                <p className="font-medium">{previewContent.subject}</p>
              </div>
              <div>
                <Label>HTML Content:</Label>
                <div 
                  className="border rounded p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewContent.html_content }}
                />
              </div>
              {previewContent.text_content && (
                <div>
                  <Label>Text Content:</Label>
                  <pre className="whitespace-pre-wrap border rounded p-4 bg-gray-50">
                    {previewContent.text_content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_recipient">Recipient Email</Label>
              <Input
                id="test_recipient"
                type="email"
                value={testEmailForm.recipient_email}
                onChange={(e) => setTestEmailForm(prev => ({...prev, recipient_email: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_template">Template (Optional)</Label>
              <Select 
                value={testEmailForm.template_id?.toString() || 'custom'} 
                onValueChange={(value) => setTestEmailForm(prev => ({...prev, template_id: value === 'custom' ? undefined : parseInt(value)}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Email</SelectItem>
                  {templates.filter(t => t.is_active).map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!testEmailForm.template_id && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="test_subject">Subject</Label>
                  <Input
                    id="test_subject"
                    value={testEmailForm.subject}
                    onChange={(e) => setTestEmailForm(prev => ({...prev, subject: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_content">HTML Content</Label>
                  <Textarea
                    id="test_content"
                    rows={5}
                    value={testEmailForm.html_content}
                    onChange={(e) => setTestEmailForm(prev => ({...prev, html_content: e.target.value}))}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button onClick={handleTestEmail} disabled={loading || !testEmailForm.recipient_email}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
              <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}