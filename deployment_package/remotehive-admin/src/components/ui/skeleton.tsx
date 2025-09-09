"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Predefined skeleton components for common use cases
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-8 w-[60px]" />
        <Skeleton className="h-3 w-[120px]" />
      </div>
    </div>
  );
}

export function ScraperConfigSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <Skeleton className="h-3 w-[80px]" />
          <Skeleton className="h-3 w-[40px]" />
        </div>
        <Skeleton className="h-2 w-full" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <Skeleton className="h-3 w-[60px]" />
            <Skeleton className="h-3 w-[40px]" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-3 w-[50px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tab triggers */}
      <div className="flex space-x-1 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-[100px] rounded-t" />
        ))}
      </div>
      
      {/* Tab content */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ScraperConfigSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main Content */}
      <TabsSkeleton />
    </div>
  );
}

export { Skeleton };