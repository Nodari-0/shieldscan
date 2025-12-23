/**
 * SEO Utility Library for ShieldScan
 * 
 * Provides functions for generating metadata, Open Graph tags,
 * Twitter Cards, and structured data (JSON-LD) for better SEO.
 */

import React from 'react';
import { Metadata } from 'next';

// Base URL for the site
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shieldscan.io';

// Site-wide metadata constants
export const SITE_NAME = 'ShieldScan';
export const SITE_DESCRIPTION = 'Professional website security scanner for small businesses. Automated vulnerability detection, security headers analysis, SSL validation, and comprehensive PDF reports.';
export const SITE_TAGLINE = 'Protect Your Website from Cyber Threats';

/**
 * Default Open Graph image
 */
export const DEFAULT_OG_IMAGE = {
  url: `${BASE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: 'ShieldScan - Website Security Scanner',
};

/**
 * Generate base metadata for all pages
 */
export function generateBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: `${SITE_NAME} - ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      'website security',
      'vulnerability scanner',
      'security headers',
      'SSL checker',
      'website scanner',
      'cybersecurity',
      'security audit',
      'web security',
      'penetration testing',
      'OWASP',
      'security analysis',
    ],
    authors: [{ name: 'ShieldScan Team' }],
    creator: 'ShieldScan',
    publisher: 'ShieldScan',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: BASE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE.url],
      creator: '@shieldscan',
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
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    },
  };
}

/**
 * Generate metadata for a page
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${BASE_URL}${path}`;
  const ogImage = image ? { url: image, width: 1200, height: 630 } : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [ogImage],
    },
    twitter: {
      title,
      description,
      images: [ogImage.url],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

/**
 * Generate metadata for a blog post
 */
export function generateBlogPostMetadata({
  title,
  description,
  slug,
  author,
  publishDate,
  modifiedDate,
  tags,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  tags?: string[];
  image?: string;
}): Metadata {
  const url = `${BASE_URL}/blog/${slug}`;
  const ogImage = image ? { url: image, width: 1200, height: 630 } : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      images: [ogImage],
      publishedTime: publishDate,
      modifiedTime: modifiedDate,
      authors: [author],
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  };
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ShieldScan',
    url: BASE_URL,
    logo: `${BASE_URL}/logo/ShieldScanLogo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/shieldscan',
      // 'https://linkedin.com/company/shieldscan',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@shieldscan.io',
    },
  };
}

/**
 * Generate WebSite structured data (JSON-LD)
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ShieldScan',
    url: BASE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate WebApplication structured data (JSON-LD)
 */
export function generateWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ShieldScan',
    url: BASE_URL,
    description: SITE_DESCRIPTION,
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
      'Scheduled Scans',
      'Email Alerts',
    ],
    screenshot: `${BASE_URL}/screenshots/dashboard.png`,
  };
}

/**
 * Generate Article structured data (JSON-LD)
 */
export function generateArticleSchema({
  title,
  description,
  slug,
  author,
  publishDate,
  modifiedDate,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || DEFAULT_OG_IMAGE.url,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ShieldScan',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo/ShieldScanLogo.png`,
      },
    },
    datePublished: publishDate,
    dateModified: modifiedDate || publishDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${slug}`,
    },
  };
}

/**
 * Generate Product structured data for pricing plans (JSON-LD)
 */
export function generateProductSchema({
  name,
  description,
  price,
  priceCurrency = 'USD',
  features,
}: {
  name: string;
  description: string;
  price: number;
  priceCurrency?: string;
  features: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `ShieldScan ${name}`,
    description,
    brand: {
      '@type': 'Brand',
      name: 'ShieldScan',
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'ShieldScan',
      },
    },
    additionalProperty: features.map((feature) => ({
      '@type': 'PropertyValue',
      name: 'Feature',
      value: feature,
    })),
  };
}

/**
 * Generate FAQ structured data (JSON-LD)
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

/**
 * Helper to render JSON-LD script tag
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

