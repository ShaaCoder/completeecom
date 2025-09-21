/**
 * Delivery Partner Health Check
 * GET /api/health/delivery
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
    
    // Check Delhivery configuration
    const delhiveryConfigured = !!(process.env.DELHIVERY_API_KEY);
    providers.push({
      name: 'delhivery',
      status: delhiveryConfigured ? 'healthy' : 'unhealthy',
      message: delhiveryConfigured ? 'Delhivery is configured' : 'Delhivery configuration missing',
      configured: delhiveryConfigured,
    });

    // Check Shiprocket configuration
    const shiprocketConfigured = !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
    providers.push({
      name: 'shiprocket',
      status: shiprocketConfigured ? 'healthy' : 'unhealthy',
      message: shiprocketConfigured ? 'Shiprocket is configured' : 'Shiprocket configuration missing',
      configured: shiprocketConfigured,
    });

    // Check Blue Dart configuration
    const bluedartConfigured = !!(process.env.BLUEDART_API_KEY);
    providers.push({
      name: 'bluedart',
      status: bluedartConfigured ? 'healthy' : 'unhealthy',
      message: bluedartConfigured ? 'Blue Dart is configured' : 'Blue Dart configuration missing',
      configured: bluedartConfigured,
    });

    // Check DTDC configuration
    const dtdcConfigured = !!(process.env.DTDC_API_KEY);
    providers.push({
      name: 'dtdc',
      status: dtdcConfigured ? 'healthy' : 'unhealthy',
      message: dtdcConfigured ? 'DTDC is configured' : 'DTDC configuration missing',
      configured: dtdcConfigured,
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
      `${healthyProviders}/${providers.length} delivery providers are healthy`
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/health/delivery');
  }
}