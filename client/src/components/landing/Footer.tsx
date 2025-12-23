'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import CookieSettingsButton from '@/components/cookies/CookieSettingsButton';
import LanguageSelector from '@/components/LanguageSelector';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function Footer() {
  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Mail, href: 'mailto:contact@shieldscan.com', label: 'Email' },
  ];

  const footerLinks = {
    products: [
      { label: 'Website Scanner', href: '/products#website-scanner' },
      { label: 'API Security', href: '/products#api-security' },
      { label: 'Cloud Security', href: '/products#cloud-security' },
      { label: 'Internal Scanning', href: '/products#internal-scanning' },
    ],
    solutions: [
      { label: 'For Developers', href: '/solutions' },
      { label: 'For Agencies', href: '/solutions' },
      { label: 'For Enterprises', href: '/solutions' },
      { label: 'For Startups', href: '/solutions' },
    ],
    resources: [
      { label: 'Blog', href: '/blog' },
      { label: 'Documentation', href: '/documentation' },
      { label: 'API Reference', href: '/developers' },
      { label: 'Help Center', href: '/help' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Partners', href: '/partners' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Share Experience', href: '/testimonials' },
    ],
  };

  return (
    <footer className="pt-12 sm:pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-10 sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {/* Company Info - Full width on mobile, 2 cols on lg */}
          <motion.div variants={fadeInUp} className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4 group">
              <motion.div 
                className="w-10 h-10 flex-shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/logo/ShieldScanLogo.png"
                  alt="ShieldScan Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <span className="text-xl font-bold font-display text-yellow-500 group-hover:text-yellow-400 transition-colors">
                ShieldScan
              </span>
            </Link>
            <p className="text-gray-400 mb-4 max-w-sm text-sm sm:text-base">
              Protect your digital assets with comprehensive cybersecurity scanning. Built for modern businesses.
            </p>
            <p className="text-gray-500 text-sm mb-2">
              contact@shieldscan.com
            </p>
            <Link
              href="mailto:contact@shieldscan.com"
              className="text-yellow-500 hover:text-yellow-400 text-sm underline cursor-pointer"
            >
              Get in touch
            </Link>
            
            {/* Social Links */}
            <div className="flex items-center space-x-3 mt-6">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-dark-accent flex items-center justify-center text-gray-400 hover:text-white hover:border-yellow-500 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Products */}
          <motion.div variants={fadeInUp} className="col-span-1">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Products</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.products.map((link, index) => (
                <motion.li 
                  key={link.label}
                  whileHover={{ x: 3 }}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={link.href} className="text-gray-400 hover:text-yellow-500 transition-colors text-xs sm:text-sm cursor-pointer">
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions */}
          <motion.div variants={fadeInUp} className="col-span-1">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Solutions</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.solutions.map((link, index) => (
                <motion.li 
                  key={link.label}
                  whileHover={{ x: 3 }}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={link.href} className="text-gray-400 hover:text-yellow-500 transition-colors text-xs sm:text-sm cursor-pointer">
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div variants={fadeInUp} className="col-span-1">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.resources.map((link, index) => (
                <motion.li 
                  key={link.label}
                  whileHover={{ x: 3 }}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={link.href} className="text-gray-400 hover:text-yellow-500 transition-colors text-xs sm:text-sm cursor-pointer">
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div variants={fadeInUp} className="col-span-1">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link, index) => (
                <motion.li 
                  key={link.label}
                  whileHover={{ x: 3 }}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={link.href} className="text-gray-400 hover:text-yellow-500 transition-colors text-xs sm:text-sm cursor-pointer">
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-6 sm:pt-8 border-t border-dark-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
              <Image
                src="/logo/ShieldScanLogo.png"
                alt="ShieldScan"
                width={24}
                height={24}
                className="w-full h-full object-contain opacity-50"
              />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} ShieldScan. All Rights Reserved
            </span>
          </div>
          <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6">
            <LanguageSelector variant="compact" />
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/terms" className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm transition-colors cursor-pointer">
                Terms
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm transition-colors cursor-pointer">
                Privacy
              </Link>
            </motion.div>
            <CookieSettingsButton variant="text" className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm" />
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
