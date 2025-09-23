/**
 * API Connection Diagnostics
 * GET /api/debug/connection-status
 * 
 * Comprehensive diagnostic tool for API connection issues
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB, { getConnectionStatus, getConnectionStats, isConnected } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Order from '@/models/Order';
import User from '@/models/User';
import { logAuthEvent } from '@/lib/auth-debug';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    logAuthEvent('api-call', {
      endpoint: '/api/debug/connection-status',
      method: 'GET',
      startTime: new Date().toISOString()
    });

    // Test database connection
    const dbConnectStart = Date.now();
    await connectDB();
    const dbConnectTime = Date.now() - dbConnectStart;

    // Get connection status
    const connectionStatus = getConnectionStatus();
    const connectionStats = getConnectionStats();
    const isDbConnected = isConnected();

    // Test individual model queries
    const modelTests: Array<{
      model: string;
      success: boolean;
      count: number;
      responseTime: number;
      error: string | null;
    }> = [];

    // Test Products
    try {
      const productTestStart = Date.now();
      const productCount = await Product.countDocuments({ isActive: true });
      const productTestTime = Date.now() - productTestStart;
      modelTests.push({
        model: 'Product',
        success: true,
        count: productCount,
        responseTime: productTestTime,
        error: null
      });
    } catch (error) {
      modelTests.push({
        model: 'Product',
        success: false,
        count: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Categories
    try {
      const categoryTestStart = Date.now();
      const categoryCount = await Category.countDocuments({ isActive: true });
      const categoryTestTime = Date.now() - categoryTestStart;
      modelTests.push({
        model: 'Category',
        success: true,
        count: categoryCount,
        responseTime: categoryTestTime,
        error: null
      });
    } catch (error) {
      modelTests.push({
        model: 'Category',
        success: false,
        count: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Orders
    try {
      const orderTestStart = Date.now();
      const orderCount = await Order.countDocuments({});
      const orderTestTime = Date.now() - orderTestStart;
      modelTests.push({
        model: 'Order',
        success: true,
        count: orderCount,
        responseTime: orderTestTime,
        error: null
      });
    } catch (error) {
      modelTests.push({
        model: 'Order',
        success: false,
        count: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Users
    try {
      const userTestStart = Date.now();
      const userCount = await User.countDocuments({ isActive: true });
      const userTestTime = Date.now() - userTestStart;
      modelTests.push({
        model: 'User',
        success: true,
        count: userCount,
        responseTime: userTestTime,
        error: null
      });
    } catch (error) {
      modelTests.push({
        model: 'User',
        success: false,
        count: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check environment variables
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      MONGODB_DB_NAME: !!process.env.MONGODB_DB_NAME,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Check rate limiting from headers
    const rateLimitHeaders = {
      'X-RateLimit-Limit': request.headers.get('X-RateLimit-Limit'),
      'X-RateLimit-Remaining': request.headers.get('X-RateLimit-Remaining'),
      'X-RateLimit-Reset': request.headers.get('X-RateLimit-Reset'),
    };

    // Memory usage
    const memoryUsage = process.memoryUsage();

    const totalTime = Date.now() - startTime;

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      totalResponseTime: totalTime,

      // Database diagnostics
      database: {
        connectionStatus,
        isConnected: isDbConnected,
        connectionTime: dbConnectTime,
        stats: connectionStats,
      },

      // Model diagnostics
      models: modelTests,

      // Environment diagnostics
      environment: envCheck,

      // Rate limiting diagnostics
      rateLimiting: rateLimitHeaders,

      // System diagnostics
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        }
      },

      // Health summary
      health: {
        overall: connectionStatus === 'connected' && modelTests.every(test => test.success),
        database: connectionStatus === 'connected',
        models: modelTests.every(test => test.success),
        performance: totalTime < 5000, // Under 5 seconds
      },

      // Issues detected
      issues: []
    };

    // Analyze issues
    if (diagnostics.database.connectionTime > 2000) {
      diagnostics.issues.push('Database connection is slow (>2s)');
    }

    if (!diagnostics.database.isConnected) {
      diagnostics.issues.push('Database is not connected');
    }

    modelTests.forEach(test => {
      if (!test.success) {
        diagnostics.issues.push(`${test.model} model test failed: ${test.error}`);
      }
      if (test.responseTime > 1000) {
        diagnostics.issues.push(`${test.model} query is slow (${test.responseTime}ms)`);
      }
    });

    if (totalTime > 5000) {
      diagnostics.issues.push('Overall diagnostic response time is slow (>5s)');
    }

    // Log the completion
    logAuthEvent('api-call', {
      endpoint: '/api/debug/connection-status',
      success: true,
      totalTime,
      issues: diagnostics.issues.length
    });

    // Use NextResponse.json for API route compliance
    return NextResponse.json(
      createSuccessResponse(
        diagnostics,
        `Diagnostics completed in ${totalTime}ms`
      )
    );

  } catch (error) {
    logAuthEvent('api-call', {
      endpoint: '/api/debug/connection-status',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalTime: Date.now() - startTime
    });

    // Use NextResponse.json for API route compliance
    return NextResponse.json(
      handleApiError(error, 'GET /api/debug/connection-status')
    );
  }
}