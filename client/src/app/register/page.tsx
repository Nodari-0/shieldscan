'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { registerWithEmail, signInWithGoogle } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = await registerWithEmail(email, password, name);
      if (user.emailVerified) {
        toast.success('Account created!');
        router.replace('/dashboard');
      } else {
        toast.success('Account created! Check your email to verify your account.');
        router.replace('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      if (errorMessage.includes('CONFIGURATION_NOT_FOUND')) {
        toast.error('Firebase Authentication is not enabled. Please enable it in Firebase Console.');
      } else if (errorMessage.includes('email-already-in-use')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        toast.success('Account created!');
        router.replace('/dashboard');
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(error.message || 'Google signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4 py-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/logo/ShieldScanLogo.png"
                alt="ShieldScan Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold font-display text-yellow-500 group-hover:text-yellow-400 transition-colors">
              ShieldScan
            </span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6">
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm mb-4">Sign up to get started with ShieldScan</p>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-dark-primary border border-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="rounded border-dark-accent text-yellow-500 focus:ring-yellow-500"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-gray-400">
                I agree to the{' '}
                <Link href="/terms" className="text-yellow-500 hover:text-yellow-400">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-yellow-500 hover:text-yellow-400">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-black py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-accent"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-dark-secondary text-gray-400">or</span>
            </div>
          </div>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-dark-primary border border-dark-accent text-white py-2.5 rounded-lg font-medium text-sm hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Sign In Link */}
          <p className="mt-4 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-500 hover:text-yellow-400 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
