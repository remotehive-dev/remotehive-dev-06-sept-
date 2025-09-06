'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Users,
  Briefcase,
  FileText,
  Image,
  Code,
  Server,
  Lock,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Plus,
  Edit,
  Check,
  X,
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Target,
  BarChart3,
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  Type,
  Link,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';
import { AnimatedModal } from '@/components/ui/advanced/animated-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface SiteSettingsProps {
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock settings data
const initialSettings = {
  general: {
    siteName: 'RemoteHive',
    siteDescription: 'The premier platform for remote work opportunities',
    siteUrl: 'https://remotehive.com',
    adminEmail: 'admin@remotehive.in',
    supportEmail: 'support@remotehive.com',
    timezone: 'UTC',
    language: 'en',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true
  },
  platform: {
    maxJobPostsPerEmployer: 50,
    jobPostExpiryDays: 30,
    autoApproveJobs: false,
    autoApproveEmployers: false,
    allowGuestJobViewing: true,
    requireEmployerVerification: true,
    maxApplicationsPerJob: 1000,
    featuredJobPrice: 99,
    premiumEmployerPrice: 299,
    commissionRate: 5
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newUserWelcomeEmail: true,
    jobApplicationNotifications: true,
    employerApprovalNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
    systemAlerts: true
  },
  security: {
    twoFactorRequired: false,
    passwordMinLength: 8,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    ipWhitelist: [],
    apiRateLimit: 1000,
    encryptionEnabled: true,
    auditLogging: true,
    gdprCompliance: true
  },
  appearance: {
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    darkMode: false,
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    customCSS: '',
    fontFamily: 'Inter',
    borderRadius: 8
  },
  integrations: {
    googleAnalytics: {
      enabled: false,
      trackingId: ''
    },
    stripe: {
      enabled: true,
      publicKey: 'pk_test_...',
      webhookSecret: 'whsec_...'
    },
    sendgrid: {
      enabled: true,
      apiKey: 'SG.***'
    },
    slack: {
      enabled: false,
      webhookUrl: ''
    },
    linkedin: {
      enabled: false,
      clientId: '',
      clientSecret: ''
    }
  },
  seo: {
    metaTitle: 'RemoteHive - Find Your Perfect Remote Job',
    metaDescription: 'Discover thousands of remote job opportunities from top companies worldwide.',
    metaKeywords: 'remote jobs, work from home, telecommute, remote work',
    ogImage: '/og-image.png',
    twitterCard: 'summary_large_image',
    structuredData: true,
    sitemap: true,
    robotsTxt: true
  }
};

const emailTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to RemoteHive!',
    description: 'Sent to new users after registration',
    lastModified: new Date('2024-01-15')
  },
  {
    id: 'job_application',
    name: 'Job Application Confirmation',
    subject: 'Your application has been submitted',
    description: 'Sent when a job seeker applies for a job',
    lastModified: new Date('2024-01-10')
  },
  {
    id: 'employer_approval',
    name: 'Employer Approval',
    subject: 'Your employer account has been approved',
    description: 'Sent when an employer account is approved',
    lastModified: new Date('2024-01-08')
  },
  {
    id: 'job_posted',
    name: 'Job Posted Confirmation',
    subject: 'Your job posting is now live',
    description: 'Sent when a job post is approved and published',
    lastModified: new Date('2024-01-12')
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your RemoteHive password',
    description: 'Sent when user requests password reset',
    lastModified: new Date('2024-01-14')
  }
];

export function SiteSettings({ className }: SiteSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [selectedTab, setSelectedTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isEmailTemplateModalOpen, setIsEmailTemplateModalOpen] = useState(false);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<any>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleIntegrationChange = (integration: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [integration]: {
          ...prev.integrations[integration as keyof typeof prev.integrations],
          [key]: value
        }
      }
    }));
  };

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'All settings have been successfully updated.'
    });
  };

  const handleReset = () => {
    setSettings(initialSettings);
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to default values.'
    });
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remotehive-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsBackupModalOpen(false);
    toast({
      title: 'Backup Created',
      description: 'Settings backup has been downloaded.'
    });
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKey(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return key.substring(0, 8) + '***';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Site Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Configure platform settings, integrations, and preferences
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsBackupModalOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Backup
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => handleSettingChange('general', 'adminEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => handleSettingChange('general', 'timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={settings.general.language} onValueChange={(value) => handleSettingChange('general', 'language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Platform Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Temporarily disable public access</p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange('general', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>User Registration</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={settings.general.registrationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('general', 'registrationEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Verification Required</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    checked={settings.general.emailVerificationRequired}
                    onCheckedChange={(checked) => handleSettingChange('general', 'emailVerificationRequired', checked)}
                  />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Platform Settings */}
          <TabsContent value="platform" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxJobPosts">Max Job Posts per Employer</Label>
                  <Input
                    id="maxJobPosts"
                    type="number"
                    value={settings.platform.maxJobPostsPerEmployer}
                    onChange={(e) => handleSettingChange('platform', 'maxJobPostsPerEmployer', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobExpiry">Job Post Expiry (Days)</Label>
                  <Input
                    id="jobExpiry"
                    type="number"
                    value={settings.platform.jobPostExpiryDays}
                    onChange={(e) => handleSettingChange('platform', 'jobPostExpiryDays', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxApplications">Max Applications per Job</Label>
                  <Input
                    id="maxApplications"
                    type="number"
                    value={settings.platform.maxApplicationsPerJob}
                    onChange={(e) => handleSettingChange('platform', 'maxApplicationsPerJob', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featuredPrice">Featured Job Price ($)</Label>
                  <Input
                    id="featuredPrice"
                    type="number"
                    value={settings.platform.featuredJobPrice}
                    onChange={(e) => handleSettingChange('platform', 'featuredJobPrice', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Approval Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve Job Posts</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Automatically approve new job posts</p>
                  </div>
                  <Switch
                    checked={settings.platform.autoApproveJobs}
                    onCheckedChange={(checked) => handleSettingChange('platform', 'autoApproveJobs', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve Employers</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Automatically approve new employer accounts</p>
                  </div>
                  <Switch
                    checked={settings.platform.autoApproveEmployers}
                    onCheckedChange={(checked) => handleSettingChange('platform', 'autoApproveEmployers', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Employer Verification</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Require verification for employer accounts</p>
                  </div>
                  <Switch
                    checked={settings.platform.requireEmployerVerification}
                    onCheckedChange={(checked) => handleSettingChange('platform', 'requireEmployerVerification', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Guest Job Viewing</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Allow non-registered users to view jobs</p>
                  </div>
                  <Switch
                    checked={settings.platform.allowGuestJobViewing}
                    onCheckedChange={(checked) => handleSettingChange('platform', 'allowGuestJobViewing', checked)}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pricing & Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="premiumPrice">Premium Employer Price ($)</Label>
                  <Input
                    id="premiumPrice"
                    type="number"
                    value={settings.platform.premiumEmployerPrice}
                    onChange={(e) => handleSettingChange('platform', 'premiumEmployerPrice', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    value={settings.platform.commissionRate}
                    onChange={(e) => handleSettingChange('platform', 'commissionRate', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notification Channels</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send notifications via SMS</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'smsNotifications', checked)}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notification Types</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New User Welcome Email</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send welcome email to new users</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newUserWelcomeEmail}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'newUserWelcomeEmail', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Job Application Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Notify employers of new applications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.jobApplicationNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'jobApplicationNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Employer Approval Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Notify when employer accounts are approved</p>
                  </div>
                  <Switch
                    checked={settings.notifications.employerApprovalNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'employerApprovalNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send weekly platform summary</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyDigest}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'weeklyDigest', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send promotional and marketing emails</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'marketingEmails', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Alerts</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send system and security alerts</p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'systemAlerts', checked)}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Email Templates</h3>
              <div className="space-y-4">
                {emailTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{template.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Last modified: {template.lastModified.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{template.subject}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmailTemplate(template);
                          setIsEmailTemplateModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Authentication</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (Hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API Rate Limit (per hour)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={settings.security.apiRateLimit}
                    onChange={(e) => handleSettingChange('security', 'apiRateLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication Required</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorRequired', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Encryption Enabled</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enable data encryption at rest</p>
                  </div>
                  <Switch
                    checked={settings.security.encryptionEnabled}
                    onCheckedChange={(checked) => handleSettingChange('security', 'encryptionEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Log all admin actions</p>
                  </div>
                  <Switch
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) => handleSettingChange('security', 'auditLogging', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>GDPR Compliance</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enable GDPR compliance features</p>
                  </div>
                  <Switch
                    checked={settings.security.gdprCompliance}
                    onCheckedChange={(checked) => handleSettingChange('security', 'gdprCompliance', checked)}
                  />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Brand Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.appearance.secondaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'secondaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.appearance.secondaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'secondaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.appearance.accentColor}
                      onChange={(e) => handleSettingChange('appearance', 'accentColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.appearance.accentColor}
                      onChange={(e) => handleSettingChange('appearance', 'accentColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Typography & Layout</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select value={settings.appearance.fontFamily} onValueChange={(value) => handleSettingChange('appearance', 'fontFamily', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius (px)</Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    value={settings.appearance.borderRadius}
                    onChange={(e) => handleSettingChange('appearance', 'borderRadius', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enable dark mode by default</p>
                  </div>
                  <Switch
                    checked={settings.appearance.darkMode}
                    onCheckedChange={(checked) => handleSettingChange('appearance', 'darkMode', checked)}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Brand Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.appearance.logoUrl}
                    onChange={(e) => handleSettingChange('appearance', 'logoUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={settings.appearance.faviconUrl}
                    onChange={(e) => handleSettingChange('appearance', 'faviconUrl', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={settings.appearance.customCSS}
                  onChange={(e) => handleSettingChange('appearance', 'customCSS', e.target.value)}
                  rows={6}
                  placeholder="/* Add your custom CSS here */"
                />
              </div>
            </GlassCard>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            {Object.entries(settings.integrations).map(([key, integration]) => (
              <GlassCard key={key} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <Switch
                    checked={integration.enabled}
                    onCheckedChange={(checked) => handleIntegrationChange(key, 'enabled', checked)}
                  />
                </div>
                {integration.enabled && (
                  <div className="space-y-4">
                    {Object.entries(integration).map(([field, value]) => {
                      if (field === 'enabled') return null;
                      const isSecret = field.toLowerCase().includes('secret') || field.toLowerCase().includes('key');
                      return (
                        <div key={field} className="space-y-2">
                          <Label htmlFor={`${key}-${field}`} className="capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id={`${key}-${field}`}
                              type={isSecret && !showApiKey[`${key}-${field}`] ? 'password' : 'text'}
                              value={isSecret && !showApiKey[`${key}-${field}`] ? maskApiKey(value as string) : value as string}
                              onChange={(e) => handleIntegrationChange(key, field, e.target.value)}
                              className="flex-1"
                            />
                            {isSecret && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleApiKeyVisibility(`${key}-${field}`)}
                              >
                                {showApiKey[`${key}-${field}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            ))}
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Meta Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={settings.seo.metaTitle}
                    onChange={(e) => handleSettingChange('seo', 'metaTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={settings.seo.metaDescription}
                    onChange={(e) => handleSettingChange('seo', 'metaDescription', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={settings.seo.metaKeywords}
                    onChange={(e) => handleSettingChange('seo', 'metaKeywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ogImage">Open Graph Image URL</Label>
                  <Input
                    id="ogImage"
                    value={settings.seo.ogImage}
                    onChange={(e) => handleSettingChange('seo', 'ogImage', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterCard">Twitter Card Type</Label>
                  <Select value={settings.seo.twitterCard} onValueChange={(value) => handleSettingChange('seo', 'twitterCard', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                      <SelectItem value="app">App</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Technical SEO</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Structured Data</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enable JSON-LD structured data</p>
                  </div>
                  <Switch
                    checked={settings.seo.structuredData}
                    onCheckedChange={(checked) => handleSettingChange('seo', 'structuredData', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>XML Sitemap</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Generate XML sitemap automatically</p>
                  </div>
                  <Switch
                    checked={settings.seo.sitemap}
                    onCheckedChange={(checked) => handleSettingChange('seo', 'sitemap', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Robots.txt</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Generate robots.txt file</p>
                  </div>
                  <Switch
                    checked={settings.seo.robotsTxt}
                    onCheckedChange={(checked) => handleSettingChange('seo', 'robotsTxt', checked)}
                  />
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Email Template Modal */}
      <AnimatedModal
        isOpen={isEmailTemplateModalOpen}
        onClose={() => setIsEmailTemplateModalOpen(false)}
        title={`Edit ${selectedEmailTemplate?.name}`}
        size="lg"
      >
        {selectedEmailTemplate && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateSubject">Subject</Label>
              <Input
                id="templateSubject"
                defaultValue={selectedEmailTemplate.subject}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateContent">Content</Label>
              <Textarea
                id="templateContent"
                rows={10}
                placeholder="Email template content..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEmailTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setIsEmailTemplateModalOpen(false);
                toast({ title: 'Template Updated', description: 'Email template has been saved.' });
              }}>
                Save Template
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Backup Modal */}
      <AnimatedModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Create Settings Backup"
        variant="info"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            This will create a backup of all your current settings that can be imported later.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsBackupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
          </div>
        </div>
      </AnimatedModal>

      {/* Import Modal */}
      <AnimatedModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Settings"
        variant="warning"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Import settings from a backup file. This will overwrite your current settings.
          </p>
          <div className="space-y-2">
            <Label htmlFor="importFile">Select Backup File</Label>
            <Input
              id="importFile"
              type="file"
              accept=".json"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsImportModalOpen(false);
              toast({ title: 'Settings Imported', description: 'Settings have been imported successfully.' });
            }}>
              <Upload className="w-4 h-4 mr-2" />
              Import Settings
            </Button>
          </div>
        </div>
      </AnimatedModal>
    </motion.div>
  );
}