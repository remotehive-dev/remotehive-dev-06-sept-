'use client';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import with no SSR
const DashboardContent = dynamicImport(() => import('./page-original').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  ),
});

export const dynamic = 'force-dynamic';

export default function DynamicDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}