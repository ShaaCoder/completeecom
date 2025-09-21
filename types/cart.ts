/**
 * Cart Type Definitions
 */

import { Document } from 'mongoose';

// Cart item interface
export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
  addedAt: Date;
}

// Base Cart interface
export interface ICart {
  userId?: string;
  sessionId?: string;
  items: ICartItem[];
  subtotal: number;
  totalItems: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Cart document interface (for Mongoose)
export interface ICartDocument extends ICart, Document {
  addItem(item: Omit<ICartItem, 'addedAt'>): Promise<void>;
  updateItem(productId: string, quantity: number, variant?: string): Promise<void>;
  removeItem(productId: string, variant?: string): Promise<void>;
  clearCart(): Promise<void>;
  toJSON(): Partial<ICart>;
}

// Add to cart request
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variant?: string;
}

// Update cart item request
export interface UpdateCartItemRequest {
  productId: string;
  quantity: number;
  variant?: string;
}

// Remove from cart request
export interface RemoveFromCartRequest {
  productId: string;
  variant?: string;
}