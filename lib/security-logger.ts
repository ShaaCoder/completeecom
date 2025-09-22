/**
 * Security Monitoring and Logging System
 * 
 * Provides comprehensive security event logging, monitoring,
 * and alerting for production environments
 */

import { env } from './env';

// Security event types
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_LOCKOUT = 'auth_lockout',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  FILE_UPLOAD = 'file_upload',
  ADMIN_ACCESS = 'admin_access',
  DATA_EXPORT = 'data_export',
  PAYMENT_ATTEMPT = 'payment_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt'
}

// Security risk levels
export enum SecurityRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType;
  level: SecurityRiskLevel;
  message: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  metadata?: Record<string, any>;
}

// Security metrics interface
export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByLevel: Record<string, number>;
  uniqueIPs: Set<string>;
  suspiciousIPs: string[];
  timeRange: {
    start: string;
    end: string;
  };
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory
  private suspiciousIPs = new Map<string, number>();
  private blockedIPs = new Set<string>();
  
  constructor() {
    // Clean up old events periodically
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Add to in-memory store
    this.events.push(securityEvent);

    // Track suspicious IPs
    if (this.isSuspiciousEvent(event.type)) {
      const count = this.suspiciousIPs.get(event.ip) || 0;
      this.suspiciousIPs.set(event.ip, count + 1);
      
      // Auto-block IPs with too many suspicious events
      if (count >= 10) {
        this.blockedIPs.add(event.ip);
        this.logEvent({
          type: SecurityEventType.AUTH_LOCKOUT,
          level: SecurityRiskLevel.HIGH,
          message: `IP ${event.ip} auto-blocked due to suspicious activity`,
          ip: event.ip,
          metadata: { reason: 'automated_block', suspiciousCount: count + 1 }
        });
      }
    }

    // Console logging based on environment and level
    this.consoleLog(securityEvent);

    // Send to external monitoring (if configured)
    this.sendToExternalMonitoring(securityEvent);

    // Cleanup if too many events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Check if an IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Get security metrics
   */
  getMetrics(timeRangeHours = 24): SecurityMetrics {
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(
      event => new Date(event.timestamp) >= startTime
    );

    const eventsByType: Record<string, number> = {};
    const eventsByLevel: Record<string, number> = {};
    const uniqueIPs = new Set<string>();

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByLevel[event.level] = (eventsByLevel[event.level] || 0) + 1;
      uniqueIPs.add(event.ip);
    });

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsByLevel,
      uniqueIPs,
      suspiciousIPs: Array.from(this.suspiciousIPs.entries())
        .filter(([_, count]) => count >= 5)
        .map(([ip]) => ip),
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit = 100, level?: SecurityRiskLevel): SecurityEvent[] {
    let events = [...this.events].reverse();
    
    if (level) {
      events = events.filter(event => event.level === level);
    }
    
    return events.slice(0, limit);
  }

  /**
   * Clear blocked IP
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    
    this.logEvent({
      type: SecurityEventType.ADMIN_ACCESS,
      level: SecurityRiskLevel.MEDIUM,
      message: `IP ${ip} manually unblocked`,
      ip: 'system',
      metadata: { action: 'ip_unblock', target_ip: ip }
    });
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): string {
    const metrics = this.getMetrics(24);
    const criticalEvents = this.getRecentEvents(50, SecurityRiskLevel.CRITICAL);
    const highEvents = this.getRecentEvents(50, SecurityRiskLevel.HIGH);
    
    return `
# 🔒 Security Report - ${new Date().toISOString()}

## Summary (Last 24 Hours)
- **Total Security Events:** ${metrics.totalEvents}
- **Unique IPs:** ${metrics.uniqueIPs.size}
- **Suspicious IPs:** ${metrics.suspiciousIPs.length}
- **Blocked IPs:** ${this.blockedIPs.size}

## Events by Risk Level
${Object.entries(metrics.eventsByLevel)
  .map(([level, count]) => `- **${level.toUpperCase()}:** ${count}`)
  .join('\n')}

## Events by Type
${Object.entries(metrics.eventsByType)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `- **${type}:** ${count}`)
  .join('\n')}

## Critical Events (Last 50)
${criticalEvents.length === 0 ? 'None' : 
  criticalEvents.map(event => 
    `- ${event.timestamp}: ${event.message} (IP: ${event.ip})`
  ).join('\n')}

## High Risk Events (Last 50)
${highEvents.length === 0 ? 'None' : 
  highEvents.map(event => 
    `- ${event.timestamp}: ${event.message} (IP: ${event.ip})`
  ).join('\n')}

## Suspicious IPs
${metrics.suspiciousIPs.length === 0 ? 'None detected' :
  metrics.suspiciousIPs.map(ip => `- ${ip}`).join('\n')}

## Recommendations
${this.generateRecommendations(metrics)}
`;
  }

  /**
   * Console logging with proper formatting
   */
  private consoleLog(event: SecurityEvent): void {
    if (!env.ENABLE_DEBUG_LOGGING && event.level === SecurityRiskLevel.LOW) {
      return; // Skip low-level events in production
    }

    const emoji = this.getLevelEmoji(event.level);
    const timestamp = new Date(event.timestamp).toLocaleString();
    
    const logMessage = `${emoji} [${event.level.toUpperCase()}] ${timestamp} - ${event.message}`;
    const details = {
      type: event.type,
      ip: event.ip,
      ...(event.userId && { userId: event.userId }),
      ...(event.endpoint && { endpoint: event.endpoint }),
      ...(event.metadata && { metadata: event.metadata })
    };

    switch (event.level) {
      case SecurityRiskLevel.CRITICAL:
        console.error(logMessage, details);
        break;
      case SecurityRiskLevel.HIGH:
        console.error(logMessage, details);
        break;
      case SecurityRiskLevel.MEDIUM:
        console.warn(logMessage, details);
        break;
      case SecurityRiskLevel.LOW:
        console.info(logMessage, details);
        break;
    }
  }

  /**
   * Send events to external monitoring services
   */
  private sendToExternalMonitoring(event: SecurityEvent): void {
    // Send to Sentry if configured
    if (env.SENTRY_DSN && (event.level === SecurityRiskLevel.HIGH || event.level === SecurityRiskLevel.CRITICAL)) {
      try {
        // Note: In a real implementation, you'd import and use Sentry SDK
        // Sentry.captureException(new Error(event.message), {
        //   tags: { securityEvent: true, level: event.level },
        //   extra: event
        // });
      } catch (error) {
        console.error('Failed to send event to Sentry:', error);
      }
    }

    // Send to custom webhook if configured
    if (process.env.SECURITY_WEBHOOK_URL && event.level !== SecurityRiskLevel.LOW) {
      this.sendToWebhook(event).catch(error => {
        console.error('Failed to send security event to webhook:', error);
      });
    }
  }

  /**
   * Send event to webhook
   */
  private async sendToWebhook(event: SecurityEvent): Promise<void> {
    const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SecurityLogger/1.0'
        },
        body: JSON.stringify({
          text: `🚨 Security Alert: ${event.message}`,
          attachments: [{
            color: this.getLevelColor(event.level),
            fields: [
              { title: 'Type', value: event.type, short: true },
              { title: 'Level', value: event.level, short: true },
              { title: 'IP', value: event.ip, short: true },
              { title: 'Timestamp', value: event.timestamp, short: true }
            ]
          }]
        })
      });
    } catch (error) {
      // Fail silently to avoid infinite loops
    }
  }

  /**
   * Check if event type is suspicious
   */
  private isSuspiciousEvent(type: SecurityEventType): boolean {
    const suspiciousTypes = [
      SecurityEventType.AUTH_FAILURE,
      SecurityEventType.SUSPICIOUS_REQUEST,
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
      SecurityEventType.CSRF_ATTEMPT
    ];
    
    return suspiciousTypes.includes(type);
  }

  /**
   * Get emoji for security level
   */
  private getLevelEmoji(level: SecurityRiskLevel): string {
    switch (level) {
      case SecurityRiskLevel.CRITICAL: return '🔥';
      case SecurityRiskLevel.HIGH: return '🚨';
      case SecurityRiskLevel.MEDIUM: return '⚠️';
      case SecurityRiskLevel.LOW: return 'ℹ️';
      default: return '📝';
    }
  }

  /**
   * Get color for security level
   */
  private getLevelColor(level: SecurityRiskLevel): string {
    switch (level) {
      case SecurityRiskLevel.CRITICAL: return 'danger';
      case SecurityRiskLevel.HIGH: return 'warning';
      case SecurityRiskLevel.MEDIUM: return '#ff9500';
      case SecurityRiskLevel.LOW: return 'good';
      default: return '#cccccc';
    }
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(metrics: SecurityMetrics): string {
    const recommendations: string[] = [];

    // Check for high failure rates
    const authFailures = metrics.eventsByType[SecurityEventType.AUTH_FAILURE] || 0;
    const authSuccesses = metrics.eventsByType[SecurityEventType.AUTH_SUCCESS] || 0;
    const failureRate = authFailures / (authFailures + authSuccesses);

    if (failureRate > 0.3) {
      recommendations.push('High authentication failure rate detected. Consider implementing CAPTCHA or account lockouts.');
    }

    // Check for suspicious activity
    if (metrics.suspiciousIPs.length > 10) {
      recommendations.push('Multiple suspicious IPs detected. Consider implementing IP-based blocking or geo-filtering.');
    }

    // Check for rate limiting
    const rateLimitEvents = metrics.eventsByType[SecurityEventType.RATE_LIMIT_EXCEEDED] || 0;
    if (rateLimitEvents > 100) {
      recommendations.push('High rate limiting activity. Consider adjusting rate limits or implementing progressive delays.');
    }

    return recommendations.length > 0 
      ? recommendations.map(r => `- ${r}`).join('\n')
      : '- No immediate security concerns detected.';
  }

  /**
   * Cleanup old events and reset counters
   */
  private cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Remove old events
    this.events = this.events.filter(
      event => new Date(event.timestamp) > oneDayAgo
    );
    
    // Reset suspicious IP counters for IPs with no recent activity
    for (const [ip, _] of Array.from(this.suspiciousIPs.entries())) {
      const recentActivity = this.events.some(
        event => event.ip === ip && new Date(event.timestamp) > oneDayAgo
      );
      
      if (!recentActivity) {
        this.suspiciousIPs.delete(ip);
        this.blockedIPs.delete(ip);
      }
    }
  }
}

// Singleton instance
export const securityLogger = new SecurityLogger();

// Helper functions for common security events
export const logAuthSuccess = (ip: string, userId: string, email?: string) => {
  securityLogger.logEvent({
    type: SecurityEventType.AUTH_SUCCESS,
    level: SecurityRiskLevel.LOW,
    message: `Successful authentication for user ${userId}`,
    ip,
    userId,
    email
  });
};

export const logAuthFailure = (ip: string, email?: string, reason?: string) => {
  securityLogger.logEvent({
    type: SecurityEventType.AUTH_FAILURE,
    level: SecurityRiskLevel.MEDIUM,
    message: `Failed authentication attempt${email ? ` for ${email}` : ''}${reason ? `: ${reason}` : ''}`,
    ip,
    email,
    metadata: { reason }
  });
};

export const logSuspiciousRequest = (ip: string, endpoint: string, reason: string, userAgent?: string) => {
  securityLogger.logEvent({
    type: SecurityEventType.SUSPICIOUS_REQUEST,
    level: SecurityRiskLevel.HIGH,
    message: `Suspicious request detected: ${reason}`,
    ip,
    endpoint,
    userAgent,
    metadata: { reason }
  });
};

export const logRateLimitExceeded = (ip: string, endpoint: string) => {
  securityLogger.logEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    level: SecurityRiskLevel.MEDIUM,
    message: `Rate limit exceeded for ${endpoint}`,
    ip,
    endpoint
  });
};

export const logAdminAccess = (ip: string, userId: string, action: string, email?: string) => {
  securityLogger.logEvent({
    type: SecurityEventType.ADMIN_ACCESS,
    level: SecurityRiskLevel.MEDIUM,
    message: `Admin access: ${action}`,
    ip,
    userId,
    email,
    metadata: { action }
  });
};