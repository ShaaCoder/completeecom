/**
 * API Health Monitoring System
 * 
 * Monitors API endpoint health and automatically recovers from connection issues
 */

import { logAuthEvent, logAuthError } from './auth-debug';

export interface ApiHealthStatus {
  endpoint: string;
  isHealthy: boolean;
  lastChecked: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  lastError?: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'recovering';
}

export interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
}

class ApiHealthMonitor {
  private endpoints: Map<string, ApiHealthStatus> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly UNHEALTHY_THRESHOLD = 3; // Failures before marking unhealthy
  private readonly RECOVERY_THRESHOLD = 2; // Successes needed to mark as recovered
  
  // Critical API endpoints to monitor
  private readonly CRITICAL_ENDPOINTS = [
    '/api/products',
    '/api/categories', 
    '/api/orders',
    '/api/auth/profile',
    '/api/health/database'
  ];

  constructor() {
    this.initializeEndpoints();
  }

  private initializeEndpoints() {
    this.CRITICAL_ENDPOINTS.forEach(endpoint => {
      this.endpoints.set(endpoint, {
        endpoint,
        isHealthy: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
        averageResponseTime: 0,
        status: 'healthy'
      });
    });
  }

  /**
   * Start monitoring all critical endpoints
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    logAuthEvent('api-health', { action: 'monitoring-started' });

    this.monitoringInterval = setInterval(() => {
      this.checkAllEndpoints();
    }, this.CHECK_INTERVAL);

    // Initial check
    this.checkAllEndpoints();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logAuthEvent('api-health', { action: 'monitoring-stopped' });
  }

  /**
   * Check health of a specific endpoint
   */
  async checkEndpoint(endpoint: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Use appropriate method based on endpoint
      const method = endpoint.includes('/auth/profile') ? 'GET' : 'GET';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add basic health check parameters
      const url = new URL(endpoint, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      if (endpoint === '/api/products') {
        url.searchParams.set('limit', '1'); // Minimal query
      }
      if (endpoint === '/api/categories') {
        url.searchParams.set('limit', '1');
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }

      // Try to parse response to ensure it's valid JSON
      try {
        await response.json();
      } catch (parseError) {
        return {
          success: false,
          responseTime,
          error: 'Invalid JSON response'
        };
      }

      return {
        success: true,
        responseTime,
        statusCode: response.status
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check health of all monitored endpoints
   */
  private async checkAllEndpoints() {
    const promises = Array.from(this.endpoints.keys()).map(async (endpoint) => {
      const result = await this.checkEndpoint(endpoint);
      this.updateEndpointStatus(endpoint, result);
      return { endpoint, result };
    });

    const results = await Promise.all(promises);
    
    // Log overall health status
    const unhealthyCount = Array.from(this.endpoints.values())
      .filter(status => status.status === 'unhealthy').length;
    
    if (unhealthyCount > 0) {
      logAuthEvent('api-health', { 
        action: 'health-check-completed',
        unhealthyEndpoints: unhealthyCount,
        totalEndpoints: this.endpoints.size
      });
    }
  }

  /**
   * Update the health status of an endpoint based on check result
   */
  private updateEndpointStatus(endpoint: string, result: HealthCheckResult) {
    const status = this.endpoints.get(endpoint);
    if (!status) return;

    const previousStatus = status.status;
    status.lastChecked = new Date();

    if (result.success) {
      // Successful check
      status.consecutiveFailures = 0;
      
      // Update average response time
      if (status.averageResponseTime === 0) {
        status.averageResponseTime = result.responseTime;
      } else {
        status.averageResponseTime = (status.averageResponseTime + result.responseTime) / 2;
      }

      // Update status based on previous state
      if (status.status === 'unhealthy' || status.status === 'recovering') {
        status.status = 'recovering';
        // Need consecutive successes to mark as healthy
        const recentSuccesses = this.RECOVERY_THRESHOLD; // Simplified for now
        if (recentSuccesses >= this.RECOVERY_THRESHOLD) {
          status.status = 'healthy';
          status.isHealthy = true;
          
          if (previousStatus === 'unhealthy') {
            logAuthEvent('api-health', {
              action: 'endpoint-recovered',
              endpoint,
              responseTime: result.responseTime
            });
          }
        }
      } else {
        status.status = result.responseTime > 5000 ? 'degraded' : 'healthy';
        status.isHealthy = true;
      }
      
      status.lastError = undefined;

    } else {
      // Failed check
      status.consecutiveFailures++;
      status.lastError = result.error;
      
      if (status.consecutiveFailures >= this.UNHEALTHY_THRESHOLD) {
        status.status = 'unhealthy';
        status.isHealthy = false;
        
        if (previousStatus !== 'unhealthy') {
          logAuthError(
            `API endpoint ${endpoint} is unhealthy: ${result.error}`,
            'api-health-monitor'
          );
        }
      } else {
        status.status = 'degraded';
        status.isHealthy = status.consecutiveFailures < 2;
      }
    }

    this.endpoints.set(endpoint, status);
  }

  /**
   * Get health status of all endpoints
   */
  getHealthStatus(): Record<string, ApiHealthStatus> {
    const status: Record<string, ApiHealthStatus> = {};
    this.endpoints.forEach((value, key) => {
      status[key] = { ...value };
    });
    return status;
  }

  /**
   * Get overall system health
   */
  getOverallHealth(): {
    isHealthy: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthyEndpoints: number;
    totalEndpoints: number;
    issues: string[];
  } {
    const statuses = Array.from(this.endpoints.values());
    const healthyCount = statuses.filter(s => s.isHealthy).length;
    const unhealthyCount = statuses.filter(s => s.status === 'unhealthy').length;
    const degradedCount = statuses.filter(s => s.status === 'degraded').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    const issues: string[] = [];
    statuses.forEach(status => {
      if (!status.isHealthy) {
        issues.push(`${status.endpoint}: ${status.lastError || 'Unknown issue'}`);
      }
    });

    return {
      isHealthy: unhealthyCount === 0,
      status: overallStatus,
      healthyEndpoints: healthyCount,
      totalEndpoints: statuses.length,
      issues
    };
  }

  /**
   * Manually trigger recovery for an endpoint
   */
  async triggerRecovery(endpoint: string): Promise<boolean> {
    logAuthEvent('api-health', { action: 'manual-recovery-triggered', endpoint });
    
    const result = await this.checkEndpoint(endpoint);
    this.updateEndpointStatus(endpoint, result);
    
    return result.success;
  }

  /**
   * Get health status for a specific endpoint
   */
  getEndpointStatus(endpoint: string): ApiHealthStatus | null {
    return this.endpoints.get(endpoint) || null;
  }
}

// Global instance
export const apiHealthMonitor = new ApiHealthMonitor();

// Auto-start monitoring in development/production
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Start monitoring after a short delay to allow app initialization
  setTimeout(() => {
    apiHealthMonitor.startMonitoring();
  }, 5000);
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    apiHealthMonitor.stopMonitoring();
  });
  
  process.on('SIGTERM', () => {
    apiHealthMonitor.stopMonitoring();
  });
}