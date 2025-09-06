'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  Globe,
  Shield,
  BarChart3,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { GlassCard } from '@/components/ui/advanced/glass-card';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { toast } from 'react-hot-toast';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

const quickActions = [
  { label: 'View Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Manage Users', href: '/users', icon: User },
  { label: 'Site Settings', href: '/settings', icon: Settings },
  { label: 'Contact Support', href: '/contact', icon: MessageSquare }
];

export function AdminHeader({ onMenuToggle, user }: AdminHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Use real-time notifications hook
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isConnected 
  } = useRealTimeNotifications();

  const unreadNotifications = notifications.filter(n => !n.read);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    router.push('/login');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full border-b border-slate-200/20 bg-white/80 backdrop-blur-xl dark:border-slate-800/20 dark:bg-slate-900/80"
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <motion.div
            className="relative"
            animate={{ width: isSearchFocused ? 400 : 300 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search users, employers, jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="pl-10 pr-4 bg-slate-100/50 border-slate-200/50 focus:bg-white dark:bg-slate-800/50 dark:border-slate-700/50 dark:focus:bg-slate-800"
                />
              </div>
            </form>

            {/* Search Suggestions */}
            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full"
                >
                  <GlassCard className="p-2">
                    <div className="space-y-1">
                      {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => router.push(action.href)}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Real-time Connection Status */}
          <div className="hidden md:flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Real-time Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Reconnecting...</span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative"
          >
            <motion.div
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </motion.div>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs text-white font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </motion.div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{unreadCount} new</Badge>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-6 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const timestamp = new Date(notification.created_at);
                    const isNewUserRegistration = notification.type === 'new_user_registration';
                    
                    return (
                      <DropdownMenuItem 
                        key={notification.id} 
                        className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          // Navigate to relevant page for new user registrations
                          if (isNewUserRegistration && notification.data) {
                            const userRole = notification.data.role;
                            if (userRole === 'employer') {
                              router.push('/admin/leads');
                            } else {
                              router.push(`/admin/users?search=${notification.data.email}`);
                            }
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <Icon className={cn('h-4 w-4 mt-0.5', getNotificationColor(notification.type))} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-medium',
                              notification.read 
                                ? 'text-slate-600 dark:text-slate-400' 
                                : 'text-slate-900 dark:text-slate-100'
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            {isNewUserRegistration && notification.data && (
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge 
                                  variant={notification.data.role === 'employer' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {notification.data.role === 'employer' ? '🏢 Employer' : '👤 Job Seeker'}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {notification.data.email}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-400">
                                {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
              {notifications.length > 5 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center">
                    <Button variant="ghost" size="sm" className="w-full">
                      View all notifications
                    </Button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-slate-500">
                    {user?.email || 'admin@remotehive.in'}
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <Badge variant="secondary" className="text-xs">
                      {user?.role || 'Super Admin'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/analytics')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Analytics</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-t border-slate-200/20 dark:border-slate-800/20 px-6 py-2"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-400">245 Active Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-400">89 Job Posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-400">12 Pending Approvals</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}