'use client';

import { Evidence } from '@/types/scan';
import { FileCode, Globe, Camera, ListOrdered } from 'lucide-react';

interface EvidenceViewerProps {
  evidence?: Evidence;
  /** If true, shows "No evidence" message when evidence is missing. Default: false */
  showEmpty?: boolean;
}

/**
 * Compact evidence viewer for checks and vulnerabilities.
 * Shows request/response snippets, reproduction steps, proof-of-impact, and optional screenshot.
 * For informational findings, evidence is intentionally omitted - don't show anything.
 */
export default function EvidenceViewer({ evidence, showEmpty = false }: EvidenceViewerProps) {
  // Don't render anything if no evidence (informational findings)
  if (!evidence) {
    if (!showEmpty) return null;
    return null; // Never show "no evidence" - it's misleading
  }

  const { request, response, reproductionSteps, proofOfImpact, screenshot } = evidence;
  
  // Check if response contains binary/encrypted data message
  const isBinaryResponse = response?.bodyPreview?.includes('[Binary') || 
                           response?.bodyPreview?.includes('[Empty') ||
                           response?.body?.includes('[Binary');
  
  // Don't show evidence if there's nothing meaningful to display
  const hasContent = proofOfImpact || 
                     (reproductionSteps && reproductionSteps.length > 0) ||
                     (request && request.url) ||
                     (response && !isBinaryResponse && response.bodyPreview) ||
                     screenshot;
  
  if (!hasContent) return null;

  return (
    <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-2 text-xs">
      {proofOfImpact && (
        <div className="text-gray-200">
          <span className="text-gray-500 font-semibold">Proof of impact: </span>
          {proofOfImpact}
        </div>
      )}

      {reproductionSteps && reproductionSteps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-gray-400 font-semibold mb-1">
            <ListOrdered className="w-4 h-4" />
            Reproduction steps
          </div>
          <ol className="list-decimal list-inside space-y-1 text-gray-300">
            {reproductionSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {request && (
        <div className="border border-gray-800 rounded-lg p-2 bg-black/30">
          <div className="flex items-center gap-2 text-gray-400 font-semibold mb-1">
            <Globe className="w-4 h-4" />
            Request
          </div>
          <div className="text-gray-200 font-mono">
            <span className="text-green-400">{request.method}</span> {request.url}
          </div>
          {request.body && (
            <pre className="mt-1 text-[10px] text-gray-400 bg-black/40 rounded p-2 overflow-x-auto">
{request.body}
            </pre>
          )}
        </div>
      )}

      {response && !isBinaryResponse && (
        <div className="border border-gray-800 rounded-lg p-2 bg-black/30">
          <div className="flex items-center gap-2 text-gray-400 font-semibold mb-1">
            <FileCode className="w-4 h-4" />
            Response
          </div>
          <div className="text-gray-200 font-mono">
            <span className="text-blue-400">{response.status || 'N/A'}</span>
            {response.bodyPreview && !response.bodyPreview.startsWith('[') && (
              <span className="text-gray-500"> • {response.bodyPreview}</span>
            )}
          </div>
          {response.body && !response.body.startsWith('[') && (
            <pre className="mt-1 text-[10px] text-gray-400 bg-black/40 rounded p-2 overflow-x-auto max-h-40">
{response.body}
            </pre>
          )}
        </div>
      )}

      {screenshot && (
        <div className="border border-gray-800 rounded-lg p-2 bg-black/30">
          <div className="flex items-center gap-2 text-gray-400 font-semibold mb-1">
            <Camera className="w-4 h-4" />
            Screenshot
          </div>
          <img
            src={screenshot}
            alt="Evidence screenshot"
            className="rounded border border-gray-800 max-h-60 object-contain"
          />
        </div>
      )}
    </div>
  );
}

