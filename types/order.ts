import { Document } from 'mongoose';
import { IAddress } from './user';

// Order item interface - matches your existing CartItem structure
export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

// Base Order interface - DB representation
export interface IOrder {
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod' | 'emi';
  paymentIntentId?: string;
  stripeSessionId?: string;
  shippingAddress: IAddress;
  createdAt: Date;
  updatedAt: Date;
  // Optional tracking and timeline fields (persisted by model)
  trackingNumber?: string;
  carrier?: string;
  paymentAt?: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  expectedDeliveryAt?: Date;
  // Email tracking fields
  confirmationEmailSent?: boolean;
  confirmationEmailSentAt?: Date;
  shippingEmailSent?: boolean;
  shippingEmailSentAt?: Date;
  deliveryEmailSent?: boolean;
  deliveryEmailSentAt?: Date;
}

// Mongoose Document
export interface IOrderDocument extends IOrder, Document {
  toJSON(): Partial<IOrder>;
}

// Request body for creating order
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: IAddress;
  paymentMethod: string;
  couponCode?: string;
}

// API Response type
export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: IAddress;
  createdAt: string;   // ✅ ISO string for API
  updatedAt: string;   // ✅ ISO string for API
  // Optional timeline dates (ISO strings)
  paymentAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  expectedDeliveryAt?: string;
  // Email tracking fields (ISO strings)
  confirmationEmailSentAt?: string;
  shippingEmailSentAt?: string;
  deliveryEmailSentAt?: string;
}

// Order query parameters
export interface OrderQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}
