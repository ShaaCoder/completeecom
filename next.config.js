/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'yourdomain.com' },
      { protocol: 'https', hostname: 'assets.myntassets.com' },
      { protocol: 'https', hostname: 'www.pexels.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enhanced security headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const enableSecurityHeaders = process.env.ENABLE_SECURITY_HEADERS !== 'false';
    
    if (!enableSecurityHeaders) {
      return [];
    }
    
    const cspReportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
    
    // Content Security Policy - Adjust based on your needs
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.stripe.com https://api.razorpay.com https://apiv2.shiprocket.in https://track.delhivery.com https://apigateway.bluedart.com https://blktracksvc.dtdc.com",
      "frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://www.google.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      ...(cspReportUri ? [`report-uri ${cspReportUri}`] : [])
    ].join('; ');
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Security Headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=self'
          },
          {
            key: 'Content-Security-Policy',
            value: csp
          },
          // Only add HSTS in production over HTTPS
          ...(isProduction ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload'
            }
          ] : []),
          // Additional security headers
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ],
      },
      // API routes specific headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        ],
      },
      // Optimized static assets caching with WebP support
      {
        source: '/uploads/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Vary',
            value: 'Accept'
          },
          {
            key: 'X-Optimized-Images',
            value: 'true'
          }
        ],
      },
      // WebP image serving optimization
      {
        source: '/uploads/(.*)\\.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Content-Type',
            value: 'image/webp'
          }
        ],
      }
    ];
  },
  
  // Environment variables to expose to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  
  // Webpack configuration for security
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Remove console logs in production
      config.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
