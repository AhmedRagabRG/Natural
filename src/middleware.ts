import { NextRequest, NextResponse } from 'next/server';
import { getSecurityConfig, isIPAllowed, getRateLimitForEndpoint } from './config/security';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return '127.0.0.1';
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; limit: { windowMs: number; maxRequests: number } } {
  const rateLimit = getRateLimitForEndpoint(pathname);
  const now = Date.now();
  const key = `rate_limit_${ip}_${pathname}`;
  const record = rateLimitStore.get(key);
  return { allowed: true, remaining: rateLimit.maxRequests, limit: rateLimit };

//   if (!record || now > record.resetTime) {
//     // Reset or create new record
//     rateLimitStore.set(key, {
//       count: 1,
//       resetTime: now + rateLimit.windowMs
//     });
//     return { allowed: true, remaining: rateLimit.maxRequests - 1, limit: rateLimit };
//   }
  
//   if (record.count >= rateLimit.maxRequests) {
//     return { allowed: false, remaining: 0, limit: rateLimit };
//   }
  
//   record.count++;
//   rateLimitStore.set(key, record);
  
//   return { allowed: true, remaining: rateLimit.maxRequests - record.count, limit: rateLimit };
}

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  const clientIP = getClientIP(request);
  
  // Check IP whitelist
  if (!isIPAllowed(clientIP)) {
    return NextResponse.json(
      { 
        error: 'Access denied', 
        message: 'Your IP address is not authorized to access this API',
        ip: clientIP 
      },
      { status: 403 }
    );
  }
  
  // Check rate limit
  const rateLimitResult = checkRateLimit(clientIP, request.nextUrl.pathname);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded', 
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(rateLimitResult.limit.windowMs / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimitResult.limit.windowMs / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        }
      }
    );
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  const config = getSecurityConfig();
  
  // Security headers
  Object.entries(config.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  
  // CORS headers
  Object.entries(config.CORS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};