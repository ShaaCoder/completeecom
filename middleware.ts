import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env, getSecureHeaders } from './lib/env';

// Rate limiting store (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  
  return request.ip || 'unknown';
}

// Rate limiting function
function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old entries
  for (const [rateLimitKey, data] of Array.from(rateLimitMap.entries())) {
    if (data.resetTime < now) {
      rateLimitMap.delete(rateLimitKey);
    }
  }
  
  const current = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (current.resetTime < now) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }
  
  current.count++;
  rateLimitMap.set(key, current);
  
  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count)
  };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isProduction = env.NODE_ENV === 'production';
  const pathname = request.nextUrl.pathname;
  const clientIP = getClientIP(request);
  
  // HTTPS Enforcement in Production
  if (isProduction && request.headers.get('x-forwarded-proto') !== 'https') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }
  
  // Add security headers to all responses
  const secureHeaders = getSecureHeaders();
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // API Routes Security
  if (pathname.startsWith('/api/')) {
    // Rate limiting for API routes
    const rateLimitKey = `api_${clientIP}`;
    const { allowed, remaining } = rateLimit(
      rateLimitKey, 
      env.RATE_LIMIT_MAX_REQUESTS || 100, 
      env.RATE_LIMIT_WINDOW_MS || 900000
    );
    
    if (!allowed) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((env.RATE_LIMIT_WINDOW_MS || 900000) / 1000).toString(),
          'X-RateLimit-Limit': (env.RATE_LIMIT_MAX_REQUESTS || 100).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + (env.RATE_LIMIT_WINDOW_MS || 900000)).toISOString(),
        },
      });
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', (env.RATE_LIMIT_MAX_REQUESTS || 100).toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + (env.RATE_LIMIT_WINDOW_MS || 900000)).toISOString());
    
    // Enhanced CORS for API routes
    const origin = request.headers.get('origin');
    const allowedOrigins = isProduction 
      ? [env.NEXT_PUBLIC_APP_URL] // Add your production domains
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (!isProduction) {
      // Allow all origins in development (less secure but convenient)
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
    
    // Additional API security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Additional rate limiting for admin routes
    const adminRateLimitKey = `admin_${clientIP}`;
    const { allowed } = rateLimit(adminRateLimitKey, 50, env.RATE_LIMIT_WINDOW_MS || 900000); // Stricter limits
    
    if (!allowed) {
      return new NextResponse('Admin rate limit exceeded', {
        status: 429,
        headers: {
          'Content-Type': 'text/html',
          'Retry-After': Math.ceil((env.RATE_LIMIT_WINDOW_MS || 900000) / 1000).toString(),
        },
      });
    }
    
    // Additional security headers for admin
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  
  // File upload routes security
  if (pathname.startsWith('/api/upload')) {
    const uploadRateLimitKey = `upload_${clientIP}`;
    const { allowed } = rateLimit(uploadRateLimitKey, 20, env.RATE_LIMIT_WINDOW_MS || 900000); // Stricter limits for uploads
    
    if (!allowed) {
      return new NextResponse('Upload rate limit exceeded', {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((env.RATE_LIMIT_WINDOW_MS || 900000) / 1000).toString(),
        },
      });
    }
  }
  
  // Security monitoring - log suspicious activity
  if (env.ENABLE_DEBUG_LOGGING) {
    const suspiciousPatterns = [
      /\.\.[\/\\]/,  // Path traversal
      /<script[^>]*>/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i,    // JavaScript protocol
      /vbscript:/i,     // VBScript protocol
    ];
    
    const urlString = request.url;
    const userAgent = request.headers.get('user-agent') || '';
    
    if (suspiciousPatterns.some(pattern => pattern.test(urlString) || pattern.test(userAgent))) {
      console.warn('🚨 Suspicious request detected:', {
        ip: clientIP,
        url: urlString,
        userAgent,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  // Add security info header in development
  if (!isProduction) {
    response.headers.set('X-Security-Info', 'Enhanced security middleware active');
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin routes
    '/admin/:path*',
    // Match all routes for HTTPS redirect in production
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
