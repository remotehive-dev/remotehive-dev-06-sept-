'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Clock,
  Shield,
  Bell,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Globe,
  Server,
  Mail,
  Slack,
  Webhook
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';
import { autoScraperApi } from '@/lib/api';

interface SystemSettings {
  // Rate Limiting
  globalRateLimit: number;
  requestsPerMinute: number;
  burstLimit: number;
  cooldownPeriod: number;
  
  // Retry Policy
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryOnErrors: string[];
  
  // Performance
  maxConcurrentJobs: number;
  jobTimeout: number;
  memoryLimit: number;
  diskSpaceThreshold: number;
  
  // Data Management
  dataRetentionDays: number;
  autoCleanup: boolean;
  compressOldData: boolean;
  backupEnabled: boolean;
  
  // Notifications
  emailNotifications: boolean;
  slackNotifications: boolean;
  webhookNotifications: boolean;
  notificationThresholds: {
    errorRate: number;
    successRate: number;
    queueSize: number;
  };
  
  // Monitoring
  healthCheckInterval: number;
  metricsRetention: number;
  logLevel: string;
  enableDebugMode: boolean;
  
  // Security
  apiKeyRotation: boolean;
  encryptData: boolean;
  auditLogging: boolean;
  ipWhitelist: string[];
}

const defaultSettings: SystemSettings = {
  // Rate Limiting
  globalRateLimit: 100,
  requestsPerMinute: 60,
  burstLimit: 10,
  cooldownPeriod: 300,
  
  // Retry Policy
  maxRetries: 3,
  retryDelay: 5000,
  exponentialBackoff: true,
  retryOnErrors: ['TIMEOUT', 'CONNECTION_ERROR', 'RATE_LIMITED'],
  
  // Performance
  maxConcurrentJobs: 5,
  jobTimeout: 300000,
  memoryLimit: 1024,
  diskSpaceThreshold: 85,
  
  // Data Management
  dataRetentionDays: 90,
  autoCleanup: true,
  compressOldData: true,
  backupEnabled: true,
  
  // Notifications
  emailNotifications: true,
  slackNotifications: false,
  webhookNotifications: false,
  notificationThresholds: {
    errorRate: 10,
    successRate: 80,
    queueSize: 100
  },
  
  // Monitoring
  healthCheckInterval: 30,
  metricsRetention: 30,
  logLevel: 'info',
  enableDebugMode: false,
  
  // Security
  apiKeyRotation: true,
  encryptData: true,
  auditLogging: true,
  ipWhitelist: []
};

export function AutoScraperSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState('');

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await autoScraperApi.getSettings();
        setSettings(response.data || defaultSettings);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError('Failed to load settings');
        setSettings(defaultSettings); // Fallback to default settings
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    if (!settings) return;
    setSettings(prev => prev ? ({ ...prev, [key]: value }) : null);
    setHasChanges(true);
  };

  const updateNestedSetting = <K extends keyof SystemSettings['notificationThresholds']>(
    parentKey: 'notificationThresholds',
    key: K,
    value: SystemSettings['notificationThresholds'][K]
  ) => {
    if (!settings) return;
    setSettings(prev => prev ? ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [key]: value
      }
    }) : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await autoScraperApi.updateSettings(settings);
      setHasChanges(false);
      setError(null);
      // Show success notification
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await autoScraperApi.resetSettings();
      const response = await autoScraperApi.getSettings();
      setSettings(response.data || defaultSettings);
      setHasChanges(false);
      setError(null);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setError('Failed to reset settings');
      setSettings(defaultSettings);
      setHasChanges(true);
    } finally {
      setLoading(false);
    }
  };

  const addIpAddress = () => {
    if (newIpAddress && settings && !settings.ipWhitelist.includes(newIpAddress)) {
      updateSetting('ipWhitelist', [...settings.ipWhitelist, newIpAddress]);
      setNewIpAddress('');
    }
  };

  const removeIpAddress = (ip: string) => {
    if (settings) {
      updateSetting('ipWhitelist', settings.ipWhitelist.filter(addr => addr !== ip));
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 text-blue-500"
        >
          <Settings className="w-8 h-8" />
        </motion.div>
        <span className="ml-3 text-slate-400">Loading settings...</span>
      </div>
    );
  }

  // Show error state
  if (error && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Settings</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AutoScraper Settings</h2>
          <p className="text-slate-400">Configure system-wide scraping parameters and policies</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-600">
              Unsaved Changes
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" className="bg-red-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {error}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving || loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-2"
              >
                <Settings className="w-4 h-4" />
              </motion.div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rate-limiting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800">
          <TabsTrigger value="rate-limiting" className="data-[state=active]:bg-slate-700">
            <Clock className="w-4 h-4 mr-2" />
            Rate Limiting
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-slate-700">
            <Database className="w-4 h-4 mr-2" />
            Data
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-slate-700">
            <Server className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Rate Limiting Tab */}
        <TabsContent value="rate-limiting">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Global Rate Limits</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Global Rate Limit (req/hour)</Label>
                  <Input
                    type="number"
                    value={settings.globalRateLimit}
                    onChange={(e) => updateSetting('globalRateLimit', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Requests Per Minute</Label>
                  <Input
                    type="number"
                    value={settings.requestsPerMinute}
                    onChange={(e) => updateSetting('requestsPerMinute', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Burst Limit</Label>
                  <Input
                    type="number"
                    value={settings.burstLimit}
                    onChange={(e) => updateSetting('burstLimit', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Cooldown Period (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.cooldownPeriod}
                    onChange={(e) => updateSetting('cooldownPeriod', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Retry Policy</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Max Retries</Label>
                  <Input
                    type="number"
                    value={settings.maxRetries}
                    onChange={(e) => updateSetting('maxRetries', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Retry Delay (ms)</Label>
                  <Input
                    type="number"
                    value={settings.retryDelay}
                    onChange={(e) => updateSetting('retryDelay', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.exponentialBackoff}
                    onCheckedChange={(checked) => updateSetting('exponentialBackoff', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Exponential Backoff</Label>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Execution Limits</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Max Concurrent Jobs</Label>
                  <Input
                    type="number"
                    value={settings.maxConcurrentJobs}
                    onChange={(e) => updateSetting('maxConcurrentJobs', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Job Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={settings.jobTimeout}
                    onChange={(e) => updateSetting('jobTimeout', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Memory Limit (MB)</Label>
                  <Input
                    type="number"
                    value={settings.memoryLimit}
                    onChange={(e) => updateSetting('memoryLimit', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Disk Space Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.diskSpaceThreshold}
                    onChange={(e) => updateSetting('diskSpaceThreshold', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Data Retention</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Data Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.autoCleanup}
                    onCheckedChange={(checked) => updateSetting('autoCleanup', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Auto Cleanup</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.compressOldData}
                    onCheckedChange={(checked) => updateSetting('compressOldData', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Compress Old Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.backupEnabled}
                    onCheckedChange={(checked) => updateSetting('backupEnabled', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Enable Backups</Label>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Mail className="w-4 h-4 text-slate-400" />
                  <Label className="text-sm text-slate-300">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.slackNotifications}
                    onCheckedChange={(checked) => updateSetting('slackNotifications', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Slack className="w-4 h-4 text-slate-400" />
                  <Label className="text-sm text-slate-300">Slack Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.webhookNotifications}
                    onCheckedChange={(checked) => updateSetting('webhookNotifications', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Webhook className="w-4 h-4 text-slate-400" />
                  <Label className="text-sm text-slate-300">Webhook Notifications</Label>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Error Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.notificationThresholds.errorRate}
                    onChange={(e) => updateNestedSetting('notificationThresholds', 'errorRate', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Success Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.notificationThresholds.successRate}
                    onChange={(e) => updateNestedSetting('notificationThresholds', 'successRate', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Queue Size</Label>
                  <Input
                    type="number"
                    value={settings.notificationThresholds.queueSize}
                    onChange={(e) => updateNestedSetting('notificationThresholds', 'queueSize', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Monitoring</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Health Check Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.healthCheckInterval}
                    onChange={(e) => updateSetting('healthCheckInterval', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Metrics Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings.metricsRetention}
                    onChange={(e) => updateSetting('metricsRetention', parseInt(e.target.value))}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Log Level</Label>
                  <Select value={settings.logLevel} onValueChange={(value) => updateSetting('logLevel', value)}>
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.enableDebugMode}
                    onCheckedChange={(checked) => updateSetting('enableDebugMode', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Enable Debug Mode</Label>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.apiKeyRotation}
                    onCheckedChange={(checked) => updateSetting('apiKeyRotation', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">API Key Rotation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.encryptData}
                    onCheckedChange={(checked) => updateSetting('encryptData', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Encrypt Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="text-sm text-slate-300">Audit Logging</Label>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">IP Whitelist</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter IP address"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Button onClick={addIpAddress} size="sm">
                    Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {settings.ipWhitelist.map((ip, index) => (
                    <div key={`ip-${ip}-${index}`} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                      <span className="text-sm text-white">{ip}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeIpAddress(ip)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                {settings.ipWhitelist.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No IP addresses whitelisted
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}