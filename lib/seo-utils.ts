import { Metadata } from 'next';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  brand: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  stock: number;
  features?: string[];
  ingredients?: string[];
  manufacturer?: string;
  countryOfOrigin?: string;
}

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  twitterHandle?: string;
  facebookAppId?: string;
}

export const seoConfig: SEOConfig = {
  siteName: 'BeautyMart',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://beautymart.com',
  defaultTitle: 'BeautyMart - Your Ultimate Beauty Destination',
  defaultDescription: 'Discover premium beauty products from top brands. Shop skincare, makeup, wellness essentials, and more with free delivery and authentic products.',
  twitterHandle: '@beautymart',
};

// Generate SEO-friendly slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${seoConfig.siteUrl}${cleanPath}`;
}

// Generate product metadata
export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} - ${product.brand} | ${seoConfig.siteName}`;
  const description = `Buy ${product.name} by ${product.brand}. ${product.description.substring(0, 150)}... ✓ Authentic Products ✓ Free Delivery ✓ Easy Returns`;
  const images = product.images.map(img => ({
    url: img.startsWith('http') ? img : `${seoConfig.siteUrl}${img}`,
    alt: product.name,
  }));

  return {
    title,
    description,
    keywords: [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      'beauty products',
      'skincare',
      'makeup',
      'authentic products'
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url: generateCanonicalUrl(`/products/${product.slug}`),
      images,
      siteName: seoConfig.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
      creator: seoConfig.twitterHandle,
    },
    alternates: {
      canonical: generateCanonicalUrl(`/products/${product.slug}`),
    },
  };
}

// Generate category metadata
export function generateCategoryMetadata(
  category: string,
  subcategory?: string,
  productCount?: number
): Metadata {
  const categoryTitle = subcategory ? `${subcategory} - ${category}` : category;
  const title = `${categoryTitle} | ${seoConfig.siteName}`;
  const description = `Shop premium ${categoryTitle.toLowerCase()} products. ${
    productCount ? `${productCount} products available.` : ''
  } ✓ Top Brands ✓ Authentic Products ✓ Free Delivery ✓ Easy Returns`;

  const slug = generateSlug(subcategory || category);
  const url = subcategory 
    ? generateCanonicalUrl(`/category/${generateSlug(category)}/${slug}`)
    : generateCanonicalUrl(`/category/${slug}`);

  return {
    title,
    description,
    keywords: [
      category,
      subcategory,
      'beauty products',
      'skincare',
      'makeup',
      'premium beauty',
      'authentic products'
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: seoConfig.siteName,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      creator: seoConfig.twitterHandle,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

// Generate product structured data
export function generateProductStructuredData(product: Product) {
  const offers = {
    '@type': 'Offer',
    url: generateCanonicalUrl(`/products/${product.slug}`),
    priceCurrency: 'INR',
    price: product.price.toString(),
    availability: product.stock > 0 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  };

  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: product.rating.toString(),
    reviewCount: product.reviewCount.toString(),
    bestRating: '5',
    worstRating: '1',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => 
      img.startsWith('http') ? img : `${seoConfig.siteUrl}${img}`
    ),
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: product.category,
    offers,
    aggregateRating: product.reviewCount > 0 ? aggregateRating : undefined,
    sku: product._id,
    manufacturer: product.manufacturer ? {
      '@type': 'Organization',
      name: product.manufacturer,
    } : undefined,
  };
}

// Generate organization structured data
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo.png`,
    description: seoConfig.defaultDescription,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-XXXXXXXXXX',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [
      'https://www.facebook.com/beautymart',
      'https://www.instagram.com/beautymart',
      'https://twitter.com/beautymart',
    ],
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate page metadata with defaults
export function generatePageMetadata(
  title: string,
  description: string,
  path: string,
  additionalKeywords: string[] = []
): Metadata {
  const fullTitle = title.includes(seoConfig.siteName) ? title : `${title} | ${seoConfig.siteName}`;
  const keywords = [
    ...additionalKeywords,
    'beauty products',
    'skincare',
    'makeup',
    'BeautyMart',
    'authentic products',
    'free delivery'
  ].join(', ');

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: generateCanonicalUrl(path),
      siteName: seoConfig.siteName,
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
      creator: seoConfig.twitterHandle,
    },
    alternates: {
      canonical: generateCanonicalUrl(path),
    },
  };
}