'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Github, GitBranch, Terminal, Copy, Check,
  FileJson, FileCode, ChevronDown, ExternalLink
} from 'lucide-react';
import { generateSARIFReport, generatePRComment, generateCLIOutput, exportForCI, evaluateBuildPolicy } from '@/lib/cicd';
import type { ScanResult } from '@/types/scan';

interface CICDExportProps {
  scanResult: ScanResult;
  targetUrl: string;
}

type ExportFormat = 'sarif' | 'json' | 'markdown' | 'cli';

export default function CICDExport({ scanResult, targetUrl }: CICDExportProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('sarif');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const buildDecision = evaluateBuildPolicy(scanResult);

  const formats = [
    { 
      id: 'sarif' as const, 
      label: 'SARIF', 
      icon: <FileJson className="w-4 h-4" />,
      description: 'GitHub, GitLab, Azure DevOps',
      ext: '.sarif.json'
    },
    { 
      id: 'json' as const, 
      label: 'JSON', 
      icon: <FileCode className="w-4 h-4" />,
      description: 'CI/CD pipelines',
      ext: '.json'
    },
    { 
      id: 'markdown' as const, 
      label: 'Markdown', 
      icon: <Github className="w-4 h-4" />,
      description: 'PR comments',
      ext: '.md'
    },
    { 
      id: 'cli' as const, 
      label: 'CLI', 
      icon: <Terminal className="w-4 h-4" />,
      description: 'Terminal output',
      ext: '.txt'
    },
  ];

  const getExportContent = (): string => {
    switch (selectedFormat) {
      case 'sarif':
        return JSON.stringify(generateSARIFReport(scanResult, targetUrl), null, 2);
      case 'json':
        return JSON.stringify(exportForCI(scanResult, buildDecision), null, 2);
      case 'markdown':
        return generatePRComment(scanResult, targetUrl).body;
      case 'cli':
        return generateCLIOutput(scanResult, buildDecision);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const format = formats.find(f => f.id === selectedFormat);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const hostname = new URL(targetUrl).hostname.replace(/\./g, '-');
    a.download = `shieldscan-${hostname}-${Date.now()}${format?.ext || '.txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <GitBranch className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">CI/CD Integration</h3>
              <p className="text-xs text-gray-500">Export for your pipeline</p>
            </div>
          </div>
          
          {/* Build status badge */}
          <div className={`px-3 py-1.5 rounded-lg border ${
            buildDecision.shouldFail 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-green-500/10 border-green-500/30'
          }`}>
            <span className={`text-xs font-medium ${
              buildDecision.shouldFail ? 'text-red-400' : 'text-green-400'
            }`}>
              {buildDecision.shouldFail ? '❌ Would Fail' : '✅ Would Pass'}
            </span>
          </div>
        </div>
      </div>

      {/* Format selector */}
      <div className="p-4 border-b border-gray-800">
        <label className="text-xs text-gray-500 mb-2 block">Export Format</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {formats.map(format => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedFormat === format.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`flex items-center gap-2 mb-1 ${
                selectedFormat === format.id ? 'text-purple-400' : 'text-gray-400'
              }`}>
                {format.icon}
                <span className="text-sm font-medium">{format.label}</span>
              </div>
              <div className="text-[10px] text-gray-500">{format.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full p-3 flex items-center justify-between text-sm text-gray-400 hover:bg-gray-800/30 border-b border-gray-800"
      >
        <span>Preview Output</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
      </button>

      {/* Preview content */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <pre className="p-4 text-xs text-gray-400 font-mono bg-black/50 max-h-80 overflow-auto">
                {getExportContent()}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="p-4 bg-gray-900/30 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-4 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Integration guides */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-3">Quick Setup Guides</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'GitHub Actions', url: '#github' },
            { name: 'GitLab CI', url: '#gitlab' },
            { name: 'Jenkins', url: '#jenkins' },
            { name: 'Azure DevOps', url: '#azure' },
          ].map(guide => (
            <a
              key={guide.name}
              href={guide.url}
              className="px-3 py-2 bg-gray-800/50 rounded-lg text-xs text-gray-400 hover:text-white flex items-center justify-between"
            >
              {guide.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Code snippet */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2">GitHub Actions Snippet</p>
        <pre className="p-3 bg-black/50 rounded-lg text-[10px] text-gray-400 font-mono overflow-x-auto">
{`- name: Security Scan
  run: |
    curl -X POST https://api.shieldscan.io/scan \\
      -H "Authorization: Bearer \${{ secrets.SHIELDSCAN_API_KEY }}" \\
      -H "Content-Type: application/json" \\
      -d '{"url": "\${{ env.DEPLOY_URL }}"}' \\
      -o scan-results.sarif.json
    
- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: scan-results.sarif.json`}
        </pre>
      </div>
    </div>
  );
}

