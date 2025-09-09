'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Database,
  Globe,
  Bell,
  Users,
  Briefcase,
  Search,
  DollarSign,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const SettingCard = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  badge 
}: {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
  badge?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            {badge && <Badge variant="outline">{badge}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'RemoteHive',
    siteDescription: 'Find your perfect remote job',
    contactEmail: 'admin@remotehive.in',
    supportEmail: 'support@remotehive.com',
    
    // Security Settings
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    
    // Job Settings
    autoApproveJobs: false,
    jobExpiryDays: '30',
    maxJobsPerEmployer: '50',
    requireJobApproval: true,
    
    // Scraper Settings
    scraperEnabled: true,
    scraperInterval: '60',
    maxScraperJobs: '1000',
    scraperApiKey: 'sk-1234567890abcdef',
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    emailFromName: 'RemoteHive',
    emailFromAddress: 'noreply@remotehive.com',
    
    // Notification Settings
    emailNotifications: true,
    newJobAlerts: true,
    applicationAlerts: true,
    systemAlerts: true,
    
    // Payment Settings
    jobPostingFee: '99',
    featuredJobFee: '199',
    premiumListingFee: '299',
    currency: 'USD'
  });

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
  };

  const handleReset = () => {
    // Reset to defaults logic here
    console.log('Resetting settings to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex space-x-2">
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

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <SettingCard
          title="General Settings"
          description="Basic platform configuration and branding"
          icon={SettingsIcon}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <Input
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
              />
            </div>
          </div>
        </SettingCard>

        {/* Security Settings */}
        <SettingCard
          title="Security Settings"
          description="Authentication and security configuration"
          icon={Shield}
          badge="Critical"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
              <Input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({...settings, maxLoginAttempts: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Require Email Verification</span>
                <Button
                  variant={settings.requireEmailVerification ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({...settings, requireEmailVerification: !settings.requireEmailVerification})}
                >
                  {settings.requireEmailVerification ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable Two-Factor Authentication</span>
                <Button
                  variant={settings.enableTwoFactor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({...settings, enableTwoFactor: !settings.enableTwoFactor})}
                >
                  {settings.enableTwoFactor ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Job Management Settings */}
        <SettingCard
          title="Job Management"
          description="Configure job posting and approval settings"
          icon={Briefcase}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Expiry (days)</label>
              <Input
                type="number"
                value={settings.jobExpiryDays}
                onChange={(e) => setSettings({...settings, jobExpiryDays: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Jobs per Employer</label>
              <Input
                type="number"
                value={settings.maxJobsPerEmployer}
                onChange={(e) => setSettings({...settings, maxJobsPerEmployer: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-approve Job Posts</span>
                <Button
                  variant={settings.autoApproveJobs ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({...settings, autoApproveJobs: !settings.autoApproveJobs})}
                >
                  {settings.autoApproveJobs ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Require Job Approval</span>
                <Button
                  variant={settings.requireJobApproval ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({...settings, requireJobApproval: !settings.requireJobApproval})}
                >
                  {settings.requireJobApproval ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Scraper Settings */}
        <SettingCard
          title="Job Scraper"
          description="Configure automated job scraping settings"
          icon={Search}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Scraper Interval (minutes)</label>
              <Input
                type="number"
                value={settings.scraperInterval}
                onChange={(e) => setSettings({...settings, scraperInterval: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Jobs per Run</label>
              <Input
                type="number"
                value={settings.maxScraperJobs}
                onChange={(e) => setSettings({...settings, maxScraperJobs: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">API Key</label>
              <div className="flex space-x-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={settings.scraperApiKey}
                  onChange={(e) => setSettings({...settings, scraperApiKey: e.target.value})}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable Job Scraper</span>
                <Button
                  variant={settings.scraperEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings({...settings, scraperEnabled: !settings.scraperEnabled})}
                >
                  {settings.scraperEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Email Settings */}
        <SettingCard
          title="Email Configuration"
          description="SMTP settings for sending emails"
          icon={Mail}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Host</label>
              <Input
                value={settings.smtpHost}
                onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Port</label>
              <Input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From Name</label>
              <Input
                value={settings.emailFromName}
                onChange={(e) => setSettings({...settings, emailFromName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From Address</label>
              <Input
                type="email"
                value={settings.emailFromAddress}
                onChange={(e) => setSettings({...settings, emailFromAddress: e.target.value})}
              />
            </div>
          </div>
        </SettingCard>

        {/* Payment Settings */}
        <SettingCard
          title="Payment Settings"
          description="Configure pricing and payment options"
          icon={DollarSign}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Posting Fee ($)</label>
              <Input
                type="number"
                value={settings.jobPostingFee}
                onChange={(e) => setSettings({...settings, jobPostingFee: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Featured Job Fee ($)</label>
              <Input
                type="number"
                value={settings.featuredJobFee}
                onChange={(e) => setSettings({...settings, featuredJobFee: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Premium Listing Fee ($)</label>
              <Input
                type="number"
                value={settings.premiumListingFee}
                onChange={(e) => setSettings({...settings, premiumListingFee: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <Input
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
              />
            </div>
          </div>
        </SettingCard>

        {/* Notification Settings */}
        <SettingCard
          title="Notifications"
          description="Configure system and user notifications"
          icon={Bell}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Notifications</span>
              <Button
                variant={settings.emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
              >
                {settings.emailNotifications ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Job Alerts</span>
              <Button
                variant={settings.newJobAlerts ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings({...settings, newJobAlerts: !settings.newJobAlerts})}
              >
                {settings.newJobAlerts ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Application Alerts</span>
              <Button
                variant={settings.applicationAlerts ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings({...settings, applicationAlerts: !settings.applicationAlerts})}
              >
                {settings.applicationAlerts ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Alerts</span>
              <Button
                variant={settings.systemAlerts ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings({...settings, systemAlerts: !settings.systemAlerts})}
              >
                {settings.systemAlerts ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}