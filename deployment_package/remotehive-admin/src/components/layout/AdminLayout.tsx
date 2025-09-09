'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  Database,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  CreditCard,
  UserPlus,
  Globe,
  MessageSquare,
  Mail,
  Workflow
} from 'lucide-react';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'Lead Management',
    href: '/admin/lead-management',
    icon: UserPlus,
    description: 'Manage leads from registrations'
  },

  {
    name: 'User Management',
    href: '/admin/user-management',
    icon: Users,
    description: 'Advanced user and role management'
  },
  {
    name: 'Job Listings',
    href: '/admin/jobs',
    icon: Briefcase,
    description: 'Manage job postings'
  },
  {
    name: 'Employers',
    href: '/admin/employers',
    icon: Building2,
    description: 'Company management'
  },
  {
    name: 'Jobseekers',
    href: '/admin/jobseekers',
    icon: Users,
    description: 'User management'
  },
  {
    name: 'Contact Management',
    href: '/admin/contact-management',
    icon: MessageSquare,
    description: 'Contact form submissions'
  },
  {
    name: 'Contact Information',
    href: '/admin/contact-info-management',
    icon: MessageSquare,
    description: 'Manage company contact details'
  },
  {
    name: 'AutoScraper',
    href: '/admin/autoscraper',
    icon: Workflow,
    description: 'Smart Job Scraping Engine'
  },
  {
    name: 'Email Management',
    href: '/admin/email-management',
    icon: Mail,
    description: 'Email templates and delivery system'
  },
  {
    name: 'Slack Management',
    href: '/admin/slack-management',
    icon: MessageSquare,
    description: 'Advanced Slack integration & chat'
  },

  {
    name: 'Payment Management',
    href: '/admin/payment-management',
    icon: CreditCard,
    description: 'Advanced payment system'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    description: 'Analytics and insights'
  },
  {
    name: 'Website Manager',
    href: '/admin/website-manager',
    icon: Globe,
    description: 'Complete content management system'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, signOut, isAdminUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Note: Authentication redirect is handled by the layout wrapper
  // No redirect logic needed here to avoid navigation loops

  // Handle responsive sidebar behavior
  useEffect(() => {
    setIsClient(true);
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading or return null while checking authentication
  if (loading || !isAdminUser) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const sidebarVariants = {
    open: {
      x: 0,
      width: "16rem",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      width: "16rem",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  };

  const desktopSidebarVariants = {
    open: {
      width: "16rem",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      width: "0rem",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={isClient && window.innerWidth >= 1024 ? desktopSidebarVariants : sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-xl lg:relative overflow-hidden"
        style={{ width: sidebarOpen ? '16rem' : (isClient && window.innerWidth >= 1024) ? '0rem' : '16rem' }}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="RemoteHive Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                  priority
                />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                RemoteHive
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.a
                  key={item.name}
                  href={item.href}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-primary-foreground/80" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={'/default-avatar.svg'} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(
                    user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user?.email || 'A'
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : 'Admin User'}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {user?.role}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 justify-start text-gray-700 dark:text-gray-300"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden md:flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}