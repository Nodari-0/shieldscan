'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/landing/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTestimonial } from '@/firebase/firestore';
import { ArrowLeft, Star, MessageSquare, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function TestimonialsPage() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    rating: 5,
    message: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/testimonials');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setError('Please write at least 10 characters about your experience');
      return;
    }

    if (!user || !userProfile) {
      setError('You must be logged in to share your experience');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTestimonial({
        userId: user.uid,
        userEmail: user.email || '',
        authorName: userProfile.displayName || userProfile.email.split('@')[0],
        authorPhotoURL: userProfile.photoURL,
        rating: formData.rating,
        message: formData.message.trim(),
      });

      setSuccess(true);
      setFormData({ rating: 5, message: '' });
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      console.error('Error creating testimonial:', err);
      setError(err.message || 'Failed to submit your review. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-2xl">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white font-heading">
                  Share Your Experience
                </h1>
                <p className="text-gray-400 mt-1">
                  Tell others about your experience with ShieldScan and help them discover better security scanning
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Thank you for sharing!</p>
                <p className="text-gray-400 text-sm">Your review will be reviewed and may appear on our homepage. Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-white font-medium mb-3">
                How would you rate ShieldScan? *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`p-2 rounded-lg transition-colors ${
                      star <= formData.rating
                        ? 'text-yellow-500 bg-yellow-500/20'
                        : 'text-gray-600 bg-dark-secondary border border-dark-accent'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-gray-400 text-sm">
                  {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-white font-medium mb-2">
                Share your experience * (Minimum 10 characters)
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your experience with ShieldScan. What do you like? How has it helped you? Why would you recommend it to others?"
                rows={8}
                className="w-full px-4 py-3 bg-dark-secondary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                required
                minLength={10}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-gray-500 text-xs">
                  {formData.message.length} characters
                </p>
                {formData.message.length < 10 && (
                  <p className="text-yellow-500 text-xs">
                    {10 - formData.message.length} more characters needed
                  </p>
                )}
              </div>
            </div>

            {/* Preview Info */}
            <div className="p-4 bg-dark-secondary border border-dark-accent rounded-xl">
              <p className="text-gray-400 text-sm mb-2">
                <strong className="text-white">Reviewer:</strong> {userProfile?.displayName || user?.email?.split('@')[0]}
              </p>
              <p className="text-gray-400 text-sm">
                <strong className="text-white">Note:</strong> Your review will be reviewed before being published on our homepage.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link
                href="/"
                className="px-6 py-3 bg-dark-primary border border-dark-accent rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || formData.message.length < 10}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

