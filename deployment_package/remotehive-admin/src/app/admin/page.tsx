'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLayoutWrapper } from '@/components/layout/admin/AdminLayoutWrapper';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { SuperAdminDashboard } from '@/components/features/super-admin/SuperAdminDashboard';
import { EmployerManagement } from '@/components/features/employers/EmployerManagement';
import { JobSeekerManagement } from '@/components/features/jobseekers/JobSeekerManagement';
import { JobPostApprovalQueue } from '@/components/features/approval-queue/JobPostApprovalQueue';
import { ContentManagement } from '@/components/features/content/ContentManagement';
import ContactManagement from '@/components/features/contact/contactmanagement';
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard';
import { SiteSettings } from '@/components/features/settings/SiteSettings';
import { Loader2 } from 'lucide-react';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
        <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Main admin page component
export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get current page from URL params
  useEffect(() => {
    const page = searchParams.get('page') || 'dashboard';
    setCurrentPage(page);
    setIsLoading(false);
  }, [searchParams]);

  // Handle page navigation
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    router.push(url.pathname + url.search);
  };

  // Reset error state
  const resetError = () => {
    setError(null);
  };

  // Render current page component
  const renderCurrentPage = () => {
    if (error) {
      return <ErrorFallback error={error} resetError={resetError} />;
    }

    if (isLoading) {
      return <LoadingSpinner />;
    }

    try {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardOverview />;
        case 'super-admin':
          return <SuperAdminDashboard />;
        case 'employers':
          return <EmployerManagement />;
        case 'job-seekers':
          return <JobSeekerManagement />;
        case 'job-posts':
        case 'approval-queue':
          return <JobPostApprovalQueue />;
        case 'content':
          return <ContentManagement />;
        case 'contact':
          return <ContactManagement />;
        case 'analytics':
          return <AnalyticsDashboard />;
        case 'notifications':
          return (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Notifications
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Notification management coming soon...
              </p>
            </div>
          );
        case 'settings':
          return <SiteSettings />;
        default:
          return (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Page Not Found
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                The requested page could not be found.
              </p>
            </div>
          );
      }
    } catch (err) {
      setError(err as Error);
      return <ErrorFallback error={err as Error} resetError={resetError} />;
    }
  };

  return (
    <AdminLayoutWrapper
      currentPage={currentPage}
      onPageChange={handlePageChange}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full"
        >
          {renderCurrentPage()}
        </motion.div>
      </AnimatePresence>
    </AdminLayoutWrapper>
  );
}