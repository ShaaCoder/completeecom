/**
 * Test Email API
 * 
 * POST /api/admin/test-email - Test email configuration and send test email
 */

import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  return withAuth(async (req, currentUser) => {
    try {
      // Only admin can test email
      if (currentUser.role !== 'admin') {
        return createErrorResponse(
          'Insufficient permissions',
          403,
          'Authorization Error'
        );
      }

      // Rate limiting
      const clientIP = getClientIP(req);
      const rateLimitResult = rateLimit(`test_email_${clientIP}`, 5, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      const body = await req.json();
      const { testEmail, testType = 'connection' } = body;

      if (testType === 'connection') {
        // Test SMTP connection
        const connectionTest = await emailService.testConnection();
        
        if (connectionTest) {
          return createSuccessResponse({
            connectionStatus: 'success',
            message: 'Email service connection successful'
          }, 'Email connection test passed');
        } else {
          return createErrorResponse(
            'Email service connection failed',
            500,
            'Connection Error'
          );
        }
      }

      if (testType === 'send') {
        if (!testEmail) {
          return createErrorResponse(
            'Test email address is required',
            400,
            'Validation Error'
          );
        }

        // Send test email
        const testEmailSent = await emailService.sendEmail({
          to: testEmail,
          subject: '✅ Email Test from Your E-commerce Store',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">🎉 Email Test Successful!</h1>
              
              <div style="background-color: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #2e7d32; margin-top: 0;">✅ Your email configuration is working correctly!</h3>
                <p style="color: #555; margin-bottom: 0;">
                  This test email confirms that your e-commerce store can successfully send emails 
                  for order confirmations, shipping notifications, and other important updates.
                </p>
              </div>
              
              <div style="background-color: #f5f5f5; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #333; margin-top: 0;">Test Details:</h4>
                <ul style="color: #666;">
                  <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
                  <li><strong>From:</strong> ${process.env.EMAIL_FROM_NAME || 'Your Store'}</li>
                  <li><strong>To:</strong> ${testEmail}</li>
                  <li><strong>Service:</strong> Gmail SMTP</li>
                </ul>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                This is an automated test email from your e-commerce store's email service.
              </p>
            </div>
          `,
          text: `Email Test Successful!\n\nYour email configuration is working correctly. This test email confirms that your e-commerce store can successfully send emails for order confirmations and other important updates.\n\nSent at: ${new Date().toISOString()}\nTo: ${testEmail}`
        });

        if (testEmailSent) {
          return createSuccessResponse({
            emailSent: true,
            testEmail,
            sentAt: new Date().toISOString(),
          }, 'Test email sent successfully');
        } else {
          return createErrorResponse(
            'Failed to send test email',
            500,
            'Email Service Error'
          );
        }
      }

      return createErrorResponse(
        'Invalid test type. Supported types: connection, send',
        400,
        'Invalid Test Type'
      );

    } catch (error) {
      return handleApiError(error, 'POST /api/admin/test-email');
    }
  }, ['admin'])(request);
}