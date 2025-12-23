import type { Metadata } from 'next';
import { Inter, Orbitron, Rajdhani, Exo_2, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import CookieProvider from '@/components/cookies/CookieProvider';
import QueryProvider from '@/providers/QueryProvider';
import SearchModal from '@/components/SearchModal';

const inter = Inter({ subsets: ['latin'] });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const rajdhani = Rajdhani({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani' 
});
const exo2 = Exo_2({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-exo2' 
});
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk' 
});

export const metadata: Metadata = {
  title: {
    default: 'ShieldScan - Professional Website Security Scanner',
    template: '%s | ShieldScan',
  },
  description: 'Protect your website with advanced cybersecurity scanning. Real security checks, SSL validation, vulnerability detection, XSS testing, and comprehensive security reports. Trusted by businesses worldwide.',
  keywords: ['website security', 'vulnerability scanner', 'SSL checker', 'security audit', 'cybersecurity', 'penetration testing', 'website scanner', 'security testing'],
  authors: [{ name: 'ShieldScan Team' }],
  creator: 'ShieldScan',
  publisher: 'ShieldScan',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shieldscan.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://shieldscan.io',
    siteName: 'ShieldScan',
    title: 'ShieldScan - Professional Website Security Scanner',
    description: 'Protect your website with advanced cybersecurity scanning. Real security checks, SSL validation, and comprehensive security reports.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShieldScan - Website Security Scanner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShieldScan - Professional Website Security Scanner',
    description: 'Protect your website with advanced cybersecurity scanning. Real security checks and comprehensive reports.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

// Organization and Website JSON-LD structured data
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ShieldScan',
  url: 'https://shieldscan.io',
  logo: 'https://shieldscan.io/logo/ShieldScanLogo.png',
  description: 'Professional website security scanner for small businesses.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@shieldscan.io',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ShieldScan',
  url: 'https://shieldscan.io',
  description: 'Protect your website with advanced cybersecurity scanning.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://shieldscan.io/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ShieldScan',
  url: 'https://shieldscan.io',
  description: 'Professional website security scanner for small businesses.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '199',
    priceCurrency: 'USD',
    offerCount: 4,
  },
  featureList: [
    'SSL/TLS Certificate Validation',
    'Security Headers Analysis',
    'Vulnerability Scanning',
    'DNS Security Check',
    'Technology Detection',
    'PDF Report Generation',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${orbitron.variable} ${rajdhani.variable} ${exo2.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        {/* Structured Data - JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
      </head>
      <body className={spaceGrotesk.className} suppressHydrationWarning>
        <QueryProvider>
          {children}
          <SearchModal />
          <CookieProvider />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e2837',
                color: '#f3f4f6',
                border: '1px solid #2a3441',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
