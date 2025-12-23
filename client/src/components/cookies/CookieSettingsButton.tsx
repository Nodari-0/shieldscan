'use client';

import { useState } from 'react';
import { Cookie, Settings } from 'lucide-react';
import CookieSettingsModal from './CookieSettingsModal';

interface CookieSettingsButtonProps {
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export default function CookieSettingsButton({ variant = 'icon', className = '' }: CookieSettingsButtonProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {variant === 'icon' && (
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 text-gray-400 hover:text-yellow-500 transition-colors ${className}`}
          title="Cookie Settings"
        >
          <Cookie className="w-5 h-5" />
        </button>
      )}

      {variant === 'text' && (
        <button
          onClick={() => setShowSettings(true)}
          className={`text-gray-400 hover:text-yellow-500 transition-colors text-sm ${className}`}
        >
          Cookie Settings
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={() => setShowSettings(true)}
          className={`flex items-center gap-2 px-4 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-gray-300 hover:text-white hover:border-yellow-500/50 transition-colors ${className}`}
        >
          <Settings className="w-4 h-4" />
          <span>Cookie Settings</span>
        </button>
      )}

      <CookieSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}

