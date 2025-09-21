/**
 * Email Configuration
 * 
 * Configuration for email services including SMTP settings for Gmail
 */

export const emailConfig = {
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // Your Gmail app password
    },
  },
  defaults: {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Your Store Name',
      address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '',
    },
  },
};

export const emailTemplates = {
  orderConfirmation: {
    subject: 'Order Confirmation - #{orderNumber}',
    template: 'order-confirmation',
  },
  orderShipped: {
    subject: 'Your Order Has Been Shipped - #{orderNumber}',
    template: 'order-shipped',
  },
  orderDelivered: {
    subject: 'Order Delivered - #{orderNumber}',
    template: 'order-delivered',
  },
};

// Validate email configuration
export function validateEmailConfig() {
  const required = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}