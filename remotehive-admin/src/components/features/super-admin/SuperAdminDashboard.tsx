'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Building2,
  Briefcase,
  Settings,
  Bell,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Send,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Database,
  Server,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  MessageSquare,
  Mail
} from 'lucide-react';
import { GlassCard, StatsCard } from '@/components/ui/advanced/glass-card';
import { AnimatedModal } from '@/components/ui/advanced/animated-modal';
import { DataTable } from '@/components/ui/advanced/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface SuperAdminDashboardProps {
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

// Mock data for platform oversight
const platformStats = {
  totalUsers: 1247,
  activeUsers: 245,
  totalEmployers: 89,
  pendingEmployers: 12,
  totalJobPosts: 156,
  pendingJobPosts: 8,
  flaggedContent: 3,
  systemHealth: 98.5,
  serverUptime: 99.9,
  apiResponseTime: 145
};

const pendingApprovals = [
  {
    id: '1',
    type: 'employer',
    name: 'TechCorp Inc.',
    email: 'contact@techcorp.com',
    submittedAt: new Date(Date.now() - 3600000),
    status: 'pending',
    priority: 'high'
  },
  {
    id: '2',
    type: 'job_post',
    name: 'Senior React Developer',
    company: 'StartupXYZ',
    submittedAt: new Date(Date.now() - 7200000),
    status: 'pending',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'employer',
    name: 'InnovateLab',
    email: 'hr@innovatelab.com',
    submittedAt: new Date(Date.now() - 10800000),
    status: 'pending',
    priority: 'low'
  }
];

const systemAlerts = [
  {
    id: '1',
    type: 'warning',
    title: 'High API Usage',
    message: 'API usage is approaching the daily limit',
    timestamp: new Date(Date.now() - 1800000),
    severity: 'medium'
  },
  {
    id: '2',
    type: 'info',
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight at 2 AM',
    timestamp: new Date(Date.now() - 3600000),
    severity: 'low'
  },
  {
    id: '3',
    type: 'error',
    title: 'Payment Gateway Issue',
    message: 'Payment processing experiencing delays',
    timestamp: new Date(Date.now() - 5400000),
    severity: 'high'
  }
];

const recentActions = [
  {
    id: '1',
    action: 'Approved employer registration',
    target: 'TechCorp Inc.',
    admin: 'Super Admin',
    timestamp: new Date(Date.now() - 900000)
  },
  {
    id: '2',
    action: 'Rejected job post',
    target: 'Spam Job Listing',
    admin: 'Super Admin',
    timestamp: new Date(Date.now() - 1800000)
  },
  {
    id: '3',
    action: 'Updated platform settings',
    target: 'Email Templates',
    admin: 'Super Admin',
    timestamp: new Date(Date.now() - 2700000)
  }
];

export function SuperAdminDashboard({ className }: SuperAdminDashboardProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [systemModal, setSystemModal] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '', type: 'info' });

  const handleApproval = (id: string, action: 'approve' | 'reject') => {
    toast({
      title: action === 'approve' ? 'Approved' : 'Rejected',
      description: `Item ${id} has been ${action}d successfully.`,
      variant: action === 'approve' ? 'default' : 'destructive'
    });
  };

  const handleSendAnnouncement = () => {
    toast({
      title: 'Announcement Sent',
      description: 'Platform announcement has been sent to all users.'
    });
    setAnnouncementModal(false);
    setAnnouncement({ title: '', message: '', type: 'info' });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
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
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Super Admin Control Panel
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Platform oversight and administrative controls
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setAnnouncementModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
            <Button
              variant="outline"
              onClick={() => setSystemModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Critical Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="System Health"
          value={`${platformStats.systemHealth}%`}
          change={0.5}
          trend="up"
          icon={Server}
          description="Overall platform status"
          variant="success"
        />
        <StatsCard
          title="Pending Approvals"
          value={platformStats.pendingEmployers + platformStats.pendingJobPosts}
          change={-2}
          trend="down"
          icon={Clock}
          description="Awaiting review"
          variant="warning"
        />
        <StatsCard
          title="Flagged Content"
          value={platformStats.flaggedContent}
          change={1}
          trend="up"
          icon={AlertTriangle}
          description="Requires attention"
          variant="error"
        />
        <StatsCard
          title="API Response"
          value={`${platformStats.apiResponseTime}ms`}
          change={-5.2}
          trend="down"
          icon={BarChart3}
          description="Average response time"
        />
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Alerts */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    System Alerts
                  </h3>
                  <Badge variant="destructive">{systemAlerts.length}</Badge>
                </div>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => {
                    const Icon = getAlertIcon(alert.type);
                    return (
                      <div key={alert.id} className={`p-3 rounded-lg ${getAlertColor(alert.severity)}`}>
                        <div className="flex items-start space-x-3">
                          <Icon className="w-5 h-5 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {alert.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {alert.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {alert.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Recent Admin Actions */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Recent Actions
                  </h3>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentActions.map((action) => (
                    <div key={action.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {action.action}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Target: {action.target} • By: {action.admin}
                        </p>
                        <p className="text-xs text-slate-500">
                          {action.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pending Approvals
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)}`} />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {item.type === 'employer' ? `Email: ${item.email}` : `Company: ${item.company}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted: {item.submittedAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{item.type}</Badge>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                          {item.priority}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproval(item.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(item.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Server Status</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Uptime</span>
                    <span className="text-sm font-medium">{platformStats.serverUptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Response Time</span>
                    <span className="text-sm font-medium">{platformStats.apiResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Health Score</span>
                    <span className="text-sm font-medium">{platformStats.systemHealth}%</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Database</h3>
                  <Database className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Connections</span>
                    <span className="text-sm font-medium">45/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Query Time</span>
                    <span className="text-sm font-medium">12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Storage</span>
                    <span className="text-sm font-medium">2.4GB</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Security</h3>
                  <Lock className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Failed Logins</span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Blocked IPs</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">SSL Status</span>
                    <span className="text-sm font-medium text-green-500">Active</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Platform Controls
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">User Registration</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Allow new user signups</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Job Post Approval</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Require admin approval for job posts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Enable platform maintenance</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Users className="w-5 h-5" />
                    <span className="text-sm">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm">Manage Employers</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Briefcase className="w-5 h-5" />
                    <span className="text-sm">Job Posts</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm">Analytics</span>
                  </Button>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Announcement Modal */}
      <AnimatedModal
        isOpen={announcementModal}
        onClose={() => setAnnouncementModal(false)}
        title="Send Platform Announcement"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              placeholder="Announcement title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              value={announcement.message}
              onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
              placeholder="Announcement message..."
              rows={4}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAnnouncementModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAnnouncement}>
              <Send className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </div>
        </div>
      </AnimatedModal>
    </motion.div>
  );
}