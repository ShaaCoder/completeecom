/**
 * Order Model
 * 
 * Mongoose schema and model for Order entity
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IOrderDocument, IOrderItem } from '@/types/order';

// Order item sub-schema
// Drop generic to avoid complex union types for subdocument
const OrderItemSchema = new Schema({
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
  },
  variant: {
    type: String,
    trim: true,
  },
}, { _id: false });

// Address sub-schema
const AddressSchema = new Schema({
  id: String,
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
  },
  isDefault: Boolean,
}, { _id: false });

// Order schema definition
// Drop generic on main schema as well to reduce TS complexity
const OrderSchema = new Schema(
  {
   orderNumber:
    { type: String, required: true, index: true }, 
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: function (items: IOrderItem[]) {
          return items && items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    shipping: {
      type: Number,
      required: [true, 'Shipping cost is required'],
      min: [0, 'Shipping cost cannot be negative'],
      default: 0,
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cod', 'emi'],
      required: [true, 'Payment method is required'],
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    shippingAddress: {
      type: AddressSchema,
      required: [true, 'Shipping address is required'],
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
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

// Optional shipping fields for tracking
// Note: Add after schema creation to avoid breaking existing docs
OrderSchema.add({
  trackingNumber: { type: String, index: true },
  carrier: { type: String },
  // timeline/date fields
  paymentAt: { type: Date },
  confirmedAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  expectedDeliveryAt: { type: Date },
  // Email tracking fields
  confirmationEmailSent: { type: Boolean, default: false },
  confirmationEmailSentAt: { type: Date },
  shippingEmailSent: { type: Boolean, default: false },
  shippingEmailSentAt: { type: Date },
  deliveryEmailSent: { type: Boolean, default: false },
  deliveryEmailSentAt: { type: Date },
});

// Pre-save middleware to generate order number
OrderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate totals
OrderSchema.pre('save', function (next) {
  // Calculate subtotal from items
  this.subtotal = (this.items as any[]).reduce((total: number, item: any) => {
    return total + (Number(item.price) * Number(item.quantity));
  }, 0);
  
  // Calculate total
  this.total = this.subtotal + this.shipping - this.discount;
  
  // Ensure total is not negative
  this.total = Math.max(0, this.total);
  
  next();
});

// Static method to find orders by user
OrderSchema.statics.findByUser = function (userId: string, options = {}) {
  return this.find({ userId, ...options })
    .sort({ createdAt: -1 });
};

// Static method to find orders by status
OrderSchema.statics.findByStatus = function (status: string, options = {}) {
  return this.find({ status, ...options })
    .sort({ createdAt: -1 });
};

// Create and export the Order model
const Order: Model<IOrderDocument> = 
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;