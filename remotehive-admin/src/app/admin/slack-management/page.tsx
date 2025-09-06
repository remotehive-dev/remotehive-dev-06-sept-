'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRetry, retryConditions } from '@/hooks/useRetry';
import {
  MessageSquare,
  Settings,
  TestTube,
  Bell,
  Users,
  Hash,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Activity,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  MessageCircle,
  Calendar,
  Filter,
  Search,
  Download,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface SlackConfig {
  webhook_url: string;
  channel_name: string;
  bot_name: string;
  enabled: boolean;
  notifications: {
    contact_forms: boolean;
    user_registrations: boolean;
    job_applications: boolean;
    system_alerts: boolean;
    payment_notifications: boolean;
  };
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiry_type: string;
  phone?: string;
  company_name?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
  source: string;
}

interface SlackMessage {
  id: string;
  type: 'contact_form' | 'system' | 'test';
  title: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
  submission_id?: string;
}

export default function SlackManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [slackConfig, setSlackConfig] = useState<SlackConfig>({
    webhook_url: '',
    channel_name: '#general',
    bot_name: 'RemoteHive Bot',
    enabled: false,
    notifications: {
      contact_forms: true,
      user_registrations: false,
      job_applications: false,
      system_alerts: true,
      payment_notifications: false
    }
  });
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [slackMessages, setSlackMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  useEffect(() => {
    loadSlackConfig();
    loadContactSubmissions();
    loadSlackMessages();
  }, []);

  const loadSlackConfig = async () => {
    try {
      // Load current Slack configuration
      // This would typically come from your backend API
      setSlackConfig({
        webhook_url: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || '',
        channel_name: '#contact-forms',
        bot_name: 'RemoteHive Bot',
        enabled: true,
        notifications: {
          contact_forms: true,
          user_registrations: false,
          job_applications: false,
          system_alerts: true,
          payment_notifications: false
        }
      });
    } catch (error) {
      console.error('Error loading Slack config:', error);
      toast.error('Failed to load Slack configuration');
    }
  };

  const loadContactSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/contact-submissions');
      if (response.ok) {
        const data = await response.json();
        setContactSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading contact submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadSlackMessages = async () => {
    try {
      // Load Slack message history
      // This would be stored in your database
      const mockMessages: SlackMessage[] = [
        {
          id: '1',
          type: 'contact_form',
          title: 'New Contact Form Submission',
          content: 'John Doe submitted a contact form about business inquiry',
          timestamp: new Date().toISOString(),
          status: 'sent',
          submission_id: '123'
        },
        {
          id: '2',
          type: 'test',
          title: 'Slack Integration Test',
          content: 'Test message sent successfully',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'sent'
        }
      ];
      setSlackMessages(mockMessages);
    } catch (error) {
      console.error('Error loading Slack messages:', error);
    }
  };

  // API function for saving Slack configuration
  const saveSlackConfigApi = async (config: any) => {
    const response = await fetch('/api/admin/slack/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save configuration');
    }
    return response;
  };

  // Configure retry for saving Slack configuration
  const saveSlackRetry = useRetry(saveSlackConfigApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying save Slack config (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for save Slack config:', error);
      toast.error('Failed to save Slack configuration after multiple attempts');
    }
  });

  const saveSlackConfig = async () => {
    try {
      setLoading(true);
      await saveSlackRetry.execute(slackConfig);
      toast.success('Slack configuration saved successfully');
    } catch (error) {
      console.error('Error saving Slack config:', error);
      // Error handling is done in the retry configuration
    } finally {
      setLoading(false);
    }
  };

  const testSlackIntegration = async () => {
    try {
      setTestLoading(true);
      const response = await fetch('/api/v1/contact/test-slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Test message sent to Slack successfully!');
        loadSlackMessages(); // Refresh message history
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error testing Slack integration:', error);
      toast.error('Failed to send test message to Slack');
    } finally {
      setTestLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(slackConfig.webhook_url);
    toast.success('Webhook URL copied to clipboard');
  };

  const filteredSubmissions = contactSubmissions.filter(submission => {
    const matchesSearch = submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || submission.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Slack Management</h1>
          <p className="text-gray-600 mt-1">Configure and manage Slack integration for notifications and chat</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={testSlackIntegration}
            disabled={testLoading || !slackConfig.webhook_url}
            className="flex items-center space-x-2"
          >
            {testLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            <span>Test Integration</span>
          </Button>
          <Button
            onClick={saveSlackConfig}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            <span>Save Config</span>
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      <Alert className={slackConfig.enabled && slackConfig.webhook_url ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <Activity className="w-4 h-4" />
        <AlertDescription>
          {slackConfig.enabled && slackConfig.webhook_url ? (
            <span className="text-green-800">✅ Slack integration is active and configured</span>
          ) : (
            <span className="text-yellow-800">⚠️ Slack integration requires configuration</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Contact Chat</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Message History</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Integration Status</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {slackConfig.enabled ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {slackConfig.enabled ? 'Notifications enabled' : 'Configure to enable'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <Send className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slackMessages.filter(m => m.status === 'sent').length}</div>
                <p className="text-xs text-muted-foreground">
                  +{slackMessages.filter(m => new Date(m.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contact Forms</CardTitle>
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contactSubmissions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {contactSubmissions.filter(s => s.status === 'new').length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Channel</CardTitle>
                <Hash className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slackConfig.channel_name}</div>
                <p className="text-xs text-muted-foreground">
                  Notification channel
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Slack Activity</CardTitle>
              <CardDescription>Latest messages sent to Slack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slackMessages.slice(0, 5).map((message) => (
                  <div key={message.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    {getMessageStatusIcon(message.status)}
                    <div className="flex-1">
                      <div className="font-medium">{message.title}</div>
                      <div className="text-sm text-gray-600">{message.content}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${
                      message.type === 'contact_form' ? 'border-blue-200 text-blue-800' :
                      message.type === 'system' ? 'border-green-200 text-green-800' :
                      'border-gray-200 text-gray-800'
                    }`}>
                      {message.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {slackMessages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No messages sent yet. Test the integration to see activity here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>Configure your Slack webhook and basic settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="webhook-url"
                      type={showWebhookUrl ? 'text' : 'password'}
                      value={slackConfig.webhook_url}
                      onChange={(e) => setSlackConfig({...slackConfig, webhook_url: e.target.value})}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowWebhookUrl(!showWebhookUrl)}
                    >
                      {showWebhookUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyWebhookUrl}
                      disabled={!slackConfig.webhook_url}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input
                    id="channel-name"
                    value={slackConfig.channel_name}
                    onChange={(e) => setSlackConfig({...slackConfig, channel_name: e.target.value})}
                    placeholder="#general"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bot-name">Bot Name</Label>
                  <Input
                    id="bot-name"
                    value={slackConfig.bot_name}
                    onChange={(e) => setSlackConfig({...slackConfig, bot_name: e.target.value})}
                    placeholder="RemoteHive Bot"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={slackConfig.enabled}
                    onCheckedChange={(checked) => setSlackConfig({...slackConfig, enabled: checked})}
                  />
                  <Label htmlFor="enabled">Enable Slack Integration</Label>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose which events trigger Slack notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contact-forms">Contact Forms</Label>
                      <p className="text-sm text-gray-600">New contact form submissions</p>
                    </div>
                    <Switch
                      id="contact-forms"
                      checked={slackConfig.notifications.contact_forms}
                      onCheckedChange={(checked) => setSlackConfig({
                        ...slackConfig,
                        notifications: {...slackConfig.notifications, contact_forms: checked}
                      })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="user-registrations">User Registrations</Label>
                      <p className="text-sm text-gray-600">New user sign-ups</p>
                    </div>
                    <Switch
                      id="user-registrations"
                      checked={slackConfig.notifications.user_registrations}
                      onCheckedChange={(checked) => setSlackConfig({
                        ...slackConfig,
                        notifications: {...slackConfig.notifications, user_registrations: checked}
                      })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="job-applications">Job Applications</Label>
                      <p className="text-sm text-gray-600">New job applications</p>
                    </div>
                    <Switch
                      id="job-applications"
                      checked={slackConfig.notifications.job_applications}
                      onCheckedChange={(checked) => setSlackConfig({
                        ...slackConfig,
                        notifications: {...slackConfig.notifications, job_applications: checked}
                      })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-alerts">System Alerts</Label>
                      <p className="text-sm text-gray-600">System errors and warnings</p>
                    </div>
                    <Switch
                      id="system-alerts"
                      checked={slackConfig.notifications.system_alerts}
                      onCheckedChange={(checked) => setSlackConfig({
                        ...slackConfig,
                        notifications: {...slackConfig.notifications, system_alerts: checked}
                      })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="payment-notifications">Payment Notifications</Label>
                      <p className="text-sm text-gray-600">Payment and subscription updates</p>
                    </div>
                    <Switch
                      id="payment-notifications"
                      checked={slackConfig.notifications.payment_notifications}
                      onCheckedChange={(checked) => setSlackConfig({
                        ...slackConfig,
                        notifications: {...slackConfig.notifications, payment_notifications: checked}
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>How to configure Slack webhook for RemoteHive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">1. Create a Slack App</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                      api.slack.com/apps <ExternalLink className="w-3 h-3 ml-1" />
                    </a> and create a new app for your workspace.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">2. Enable Incoming Webhooks</h4>
                  <p className="text-sm text-gray-600">
                    In your app settings, go to "Incoming Webhooks" and activate them. Then create a new webhook for your desired channel.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">3. Copy Webhook URL</h4>
                  <p className="text-sm text-gray-600">
                    Copy the webhook URL and paste it in the configuration above. Make sure to keep it secure!
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">4. Test Integration</h4>
                  <p className="text-sm text-gray-600">
                    Use the "Test Integration" button to verify that messages are being sent correctly to your Slack channel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Contact Submissions</CardTitle>
                <CardDescription>Recent contact form submissions</CardDescription>
                
                {/* Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSubmission?.id === submission.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{submission.name}</div>
                            <div className="text-xs text-gray-600 truncate">{submission.subject}</div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={`text-xs ${getStatusColor(submission.status)}`}>
                                {submission.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(submission.priority)}`}>
                                {submission.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredSubmissions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No contact submissions found.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedSubmission ? `Chat with ${selectedSubmission.name}` : 'Select a Contact'}
                </CardTitle>
                <CardDescription>
                  {selectedSubmission ? `${selectedSubmission.email} • ${selectedSubmission.inquiry_type}` : 'Choose a contact submission to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSubmission ? (
                  <div className="space-y-6">
                    {/* Contact Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Name:</span>
                          <span className="text-sm">{selectedSubmission.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Email:</span>
                          <span className="text-sm">{selectedSubmission.email}</span>
                        </div>
                        {selectedSubmission.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Phone:</span>
                            <span className="text-sm">{selectedSubmission.phone}</span>
                          </div>
                        )}
                        {selectedSubmission.company_name && (
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Company:</span>
                            <span className="text-sm">{selectedSubmission.company_name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Submitted:</span>
                          <span className="text-sm">{new Date(selectedSubmission.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Type:</span>
                          <span className="text-sm">{selectedSubmission.inquiry_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Original Message */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Original Message</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="font-medium text-sm mb-2">{selectedSubmission.subject}</div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSubmission.message}</div>
                      </div>
                    </div>

                    {/* Slack Notification Status */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Slack Notification</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Notification sent to {slackConfig.channel_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Sent at {new Date(selectedSubmission.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Button size="sm" className="flex items-center space-x-2">
                        <Send className="w-4 h-4" />
                        <span>Send to Slack</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <Edit className="w-4 h-4" />
                        <span>Update Status</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a contact submission to view details and chat history</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Message History Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Slack Message History</CardTitle>
                  <CardDescription>All messages sent to Slack from RemoteHive</CardDescription>
                </div>
                <Button
                  onClick={loadSlackMessages}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slackMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getMessageStatusIcon(message.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{message.title}</h4>
                            <Badge variant="outline" className={`text-xs ${
                              message.type === 'contact_form' ? 'border-blue-200 text-blue-800' :
                              message.type === 'system' ? 'border-green-200 text-green-800' :
                              'border-gray-200 text-gray-800'
                            }`}>
                              {message.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{new Date(message.timestamp).toLocaleString()}</span>
                            {message.submission_id && (
                              <span>Submission ID: {message.submission_id}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {slackMessages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages sent yet</p>
                    <p className="text-sm">Messages will appear here when notifications are sent to Slack</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}