// components/AppWrapper.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/notification/client';

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      // Register service worker
      registerServiceWorker().catch(err => {
        console.error('Failed to register service worker:', err);
      });
    }
  }, []);

  return <>{children}</>;
}