'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Copy, 
  RefreshCw,
  Shield,
  AlertTriangle,
  Info,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordCheck {
  label: string;
  met: boolean;
  description: string;
}

interface BreachResult {
  checked: boolean;
  loading: boolean;
  breached: boolean;
  count: number;
  error?: string;
}

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');
  const [checks, setChecks] = useState<PasswordCheck[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showGenerated, setShowGenerated] = useState(false);
  const [timeToCrack, setTimeToCrack] = useState('');
  const [breachResult, setBreachResult] = useState<BreachResult>({
    checked: false,
    loading: false,
    breached: false,
    count: 0
  });

  // Check password against HIBP Pwned Passwords API (k-anonymity model)
  const checkPasswordBreach = useCallback(async (pwd: string) => {
    if (!pwd || pwd.length < 4) {
      setBreachResult({ checked: false, loading: false, breached: false, count: 0 });
      return;
    }

    setBreachResult(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      // Create SHA-1 hash of the password
      const encoder = new TextEncoder();
      const data = encoder.encode(pwd);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      // Use k-anonymity: send only first 5 chars of hash
      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      // Use our server-side proxy to avoid CORS issues
      const response = await fetch(`/api/password-check?prefix=${prefix}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to check password');
      }

      const text = await response.text();
      const lines = text.split('\n');
      
      let breachCount = 0;
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix && hashSuffix.trim() === suffix) {
          breachCount = parseInt(count.trim(), 10);
          break;
        }
      }

      setBreachResult({
        checked: true,
        loading: false,
        breached: breachCount > 0,
        count: breachCount
      });
    } catch (error) {
      console.error('Password breach check error:', error);
      setBreachResult({
        checked: true,
        loading: false,
        breached: false,
        count: 0,
        error: 'Could not check breach database'
      });
    }
  }, []);

  // Debounce the breach check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (password.length >= 4) {
        checkPasswordBreach(password);
      } else {
        setBreachResult({ checked: false, loading: false, breached: false, count: 0 });
      }
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer);
  }, [password, checkPasswordBreach]);

  // Password requirements check
  useEffect(() => {
    const newChecks: PasswordCheck[] = [
      {
        label: 'At least 8 characters',
        met: password.length >= 8,
        description: 'Longer passwords are harder to crack'
      },
      {
        label: 'At least 12 characters',
        met: password.length >= 12,
        description: 'Recommended minimum for strong security'
      },
      {
        label: 'Contains uppercase letter',
        met: /[A-Z]/.test(password),
        description: 'Mix of cases increases complexity'
      },
      {
        label: 'Contains lowercase letter',
        met: /[a-z]/.test(password),
        description: 'Mix of cases increases complexity'
      },
      {
        label: 'Contains number',
        met: /[0-9]/.test(password),
        description: 'Numbers add more possible combinations'
      },
      {
        label: 'Contains special character',
        met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        description: 'Special characters significantly increase strength'
      },
      {
        label: 'No common patterns',
        met: password.length > 0 && !hasCommonPatterns(password),
        description: 'Avoid sequences like 123, abc, qwerty'
      },
      {
        label: 'No repeated characters',
        met: password.length > 0 && !/(.)\1{2,}/.test(password),
        description: 'Avoid patterns like aaa or 111'
      }
    ];

    setChecks(newChecks);

    // Calculate strength
    const metChecks = newChecks.filter(c => c.met).length;
    const strengthScore = Math.round((metChecks / newChecks.length) * 100);
    setStrength(strengthScore);

    // Set strength label
    if (password.length === 0) {
      setStrengthLabel('');
      setTimeToCrack('');
    } else if (strengthScore < 25) {
      setStrengthLabel('Very Weak');
      setTimeToCrack('< 1 second');
    } else if (strengthScore < 50) {
      setStrengthLabel('Weak');
      setTimeToCrack('A few minutes');
    } else if (strengthScore < 75) {
      setStrengthLabel('Moderate');
      setTimeToCrack('A few hours');
    } else if (strengthScore < 100) {
      setStrengthLabel('Strong');
      setTimeToCrack('Several years');
    } else {
      setStrengthLabel('Very Strong');
      setTimeToCrack('Centuries');
    }
  }, [password]);

  function hasCommonPatterns(pwd: string): boolean {
    const common = [
      '123', '234', '345', '456', '567', '678', '789', '890',
      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
      'qwerty', 'asdf', 'zxcv', 'password', '1234', 'admin',
      'letmein', 'welcome', 'monkey', 'dragon', 'master'
    ];
    const lower = pwd.toLowerCase();
    return common.some(pattern => lower.includes(pattern));
  }

  const generatePassword = (length: number = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let newPassword = '';
    
    // Ensure at least one of each type
    newPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    newPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    newPassword += numbers[Math.floor(Math.random() * numbers.length)];
    newPassword += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest
    for (let i = newPassword.length; i < length; i++) {
      newPassword += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(newPassword);
    setShowGenerated(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Password copied to clipboard!');
  };

  const useGeneratedPassword = () => {
    setPassword(generatedPassword);
    setShowGenerated(false);
    toast.success('Password applied!');
  };

  const getStrengthColor = () => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    if (strength < 100) return 'bg-green-400';
    return 'bg-green-500';
  };

  const getStrengthTextColor = () => {
    if (strength < 25) return 'text-red-500';
    if (strength < 50) return 'text-orange-500';
    if (strength < 75) return 'text-yellow-500';
    if (strength < 100) return 'text-green-400';
    return 'text-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Key className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Password Strength Checker</h2>
          <p className="text-sm text-gray-400">Check how secure your passwords are</p>
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a password to check..."
            className="w-full pl-10 pr-12 py-3 bg-dark-primary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors font-mono"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Strength Meter */}
        {password.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
                {strengthLabel}
              </span>
              <span className="text-xs text-gray-500">
                {strength}% strength
              </span>
            </div>
            <div className="h-2 bg-dark-accent rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getStrengthColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${strength}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {/* Time to Crack */}
            <div className="flex items-center gap-2 text-xs">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-500">Estimated time to crack:</span>
              <span className={getStrengthTextColor()}>{timeToCrack}</span>
            </div>
          </div>
        )}
      </div>

      {/* Breach Check Result */}
      {password.length >= 4 && (
        <div className={`p-4 rounded-xl border ${
          breachResult.loading 
            ? 'bg-dark-primary border-dark-accent' 
            : breachResult.breached 
              ? 'bg-red-500/10 border-red-500/30' 
              : breachResult.checked 
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-dark-primary border-dark-accent'
        }`}>
          <div className="flex items-center gap-3">
            {breachResult.loading ? (
              <>
                <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                <div>
                  <p className="text-white text-sm font-medium">Checking breach databases...</p>
                  <p className="text-gray-500 text-xs">Using Have I Been Pwned API</p>
                </div>
              </>
            ) : breachResult.error ? (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Could not check breach database</p>
                  <p className="text-gray-500 text-xs">Try again later</p>
                </div>
              </>
            ) : breachResult.breached ? (
              <>
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-red-400 text-sm font-medium">⚠️ Password found in breaches!</p>
                  <p className="text-red-300/70 text-xs">
                    This password appeared <span className="font-bold text-red-400">{breachResult.count.toLocaleString()}</span> times in data breaches. 
                    <span className="text-red-400 font-medium"> Do NOT use this password!</span>
                  </p>
                </div>
              </>
            ) : breachResult.checked ? (
              <>
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-green-400 text-sm font-medium">✓ Not found in breach databases</p>
                  <p className="text-gray-500 text-xs">This password hasn&apos;t appeared in known data breaches</p>
                </div>
              </>
            ) : (
              <>
                <Database className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-gray-400 text-sm font-medium">Breach check pending</p>
                  <p className="text-gray-500 text-xs">Enter at least 4 characters to check</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {password.length > 0 && (
        <div className="bg-dark-primary border border-dark-accent rounded-xl p-4">
          <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-500" />
            Password Requirements
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checks.map((check, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-2 text-xs ${check.met ? 'text-green-400' : 'text-gray-500'}`}
              >
                {check.met ? (
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                )}
                <span>{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Generator */}
      <div className="bg-dark-primary border border-dark-accent rounded-xl p-4">
        <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-500" />
          Password Generator
          <span className="text-xs text-gray-500 font-normal">(for future Password Vault)</span>
        </h4>
        
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => generatePassword(12)}
            className="flex-1 px-3 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-xs text-white hover:border-purple-500/50 transition-colors"
          >
            12 chars
          </button>
          <button
            onClick={() => generatePassword(16)}
            className="flex-1 px-3 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-xs text-white hover:border-purple-500/50 transition-colors"
          >
            16 chars
          </button>
          <button
            onClick={() => generatePassword(20)}
            className="flex-1 px-3 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-xs text-white hover:border-purple-500/50 transition-colors"
          >
            20 chars
          </button>
          <button
            onClick={() => generatePassword(24)}
            className="flex-1 px-3 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-xs text-white hover:border-purple-500/50 transition-colors"
          >
            24 chars
          </button>
        </div>

        {showGenerated && generatedPassword && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={generatedPassword}
                readOnly
                className="w-full px-3 py-2 bg-dark-secondary border border-purple-500/30 rounded-lg text-white text-sm font-mono pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={() => copyToClipboard(generatedPassword)}
                  className="p-1 hover:bg-dark-accent rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
                <button
                  onClick={() => generatePassword(generatedPassword.length)}
                  className="p-1 hover:bg-dark-accent rounded transition-colors"
                  title="Generate new"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
            <button
              onClick={useGeneratedPassword}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Use This Password
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-dark-primary/50 border border-dark-accent rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300 mb-2">Password Security Tips:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Never reuse passwords across different accounts</li>
              <li>• Use a password manager to store complex passwords</li>
              <li>• Consider using passphrases (e.g., &quot;correct-horse-battery-staple&quot;)</li>
              <li>• Enable two-factor authentication whenever possible</li>
              <li>• Change passwords periodically, especially for sensitive accounts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

