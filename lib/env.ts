/**
 * Environment Variables Validation (Backward Compatible)
 * 
 * Provides type-safe access to environment variables with optional
 * security enhancements that don't break existing functionality
 */

import { cleanEnv, str, bool, num } from 'envalid';

// Environment-specific validation
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const env = cleanEnv(process.env, {
  // Node Environment
  NODE_ENV: str({ default: 'development' }),
  
  // Database Configuration  
  MONGODB_URI: str({ desc: 'MongoDB connection URI' }),
  MONGODB_DB_NAME: str({ desc: 'MongoDB database name' }),
  
  // JWT Configuration
  JWT_SECRET: str({ desc: 'JWT secret for signing access tokens' }),
  JWT_REFRESH_SECRET: str({ desc: 'JWT secret for signing refresh tokens' }),
  JWT_EXPIRES_IN: str({ default: '7d', desc: 'JWT access token expiration time' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '30d', desc: 'JWT refresh token expiration time' }),
  BCRYPT_SALT_ROUNDS: num({ default: 12, desc: 'Number of salt rounds for bcrypt' }),
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: str({ default: 'http://localhost:3000' }),
  NEXT_PUBLIC_API_URL: str({ default: 'http://localhost:3000/api' }),
  
  // Email Configuration
  EMAIL_USER: str({ default: '' }),
  EMAIL_PASSWORD: str({ default: '' }),
  EMAIL_FROM_NAME: str({ default: 'BeautyMart' }),
  EMAIL_FROM_ADDRESS: str({ default: '' }),
  
  // Payment Gateway Configuration
  RAZORPAY_KEY_ID: str({ default: '' }),
  RAZORPAY_KEY_SECRET: str({ default: '' }),
  RAZORPAY_WEBHOOK_SECRET: str({ default: '' }),
  STRIPE_PUBLISHABLE_KEY: str({ default: '' }),
  STRIPE_SECRET_KEY: str({ default: '' }),
  STRIPE_WEBHOOK_SECRET: str({ default: '' }),
  PAYU_MERCHANT_KEY: str({ default: '' }),
  PAYU_MERCHANT_SALT: str({ default: '' }),
  
  // Delivery Partner Configuration
  DELHIVERY_API_KEY: str({ default: '' }),
  DELHIVERY_BASE_URL: str({ default: 'https://track.delhivery.com/api' }),
  SHIPROCKET_EMAIL: str({ default: '' }),
  SHIPROCKET_PASSWORD: str({ default: '' }),
  SHIPROCKET_BASE_URL: str({ default: 'https://apiv2.shiprocket.in/v1/external' }),
  SHIPROCKET_PICKUP_LOCATION_ID: str({ default: '' }),
  BLUEDART_API_KEY: str({ default: '' }),
  BLUEDART_BASE_URL: str({ default: 'https://apigateway.bluedart.com' }),
  DTDC_API_KEY: str({ default: '' }),
  DTDC_BASE_URL: str({ default: 'https://blktracksvc.dtdc.com' }),
  
  // Development/Testing Configuration
  FORCE_MOCK_DELIVERY: bool({ default: false }),
  ENABLE_DEBUG_LOGGING: bool({ default: false }),
  
  // NextAuth Configuration
  NEXTAUTH_SECRET: str({ desc: 'NextAuth secret for signing tokens' }),
  NEXTAUTH_URL: str({ desc: 'NextAuth base URL' }),
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: str({ desc: 'Google OAuth client ID' }),
  GOOGLE_CLIENT_SECRET: str({ desc: 'Google OAuth client secret' }),
  
  // Security Configuration
  RATE_LIMIT_MAX_REQUESTS: num({ 
    default: 100,
    desc: 'Maximum requests per window for rate limiting'
  }),
  RATE_LIMIT_WINDOW_MS: num({ 
    default: 900000, // 15 minutes
    desc: 'Rate limiting window in milliseconds'
  }),
  ENABLE_SECURITY_HEADERS: bool({ 
    default: true,
    desc: 'Enable comprehensive security headers'
  }),
  CSP_REPORT_URI: str({ 
    default: '',
    desc: 'Content Security Policy report URI for violations'
  }),
  
  // File Upload Configuration
  MAX_FILE_SIZE: num({ 
    default: 5242880, // 5MB
    desc: 'Maximum file size in bytes for uploads'
  }),
  ALLOWED_FILE_TYPES: str({ 
    default: 'image/jpeg,image/png,image/webp,image/gif',
    desc: 'Comma-separated list of allowed MIME types for uploads'
  }),
  UPLOAD_PATH: str({ 
    default: 'uploads',
    desc: 'Directory path for file uploads (relative to public)'
  }),
  
  // Monitoring and Logging (Optional)
  SENTRY_DSN: str({ 
    default: '',
    desc: 'Sentry DSN for error tracking and monitoring'
  }),
  LOG_LEVEL: str({ 
    choices: ['error', 'warn', 'info', 'debug'],
    default: isProduction ? 'info' : 'debug',
    desc: 'Logging level for the application'
  })
});

// Additional Security Checks (more lenient for backward compatibility)
if (isProduction) {
  // Ensure critical secrets are set in production
  const requiredInProduction = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET', 
    'NEXTAUTH_SECRET',
    'MONGODB_URI'
  ];
  
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      console.warn(`⚠️  ${key} should be set in production environment`);
      // Don't throw error for backward compatibility
    }
  }
  
  // Warn about development settings in production
  if (env.ENABLE_DEBUG_LOGGING) {
    console.warn('⚠️  Debug logging is enabled in production');
  }
  
  if (env.FORCE_MOCK_DELIVERY) {
    console.warn('⚠️  Mock delivery is enabled in production');
  }
} else {
  // Development environment info
  console.log('👨‍💻 Development mode: Enhanced security features active with relaxed validation');
}

// Export environment information
export const envInfo = {
  isProduction,
  isDevelopment,
  isTest: process.env.NODE_ENV === 'test',
  nodeVersion: process.version,
  buildTime: new Date().toISOString()
};

// Export helper functions
export const getSecureHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...(isProduction && {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
  })
});
