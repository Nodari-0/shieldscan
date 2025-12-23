/**
 * Dashboard Loading Component
 * 
 * Shows while dashboard is loading for instant feedback
 */

import { SkeletonStats, SkeletonScanCard, SkeletonChart } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header Skeleton */}
      <div className="bg-dark-secondary border-b border-dark-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-dark-accent rounded-lg animate-pulse" />
              <div className="h-6 w-32 bg-dark-accent rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-dark-accent rounded-lg animate-pulse" />
              <div className="w-10 h-10 bg-dark-accent rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <SkeletonStats />

        {/* Chart Section */}
        <div className="mt-8">
          <SkeletonChart />
        </div>

        {/* Recent Scans */}
        <div className="mt-8 space-y-4">
          <div className="h-8 w-48 bg-dark-accent rounded animate-pulse" />
          <SkeletonScanCard />
          <SkeletonScanCard />
          <SkeletonScanCard />
        </div>
      </main>
    </div>
  );
}

