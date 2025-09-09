'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const contentVariants = {
  expanded: { marginLeft: 280 },
  collapsed: { marginLeft: 80 }
};

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Real-time notifications are now handled by the AdminHeader component

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Loading Admin Panel
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we prepare your dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-purple-100/20 dark:from-blue-900/20 dark:to-purple-900/20 pointer-events-none" />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out",
        isMobile && !mobileMenuOpen && "-translate-x-full"
      )}>
        <AdminSidebar
          isCollapsed={isMobile ? false : sidebarCollapsed}
          onToggle={handleSidebarToggle}
          user={{
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User',
            email: user?.email || 'admin@remotehive.in',
            avatar: user?.user_metadata?.avatar_url,
            role: user?.user_metadata?.role || 'Super Admin'
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        variants={contentVariants}
        animate={isMobile ? 'collapsed' : (sidebarCollapsed ? 'collapsed' : 'expanded')}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {/* Header */}
        <AdminHeader
          onMenuToggle={handleSidebarToggle}
          user={{
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User',
            email: user?.email || 'admin@remotehive.in',
            avatar: user?.user_metadata?.avatar_url,
            role: user?.user_metadata?.role || 'Super Admin'
          }}
        />

        {/* Page Content */}
        <main className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/20 dark:border-slate-800/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <span>© 2024 RemoteHive Admin Panel</span>
                <span className="text-slate-400">•</span>
                <span>Version 2.0.0</span>
              </div>
              <div className="flex items-center space-x-4">
                <button className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  Documentation
                </button>
                <span className="text-slate-400">•</span>
                <button className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  Support
                </button>
                <span className="text-slate-400">•</span>
                <button className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  API Status
                </button>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>

      {/* Toast Notifications */}
      <Toaster />
      <HotToaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileMenuOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}