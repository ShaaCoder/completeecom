/**
 * Email Service
 * 
 * Service for sending emails using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import { emailConfig, emailTemplates, validateEmailConfig } from './email-config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    image: string;
    price: number;
    quantity: number;
    variant?: string;
  }>;
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  trackingUrl?: string;
  companyName?: string;
  companyAddress?: string;
  supportUrl?: string;
  returnUrl?: string;
  unsubscribeUrl?: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      console.log('📧 EmailService: Initializing transporter...');
      console.log('📧 EmailService: Environment check:', {
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
        EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
      });
      
      validateEmailConfig();
      
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: {
          user: emailConfig.smtp.auth.user,
          pass: emailConfig.smtp.auth.pass,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = join(process.cwd(), 'lib', 'email-templates', `${templateName}.html`);
      return readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  private compileTemplate(templateContent: string, data: any): string {
    try {
      console.log('📧 EmailService: Compiling template with data:', Object.keys(data));
      
      // Register Handlebars helpers if needed
      Handlebars.registerHelper('formatPrice', function(price: number) {
        return price.toFixed(2);
      });
      
      const template = Handlebars.compile(templateContent);
      const compiledHtml = template(data);
      
      console.log('📧 EmailService: Template compiled successfully, length:', compiledHtml.length);
      return compiledHtml;
    } catch (error) {
      console.error('❌ EmailService: Failed to compile template:', error);
      console.error('❌ EmailService: Template data:', JSON.stringify(data, null, 2));
      throw new Error('Failed to compile email template: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('🚀 EmailService: sendEmail called with options:', { to: options.to, subject: options.subject });
    
    if (!this.isConfigured) {
      console.error('❌ Email service is not configured. Please check environment variables.');
      return false;
    }

    try {
      const mailOptions = {
        from: {
          name: emailConfig.defaults.from.name,
          address: emailConfig.defaults.from.address,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };
      
      console.log('📧 EmailService: Mail options prepared:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html,
        hasText: !!mailOptions.text
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully with messageId:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      console.error('❌ Email error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? error.code : undefined,
        command: error instanceof Error && 'command' in error ? error.command : undefined
      });
      return false;
    }
  }

  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    try {
      console.log('📧 EmailService: Starting sendOrderConfirmation for order:', data.orderNumber);
      console.log('📧 EmailService: Customer email:', data.customerEmail);
      console.log('📧 EmailService: Email service configured:', this.isConfigured);
      
      // Load and compile the template
      console.log('📧 EmailService: Loading email template...');
      const templateContent = await this.loadTemplate('order-confirmation');
      console.log('📧 EmailService: Template loaded successfully, length:', templateContent.length);
      
      // Format data for template
      const templateData = {
        ...data,
        orderDate: new Date(data.orderDate).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        subtotal: data.subtotal.toFixed(2),
        shipping: data.shipping.toFixed(2),
        discount: data.discount ? data.discount.toFixed(2) : undefined,
        total: data.total.toFixed(2),
        items: data.items.map(item => ({
          ...item,
          price: item.price.toFixed(2),
        })),
        trackingUrl: data.trackingUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/orders/${data.orderId}`,
        companyName: data.companyName || 'Your E-commerce Store',
        companyAddress: data.companyAddress || 'Your Store Address',
        supportUrl: data.supportUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/support`,
        returnUrl: data.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/returns`,
        unsubscribeUrl: data.unsubscribeUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/unsubscribe`,
      };

      const htmlContent = this.compileTemplate(templateContent, templateData);
      
      // Generate subject
      const subject = emailTemplates.orderConfirmation.subject.replace('#{orderNumber}', data.orderNumber);

      // Send email
      console.log('📧 EmailService: Sending email with subject:', subject);
      const emailResult = await this.sendEmail({
        to: data.customerEmail,
        subject,
        html: htmlContent,
        text: `Your order ${data.orderNumber} has been confirmed. Total: ₹${data.total.toFixed(2)}`,
      });
      console.log('📧 EmailService: Send email result:', emailResult);
      return emailResult;
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      return false;
    }
  }

  async sendOrderShipped(data: OrderEmailData & { trackingNumber: string; carrier: string }): Promise<boolean> {
    try {
      // For now, we'll use a simple HTML template for shipped emails
      // You can create a separate template file later
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">📦 Your Order Has Been Shipped!</h1>
          <p>Hi ${data.customerName},</p>
          <p>Great news! Your order <strong>${data.orderNumber}</strong> has been shipped and is on its way to you.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Tracking Information</h3>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            <p><strong>Carrier:</strong> ${data.carrier}</p>
            <p><a href="${data.trackingUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Track Your Package</a></p>
          </div>
          
          <p>Expected delivery: 3-5 business days</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.<br>
            ${data.companyName || 'Your E-commerce Store'}
          </p>
        </div>
      `;

      const subject = emailTemplates.orderShipped.subject.replace('#{orderNumber}', data.orderNumber);

      return await this.sendEmail({
        to: data.customerEmail,
        subject,
        html: htmlContent,
        text: `Your order ${data.orderNumber} has been shipped. Tracking: ${data.trackingNumber}`,
      });
    } catch (error) {
      console.error('Failed to send order shipped email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection test successful');
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
const emailService = new EmailService();

export default emailService;

// Export the class for testing purposes
export { EmailService };