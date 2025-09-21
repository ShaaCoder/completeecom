/**
 * Content Security Policy Violation Report Endpoint
 * 
 * POST /api/csp-report - Receives CSP violation reports from browsers
 * This endpoint helps monitor and debug CSP violations in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityLogger, SecurityEventType, SecurityRiskLevel } from '@/lib/security-logger';

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// Helper function to analyze violation severity
function analyzeViolationSeverity(report: CSPViolationReport): SecurityRiskLevel {
  const violatedDirective = report['csp-report']['violated-directive'];
  const blockedUri = report['csp-report']['blocked-uri'];
  
  // High risk violations
  if (violatedDirective.includes('script-src') || violatedDirective.includes('object-src')) {
    if (blockedUri.includes('javascript:') || blockedUri.includes('data:') || blockedUri.includes('eval')) {
      return SecurityRiskLevel.HIGH;
    }
  }
  
  // Medium risk violations
  if (violatedDirective.includes('frame-src') || violatedDirective.includes('connect-src')) {
    return SecurityRiskLevel.MEDIUM;
  }
  
  // Low risk violations (style, image, font issues)
  return SecurityRiskLevel.LOW;
}

// Helper function to determine if violation is suspicious
function isSuspiciousViolation(report: CSPViolationReport): boolean {
  const blockedUri = report['csp-report']['blocked-uri'];
  const scriptSample = report['csp-report']['script-sample'] || '';
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:text\/javascript/i,
    /eval\(/i,
    /Function\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /<script/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i
  ];
  
  return suspiciousPatterns.some(pattern => 
    pattern.test(blockedUri) || pattern.test(scriptSample)
  );
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Parse the CSP violation report
    const report: CSPViolationReport = await request.json();
    
    if (!report['csp-report']) {
      return NextResponse.json({ error: 'Invalid CSP report format' }, { status: 400 });
    }
    
    const cspReport = report['csp-report'];
    const severity = analyzeViolationSeverity(report);
    const suspicious = isSuspiciousViolation(report);
    
    // Log the CSP violation
    securityLogger.logEvent({
      type: suspicious ? SecurityEventType.XSS_ATTEMPT : SecurityEventType.SUSPICIOUS_REQUEST,
      level: suspicious ? SecurityRiskLevel.HIGH : severity,
      message: `CSP violation: ${cspReport['violated-directive']} blocked ${cspReport['blocked-uri']}`,
      ip: clientIP,
      userAgent,
      endpoint: '/api/csp-report',
      metadata: {
        documentUri: cspReport['document-uri'],
        violatedDirective: cspReport['violated-directive'],
        blockedUri: cspReport['blocked-uri'],
        sourceFile: cspReport['source-file'],
        lineNumber: cspReport['line-number'],
        columnNumber: cspReport['column-number'],
        scriptSample: cspReport['script-sample'],
        disposition: cspReport.disposition,
        suspicious: suspicious,
        severity: severity
      }
    });
    
    // In development, log detailed information
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ CSP Violation Report:', {
        directive: cspReport['violated-directive'],
        blockedUri: cspReport['blocked-uri'],
        documentUri: cspReport['document-uri'],
        sourceFile: cspReport['source-file'],
        location: `${cspReport['line-number']}:${cspReport['column-number']}`,
        scriptSample: cspReport['script-sample'],
        suspicious: suspicious,
        severity: severity
      });
    }
    
    // Return success response
    return NextResponse.json({ 
      received: true,
      timestamp: new Date().toISOString()
    }, { status: 204 });
    
  } catch (error) {
    console.error('Error processing CSP report:', error);
    
    // Log the error as a security event
    securityLogger.logEvent({
      type: SecurityEventType.SUSPICIOUS_REQUEST,
      level: SecurityRiskLevel.MEDIUM,
      message: 'Malformed CSP report received',
      ip: getClientIP(request),
      endpoint: '/api/csp-report',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        rawBody: request.body ? 'Present' : 'Missing'
      }
    });
    
    return NextResponse.json({ error: 'Error processing report' }, { status: 400 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}