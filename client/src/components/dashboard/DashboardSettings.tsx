'use client';

import { useState, useEffect } from 'react';
import { Settings, Type, Monitor, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FontSize = 'small' | 'medium' | 'large';

interface DashboardSettingsProps {
  onFontSizeChange?: (size: FontSize) => void;
}

const FONT_SIZES = [
  { value: 'small' as FontSize, label: 'Small', scale: '0.85' },
  { value: 'medium' as FontSize, label: 'Medium', scale: '1' },
  { value: 'large' as FontSize, label: 'Large', scale: '1.15' },
];

export function useDashboardSettings() {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_font_size') as FontSize;
    if (saved && ['small', 'medium', 'large'].includes(saved)) {
      setFontSize(saved);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('dashboard_font_size', fontSize);
      
      // Apply font size to dashboard
      const scale = FONT_SIZES.find(f => f.value === fontSize)?.scale || '1';
      document.documentElement.style.setProperty('--dashboard-font-scale', scale);
    }
  }, [fontSize, isLoaded]);

  return { fontSize, setFontSize, isLoaded };
}

export default function DashboardSettings({ onFontSizeChange }: DashboardSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { fontSize, setFontSize } = useDashboardSettings();

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    onFontSizeChange?.(size);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
        title="Dashboard Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f14] border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 border-b border-gray-800">
                <p className="text-xs font-medium text-white px-2">Display Settings</p>
              </div>

              <div className="p-2">
                <div className="px-2 py-1">
                  <p className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                    <Type className="w-3 h-3" /> Font Size
                  </p>
                  <div className="flex gap-1">
                    {FONT_SIZES.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => handleFontSizeChange(size.value)}
                        className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                          fontSize === size.value
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

