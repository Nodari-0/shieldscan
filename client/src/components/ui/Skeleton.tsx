'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-dark-accent rounded';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 space-y-4">
      <Skeleton variant="rectangular" height={24} width="60%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" height={36} width={100} />
        <Skeleton variant="rectangular" height={36} width={100} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-dark-accent">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="rectangular" height={20} width="100%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} variant="rectangular" height={20} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonScanCard() {
  return (
    <div className="flex items-center justify-between p-4 bg-dark-primary border border-dark-accent rounded-xl">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="rectangular" height={16} width="40%" />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-4">
          <Skeleton variant="rectangular" height={20} width={40} />
          <Skeleton variant="rectangular" height={20} width={40} />
          <Skeleton variant="rectangular" height={20} width={40} />
        </div>
        <Skeleton variant="rectangular" height={24} width={100} />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6">
      <div className="mb-6">
        <Skeleton variant="rectangular" height={24} width="40%" className="mb-2" />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={`${Math.random() * 60 + 30}%`}
            width="100%"
            className="flex-1"
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-dark-secondary border border-dark-accent rounded-xl p-6">
          <Skeleton variant="text" width="60%" className="mb-4" />
          <Skeleton variant="rectangular" height={32} width="50%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonModal() {
  return (
    <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="rectangular" height={28} width="40%" />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <div className="space-y-4 mb-6">
        <Skeleton variant="rectangular" height={40} width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="95%" />
      </div>
      <div className="flex gap-4">
        <Skeleton variant="rectangular" height={44} width={120} />
        <Skeleton variant="rectangular" height={44} width={120} />
      </div>
    </div>
  );
}

