'use client';

import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

export default function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    setIsOpen(false);
    // Translation functionality will be implemented later
    console.log('Language selected:', code);
  };

  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-400 text-xs sm:text-sm transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLang.flag}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full mb-2 right-0 bg-dark-secondary border border-dark-accent rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-accent transition-colors ${
                    selectedLanguage === lang.code ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-gray-300 hover:text-white hover:border-yellow-500/50 transition-all cursor-pointer"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang.flag}</span>
        <span className="text-sm">{currentLang.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-dark-secondary border border-dark-accent rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-dark-accent transition-colors ${
                  selectedLanguage === lang.code ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-300'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
