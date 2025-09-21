/**
 * Cart Model
 * 
 * Mongoose schema and model for Cart entity
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ICartDocument, ICartItem } from '@/types/cart';

// Cart item sub-schema (avoid complex generics for TS)
const CartItemSchema = new Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum 10 items allowed per product'],
  },
  variant: {
    type: String,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// Cart schema definition (drop generic to avoid complex union types)
const CartSchema = new Schema(
  {
    userId: {
      type: String,
      sparse: true, // Allow multiple null values for guest carts
      index: true,
    },
    sessionId: {
      type: String,
      trim: true,
      sparse: true, // Allow multiple null values
      index: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: function (items: ICartItem[]) {
          return items.length <= 50; // Maximum 50 items in cart
        },
        message: 'Cart cannot have more than 50 items',
      },
    },
    subtotal: {
      type: Number,
      min: [0, 'Subtotal cannot be negative'],
      default: 0,
    },
    totalItems: {
      type: Number,
      min: [0, 'Total items cannot be negative'],
      default: 0,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index for automatic cleanup
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
CartSchema.index({ userId: 1 }, { unique: true, sparse: true });
CartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
CartSchema.index({ updatedAt: -1 });
CartSchema.index({ expiresAt: 1 });

// Pre-save middleware to set expiration for guest carts
CartSchema.pre('save', function (next) {
  // Set expiration for guest carts (30 days)
  if (!this.userId && this.sessionId && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  // Remove expiration for user carts
  if (this.userId && this.expiresAt) {
    this.expiresAt = undefined;
  }
  
  next();
});

// Pre-save middleware to calculate totals
CartSchema.pre('save', function (next) {
  // Calculate subtotal and total items
  this.subtotal = 0;
  this.totalItems = 0;
  
  (this.items as any[]).forEach((item: any) => {
    this.subtotal += Number(item.price) * Number(item.quantity);
    this.totalItems += Number(item.quantity);
  });
  
  next();
});

// Instance method to add item to cart
CartSchema.methods.addItem = async function (itemData: Omit<ICartItem, 'addedAt'>): Promise<void> {
  const existingItemIndex = (this.items as any[]).findIndex((item: any) => 
    item.productId === itemData.productId && 
    item.variant === itemData.variant
  );
  
  if (existingItemIndex > -1) {
    // Update existing item quantity
    const existingItem = (this.items as any[])[existingItemIndex];
    const newQuantity = existingItem.quantity + itemData.quantity;
    
    // Check max quantity limit
    if (newQuantity > 10) {
      throw new Error('Maximum 10 items allowed per product');
    }
    
    existingItem.quantity = newQuantity;
    existingItem.addedAt = new Date();
  } else {
    // Add new item
    if (itemData.quantity > 10) {
      throw new Error('Maximum 10 items allowed per product');
    }
    
    (this.items as any[]).push({
      ...itemData,
      addedAt: new Date(),
    });
  }
  
  await this.save();
};

// Instance method to update item quantity
CartSchema.methods.updateItem = async function (
  productId: string, 
  quantity: number, 
  variant?: string
): Promise<void> {
  const itemIndex = (this.items as any[]).findIndex((item: any) => 
    item.productId === productId && item.variant === variant
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    (this.items as any[]).splice(itemIndex, 1);
  } else {
    // Check max quantity limit
    if (quantity > 10) {
      throw new Error('Maximum 10 items allowed per product');
    }
    
    (this.items as any[])[itemIndex].quantity = quantity;
  }
  
  await this.save();
};

// Instance method to remove item from cart
CartSchema.methods.removeItem = async function (productId: string, variant?: string): Promise<void> {
  const itemIndex = (this.items as any[]).findIndex((item: any) => 
    item.productId === productId && item.variant === variant
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  (this.items as any[]).splice(itemIndex, 1);
  await this.save();
};

// Instance method to clear cart
CartSchema.methods.clearCart = async function (): Promise<void> {
  this.items = [];
  await this.save();
};

// Static method to find cart by user
CartSchema.statics.findByUser = function (userId: string) {
  return this.findOne({ userId });
};

// Static method to find cart by session
CartSchema.statics.findBySession = function (sessionId: string) {
  return this.findOne({ sessionId });
};

// Create and export the Cart model using safe getter to avoid complex unions
let CartModel: Model<ICartDocument>;
try {
  CartModel = mongoose.model<ICartDocument>('Cart');
} catch {
  CartModel = mongoose.model<ICartDocument>('Cart', CartSchema as any);
}

export default CartModel;