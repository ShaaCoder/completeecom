/**
 * Payment Gateway Integration
 * 
 * Supports multiple payment providers:
 * - Razorpay (Primary for India)
 * - Stripe (International)
 * - PayU (Alternative for India)
 */

import crypto from 'crypto';

// Payment Provider Types
export type PaymentProvider = 'razorpay' | 'stripe' | 'payu';

export interface PaymentConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  payu: {
    merchantKey: string;
    merchantSalt: string;
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  provider: PaymentProvider;
  providerPaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  providerResponse?: any;
  redirectUrl?: string;
  error?: string;
}

class PaymentGateway {
  private config: PaymentConfig;
  private defaultProvider: PaymentProvider;

  constructor() {
    this.config = {
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || '',
        keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
      },
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      },
      payu: {
        merchantKey: process.env.PAYU_MERCHANT_KEY || '',
        merchantSalt: process.env.PAYU_MERCHANT_SALT || '',
      },
    };
    this.defaultProvider = 'razorpay';
  }

  /**
   * Create payment intent with Razorpay
   */
  async createRazorpayPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: this.config.razorpay.keyId,
        key_secret: this.config.razorpay.keySecret,
      });

      const options = {
        amount: request.amount * 100, // Convert to paise
        currency: request.currency.toUpperCase(),
        receipt: request.orderId,
        notes: {
          customerId: request.customerId,
          customerEmail: request.customerEmail,
          ...request.metadata,
        },
      };

      const order = await razorpay.orders.create(options);

      return {
        success: true,
        paymentId: order.id,
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        providerResponse: order,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  /**
   * Create payment intent with Stripe
   */
  async createStripePayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const stripe = require('stripe')(this.config.stripe.secretKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: request.amount * 100, // Convert to cents
        currency: request.currency.toLowerCase(),
        metadata: {
          orderId: request.orderId,
          customerId: request.customerId,
          ...request.metadata,
        },
        description: request.description || `Payment for order ${request.orderId}`,
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        providerResponse: paymentIntent,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  /**
   * Create payment with PayU
   */
  async createPayUPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const txnid = `TXN${Date.now()}`;
      const productinfo = request.description || `Payment for order ${request.orderId}`;
      const firstname = request.customerEmail.split('@')[0];
      
      // Generate hash
      const hashString = `${this.config.payu.merchantKey}|${txnid}|${request.amount}|${productinfo}|${firstname}|${request.customerEmail}|||||||||||${this.config.payu.merchantSalt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const paymentData = {
        key: this.config.payu.merchantKey,
        txnid,
        amount: request.amount,
        productinfo,
        firstname,
        email: request.customerEmail,
        phone: request.customerPhone,
        hash,
        surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/success`,
        furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/failure`,
        udf1: request.orderId,
        udf2: request.customerId,
      };

      return {
        success: true,
        paymentId: txnid,
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        providerResponse: paymentData,
        redirectUrl: 'https://secure.payu.in/_payment',
      };
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  /**
   * Create payment with specified provider
   */
  async createPayment(
    request: CreatePaymentRequest,
    provider: PaymentProvider = this.defaultProvider
  ): Promise<PaymentResponse> {
    switch (provider) {
      case 'razorpay':
        return this.createRazorpayPayment(request);
      case 'stripe':
        return this.createStripePayment(request);
      case 'payu':
        return this.createPayUPayment(request);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Verify payment signature (Razorpay)
   */
  verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.razorpay.keySecret)
        .update(body.toString())
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    provider: PaymentProvider
  ): boolean {
    try {
      let secret: string;
      switch (provider) {
        case 'razorpay':
          secret = this.config.razorpay.webhookSecret;
          break;
        case 'stripe':
          secret = this.config.stripe.webhookSecret;
          break;
        default:
          return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string, provider: PaymentProvider): Promise<any> {
    try {
      switch (provider) {
        case 'razorpay': {
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: this.config.razorpay.keyId,
            key_secret: this.config.razorpay.keySecret,
          });
          return await razorpay.payments.fetch(paymentId);
        }
        case 'stripe': {
          const stripe = require('stripe')(this.config.stripe.secretKey);
          return await stripe.paymentIntents.retrieve(paymentId);
        }
        default:
          throw new Error(`Payment status check not supported for ${provider}`);
      }
    } catch (error) {
      throw error;
    }
  }
}

export const paymentGateway = new PaymentGateway();