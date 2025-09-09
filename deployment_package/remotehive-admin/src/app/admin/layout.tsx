'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdminUser, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not admin
  useEffect(() => {
    console.log('AdminLayoutWrapper: Auth state changed', { loading, isAdminUser });
    if (!loading && !isAdminUser) {
      console.log('AdminLayoutWrapper: Redirecting to login - user is not admin');
      router.replace('/login');
    }
  }, [isAdminUser, loading, router]);

  // Show loading or nothing while checking authentication
  if (loading || !isAdminUser) {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}