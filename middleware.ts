import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env, getSecureHeaders } from './lib/env';

// In production, replace Map with Redis or Upstash
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// ✅ Helper: Get client IP
function getClientIP(request: NextRequest): string {
  const headers = request.headers;
  const isProduction = env.NODE_ENV === 'production';

  if (!isProduction) return 'localhost-dev';

  return (
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.ip ||
    'unknown'
  );
}

// ✅ Helper: Get client key (userId if logged in, else IP)
function getClientKey(request: NextRequest): string {
  // Try to get user ID from NextAuth session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                       request.cookies.get('__Secure-next-auth.session-token')?.value;
  
  // For now, fall back to IP-based limiting
  // In a production setup, you could decode the JWT to get user ID
  // but that would require importing JWT libraries in middleware
  
  // Alternative: use x-user-id header if set by your API routes
  const userId = request.headers.get('x-user-id');
  
  if (userId) {
    return `user_${userId}`;
  }
  
  // If we have a session token, create a unique key based on it
  if (sessionToken) {
    // Use first 16 characters of session token as user identifier
    const userHash = sessionToken.substring(0, 16);
    return `session_${userHash}`;
  }

  return `ip_${getClientIP(request)}`;
}

// ✅ Rate limiting function
function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let current = rateLimitMap.get(key);

  if (!current || current.resetTime < now) {
    current = { count: 0, resetTime: now + windowMs };
  }

  current.count++;
  rateLimitMap.set(key, current);

  // Cleanup old entries every 100 requests
  if (rateLimitMap.size % 100 === 0) {
    for (const [rateLimitKey, data] of Array.from(rateLimitMap.entries())) {
      if (data.resetTime < now) {
        rateLimitMap.delete(rateLimitKey);
      }
    }
  }

  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
  };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isProduction = env.NODE_ENV === 'production';
  const pathname = request.nextUrl.pathname;

  // ✅ Enforce HTTPS in production
  if (isProduction && request.headers.get('x-forwarded-proto') !== 'https') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // ✅ Security headers (all responses)
  const secureHeaders = getSecureHeaders();
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // ✅ API Rate Limiting
  if (pathname.startsWith('/api/')) {
    // 🔴 Skip webhook → never block payment retries
    if (pathname.startsWith('/api/payments/webhook')) {
      return response;
    }

    const clientKey = getClientKey(request);
    let limitKey = `api_${clientKey}`;
    let maxRequests = 60;
    let windowMs = 60_000; // 1 min

    // Per-route limits
    if (pathname.startsWith('/api/auth/')) {
      // Use per-endpoint buckets so a single login flow doesn't trip a shared auth bucket
      limitKey = `auth_${pathname}_${clientKey}`;

      // In development, relax limits aggressively to avoid noisy warnings during NextAuth flows
      if (!isProduction) {
        maxRequests = 1000; // effectively disable in dev
      } else {
        // In production, set sensible limits per endpoint to allow OAuth flows
        if (pathname.endsWith('/session')) {
          // Session endpoint can be polled frequently by the client
          maxRequests = 60; // per minute
        } else if (
          pathname.includes('/signin') ||
          pathname.includes('/callback')
        ) {
          // Sign-in and callback are invoked a few times during OAuth
          maxRequests = 20; // per minute
        } else if (
          pathname.endsWith('/csrf') ||
          pathname.endsWith('/providers')
        ) {
          maxRequests = 30; // per minute
        } else {
          // Default for other auth endpoints
          maxRequests = 30;
        }
      }
    } else if (
      pathname.startsWith('/api/cart') ||
      pathname.startsWith('/api/checkout')
    ) {
      limitKey = `checkout_${clientKey}`;
      maxRequests = 30;
    } else if (
      pathname.startsWith('/api/products') ||
      pathname.startsWith('/api/search')
    ) {
      limitKey = `search_${clientKey}`;
      if (!isProduction) {
        // Relax limits in development to avoid noisy warnings during product listing/search
        maxRequests = 5000; // effectively disable in dev
      } else {
        maxRequests = 100;
      }
    } else if (pathname.startsWith('/api/upload')) {
      limitKey = `upload_${clientKey}`;
      maxRequests = 20;
      windowMs = 900_000; // 15 min
    }

    const { allowed, remaining } = rateLimit(limitKey, maxRequests, windowMs);

    if (!allowed) {
      if (isProduction) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(windowMs / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(
                Date.now() + windowMs
              ).toISOString(),
            },
          }
        );
      } else {
        // Development mode: log warning but allow request
        console.warn(`⚠️ Rate limit exceeded in dev (would block in prod):`, {
          path: pathname,
          limitKey,
          maxRequests,
          remaining
        });
      }
    }

    // Add headers for monitoring
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      new Date(Date.now() + windowMs).toISOString()
    );

    // ✅ CORS setup
    const origin = request.headers.get('origin');
    const allowedOrigins = isProduction
      ? [env.NEXT_PUBLIC_APP_URL] // <-- set to your prod domain
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (!isProduction) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name'
    );
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // ✅ Admin routes stricter check
  if (pathname.startsWith('/admin')) {
    const clientKey = getClientKey(request);
    const { allowed } = rateLimit(
      `admin_${clientKey}`,
      200,
      env.RATE_LIMIT_WINDOW_MS || 300000
    );

    if (!allowed && isProduction) {
      return new NextResponse('Admin rate limit exceeded', {
        status: 429,
        headers: {
          'Content-Type': 'text/html',
          'Retry-After': Math.ceil(
            (env.RATE_LIMIT_WINDOW_MS || 300000) / 1000
          ).toString(),
        },
      });
    } else if (!allowed && !isProduction) {
      console.warn(`⚠️ Admin rate limit exceeded in dev (would block in prod): ${pathname}`);
    }
  }

  // ✅ Debugging (only dev)
  if (!isProduction) {
    response.headers.set(
      'X-Security-Info',
      'Enhanced security middleware active'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|css|js|map)).*)',
  ],
};
