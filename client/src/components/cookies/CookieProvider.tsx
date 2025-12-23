'use client';

import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const CookieConsent = dynamic(() => import('./CookieConsent'), {
  ssr: false,
});

export default function CookieProvider() {
  return <CookieConsent />;
}

