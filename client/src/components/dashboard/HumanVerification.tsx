'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Clock, Check, X, AlertTriangle, Shield,
  ChevronDown, ChevronRight, MessageSquare, ExternalLink,
  Loader2, CheckCircle, XCircle, HelpCircle
} from 'lucide-react';
import {
  createVerificationRequest, getVerificationRequests, cancelVerificationRequest,
  canRequestVerification, getSLAStatus, SLA_CONFIG, simulateVerification,
  type VerificationRequest, type SLATier
} from '@/lib/humanVerification';
import { CREDIT_COSTS } from '@/lib/credits';

interface RequestVerificationModalProps {
  finding: {
    id: string;
    name: string;
    category: string;
    severity: string;
    message?: string;
  };
  scan: {
    id: string;
    url: string;
  };
  user: {
    id: string;
    email: string;
  };
  onClose: () => void;
  onRequestSubmitted: (request: VerificationRequest) => void;
}

// Modal to request verification
export function RequestVerificationModal({
  finding,
  scan,
  user,
  onClose,
  onRequestSubmitted,
}: RequestVerificationModalProps) {
  const [selectedTier, setSelectedTier] = useState<SLATier>('standard');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRequest = canRequestVerification(finding.id, finding.severity);

  const handleSubmit = () => {
    if (!canRequest.allowed) {
      setError(canRequest.reason || 'Cannot request verification');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const request = createVerificationRequest(
        finding,
        scan,
        user,
        selectedTier,
        notes || undefined
      );
      
      setIsSubmitting(false);
      onRequestSubmitted(request);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" onClick={onClose}></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 font-mono text-sm">verification — request</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Finding summary */}
          <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-white">{finding.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${
                finding.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                finding.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {finding.severity}
              </span>
            </div>
            {finding.message && (
              <p className="text-xs text-gray-500">{finding.message}</p>
            )}
            <div className="text-[10px] text-gray-600 mt-1">
              Target: {scan.url}
            </div>
          </div>

          {/* SLA tier selection */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2 font-mono">SELECT_SLA_TIER</label>
            <div className="space-y-2">
              {(Object.entries(SLA_CONFIG) as [SLATier, typeof SLA_CONFIG.standard][]).map(([tier, config]) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedTier === tier
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-800 hover:border-gray-700 bg-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${selectedTier === tier ? 'text-white' : 'text-gray-400'}`}>
                      {config.name}
                    </span>
                    <span className="text-xs text-yellow-400">{config.credits} credits</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {config.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1 font-mono">ADDITIONAL_NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-green-500 h-20 resize-none"
              placeholder="Any context for the security expert..."
            />
          </div>

          {/* What you get */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg mb-4">
            <div className="text-xs text-blue-400 font-medium mb-2">What you&apos;ll receive:</div>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-blue-400" />
                Expert confirmation (true/false positive)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-blue-400" />
                Detailed analysis and notes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-blue-400" />
                Reproduction steps if confirmed
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-blue-400" />
                Remediation recommendation
              </li>
            </ul>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canRequest.allowed}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Request Verification ({SLA_CONFIG[selectedTier].credits} credits)
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 bg-[#111]">
          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
            <UserCheck className="w-3 h-3" />
            <span>verified by security experts • SLA guaranteed</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Verification status badge
export function VerificationBadge({ request }: { request: VerificationRequest }) {
  const slaStatus = getSLAStatus(request);
  
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending' },
    in_review: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Review' },
    verified_true_positive: { icon: CheckCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Confirmed' },
    verified_false_positive: { icon: XCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'False Positive' },
    needs_more_info: { icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Needs Info' },
    cancelled: { icon: X, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Cancelled' },
  };
  
  const config = statusConfig[request.status];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${config.bg}`}>
      <Icon className={`w-3 h-3 ${config.color} ${request.status === 'in_review' ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

// Verification requests list
export function VerificationRequestsList({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setRequests(getVerificationRequests().filter(r => r.userId === userId));
  }, [userId]);

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <UserCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No verification requests</p>
        <p className="text-gray-600 text-xs mt-1">Request expert review for critical findings</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => {
        const slaStatus = getSLAStatus(request);
        const isExpanded = expandedId === request.id;
        
        return (
          <div
            key={request.id}
            className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : request.id)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-800/30"
            >
              <div className="flex items-center gap-3">
                <VerificationBadge request={request} />
                <div className="text-left">
                  <div className="text-sm text-white">{request.findingName}</div>
                  <div className="text-xs text-gray-500">{request.scanUrl}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(request.status === 'pending' || request.status === 'in_review') && (
                  <span className={`text-xs ${slaStatus.isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                    {slaStatus.statusText}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 border-t border-gray-800 space-y-3">
                    {/* SLA Progress */}
                    {(request.status === 'pending' || request.status === 'in_review') && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>SLA Progress ({SLA_CONFIG[request.slaTier].name})</span>
                          <span>{slaStatus.statusText}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              slaStatus.isOverdue ? 'bg-red-500' :
                              slaStatus.percentComplete > 75 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${slaStatus.percentComplete}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* User notes */}
                    {request.userNotes && (
                      <div className="p-2 bg-gray-900/50 rounded text-xs text-gray-400">
                        <span className="text-gray-500">Your notes: </span>
                        {request.userNotes}
                      </div>
                    )}

                    {/* Verification result */}
                    {request.result && (
                      <div className={`p-3 rounded-lg ${
                        request.result.isConfirmed 
                          ? 'bg-red-500/10 border border-red-500/20' 
                          : 'bg-green-500/10 border border-green-500/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {request.result.isConfirmed ? (
                            <CheckCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-green-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            request.result.isConfirmed ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {request.result.isConfirmed ? 'Vulnerability Confirmed' : 'False Positive'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{request.result.expertNotes}</p>
                        <div className="text-xs text-gray-500">
                          <strong>Recommendation:</strong> {request.result.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <button
                        onClick={() => {
                          cancelVerificationRequest(request.id);
                          setRequests(getVerificationRequests().filter(r => r.userId === userId));
                        }}
                        className="text-xs text-gray-500 hover:text-red-400"
                      >
                        Cancel request
                      </button>
                    )}

                    {/* Demo: Simulate verification */}
                    {(request.status === 'pending' || request.status === 'in_review') && (
                      <button
                        onClick={() => {
                          simulateVerification(request.id);
                          setRequests(getVerificationRequests().filter(r => r.userId === userId));
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        [Demo] Simulate expert verification
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Button to request verification (for use in scan details)
export function RequestVerificationButton({
  finding,
  scan,
  user,
  onRequestSubmitted,
}: {
  finding: { id: string; name: string; category: string; severity: string };
  scan: { id: string; url: string };
  user: { id: string; email: string };
  onRequestSubmitted?: (request: VerificationRequest) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const canRequest = canRequestVerification(finding.id, finding.severity);

  if (!canRequest.allowed) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-medium hover:bg-purple-500/20"
      >
        <UserCheck className="w-3 h-3" />
        Request Verification
      </button>

      <AnimatePresence>
        {showModal && (
          <RequestVerificationModal
            finding={finding}
            scan={scan}
            user={user}
            onClose={() => setShowModal(false)}
            onRequestSubmitted={(request) => {
              onRequestSubmitted?.(request);
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

