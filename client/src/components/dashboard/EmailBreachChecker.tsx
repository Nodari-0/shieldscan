'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import type { EmailCheckResponse, BreachInfo, PasswordSuggestion } from '@/types/scan';
import { getRiskLevelColor, getRiskLevelBgColor, formatPwnCount } from '@/lib/emailBreachChecker';

interface EmailBreachCheckerProps {
  userEmail?: string;
}

export default function EmailBreachChecker({ userEmail }: EmailBreachCheckerProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedBreaches, setExpandedBreaches] = useState<Set<string>>(new Set());
  const [showPasswordSuggestions, setShowPasswordSuggestions] = useState(true);

  const handleCheck = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/email-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data: EmailCheckResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to check email');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Failed to connect to breach checking service');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBreachExpansion = (breachName: string) => {
    setExpandedBreaches(prev => {
      const next = new Set(prev);
      if (next.has(breachName)) {
        next.delete(breachName);
      } else {
        next.add(breachName);
      }
      return next;
    });
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <ShieldAlert className="w-6 h-6 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'low':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-green-500" />;
    }
  };

  const getPriorityBadge = (type: PasswordSuggestion['type']) => {
    switch (type) {
      case 'immediate':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Immediate</span>;
      case 'recommended':
        return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Recommended</span>;
      default:
        return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Best Practice</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Mail className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Email Breach Checker</h2>
          <p className="text-sm text-gray-400">Check if your email has been exposed in data breaches</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="Enter email address to check..."
            className="w-full pl-10 pr-4 py-3 bg-dark-primary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          {isLoading ? 'Checking...' : 'Check'}
        </button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result?.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Risk Level Card */}
            <div className={`p-6 rounded-xl border ${getRiskLevelBgColor(result.data.riskLevel)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getRiskIcon(result.data.riskLevel)}
                  <div>
                    <h3 className="text-white font-semibold">
                      {result.data.breached ? 'Breaches Found' : 'No Breaches Found'}
                    </h3>
                    <p className="text-sm text-gray-400">{result.data.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getRiskLevelColor(result.data.riskLevel)}`}>
                    {result.data.breachCount}
                  </p>
                  <p className="text-xs text-gray-500">breaches</p>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Risk Level:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBgColor(result.data.riskLevel)} ${getRiskLevelColor(result.data.riskLevel)}`}>
                  {result.data.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Recommendations */}
            {result.data.recommendations.length > 0 && (
              <div className="p-4 bg-dark-secondary border border-dark-accent rounded-xl">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.data.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Password Suggestions */}
            {result.data.passwordSuggestions && result.data.passwordSuggestions.length > 0 && (
              <div className="p-4 bg-dark-secondary border border-dark-accent rounded-xl">
                <button
                  onClick={() => setShowPasswordSuggestions(!showPasswordSuggestions)}
                  className="w-full flex items-center justify-between text-white font-medium mb-3"
                >
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-500" />
                    Password Security Tips
                    <span className="text-xs text-gray-500 font-normal">
                      (for future Password Vault)
                    </span>
                  </span>
                  {showPasswordSuggestions ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showPasswordSuggestions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {result.data.passwordSuggestions.map((suggestion, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-dark-primary rounded-lg border border-dark-accent"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-sm font-medium">{suggestion.title}</span>
                            {getPriorityBadge(suggestion.type)}
                          </div>
                          <p className="text-gray-400 text-xs">{suggestion.description}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Breach Details */}
            {result.data.breaches.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Breach Details ({result.data.breachCount})
                </h4>
                
                {result.data.breaches.map((breach) => (
                  <div 
                    key={breach.name}
                    className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleBreachExpansion(breach.name)}
                      className="w-full p-4 flex items-center justify-between hover:bg-dark-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{breach.title || breach.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(breach.breachDate).toLocaleDateString()} • {formatPwnCount(breach.pwnCount)} accounts
                          </p>
                        </div>
                      </div>
                      {expandedBreaches.has(breach.name) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedBreaches.has(breach.name) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-dark-accent"
                        >
                          <div className="p-4 space-y-3">
                            {/* Description */}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Description</p>
                              <p 
                                className="text-sm text-gray-300"
                                dangerouslySetInnerHTML={{ __html: breach.description }}
                              />
                            </div>

                            {/* Data Exposed */}
                            {breach.dataClasses.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Data Exposed</p>
                                <div className="flex flex-wrap gap-2">
                                  {breach.dataClasses.map((dataClass, idx) => (
                                    <span 
                                      key={idx}
                                      className={`px-2 py-1 rounded text-xs ${
                                        ['Passwords', 'Password hints', 'Credit cards', 'Bank account numbers']
                                          .some(s => dataClass.toLowerCase().includes(s.toLowerCase()))
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                          : 'bg-dark-accent text-gray-400'
                                      }`}
                                    >
                                      {dataClass}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Breach Date</p>
                                <p className="text-gray-300">{new Date(breach.breachDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Added to Database</p>
                                <p className="text-gray-300">{new Date(breach.addedDate).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {/* Flags */}
                            <div className="flex flex-wrap gap-2">
                              {breach.isVerified && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                              )}
                              {breach.isSensitive && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Sensitive
                                </span>
                              )}
                            </div>

                            {/* Domain Link */}
                            {breach.domain && (
                              <a
                                href={`https://${breach.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                Visit {breach.domain}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* Safe Message */}
            {!result.data.breached && (
              <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Good news!</h3>
                <p className="text-gray-400 text-sm">
                  This email address hasn&apos;t been found in any known data breaches.
                </p>
              </div>
            )}

            {/* Last Checked */}
            <p className="text-xs text-gray-500 text-center">
              Last checked: {new Date(result.data.lastChecked).toLocaleString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      {!result && !isLoading && (
        <div className="p-4 bg-dark-secondary/50 border border-dark-accent rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Check if your email has been exposed in known data breaches. We use the Have I Been Pwned database to check your email against billions of breached accounts.
              </p>
              <p className="text-xs text-gray-500">
                Your email is only used for the check and is not stored. Consider checking all your important email addresses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

