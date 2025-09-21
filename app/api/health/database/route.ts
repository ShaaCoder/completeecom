/**
 * Database Health Check API
 * GET /api/health/database
 */

import { NextRequest } from 'next/server';
import connectDB, { getConnectionStatus, getConnectionStats } from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await connectDB();
    
    const responseTime = Date.now() - startTime;
    const connectionStatus = getConnectionStatus();
    const connectionStats = getConnectionStats();

    if (connectionStatus === 'connected') {
      return createSuccessResponse(
        {
          status: connectionStatus,
          responseTime,
          ...connectionStats,
          timestamp: new Date().toISOString(),
        },
        'Database is healthy'
      );
    } else {
      return createErrorResponse(
        'Database connection is not healthy',
        503,
        'Database Error'
      );
    }
  } catch (error) {
    return handleApiError(error, 'GET /api/health/database');
  }
}