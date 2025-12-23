'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, Target, Users, Globe, Award, Zap, 
  ArrowRight, CheckCircle, Mail, MapPin, Phone,
  Linkedin, Twitter, Github
} from 'lucide-react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'We believe security should be accessible to everyone, not just large enterprises with massive budgets.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Target,
      title: 'Precision',
      description: 'Our scanning technology is built for accuracy, minimizing false positives while catching real threats.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Users,
      title: 'Customer Focus',
      description: 'We work closely with our customers to understand their needs and continuously improve our platform.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We constantly evolve our technology to stay ahead of emerging threats and attack vectors.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  const milestones = [
    { year: '2023', title: 'Founded', description: 'ShieldScan was born from a vision to democratize cybersecurity' },
    { year: '2023', title: 'First 1,000 Scans', description: 'Reached our first milestone of protecting websites worldwide' },
    { year: '2024', title: 'Cloud Security Launch', description: 'Expanded to AWS, Azure, and Google Cloud security scanning' },
    { year: '2024', title: 'Enterprise Features', description: 'Launched attack surface monitoring and DAST capabilities' },
  ];

  const certifications = [
    { name: 'SOC 2 Type II', description: 'Certified' },
    { name: 'ISO 27001', description: 'Compliant' },
    { name: 'GDPR', description: 'Compliant' },
    { name: 'PCI DSS', description: 'Compliant' },
  ];

  const stats = [
    { value: '50K+', label: 'Security Scans' },
    { value: '2.5K+', label: 'Happy Customers' },
    { value: '140K+', label: 'Security Checks' },
    { value: '99.9%', label: 'Uptime' },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="px-4 py-20 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-sm mb-6"
            >
              <Shield className="w-4 h-4" />
              <span>About ShieldScan</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 font-heading"
            >
              Security that works for the{' '}
              <span className="text-yellow-500">99%</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
            >
              We're on a mission to make enterprise-grade security accessible to businesses of all sizes. 
              No complexity, no massive budgets required.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border border-dark-accent hover:border-gray-600 text-white font-semibold rounded-xl transition-colors"
              >
                Contact Us
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="text-center p-6 bg-dark-secondary border border-dark-accent rounded-xl"
                >
                  <div className="text-3xl md:text-4xl font-bold text-yellow-500 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">
                  Our Mission
                </h2>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  The cybersecurity landscape is complex and ever-evolving. Large enterprises have dedicated security teams 
                  and million-dollar budgets. But what about the other 99%?
                </p>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  We founded ShieldScan to bridge this gap. Our platform brings enterprise-grade security scanning 
                  to businesses of all sizes – with pricing that makes sense and technology that's easy to use.
                </p>
                <div className="space-y-3">
                  {[
                    'Comprehensive vulnerability scanning in seconds',
                    'Clear, actionable security insights',
                    'No security expertise required',
                    'Affordable pricing for every budget',
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-yellow-500/20 via-purple-500/10 to-blue-500/20 border border-dark-accent p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-yellow-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">ShieldScan</h3>
                    <p className="text-gray-400">Protecting the digital world</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="px-4 py-20 bg-dark-secondary/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
                Our Values
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>
            
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center hover:border-gray-700 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl ${value.bgColor} flex items-center justify-center mx-auto mb-4`}>
                    <value.icon className={`w-7 h-7 ${value.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-gray-400 text-sm">{value.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
                Our Journey
              </h2>
              <p className="text-gray-400 text-lg">
                Key milestones in our mission to democratize cybersecurity
              </p>
            </motion.div>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-dark-accent transform md:-translate-x-1/2" />
              
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'} pl-8 md:pl-0`}>
                      <div className="bg-dark-secondary border border-dark-accent rounded-xl p-5">
                        <span className="text-yellow-500 font-bold text-sm">{milestone.year}</span>
                        <h3 className="text-lg font-bold text-white mt-1">{milestone.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{milestone.description}</p>
                      </div>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-yellow-500 rounded-full transform md:-translate-x-1/2 border-4 border-black" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="px-4 py-20 bg-dark-secondary/30">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
                Trust & Compliance
              </h2>
              <p className="text-gray-400 text-lg mb-12">
                We practice what we preach. Our platform is built on a foundation of security and compliance.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-dark-secondary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/30 transition-colors"
                >
                  <Award className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <h3 className="font-bold text-white">{cert.name}</h3>
                  <p className="text-green-500 text-sm">{cert.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-blue-500/10 border border-dark-accent rounded-2xl p-8 md:p-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4 font-heading">
                  Get in Touch
                </h2>
                <p className="text-gray-400">
                  Have questions? We'd love to hear from you.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <a
                  href="mailto:contact@shieldscan.com"
                  className="flex flex-col items-center p-6 bg-dark-secondary/50 rounded-xl hover:bg-dark-secondary transition-colors"
                >
                  <Mail className="w-8 h-8 text-yellow-500 mb-3" />
                  <span className="text-white font-medium">Email Us</span>
                  <span className="text-gray-400 text-sm">contact@shieldscan.com</span>
                </a>
                
                <div className="flex flex-col items-center p-6 bg-dark-secondary/50 rounded-xl">
                  <MapPin className="w-8 h-8 text-purple-500 mb-3" />
                  <span className="text-white font-medium">Location</span>
                  <span className="text-gray-400 text-sm">Global / Remote</span>
                </div>
                
                <div className="flex flex-col items-center p-6 bg-dark-secondary/50 rounded-xl">
                  <Globe className="w-8 h-8 text-blue-500 mb-3" />
                  <span className="text-white font-medium">Social</span>
                  <div className="flex items-center gap-3 mt-2">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              className="bg-dark-secondary border border-dark-accent rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to secure your infrastructure?
              </h3>
              <p className="text-gray-400 mb-6">
                Join thousands of companies using ShieldScan to protect their digital assets.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-3 border border-dark-accent hover:border-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

