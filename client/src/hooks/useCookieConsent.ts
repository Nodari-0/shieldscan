'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

const COOKIE_CONSENT_KEY = 'shieldscan_cookie_consent';
const COOKIE_VERSION = '1.0';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  timestamp: '',
  version: COOKIE_VERSION,
};

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as CookiePreferences;
          if (parsed.version === COOKIE_VERSION) {
            setPreferences(parsed);
            setHasConsented(true);
          }
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();

    // Listen for changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as CookiePreferences;
          setPreferences(parsed);
          setHasConsented(true);
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<CookiePreferences>) => {
    const updated: CookiePreferences = {
      ...preferences,
      ...newPrefs,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
      version: COOKIE_VERSION,
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updated));
    setPreferences(updated);
    setHasConsented(true);

    // Update window object for external scripts
    if (typeof window !== 'undefined') {
      (window as any).__cookieConsent = updated;
    }
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setPreferences(defaultPreferences);
    setHasConsented(false);
  }, []);

  const canUseAnalytics = hasConsented && preferences.analytics;
  const canUseFunctional = hasConsented && preferences.functional;
  const canUseMarketing = hasConsented && preferences.marketing;

  return {
    preferences,
    hasConsented,
    isLoading,
    updatePreferences,
    resetPreferences,
    canUseAnalytics,
    canUseFunctional,
    canUseMarketing,
  };
}

// Utility function to check consent outside of React
export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CookiePreferences;
      if (parsed.version === COOKIE_VERSION) {
        return parsed;
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Utility to track events only if analytics is enabled
export function trackEvent(eventName: string, eventData?: Record<string, any>) {
  const consent = getCookieConsent();
  if (!consent?.analytics) {
    console.log('[Analytics Blocked]', eventName, eventData);
    return;
  }
  
  // Here you would send to your analytics service
  console.log('[Analytics]', eventName, eventData);
  
  // Example: Google Analytics
  // if (typeof window.gtag === 'function') {
  //   window.gtag('event', eventName, eventData);
  // }
}

