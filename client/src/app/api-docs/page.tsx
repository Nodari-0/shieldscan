'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Code, ExternalLink, Key, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/landing/Navigation';

export default function ApiDocsPage() {
  const [specUrl, setSpecUrl] = useState<string>('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setSpecUrl(`${origin}/api/docs/openapi`);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Code className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-heading">
                  API <span className="text-purple-500">Documentation</span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Interactive OpenAPI reference for the ShieldScan Developer API
                </p>
              </div>
            </div>
            
            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-secondary border border-dark-accent rounded-lg">
                <Key className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-300">
                  Auth: <code className="px-2 py-0.5 bg-dark-accent rounded text-yellow-400 text-xs ml-1">X-API-Key</code> header
                </span>
              </div>
              <Link 
                href="/developers"
                className="flex items-center gap-2 px-4 py-2 bg-dark-secondary border border-dark-accent rounded-lg hover:border-purple-500/50 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-300">Get API Keys</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </Link>
              {specUrl && (
                <a 
                  href={specUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-dark-secondary border border-dark-accent rounded-lg hover:border-purple-500/50 transition-colors"
                >
                  <Code className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-300">OpenAPI Spec</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              )}
            </div>
          </motion.div>

          {/* API Docs Iframe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {specUrl ? (
              <div className="rounded-xl border border-dark-accent overflow-hidden bg-white">
                <iframe
                  title="API Documentation"
                  src={`https://redocly.github.io/redoc/?url=${encodeURIComponent(specUrl)}`}
                  className="w-full h-[75vh]"
                  style={{ border: 'none' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[50vh] text-gray-500">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Loading API documentation...</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Footer Note */}
          <motion.div 
            className="mt-8 p-4 bg-dark-secondary/50 border border-dark-accent rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-gray-400">
              <strong className="text-white">Note:</strong> API access requires a Pro, Business, or Enterprise plan. 
              Visit the <Link href="/developers" className="text-purple-400 hover:text-purple-300">Developers page</Link> to generate your API key and view usage limits.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
