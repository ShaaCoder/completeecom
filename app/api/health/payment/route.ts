/**
 * Payment Gateway Health Check
 * GET /api/health/payment
 */

import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const providers = [];
    
    // Check Razorpay configuration
    const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    providers.push({
      name: 'razorpay',
      status: razorpayConfigured ? 'healthy' : 'unhealthy',
      message: razorpayConfigured ? 'Razorpay is configured' : 'Razorpay configuration missing',
      configured: razorpayConfigured,
    });

    // Check Stripe configuration
    const stripeConfigured = !!(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY);
    providers.push({
      name: 'stripe',
      status: stripeConfigured ? 'healthy' : 'unhealthy',
      message: stripeConfigured ? 'Stripe is configured' : 'Stripe configuration missing',
      configured: stripeConfigured,
    });

    // Check PayU configuration
    const payuConfigured = !!(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
    providers.push({
      name: 'payu',
      status: payuConfigured ? 'healthy' : 'unhealthy',
      message: payuConfigured ? 'PayU is configured' : 'PayU configuration missing',
      configured: payuConfigured,
    });

    const healthyProviders = providers.filter(p => p.status === 'healthy').length;
    const overallStatus = healthyProviders > 0 ? 'healthy' : 'unhealthy';

    return createSuccessResponse(
      {
        status: overallStatus,
        providers,
        healthyProviders,
        totalProviders: providers.length,
        timestamp: new Date().toISOString(),
      },
      `${healthyProviders}/${providers.length} payment providers are healthy`
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/health/payment');
  }
}