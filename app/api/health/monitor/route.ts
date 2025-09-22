/**
 * API Health Monitor Endpoint
 * GET /api/health/monitor
 */

import { NextRequest } from 'next/server';
import { apiHealthMonitor } from '@/lib/api-health-monitor';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const endpoint = searchParams.get('endpoint');

    if (action === 'check' && endpoint) {
      // Manual health check for specific endpoint
      const result = await apiHealthMonitor.checkEndpoint(endpoint);
      const status = apiHealthMonitor.getEndpointStatus(endpoint);
      
      return createSuccessResponse({
        endpoint,
        checkResult: result,
        currentStatus: status
      }, 'Health check completed');
    }

    if (action === 'recover' && endpoint) {
      // Trigger recovery for specific endpoint
      const recovered = await apiHealthMonitor.triggerRecovery(endpoint);
      const status = apiHealthMonitor.getEndpointStatus(endpoint);
      
      return createSuccessResponse({
        endpoint,
        recovered,
        currentStatus: status
      }, recovered ? 'Recovery successful' : 'Recovery failed');
    }

    // Default: return overall health status
    const overallHealth = apiHealthMonitor.getOverallHealth();
    const endpointStatuses = apiHealthMonitor.getHealthStatus();

    return createSuccessResponse({
      overall: overallHealth,
      endpoints: endpointStatuses,
      timestamp: new Date().toISOString(),
      monitoringActive: true
    }, 'Health status retrieved');

  } catch (error) {
    return handleApiError(error, 'GET /api/health/monitor');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, endpoint } = body;

    if (action === 'start-monitoring') {
      apiHealthMonitor.startMonitoring();
      return createSuccessResponse(
        { monitoringActive: true },
        'Monitoring started'
      );
    }

    if (action === 'stop-monitoring') {
      apiHealthMonitor.stopMonitoring();
      return createSuccessResponse(
        { monitoringActive: false },
        'Monitoring stopped'
      );
    }

    if (action === 'check-endpoint' && endpoint) {
      const result = await apiHealthMonitor.checkEndpoint(endpoint);
      return createSuccessResponse(result, 'Endpoint checked');
    }

    return createErrorResponse(
      'Invalid action or missing parameters',
      400,
      'Bad Request'
    );

  } catch (error) {
    return handleApiError(error, 'POST /api/health/monitor');
  }
}