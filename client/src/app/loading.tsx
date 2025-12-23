/**
 * Global Loading Component
 * 
 * Shows during page transitions for better perceived performance
 */

import { Shield } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Shield className="w-16 h-16 text-yellow-500 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-yellow-500/30 rounded-full animate-ping" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

