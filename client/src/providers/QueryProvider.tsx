'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/react-query';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider Component
 * 
 * Provides query client to the entire app.
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient in useState to avoid recreating on every render
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

