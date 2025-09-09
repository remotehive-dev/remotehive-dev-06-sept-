'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Settings,
  Bell,
  BarChart3,
  Shield,
  MessageSquare,
  Mail,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Bot,
  Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
    description: 'Overview & Analytics'
  },
  {
    title: 'Super Admin',
    href: '/super-admin',
    icon: Shield,
    badge: 'ADMIN',
    description: 'Platform Control'
  },
  {
    title: 'Employers',
    href: '/employers',
    icon: Building2,
    badge: null,
    description: 'Company Management'
  },
  {
    title: 'Job Seekers',
    href: '/jobseekers',
    icon: Users,
    badge: null,
    description: 'User Management'
  },
  {
    title: 'Job Posts',
    href: '/jobs',
    icon: Briefcase,
    badge: null,
    description: 'Job Management'
  },
  {
    title: 'CSV Import',
    href: '/admin/csv-import',
    icon: Upload,
    badge: null,
    description: 'Bulk Job Import'
  },
  {
    title: 'AutoScraper',
    href: '/admin/autoscraper',
    icon: Bot,
    badge: 'BETA',
    description: 'Smart Job Scraping'
  },
  {
    title: 'Contact Management',
    href: '/admin/contact-management',
    icon: MessageSquare,
    badge: null,
    description: 'Contact Inquiries'
  },
  {
    title: 'Email Templates',
    href: '/admin/email-management',
    icon: FileText,
    badge: null,
    description: 'Email Templates & SMTP'
  },
  {
    title: 'Email Users',
    href: '/admin/email-users',
    icon: Mail,
    badge: null,
    description: 'Inbox, Sent & User Management'
  },
  {
    title: 'Approval Queue',
    href: '/approval-queue',
    icon: CheckCircle,
    badge: 'NEW',
    description: 'Pending Approvals'
  },
  {
    title: 'Content Management',
    href: '/content',
    icon: FileText,
    badge: null,
    description: 'Website Content'
  },

  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    badge: null,
    description: 'Platform Insights'
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: null,
    description: 'System Alerts'
  },
  {
    title: 'Site Settings',
    href: '/settings',
    icon: Settings,
    badge: null,
    description: 'Platform Config'
  }
];

const quickStats = [
  { label: 'Pending', value: 12, color: 'bg-yellow-500', icon: Clock },
  { label: 'Active', value: 245, color: 'bg-green-500', icon: CheckCircle },
  { label: 'Issues', value: 3, color: 'bg-red-500', icon: AlertTriangle }
];

export function AdminSidebar({ isCollapsed, onToggle, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 backdrop-blur-3xl" />
      
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className="flex flex-col h-full p-4 space-y-6">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex flex-col"
              >
                <span className="font-bold text-white text-lg">RemoteHive</span>
                <span className="text-xs text-slate-400">Admin Panel</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <GlassCard className="p-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-slate-600">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || 'admin@remotehive.in'}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {user?.role || 'Super Admin'}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Quick Stats */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <GlassCard className="p-3">
                <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  {quickStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn('w-2 h-2 rounded-full', stat.color)} />
                          <span className="text-xs text-slate-300">{stat.label}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium text-white">{stat.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={cn(
                    'group relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-200',
                    'hover:bg-slate-700/50 hover:backdrop-blur-sm',
                    isActive && 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                  )}
                  onHoverStart={() => setHoveredItem(item.href)}
                  onHoverEnd={() => setHoveredItem(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <div className="flex items-center space-x-3 flex-1">
                    <Icon className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                    )} />
                    
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          variants={contentVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'text-sm font-medium transition-colors',
                              isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                            )}>
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge 
                                variant={item.badge === 'ADMIN' ? 'default' : 'secondary'}
                                className="text-xs px-1.5 py-0.5"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Tooltip for collapsed state */}
                  <AnimatePresence>
                    {isCollapsed && hoveredItem === item.href && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-full ml-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50"
                      >
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="text-xs text-slate-400">{item.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="pt-4 border-t border-slate-700/50">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700/50',
              isCollapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="ml-3"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}