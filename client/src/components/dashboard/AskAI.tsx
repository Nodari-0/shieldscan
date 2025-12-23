'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Copy, Check, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskAIProps {
  scanData?: {
    url?: string;
    score?: number;
    vulnerabilities?: any[];
    checks?: any[];
  };
}

const SUGGESTIONS = [
  "How can I improve my website's security score?",
  "What are the most critical vulnerabilities to fix first?",
  "Explain the SSL/TLS security best practices",
  "How do I fix missing security headers?",
  "What is XSS and how do I prevent it?",
  "How to secure my API endpoints?",
];

export default function AskAI({ scanData }: AskAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent, customQuestion?: string) => {
    e?.preventDefault();
    const question = customQuestion || input.trim();
    if (!question || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response (in production, call your AI API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = generateAIResponse(question, scanData);
      
      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Ask AI Assistant
              <span className="px-1.5 py-0.5 text-[10px] bg-pink-500/20 text-pink-400 rounded font-medium">Beta</span>
            </h2>
            <p className="text-gray-500 text-xs">Get security recommendations and advice</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 space-y-4 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">How can I help you?</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Ask me anything about web security, vulnerabilities, or how to improve your security posture.
            </p>
            
            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(undefined, suggestion)}
                  className="text-left p-3 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-500/20' 
                    : 'bg-gradient-to-br from-pink-500/20 to-purple-600/20'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-pink-400" />
                  )}
                </div>
                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-xl text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500/20 text-white'
                      : 'bg-gray-800/50 text-gray-200'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="mt-1 text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1"
                    >
                      {copiedId === message.id ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex items-center gap-1 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask about security, vulnerabilities, or best practices..."
            className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none text-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          AI responses are for guidance only. Always verify security recommendations.
        </p>
      </form>
    </div>
  );
}

// Simulated AI response generator
function generateAIResponse(question: string, scanData?: any): string {
  const q = question.toLowerCase();
  
  if (q.includes('security score') || q.includes('improve')) {
    return `To improve your website's security score, focus on these key areas:

**1. Security Headers**
- Add Content-Security-Policy (CSP)
- Enable X-Frame-Options
- Set X-Content-Type-Options: nosniff
- Add Referrer-Policy

**2. SSL/TLS Configuration**
- Use TLS 1.3 where possible
- Enable HSTS with preload
- Use strong cipher suites

**3. API Security**
- Implement rate limiting
- Use proper authentication
- Validate all inputs

**4. Regular Updates**
- Keep dependencies updated
- Monitor for vulnerabilities
- Apply security patches promptly

Would you like more details on any of these areas?`;
  }
  
  if (q.includes('xss') || q.includes('cross-site scripting')) {
    return `**Cross-Site Scripting (XSS) Prevention**

XSS attacks occur when malicious scripts are injected into trusted websites. Here's how to prevent them:

**1. Output Encoding**
\`\`\`javascript
// Always encode user input before displaying
const safeOutput = encodeHTML(userInput);
\`\`\`

**2. Content Security Policy**
\`\`\`
Content-Security-Policy: script-src 'self'
\`\`\`

**3. Input Validation**
- Validate and sanitize all user inputs
- Use allowlists for accepted characters
- Reject suspicious patterns

**4. HTTPOnly Cookies**
- Mark sensitive cookies as HTTPOnly
- Prevents JavaScript access to cookies

**5. Use Modern Frameworks**
- React, Vue, Angular escape content by default
- Avoid using dangerouslySetInnerHTML`;
  }
  
  if (q.includes('ssl') || q.includes('tls') || q.includes('https')) {
    return `**SSL/TLS Security Best Practices**

**1. Use TLS 1.3**
- Faster and more secure
- Disable TLS 1.0 and 1.1

**2. Enable HSTS**
\`\`\`
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
\`\`\`

**3. Certificate Management**
- Use certificates from trusted CAs
- Monitor expiration dates
- Consider automated renewal (Let's Encrypt)

**4. Strong Cipher Suites**
- Prefer ECDHE for key exchange
- Use AES-GCM for encryption
- Disable weak ciphers (RC4, 3DES)

**5. Perfect Forward Secrecy**
- Ensures session keys aren't compromised
- Even if long-term key is leaked`;
  }
  
  if (q.includes('header') || q.includes('security headers')) {
    return `**Essential Security Headers**

Add these headers to your server configuration:

**1. Content-Security-Policy**
\`\`\`
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
\`\`\`

**2. X-Frame-Options**
\`\`\`
X-Frame-Options: DENY
\`\`\`

**3. X-Content-Type-Options**
\`\`\`
X-Content-Type-Options: nosniff
\`\`\`

**4. Referrer-Policy**
\`\`\`
Referrer-Policy: strict-origin-when-cross-origin
\`\`\`

**5. Permissions-Policy**
\`\`\`
Permissions-Policy: geolocation=(), microphone=(), camera=()
\`\`\`

For Nginx, add these in your server block. For Apache, use .htaccess or httpd.conf.`;
  }
  
  if (q.includes('api') || q.includes('endpoint')) {
    return `**API Security Best Practices**

**1. Authentication**
- Use JWT or OAuth 2.0
- Implement proper token expiration
- Never expose API keys in client code

**2. Rate Limiting**
\`\`\`javascript
// Example with Express
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
\`\`\`

**3. Input Validation**
- Validate all parameters
- Use schema validation (Joi, Zod)
- Sanitize SQL and NoSQL queries

**4. Error Handling**
- Don't expose stack traces
- Use generic error messages
- Log detailed errors server-side

**5. CORS Configuration**
\`\`\`javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  methods: ['GET', 'POST']
}));
\`\`\``;
  }
  
  if (q.includes('vulnerabilit') || q.includes('critical') || q.includes('fix first')) {
    return `**Prioritizing Vulnerability Fixes**

Fix vulnerabilities in this order:

**🔴 Critical (Fix Immediately)**
1. SQL Injection
2. Remote Code Execution
3. Authentication Bypass
4. Exposed Credentials

**🟠 High (Fix Within 24-48 Hours)**
1. Cross-Site Scripting (XSS)
2. Missing Security Headers
3. Outdated Software with CVEs
4. Insecure Direct Object References

**🟡 Medium (Fix Within a Week)**
1. Missing HTTPS
2. Weak Password Policies
3. Session Management Issues
4. Information Disclosure

**🟢 Low (Fix When Possible)**
1. Verbose Error Messages
2. Missing Non-Critical Headers
3. Cookie Security Flags
4. Minor Misconfigurations

Would you like specific guidance on fixing any of these?`;
  }

  // Default response
  return `Great question! Here's what I can help you with:

**Security Topics I Cover:**
- Vulnerability assessment and remediation
- Security headers configuration
- SSL/TLS best practices
- API security guidelines
- Authentication and authorization
- Input validation and sanitization
- OWASP Top 10 vulnerabilities

**For Your Specific Question:**
I'd be happy to provide more targeted advice. Could you share:
1. Your current security concerns
2. Any specific scan results you'd like to discuss
3. The technologies/frameworks you're using

This will help me give you more relevant recommendations!`;
}

