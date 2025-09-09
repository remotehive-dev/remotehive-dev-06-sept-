import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Users, 
  Building, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Eye, 
  EyeOff, 
  Key, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Link, 
  ExternalLink, 
  Copy, 
  Share, 
  Archive, 
  FileText, 
  Calendar, 
  Clock, 
  Zap, 
  Target, 
  Award, 
  TrendingUp, 
  Activity, 
  BarChart, 
  PieChart, 
  Filter, 
  Search, 
  Plus, 
  Minus, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Star, 
  Heart, 
  Bookmark, 
  Flag, 
  Tag, 
  Folder, 
  Database, 
  Server, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  HardDrive, 
  Cloud, 
  CloudOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface CompanyProfile {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  founded: string;
  website: string;
  headquarters: string;
  logo?: string;
  cover_image?: string;
  social_links: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  benefits: string[];
  culture: string[];
  tech_stack: string[];
}

interface NotificationSettings {
  email_notifications: {
    new_applications: boolean;
    interview_reminders: boolean;
    candidate_messages: boolean;
    job_expiry: boolean;
    weekly_reports: boolean;
    system_updates: boolean;
  };
  push_notifications: {
    new_applications: boolean;
    interview_reminders: boolean;
    candidate_messages: boolean;
    urgent_alerts: boolean;
  };
  sms_notifications: {
    interview_reminders: boolean;
    urgent_alerts: boolean;
  };
  notification_frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

interface SecuritySettings {
  two_factor_auth: {
    enabled: boolean;
    method: 'sms' | 'email' | 'authenticator';
  };
  login_alerts: boolean;
  session_timeout: number; // in minutes
  ip_whitelist: string[];
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    expiry_days: number;
  };
  data_retention: {
    candidate_data: number; // in months
    application_data: number;
    interview_recordings: number;
  };
}

interface BillingSettings {
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    current_period_start: string;
    current_period_end: string;
    auto_renew: boolean;
  };
  payment_method: {
    type: 'card' | 'bank' | 'paypal';
    last_four: string;
    expiry: string;
    brand: string;
  };
  billing_history: {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    invoice_url: string;
  }[];
  usage: {
    job_posts: { used: number; limit: number };
    candidate_views: { used: number; limit: number };
    team_members: { used: number; limit: number };
    storage: { used: number; limit: number };
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  last_login: string;
  permissions: {
    manage_jobs: boolean;
    view_candidates: boolean;
    schedule_interviews: boolean;
    manage_team: boolean;
    view_analytics: boolean;
    manage_billing: boolean;
  };
  avatar?: string;
  joined_date: string;
}

const EmployerSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Mock data
  const mockCompanyProfile: CompanyProfile = {
    id: 'company_1',
    name: 'TechCorp Solutions',
    description: 'Leading technology company specializing in innovative software solutions for modern businesses.',
    industry: 'Technology',
    size: '51-200 employees',
    founded: '2015',
    website: 'https://techcorp.com',
    headquarters: 'San Francisco, CA',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
    cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    social_links: {
      linkedin: 'https://linkedin.com/company/techcorp',
      twitter: 'https://twitter.com/techcorp',
      github: 'https://github.com/techcorp'
    },
    contact: {
      email: 'contact@techcorp.com',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, San Francisco, CA 94105'
    },
    benefits: ['Health Insurance', 'Remote Work', 'Flexible Hours', 'Stock Options', 'Learning Budget'],
    culture: ['Innovation', 'Collaboration', 'Work-Life Balance', 'Continuous Learning'],
    tech_stack: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes']
  };

  const mockNotificationSettings: NotificationSettings = {
    email_notifications: {
      new_applications: true,
      interview_reminders: true,
      candidate_messages: true,
      job_expiry: true,
      weekly_reports: false,
      system_updates: true
    },
    push_notifications: {
      new_applications: true,
      interview_reminders: true,
      candidate_messages: false,
      urgent_alerts: true
    },
    sms_notifications: {
      interview_reminders: false,
      urgent_alerts: true
    },
    notification_frequency: 'instant',
    quiet_hours: {
      enabled: true,
      start_time: '22:00',
      end_time: '08:00'
    }
  };

  const mockSecuritySettings: SecuritySettings = {
    two_factor_auth: {
      enabled: true,
      method: 'authenticator'
    },
    login_alerts: true,
    session_timeout: 480,
    ip_whitelist: [],
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false,
      expiry_days: 90
    },
    data_retention: {
      candidate_data: 24,
      application_data: 12,
      interview_recordings: 6
    }
  };

  const mockBillingSettings: BillingSettings = {
    subscription: {
      plan: 'professional',
      status: 'active',
      current_period_start: '2024-01-01T00:00:00Z',
      current_period_end: '2024-02-01T00:00:00Z',
      auto_renew: true
    },
    payment_method: {
      type: 'card',
      last_four: '4242',
      expiry: '12/25',
      brand: 'Visa'
    },
    billing_history: [
      {
        id: 'inv_1',
        date: '2024-01-01T00:00:00Z',
        amount: 99,
        status: 'paid',
        invoice_url: '/invoices/inv_1.pdf'
      },
      {
        id: 'inv_2',
        date: '2023-12-01T00:00:00Z',
        amount: 99,
        status: 'paid',
        invoice_url: '/invoices/inv_2.pdf'
      }
    ],
    usage: {
      job_posts: { used: 15, limit: 50 },
      candidate_views: { used: 1250, limit: 2000 },
      team_members: { used: 3, limit: 10 },
      storage: { used: 2.5, limit: 10 }
    }
  };

  const mockTeamMembers: TeamMember[] = [
    {
      id: 'member_1',
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      role: 'admin',
      status: 'active',
      last_login: '2024-01-22T10:30:00Z',
      permissions: {
        manage_jobs: true,
        view_candidates: true,
        schedule_interviews: true,
        manage_team: true,
        view_analytics: true,
        manage_billing: true
      },
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      joined_date: '2023-01-15T00:00:00Z'
    },
    {
      id: 'member_2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      role: 'recruiter',
      status: 'active',
      last_login: '2024-01-22T09:15:00Z',
      permissions: {
        manage_jobs: true,
        view_candidates: true,
        schedule_interviews: true,
        manage_team: false,
        view_analytics: true,
        manage_billing: false
      },
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      joined_date: '2023-03-20T00:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCompanyProfile(mockCompanyProfile);
      setNotificationSettings(mockNotificationSettings);
      setSecuritySettings(mockSecuritySettings);
      setBillingSettings(mockBillingSettings);
      setTeamMembers(mockTeamMembers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSaveSettings = () => {
    // Simulate API call
    toast.success('Settings saved successfully');
    setUnsavedChanges(false);
  };

  const handleInviteTeamMember = (email: string, role: string) => {
    // Simulate API call
    toast.success(`Invitation sent to ${email}`);
    setShowInviteModal(false);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    toast.success('Team member removed successfully');
    setShowDeleteModal(false);
    setSelectedMember(null);
  };

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'api', label: 'API & Webhooks', icon: Database }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and company preferences</p>
          </div>
          
          {unsavedChanges && (
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Company Profile Tab */}
            {activeTab === 'profile' && companyProfile && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Profile</h2>
                  <p className="text-gray-600">Update your company information and branding</p>
                </div>

                <div className="space-y-6">
                  {/* Company Logo & Cover */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                      <div className="flex items-center space-x-4">
                        {companyProfile.logo ? (
                          <img
                            src={companyProfile.logo}
                            alt="Company Logo"
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <Building className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                            <Upload className="h-4 w-4" />
                            <span>Upload Logo</span>
                          </button>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                      <div className="space-y-2">
                        {companyProfile.cover_image && (
                          <img
                            src={companyProfile.cover_image}
                            alt="Cover Image"
                            className="w-full h-24 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                          <Upload className="h-4 w-4" />
                          <span>Upload Cover</span>
                        </button>
                        <p className="text-xs text-gray-500">1200x400px recommended</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={companyProfile.name}
                        onChange={(e) => {
                          setCompanyProfile({ ...companyProfile, name: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <select
                        value={companyProfile.industry}
                        onChange={(e) => {
                          setCompanyProfile({ ...companyProfile, industry: e.target.value });
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                    <textarea
                      value={companyProfile.description}
                      onChange={(e) => {
                        setCompanyProfile({ ...companyProfile, description: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your company, mission, and values..."
                    />
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={companyProfile.contact.email}
                          onChange={(e) => {
                            setCompanyProfile({
                              ...companyProfile,
                              contact: { ...companyProfile.contact, email: e.target.value }
                            });
                            setUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={companyProfile.contact.phone}
                          onChange={(e) => {
                            setCompanyProfile({
                              ...companyProfile,
                              contact: { ...companyProfile.contact, phone: e.target.value }
                            });
                            setUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={companyProfile.contact.address}
                        onChange={(e) => {
                          setCompanyProfile({
                            ...companyProfile,
                            contact: { ...companyProfile.contact, address: e.target.value }
                          });
                          setUnsavedChanges(true);
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(companyProfile.social_links).map(([platform, url]) => (
                        <div key={platform}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                            {platform}
                          </label>
                          <input
                            type="url"
                            value={url || ''}
                            onChange={(e) => {
                              setCompanyProfile({
                                ...companyProfile,
                                social_links: {
                                  ...companyProfile.social_links,
                                  [platform]: e.target.value
                                }
                              });
                              setUnsavedChanges(true);
                            }}
                            placeholder={`https://${platform}.com/yourcompany`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && notificationSettings && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h2>
                  <p className="text-gray-600">Choose how and when you want to be notified</p>
                </div>

                <div className="space-y-8">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Email Notifications</span>
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(notificationSettings.email_notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {key === 'new_applications' && 'Get notified when candidates apply to your jobs'}
                              {key === 'interview_reminders' && 'Reminders for upcoming interviews'}
                              {key === 'candidate_messages' && 'When candidates send you messages'}
                              {key === 'job_expiry' && 'When your job postings are about to expire'}
                              {key === 'weekly_reports' && 'Weekly summary of your hiring activity'}
                              {key === 'system_updates' && 'Important platform updates and announcements'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => {
                                setNotificationSettings({
                                  ...notificationSettings,
                                  email_notifications: {
                                    ...notificationSettings.email_notifications,
                                    [key]: e.target.checked
                                  }
                                });
                                setUnsavedChanges(true);
                              }}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              value ? 'bg-blue-600' : 'bg-gray-200'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                value ? 'translate-x-5' : 'translate-x-0'
                              } mt-0.5 ml-0.5`}></div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Push Notifications</span>
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(notificationSettings.push_notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => {
                                setNotificationSettings({
                                  ...notificationSettings,
                                  push_notifications: {
                                    ...notificationSettings.push_notifications,
                                    [key]: e.target.checked
                                  }
                                });
                                setUnsavedChanges(true);
                              }}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              value ? 'bg-blue-600' : 'bg-gray-200'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                value ? 'translate-x-5' : 'translate-x-0'
                              } mt-0.5 ml-0.5`}></div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Quiet Hours</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Enable Quiet Hours</p>
                          <p className="text-xs text-gray-500">Pause non-urgent notifications during specified hours</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.quiet_hours.enabled}
                            onChange={(e) => {
                              setNotificationSettings({
                                ...notificationSettings,
                                quiet_hours: {
                                  ...notificationSettings.quiet_hours,
                                  enabled: e.target.checked
                                }
                              });
                              setUnsavedChanges(true);
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            notificationSettings.quiet_hours.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              notificationSettings.quiet_hours.enabled ? 'translate-x-5' : 'translate-x-0'
                            } mt-0.5 ml-0.5`}></div>
                          </div>
                        </label>
                      </div>
                      
                      {notificationSettings.quiet_hours.enabled && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                            <input
                              type="time"
                              value={notificationSettings.quiet_hours.start_time}
                              onChange={(e) => {
                                setNotificationSettings({
                                  ...notificationSettings,
                                  quiet_hours: {
                                    ...notificationSettings.quiet_hours,
                                    start_time: e.target.value
                                  }
                                });
                                setUnsavedChanges(true);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                            <input
                              type="time"
                              value={notificationSettings.quiet_hours.end_time}
                              onChange={(e) => {
                                setNotificationSettings({
                                  ...notificationSettings,
                                  quiet_hours: {
                                    ...notificationSettings.quiet_hours,
                                    end_time: e.target.value
                                  }
                                });
                                setUnsavedChanges(true);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && securitySettings && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h2>
                  <p className="text-gray-600">Manage your account security and data protection</p>
                </div>

                <div className="space-y-8">
                  {/* Two-Factor Authentication */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Two-Factor Authentication</span>
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-900">2FA is enabled</p>
                            <p className="text-xs text-green-700">Using authenticator app</p>
                          </div>
                        </div>
                        <button className="px-3 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100">
                          Configure
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Policy */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Key className="h-5 w-5" />
                      <span>Password Policy</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
                          <input
                            type="number"
                            value={securitySettings.password_policy.min_length}
                            onChange={(e) => {
                              setSecuritySettings({
                                ...securitySettings,
                                password_policy: {
                                  ...securitySettings.password_policy,
                                  min_length: parseInt(e.target.value)
                                }
                              });
                              setUnsavedChanges(true);
                            }}
                            min="6"
                            max="20"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                          <input
                            type="number"
                            value={securitySettings.password_policy.expiry_days}
                            onChange={(e) => {
                              setSecuritySettings({
                                ...securitySettings,
                                password_policy: {
                                  ...securitySettings.password_policy,
                                  expiry_days: parseInt(e.target.value)
                                }
                              });
                              setUnsavedChanges(true);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { key: 'require_uppercase', label: 'Require uppercase letters' },
                          { key: 'require_lowercase', label: 'Require lowercase letters' },
                          { key: 'require_numbers', label: 'Require numbers' },
                          { key: 'require_symbols', label: 'Require special characters' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={securitySettings.password_policy[key as keyof typeof securitySettings.password_policy] as boolean}
                                onChange={(e) => {
                                  setSecuritySettings({
                                    ...securitySettings,
                                    password_policy: {
                                      ...securitySettings.password_policy,
                                      [key]: e.target.checked
                                    }
                                  });
                                  setUnsavedChanges(true);
                                }}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 rounded-full transition-colors ${
                                securitySettings.password_policy[key as keyof typeof securitySettings.password_policy] ? 'bg-blue-600' : 'bg-gray-200'
                              }`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                  securitySettings.password_policy[key as keyof typeof securitySettings.password_policy] ? 'translate-x-5' : 'translate-x-0'
                                } mt-0.5 ml-0.5`}></div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Session Management */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Session Management</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          value={securitySettings.session_timeout}
                          onChange={(e) => {
                            setSecuritySettings({
                              ...securitySettings,
                              session_timeout: parseInt(e.target.value)
                            });
                            setUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Login Alerts</p>
                          <p className="text-xs text-gray-500">Get notified of new login attempts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={securitySettings.login_alerts}
                            onChange={(e) => {
                              setSecuritySettings({
                                ...securitySettings,
                                login_alerts: e.target.checked
                              });
                              setUnsavedChanges(true);
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            securitySettings.login_alerts ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              securitySettings.login_alerts ? 'translate-x-5' : 'translate-x-0'
                            } mt-0.5 ml-0.5`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Management Tab */}
            {activeTab === 'team' && (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Management</h2>
                      <p className="text-gray-600">Manage team members and their permissions</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Invite Member</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                member.role === 'recruiter' ? 'bg-blue-100 text-blue-800' :
                                member.role === 'hiring_manager' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {member.role.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                member.status === 'active' ? 'bg-green-100 text-green-800' :
                                member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {member.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Permissions */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(member.permissions).map(([permission, hasPermission]) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                hasPermission ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                              <span className="text-xs text-gray-600 capitalize">
                                {permission.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && billingSettings && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Billing & Subscription</h2>
                  <p className="text-gray-600">Manage your subscription and billing information</p>
                </div>

                <div className="space-y-8">
                  {/* Current Plan */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-semibold text-blue-900 capitalize">
                            {billingSettings.subscription.plan} Plan
                          </h4>
                          <p className="text-blue-700 mt-1">
                            Active until {new Date(billingSettings.subscription.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-900">$99</p>
                          <p className="text-blue-700">per month</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Usage This Month</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(billingSettings.usage).map(([key, usage]) => {
                        const percentage = (usage.used / usage.limit) * 100;
                        return (
                          <div key={key} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {key.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-gray-600">
                                {usage.used} / {usage.limit}
                                {key === 'storage' ? ' GB' : ''}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  percentage > 90 ? 'bg-red-500' :
                                  percentage > 70 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {billingSettings.payment_method.brand} ending in {billingSettings.payment_method.last_four}
                            </p>
                            <p className="text-xs text-gray-500">
                              Expires {billingSettings.payment_method.expiry}
                            </p>
                          </div>
                        </div>
                        <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          Update
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Billing History</h3>
                    <div className="space-y-3">
                      {billingSettings.billing_history.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Invoice #{invoice.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-900">
                              ${invoice.amount}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invoice.status}
                            </span>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h2>
                  <p className="text-gray-600">Connect with your favorite tools and services</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      name: 'Slack',
                      description: 'Get notifications in your Slack workspace',
                      icon: '💬',
                      connected: true,
                      category: 'Communication'
                    },
                    {
                      name: 'Google Calendar',
                      description: 'Sync interviews with your calendar',
                      icon: '📅',
                      connected: true,
                      category: 'Calendar'
                    },
                    {
                      name: 'Zoom',
                      description: 'Automatically create meeting links',
                      icon: '🎥',
                      connected: false,
                      category: 'Video Conferencing'
                    },
                    {
                      name: 'LinkedIn',
                      description: 'Import candidate profiles from LinkedIn',
                      icon: '💼',
                      connected: false,
                      category: 'Social Media'
                    },
                    {
                      name: 'GitHub',
                      description: 'View candidate code repositories',
                      icon: '🐙',
                      connected: true,
                      category: 'Development'
                    },
                    {
                      name: 'Greenhouse',
                      description: 'Sync with your existing ATS',
                      icon: '🌱',
                      connected: false,
                      category: 'ATS'
                    }
                  ].map((integration) => (
                    <div key={integration.name} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{integration.icon}</div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                            <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full mt-2">
                              {integration.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          {integration.connected ? (
                            <>
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Connected
                              </span>
                              <button className="text-sm text-red-600 hover:text-red-800">
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Tab */}
            {activeTab === 'api' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">API & Webhooks</h2>
                  <p className="text-gray-600">Manage API keys and webhook endpoints</p>
                </div>

                <div className="space-y-8">
                  {/* API Keys */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Production API Key</p>
                            <p className="text-xs text-gray-500 font-mono">rh_prod_••••••••••••••••••••••••••••••••</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Copy className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Test API Key</p>
                            <p className="text-xs text-gray-500 font-mono">rh_test_••••••••••••••••••••••••••••••••</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Copy className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Generate New Key</span>
                      </button>
                    </div>
                  </div>

                  {/* Webhooks */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Webhooks</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Application Webhook</p>
                            <p className="text-xs text-gray-500">https://your-app.com/webhooks/applications</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                              <span className="text-xs text-gray-500">Last triggered: 2 hours ago</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Add Webhook</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleInviteTeamMember(
                formData.get('email') as string,
                formData.get('role') as string
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="colleague@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Team Member Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Remove Team Member</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMember(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to remove <strong>{selectedMember.name}</strong> from your team?
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMember(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveTeamMember(selectedMember.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerSettings;