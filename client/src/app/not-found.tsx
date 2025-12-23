'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Home, ArrowLeft, Search, Bug, Lock } from 'lucide-react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="relative inline-block">
              {/* Glitch effect text */}
              <h1 className="text-9xl md:text-[12rem] font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 animate-pulse">
                404
              </h1>
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-red-500/20 to-purple-500/20 blur-3xl animate-pulse" />
            </div>
          </div>

          {/* Shield Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Shield className="w-24 h-24 text-yellow-500 animate-bounce" />
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-400 mb-2">
            The page you're looking for has been
          </p>
          <p className="text-lg text-gray-500 mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400">
              <Lock className="w-4 h-4" />
              Secured Away
            </span>
          </p>

          {/* Security-themed message */}
          <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4 text-left">
              <Bug className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">
                  Security Alert: Invalid Request
                </h3>
                <p className="text-gray-400 text-sm">
                  This page doesn't exist in our secure directory. It may have been moved, deleted, or the URL might be incorrect.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-all hover:scale-105 shadow-lg shadow-yellow-500/20"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>

            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 bg-dark-secondary border border-dark-accent text-white rounded-lg font-semibold hover:bg-dark-tertiary transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-dark-secondary border border-dark-accent text-white rounded-lg font-semibold hover:bg-dark-tertiary transition-all"
            >
              <Search className="w-5 h-5" />
              Dashboard
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-dark-accent">
            <p className="text-gray-500 text-sm mb-4">Popular Pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="text-yellow-500 hover:text-yellow-400 text-sm transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/products"
                className="text-yellow-500 hover:text-yellow-400 text-sm transition-colors"
              >
                Products
              </Link>
              <Link
                href="/solutions"
                className="text-yellow-500 hover:text-yellow-400 text-sm transition-colors"
              >
                Solutions
              </Link>
              <Link
                href="/resources"
                className="text-yellow-500 hover:text-yellow-400 text-sm transition-colors"
              >
                Resources
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

