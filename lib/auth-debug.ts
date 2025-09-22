/**
 * Authentication Debug Utilities
 * 
 * Centralized debugging and monitoring for authentication issues
 */

export interface AuthDebugInfo {
  timestamp: string;
  event: string;
  details: Record<string, any>;
  userId?: string;
  userEmail?: string;
}

class AuthDebugger {
  private logs: AuthDebugInfo[] = [];
  private maxLogs = 50;

  log(event: string, details: Record<string, any> = {}, user?: any) {
    const debugInfo: AuthDebugInfo = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userId: user?.id || user?._id?.toString(),
      userEmail: user?.email,
    };

    this.logs.push(debugInfo);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log with emoji for easy identification
    const emoji = this.getEventEmoji(event);
    console.log(`${emoji} [AUTH] ${event}:`, {
      ...details,
      ...(user ? { user: user.email || user.id } : {}),
    });
  }

  private getEventEmoji(event: string): string {
    const eventEmojis: Record<string, string> = {
      'session-start': '🚀',
      'session-sync': '🔄',
      'session-found': '✅',
      'session-lost': '❌',
      'session-error': '🚨',
      'auth-success': '🎉',
      'auth-failure': '💥',
      'token-valid': '🔑',
      'token-invalid': '🔒',
      'user-login': '👤',
      'user-logout': '👋',
      'hydration': '💧',
      'persistence': '💾',
      'api-call': '📡',
      'middleware': '⚡',
    };

    return eventEmojis[event] || '🔍';
  }

  getLogs(): AuthDebugInfo[] {
    return [...this.logs];
  }

  getRecentLogs(count: number = 10): AuthDebugInfo[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
    console.log('🗑️ [AUTH] Debug logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Analyze common auth issues
  analyzeIssues(): string[] {
    const issues: string[] = [];
    const recentLogs = this.getRecentLogs(20);

    // Check for session loss patterns
    const sessionLostCount = recentLogs.filter(log => log.event === 'session-lost').length;
    if (sessionLostCount > 2) {
      issues.push(`Frequent session loss detected (${sessionLostCount} times recently)`);
    }

    // Check for auth errors
    const authErrors = recentLogs.filter(log => log.event === 'session-error' || log.event === 'auth-failure');
    if (authErrors.length > 3) {
      issues.push(`Multiple authentication errors detected (${authErrors.length} times)`);
    }

    // Check for hydration issues
    const hydrationIssues = recentLogs.filter(log => 
      log.event === 'hydration' && log.details.error
    );
    if (hydrationIssues.length > 1) {
      issues.push('Hydration issues detected - may cause session sync problems');
    }

    // Check for API failures
    const apiFailures = recentLogs.filter(log => 
      log.event === 'api-call' && !log.details.success
    );
    if (apiFailures.length > 2) {
      issues.push(`API authentication failures detected (${apiFailures.length} times)`);
    }

    return issues;
  }

  // Get summary of auth state
  getSummary(): Record<string, any> {
    const recentLogs = this.getRecentLogs(10);
    const lastLogin = recentLogs.findLast(log => log.event === 'user-login');
    const lastLogout = recentLogs.findLast(log => log.event === 'user-logout');
    const lastSessionSync = recentLogs.findLast(log => log.event === 'session-sync');
    const lastError = recentLogs.findLast(log => 
      log.event.includes('error') || log.event.includes('failure')
    );

    return {
      totalLogs: this.logs.length,
      recentActivity: recentLogs.length,
      lastLogin: lastLogin?.timestamp,
      lastLogout: lastLogout?.timestamp,
      lastSessionSync: lastSessionSync?.timestamp,
      lastError: lastError ? {
        event: lastError.event,
        timestamp: lastError.timestamp,
        details: lastError.details,
      } : null,
      issues: this.analyzeIssues(),
    };
  }
}

// Global debug instance
export const authDebugger = new AuthDebugger();

// Convenience functions
export const logAuthEvent = (event: string, details?: Record<string, any>, user?: any) => {
  authDebugger.log(event, details, user);
};

export const logSessionEvent = (event: 'found' | 'lost' | 'sync' | 'error', details?: Record<string, any>, user?: any) => {
  authDebugger.log(`session-${event}`, details, user);
};

export const logAuthError = (error: Error | string, context?: string, user?: any) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  authDebugger.log('auth-failure', {
    error: errorMessage,
    stack: errorStack,
    context,
  }, user);
};

// Browser-only functions for development
export const getAuthDebugInfo = () => {
  if (typeof window !== 'undefined') {
    return {
      summary: authDebugger.getSummary(),
      recentLogs: authDebugger.getRecentLogs(15),
      issues: authDebugger.analyzeIssues(),
    };
  }
  return null;
};

// Add to window for easy debugging in dev tools
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authDebug = {
    logs: () => authDebugger.getLogs(),
    recent: (count?: number) => authDebugger.getRecentLogs(count),
    summary: () => authDebugger.getSummary(),
    clear: () => authDebugger.clearLogs(),
    export: () => authDebugger.exportLogs(),
    analyze: () => authDebugger.analyzeIssues(),
    info: getAuthDebugInfo,
  };
}