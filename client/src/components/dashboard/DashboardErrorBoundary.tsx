'use client';

/**
 * Dashboard-specific Error Boundary
 * Provides a more contextual error UI for the dashboard
 */

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home, HelpCircle, Shield } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry with dashboard context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        error_boundary: true,
        location: 'dashboard',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard Error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-dark-secondary border border-dark-accent rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Dashboard Error
                </h1>
                <p className="text-sm text-gray-400">
                  Something went wrong loading your dashboard
                </p>
              </div>
            </div>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-dark-primary border border-red-500/30 rounded-lg p-4 mb-6 overflow-auto max-h-32">
                <p className="text-red-400 text-sm font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-dark-primary border border-dark-accent rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-3">This might help:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  Try refreshing the page
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  Clear your browser cache
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  Sign out and sign back in
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-dark-primary border border-dark-accent rounded-lg text-white hover:border-yellow-500/50 transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>

            {/* Support Link */}
            <div className="mt-6 pt-6 border-t border-dark-accent text-center">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-500 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Need help? Contact support
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Scan Modal Error Boundary
 * Lighter error UI for modal context
 */
export class ScanModalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      tags: {
        error_boundary: true,
        location: 'scan_modal',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Scanner Error
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Unable to initialize the scanner. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;

