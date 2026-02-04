// Security configuration
export const SECURITY_CONFIG = {
  // Allowed IP addresses - Add your specific IPs here
  ALLOWED_IPS: [
    '127.0.0.1',
    '::1',
    'localhost',
    '192.168.1.100', // Test IP
    '192.168.1.101', // Test IP 2
    '134.122.64.40',
  ],
  
  // Rate limiting configuration
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    
    // Different limits for different endpoints
    endpoints: {
      // '/api/products': { windowMs: 5 * 60 * 1000, maxRequests: 500 },
      // '/api/category': { windowMs: 5 * 60 * 1000, maxRequests: 150 }, // 5 minutes, 150 requests
      '/api/orders': { windowMs: 5 * 60 * 1000, maxRequests: 100 }, // 5 minutes, 100 requests
      '/api/orders/items': { windowMs: 5 * 60 * 1000, maxRequests: 150 }, // 5 minutes, 150 requests
      '/api/orders/stats': { windowMs: 10 * 60 * 1000, maxRequests: 50 }, // 10 minutes, 50 requests
      '/api/events': { windowMs: 10 * 60 * 1000, maxRequests: 100 },
      '/api/coupons': { windowMs: 15 * 60 * 1000, maxRequests: 50 },
      '/api/send-order-email': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 1 hour, 10 requests
    }
  },
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  },
  
  // CORS configuration
  CORS: {
    'Access-Control-Allow-Origin': '*', // In production, specify your domain
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  },
  
  // Environment-specific settings
  ENVIRONMENT: {
    development: {
      enableIPWhitelist: false, // Disable IP whitelist in development
      enableRateLimit: false,
      logRequests: false,
    },
    production: {
      enableIPWhitelist: false, // Disable IP whitelist in production to allow all users
      enableRateLimit: false,
      logRequests: false,
    }
  }
};

// Helper function to get environment-specific config
export function getSecurityConfig() {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...SECURITY_CONFIG,
    current: SECURITY_CONFIG.ENVIRONMENT[env as keyof typeof SECURITY_CONFIG.ENVIRONMENT] || SECURITY_CONFIG.ENVIRONMENT.development
  };
}

// Helper function to check if IP is allowed
export function isIPAllowed(ip: string): boolean {
  const config = getSecurityConfig();
  
  // Skip IP check in development
  if (!config.current.enableIPWhitelist) {
    return true;
  }
  
  // Always allow localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }
  
  return config.ALLOWED_IPS.includes(ip);
}

// Helper function to get rate limit for specific endpoint
export function getRateLimitForEndpoint(pathname: string) {
  const config = getSecurityConfig();
  
  // Check for specific endpoint limits
  for (const [endpoint, limit] of Object.entries(config.RATE_LIMIT.endpoints)) {
    if (pathname.startsWith(endpoint)) {
      return limit;
    }
  }
  
  // Return default rate limit
  return {
    windowMs: config.RATE_LIMIT.windowMs,
    maxRequests: config.RATE_LIMIT.maxRequests
  };
}