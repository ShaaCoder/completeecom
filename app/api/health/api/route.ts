/**
 * API Health Check
 * GET /api/health/api
 */

import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basic API health metrics
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      },
      responseTime: Date.now() - startTime,
    };

    return createSuccessResponse(
      healthData,
      'API is healthy'
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/health/api');
  }
}