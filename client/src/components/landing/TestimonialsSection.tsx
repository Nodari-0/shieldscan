'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getApprovedTestimonials, Testimonial } from '@/firebase/firestore';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const approved = await getApprovedTestimonials();
      setTestimonials(approved);
      setLoading(false);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      setLoading(false);
    }
  };

  // Duplicate testimonials for seamless infinite loop
  const duplicatedTestimonials = testimonials.length > 0 
    ? [...testimonials, ...testimonials, ...testimonials, ...testimonials]
    : [];

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
              What Our <span className="text-yellow-500">Users Say</span>
            </h2>
            <p className="text-gray-400">Loading testimonials...</p>
          </motion.div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading"
            >
              What Our <span className="text-yellow-500">Users Say</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 mb-6">
              Be the first to share your experience!
            </motion.p>
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/testimonials"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                Share Your Experience
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Calculate animation duration based on number of testimonials
  const animationDuration = Math.max(80, testimonials.length * 20);

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <motion.div 
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-white mb-3 font-heading"
          >
            What Our <span className="text-yellow-500">Users Say</span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-gray-500 max-w-2xl mx-auto text-sm"
          >
            Real experiences from users who trust ShieldScan
          </motion.p>
        </motion.div>
      </div>

      {/* Simple text marquee - no cards */}
      <div className="relative w-full overflow-hidden py-8">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        
        <div 
          className="flex animate-testimonial-scroll"
          style={{
            animationDuration: `${animationDuration}s`,
          }}
        >
          {duplicatedTestimonials.map((testimonial, idx) => {
            const testimonialDate = testimonial.createdAt instanceof Date
              ? testimonial.createdAt
              : (testimonial.createdAt as Timestamp)?.toDate?.() || new Date();

            return (
              <div
                key={`${testimonial.id}-${idx}`}
                className="flex-shrink-0 px-8 md:px-12 border-r border-dark-accent/30 last:border-r-0"
              >
                <div className="max-w-xs md:max-w-sm">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= testimonial.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
                    &ldquo;{testimonial.message}&rdquo;
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500/30 to-purple-500/30 flex items-center justify-center">
                      <span className="text-yellow-500 font-semibold text-[10px]">
                        {testimonial.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{testimonial.authorName}</p>
                      <p className="text-gray-600 text-[10px]">
                        {testimonialDate.toLocaleDateString('en-US', { 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.div 
        className="text-center mt-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href="/testimonials"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors"
        >
          Share Your Experience
        </Link>
      </motion.div>
    </section>
  );
}
