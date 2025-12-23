'use client';

import { useState } from 'react';
import { X, Sparkles, Send, Loader2, CheckCircle, AlertTriangle, Shield, Lightbulb, Code, Globe } from 'lucide-react';

interface ScanCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'info' | 'error';
  message: string;
  details?: string;
  severity: string;
}

interface ScanContext {
  url: string;
  score: number;
  grade: string;
  summary: { passed: number; warnings: number; failed: number; };
  technologies?: string[];
}

interface AskAIPopupProps {
  isOpen: boolean;
  onClose: () => void;
  checkData: ScanCheck | null;
  scanContext?: ScanContext;
}

const AI_KNOWLEDGE_BASE: Record<string, {
  whatIsIt: string;
  whyItMatters: string;
  ifPassed: string;
  ifFailed: string;
  howToFix: string[];
  codeExample?: string;
  quickTips: string[];
  riskLevel: string;
  resources: string[];
}> = {
  'Content-Security-Policy': {
    whatIsIt: 'Content Security Policy (CSP) is a security header that acts as a whitelist, telling browsers which sources of content are trusted.',
    whyItMatters: 'XSS is one of the most common web attacks. CSP is your primary defense against it.',
    ifPassed: 'Your site has CSP configured, significantly reducing XSS attack risk.',
    ifFailed: 'Your site is vulnerable to XSS attacks. Attackers could inject malicious scripts.',
    howToFix: ['Start with a report-only policy to test', 'Use strict-dynamic for modern script handling', 'Avoid unsafe-inline and unsafe-eval'],
    codeExample: `// Next.js - next.config.js
const securityHeaders = [{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self';"
}];`,
    quickTips: ['Start with report-only mode', 'Never use unsafe-inline in production', 'Use CSP reporting'],
    riskLevel: 'HIGH',
    resources: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'],
  },
  'X-Frame-Options': {
    whatIsIt: 'X-Frame-Options controls whether your site can be embedded in iframes on other websites.',
    whyItMatters: 'Clickjacking attacks trick users into clicking hidden elements by overlaying your legitimate site.',
    ifPassed: 'Your site cannot be embedded in malicious iframes.',
    ifFailed: 'Your site can be embedded in iframes anywhere, enabling clickjacking attacks.',
    howToFix: ['Add X-Frame-Options: DENY', 'Use SAMEORIGIN if you need to frame your own pages'],
    codeExample: `// Nginx
add_header X-Frame-Options "DENY" always;`,
    quickTips: ['DENY is the safest option', 'This is a quick win - add it in minutes'],
    riskLevel: 'MEDIUM',
    resources: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'],
  },
  'Strict-Transport-Security': {
    whatIsIt: 'HSTS tells browsers to ONLY connect to your site using HTTPS.',
    whyItMatters: 'Without HSTS, the first request might be HTTP, giving attackers a window to intercept traffic.',
    ifPassed: 'Browsers will only connect to your site via HTTPS.',
    ifFailed: 'Your HTTPS site can still receive initial HTTP requests.',
    howToFix: ['Ensure your site works 100% on HTTPS first', 'Start with a short max-age to test', 'Consider HSTS preloading'],
    codeExample: `// Nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
    quickTips: ['Start with short max-age while testing', 'Submit to hstspreload.org for browser preloading'],
    riskLevel: 'MEDIUM',
    resources: ['https://hstspreload.org/'],
  },
  'SSL': {
    whatIsIt: 'SSL/TLS certificates encrypt all data between users and your server.',
    whyItMatters: 'Without SSL, all data is sent in plain text that anyone on the network can read.',
    ifPassed: 'Your SSL certificate is valid and properly configured.',
    ifFailed: 'Your SSL certificate is invalid, expired, or missing.',
    howToFix: ['Get a free certificate from Let\'s Encrypt', 'Set up automatic renewal', 'Enable TLS 1.2/1.3'],
    codeExample: `# Install Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com`,
    quickTips: ['Let\'s Encrypt is free and trusted', 'Set up automatic renewal'],
    riskLevel: 'CRITICAL',
    resources: ['https://letsencrypt.org/', 'https://www.ssllabs.com/ssltest/'],
  },
  'XSS': {
    whatIsIt: 'Cross-Site Scripting (XSS) is when attackers inject malicious JavaScript into your web pages.',
    whyItMatters: 'XSS is in the OWASP Top 10. Attackers can steal session cookies, capture passwords.',
    ifPassed: 'No obvious XSS vulnerabilities detected.',
    ifFailed: 'Potential XSS vulnerability found! User input may be reflected without sanitization.',
    howToFix: ['Always sanitize ALL user inputs', 'Implement Content Security Policy', 'Use frameworks that auto-escape'],
    codeExample: `// ❌ VULNERABLE
element.innerHTML = userInput;
// ✅ SAFE
element.textContent = userInput;`,
    quickTips: ['Use React/Vue - they escape by default', 'HttpOnly cookies can\'t be stolen via XSS'],
    riskLevel: 'CRITICAL',
    resources: ['https://owasp.org/www-community/attacks/xss/'],
  },
  'default': {
    whatIsIt: 'This security check evaluates a specific aspect of your website\'s security configuration.',
    whyItMatters: 'Every security check contributes to your overall security posture.',
    ifPassed: 'This security check passed! Your configuration follows best practices.',
    ifFailed: 'This check identified a potential issue that should be addressed.',
    howToFix: ['Review the specific issue', 'Research best practices', 'Implement the fix in test environment'],
    quickTips: ['Check OWASP for security guidance', 'Always test changes in staging first'],
    riskLevel: 'Varies',
    resources: ['https://owasp.org/', 'https://cheatsheetseries.owasp.org/'],
  },
};

export default function AskAIPopup({ isOpen, onClose, checkData, scanContext }: AskAIPopupProps) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !checkData) return null;

  const getKnowledge = () => {
    const searchTerms = [checkData.name.toLowerCase(), checkData.message.toLowerCase(), checkData.category.toLowerCase()].join(' ');
    for (const key of Object.keys(AI_KNOWLEDGE_BASE)) {
      if (searchTerms.includes(key.toLowerCase())) return AI_KNOWLEDGE_BASE[key];
    }
    return AI_KNOWLEDGE_BASE['default'];
  };

  const knowledge = getKnowledge();
  const isPassed = checkData.status === 'passed' || checkData.status === 'info';
  const isFailed = checkData.status === 'failed';

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('AI Chat integration coming soon!');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-accent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dark-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-white font-semibold">AI Security Assistant</h2>
              <p className="text-xs text-gray-500">{checkData.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-dark-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
          {/* Status */}
          <div className={`p-3 rounded-lg border ${isPassed ? 'bg-green-500/5 border-green-500/20' : isFailed ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPassed ? 'bg-green-500/10 text-green-500' : isFailed ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {isPassed ? <CheckCircle className="w-5 h-5" /> : isFailed ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPassed ? 'bg-green-500/20 text-green-400' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {isPassed ? 'PASSED' : isFailed ? 'FAILED' : 'WARNING'}
                  </span>
                  <span className="text-xs text-gray-600">{checkData.category}</span>
                </div>
                <p className="text-sm text-gray-400">{checkData.message}</p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-dark-primary border border-dark-accent rounded-lg p-3">
            <p className="text-sm text-gray-300">{isPassed ? knowledge.ifPassed : knowledge.ifFailed}</p>
          </div>

          {/* Context */}
          {scanContext && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-2">
                <div className="font-bold text-white">{scanContext.score}</div>
                <div className="text-gray-500">Score</div>
              </div>
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-2">
                <div className="font-bold text-green-500">{scanContext.summary.passed}</div>
                <div className="text-gray-500">Passed</div>
              </div>
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-2">
                <div className="font-bold text-yellow-500">{scanContext.summary.warnings}</div>
                <div className="text-gray-500">Warnings</div>
              </div>
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-2">
                <div className="font-bold text-red-500">{scanContext.summary.failed}</div>
                <div className="text-gray-500">Failed</div>
              </div>
            </div>
          )}

          {/* What Is It */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <Lightbulb className="w-4 h-4" />
              <h4 className="text-sm font-medium">What is this?</h4>
            </div>
            <p className="text-sm text-gray-300">{knowledge.whatIsIt}</p>
          </div>

          {/* Why It Matters */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-sm font-medium">Why it matters</h4>
              <span className={`text-xs px-1.5 py-0.5 rounded ${knowledge.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : knowledge.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {knowledge.riskLevel}
              </span>
            </div>
            <p className="text-sm text-gray-300">{knowledge.whyItMatters}</p>
          </div>

          {/* How To Fix */}
          {!isPassed && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <CheckCircle className="w-4 h-4" />
                <h4 className="text-sm font-medium">How to fix</h4>
              </div>
              <div className="space-y-1.5">
                {knowledge.howToFix.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-dark-accent text-gray-400 flex items-center justify-center text-xs flex-shrink-0">{idx + 1}</span>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Example */}
          {knowledge.codeExample && !isPassed && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Code className="w-4 h-4" />
                <h4 className="text-sm font-medium">Code example</h4>
              </div>
              <div className="bg-black rounded-lg p-3 border border-dark-accent overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono">{knowledge.codeExample}</pre>
              </div>
            </div>
          )}

          {/* Resources */}
          {knowledge.resources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Globe className="w-4 h-4" />
                <h4 className="text-sm font-medium">Resources</h4>
              </div>
              <div className="space-y-1">
                {knowledge.resources.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-500 hover:text-gray-300 truncate">
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Ask Question */}
          <div className="pt-3 border-t border-dark-accent">
            <div className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <button
                onClick={handleAskQuestion}
                disabled={isLoading || !customQuestion.trim()}
                className="px-3 py-2 bg-dark-accent text-gray-300 rounded-lg hover:bg-dark-primary disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-accent">
          <button onClick={onClose} className="w-full py-2 bg-dark-accent text-gray-300 rounded-lg hover:bg-dark-primary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
