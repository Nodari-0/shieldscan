'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  Shield,
  BookOpen,
  Zap,
  Terminal,
} from 'lucide-react';
import {
  getFixSuggestion,
  getAvailableLanguages,
  getLanguageDisplayName,
  type SupportedLanguage,
} from '@/config/fixSuggestions';

interface FixSuggestionPanelProps {
  checkId: string;
  checkName?: string;
  onClose?: () => void;
}

// Language logos as inline SVGs for crisp rendering
const LanguageLogos: Record<SupportedLanguage, React.ReactNode> = {
  nodejs: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339c.082.045.198.045.275 0l8.795-5.076c.082-.047.134-.141.134-.238V6.921c0-.099-.053-.192-.137-.242l-8.791-5.072c-.081-.047-.189-.047-.271 0L3.075 6.68c-.085.05-.139.144-.139.242v10.15c0 .097.054.189.139.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675c-.57-.329-.922-.943-.922-1.604V6.921c0-.659.353-1.275.922-1.603l8.795-5.082c.557-.315 1.296-.315 1.848 0l8.794 5.082c.57.329.924.944.924 1.603v10.15c0 .659-.354 1.273-.924 1.604l-8.794 5.078c-.28.163-.6.247-.925.247zm2.715-6.997c-3.857 0-4.663-1.771-4.663-3.259 0-.142.114-.253.256-.253h1.137c.126 0 .232.091.253.214.172 1.161.686 1.746 3.017 1.746 1.856 0 2.646-.42 2.646-1.404 0-.566-.224-.986-3.108-1.269-2.409-.238-3.899-.771-3.899-2.7 0-1.778 1.499-2.837 4.012-2.837 2.824 0 4.217.979 4.394 3.082.006.074-.021.147-.068.204-.046.056-.112.088-.183.088h-1.143c-.119 0-.226-.085-.251-.199-.279-1.24-.957-1.637-2.749-1.637-2.024 0-2.261.705-2.261 1.233 0 .64.278.826 3.012 1.187 2.708.358 3.993.865 3.993 2.768 0 1.919-1.599 3.018-4.395 3.018z"/>
    </svg>
  ),
  python: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
    </svg>
  ),
  java: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.154 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
    </svg>
  ),
  go: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2m3.868 6.461c-1.064-.024-2.034-.328-2.852-1.029a3.665 3.665 0 01-1.262-2.255c-.21-1.32.152-2.489.947-3.529.853-1.122 1.881-1.706 3.272-1.95 1.192-.21 2.314-.095 3.33.595.923.63 1.496 1.484 1.648 2.605.198 1.578-.257 2.863-1.344 3.962-.771.783-1.718 1.273-2.805 1.495-.315.06-.63.07-.934.106zm2.78-4.72c-.011-.153-.011-.27-.034-.387-.21-1.157-1.274-1.81-2.384-1.554-1.087.245-1.788.935-2.045 2.033-.21.912.234 1.835 1.075 2.21.643.28 1.285.244 1.905-.07.923-.48 1.425-1.228 1.484-2.233z"/>
    </svg>
  ),
};

// Language colors for styling
const LANGUAGE_COLORS: Record<SupportedLanguage, { bg: string; text: string; border: string; glow: string }> = {
  nodejs: { 
    bg: 'bg-[#339933]/10', 
    text: 'text-[#339933]', 
    border: 'border-[#339933]/30',
    glow: 'shadow-[#339933]/20'
  },
  python: { 
    bg: 'bg-[#3776AB]/10', 
    text: 'text-[#3776AB]', 
    border: 'border-[#3776AB]/30',
    glow: 'shadow-[#3776AB]/20'
  },
  java: { 
    bg: 'bg-[#ED8B00]/10', 
    text: 'text-[#ED8B00]', 
    border: 'border-[#ED8B00]/30',
    glow: 'shadow-[#ED8B00]/20'
  },
  go: { 
    bg: 'bg-[#00ADD8]/10', 
    text: 'text-[#00ADD8]', 
    border: 'border-[#00ADD8]/30',
    glow: 'shadow-[#00ADD8]/20'
  },
};

// Code block with line numbers and terminal styling
function CodeBlock({ 
  code, 
  type, 
  language,
  onCopy 
}: { 
  code: string; 
  type: 'vulnerable' | 'fixed';
  language: SupportedLanguage;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isVulnerable = type === 'vulnerable';
  
  return (
    <div className={`rounded-xl overflow-hidden border ${
      isVulnerable 
        ? 'border-red-500/30 bg-gradient-to-b from-red-950/20 to-gray-950' 
        : 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-gray-950'
    }`}>
      {/* Terminal Header */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        isVulnerable ? 'bg-red-950/40' : 'bg-emerald-950/40'
      }`}>
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${isVulnerable ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-gray-600" />
          </div>
          
          {/* Title */}
          <div className="flex items-center gap-2">
            {isVulnerable ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <Shield className="w-4 h-4 text-emerald-400" />
            )}
            <span className={`text-xs font-semibold ${isVulnerable ? 'text-red-400' : 'text-emerald-400'}`}>
              {isVulnerable ? 'VULNERABLE' : 'SECURE'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${LANGUAGE_COLORS[language].bg} ${LANGUAGE_COLORS[language].border} border`}>
            <span className={LANGUAGE_COLORS[language].text}>
              {LanguageLogos[language]}
            </span>
            <span className={`text-[10px] font-medium ${LANGUAGE_COLORS[language].text}`}>
              {getLanguageDisplayName(language)}
            </span>
          </div>
          
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              copied 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Code Content */}
      <div className="relative overflow-x-auto">
        <div className="flex">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-4 px-3 bg-black/20 border-r border-gray-800/50 select-none">
            {lines.map((_, idx) => (
              <div 
                key={idx} 
                className="text-[11px] font-mono text-gray-600 leading-6 text-right pr-2"
                style={{ minWidth: '2rem' }}
              >
                {idx + 1}
              </div>
            ))}
          </div>
          
          {/* Code */}
          <pre className="flex-1 py-4 px-4 overflow-x-auto">
            <code className="text-[12px] font-mono leading-6">
              {lines.map((line, idx) => (
                <div key={idx} className="whitespace-pre">
                  {highlightCode(line, isVulnerable)}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightCode(line: string, isVulnerable: boolean): React.ReactNode {
  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    const isSpecialComment = line.includes('❌') || line.includes('✅') || line.includes('VULNERABLE') || line.includes('FIXED') || line.includes('MISSING');
    if (isSpecialComment) {
      return (
        <span className={isVulnerable ? 'text-red-400/90' : 'text-emerald-400/90'}>
          {line}
        </span>
      );
    }
    return <span className="text-gray-500 italic">{line}</span>;
  }
  
  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'import', 'from', 'export', 'default', 'async', 'await', 'require', 'new', 'class', 'extends', 'public', 'private', 'protected', 'static', 'void', 'String', 'int', 'boolean', 'package', 'func', 'type', 'struct', 'interface', 'def', 'self', 'None', 'True', 'False', 'throws', 'throw', 'try', 'catch', '@'];
  
  let result = line;
  
  // Highlight strings
  result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<STRING>$&</STRING>');
  
  // Highlight keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'g');
    result = result.replace(regex, `<KW>${kw}</KW>`);
  });
  
  // Parse and render
  const parts = result.split(/(<STRING>.*?<\/STRING>|<KW>.*?<\/KW>)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<STRING>')) {
          return <span key={i} className="text-amber-400">{part.replace(/<\/?STRING>/g, '')}</span>;
        }
        if (part.startsWith('<KW>')) {
          return <span key={i} className="text-purple-400">{part.replace(/<\/?KW>/g, '')}</span>;
        }
        // Highlight function calls
        return <span key={i} className="text-gray-300">{part}</span>;
      })}
    </>
  );
}

export default function FixSuggestionPanel({ checkId, checkName, onClose }: FixSuggestionPanelProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('nodejs');
  const [showVulnerable, setShowVulnerable] = useState(true);
  const [showFixed, setShowFixed] = useState(true);

  const fix = getFixSuggestion(checkId);
  const availableLanguages = fix ? getAvailableLanguages(fix.id) : [];

  // Auto-select first available language
  if (fix && availableLanguages.length > 0 && !availableLanguages.includes(selectedLang)) {
    setSelectedLang(availableLanguages[0]);
  }

  if (!fix) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <Lightbulb className="w-5 h-5" />
          <span>No fix suggestions available for this check.</span>
        </div>
      </div>
    );
  }

  const currentFix = fix.fixes[selectedLang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border-b border-gray-800 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{fix.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{fix.description}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Fix Banner */}
        {fix.quickFix && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Quick Fix</span>
              <p className="text-sm text-emerald-300 mt-0.5">{fix.quickFix}</p>
            </div>
          </div>
        )}

        {/* Metadata Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {fix.cweId && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/80 text-gray-300 border border-gray-700">
              {fix.cweId}
            </span>
          )}
          {fix.owaspCategory && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {fix.owaspCategory}
            </span>
          )}
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            fix.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            fix.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            fix.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {fix.severity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Language Selector - Tab Style */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {availableLanguages.map((lang) => {
            const colors = LANGUAGE_COLORS[lang];
            const isSelected = selectedLang === lang;
            return (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? `${colors.bg} ${colors.text} ${colors.border} border shadow-lg ${colors.glow}`
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className={isSelected ? colors.text : 'text-gray-500'}>
                  {LanguageLogos[lang]}
                </span>
                {getLanguageDisplayName(lang)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Examples */}
      {currentFix && (
        <div className="p-5 space-y-5">
          {/* Vulnerable Code */}
          <div>
            <button
              onClick={() => setShowVulnerable(!showVulnerable)}
              className="w-full flex items-center gap-2 mb-3 text-left group"
            >
              {showVulnerable ? (
                <ChevronDown className="w-4 h-4 text-red-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-semibold text-red-400">Vulnerable Code</span>
              <span className="text-xs text-gray-500">— Don't do this</span>
            </button>
            <AnimatePresence>
              {showVulnerable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CodeBlock 
                    code={currentFix.vulnerable} 
                    type="vulnerable" 
                    language={selectedLang}
                    onCopy={() => {}}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/10 via-gray-900 to-emerald-500/10">
              <span className="text-red-400 text-xs font-medium">Insecure</span>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-gray-600" />
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <div className="w-8 h-0.5 bg-gradient-to-r from-gray-600 to-emerald-500" />
              </div>
              <span className="text-emerald-400 text-xs font-medium">Secure</span>
            </div>
          </div>

          {/* Fixed Code */}
          <div>
            <button
              onClick={() => setShowFixed(!showFixed)}
              className="w-full flex items-center gap-2 mb-3 text-left group"
            >
              {showFixed ? (
                <ChevronDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm font-semibold text-emerald-400">Fixed Code</span>
              <span className="text-xs text-gray-500">— Use this instead</span>
            </button>
            <AnimatePresence>
              {showFixed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CodeBlock 
                    code={currentFix.fixed} 
                    type="fixed" 
                    language={selectedLang}
                    onCopy={() => {}}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Explanation */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-1">Why this works</h4>
              <p className="text-sm text-blue-300/80 leading-relaxed">{currentFix.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* References */}
      {fix.references.length > 0 && (
        <div className="border-t border-gray-800 p-5 bg-gray-900/30">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Learn More
          </h4>
          <div className="flex flex-wrap gap-2">
            {fix.references.map((ref, idx) => (
              <a
                key={idx}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 text-xs text-gray-400 hover:text-white transition-all group"
              >
                <ExternalLink className="w-3.5 h-3.5 group-hover:text-blue-400" />
                {new URL(ref).hostname.replace('www.', '')}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* PR Suggestion Footer */}
      <div className="border-t border-gray-800 p-5 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">
              Ready to fix? Copy the code and create a PR
            </span>
          </div>
          <button
            onClick={() => {
              if (currentFix) {
                navigator.clipboard.writeText(currentFix.fixed);
                window.open('https://github.com/new', '_blank');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 text-purple-400 text-sm font-medium transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Create PR
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for inline display
export function FixSuggestionButton({ checkId, onClick }: { checkId: string; onClick?: () => void }) {
  const fix = getFixSuggestion(checkId);
  
  if (!fix) return null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
    >
      <Zap className="w-3 h-3" />
      View Fix
    </button>
  );
}
