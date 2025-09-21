/**
 * Validation Schemas and Utilities
 * 
 * Centralized validation logic using Zod for type-safe validation
 * with comprehensive error handling and custom validation rules
 */

import { z } from 'zod';
import { CreateUserRequest } from '@/types/user';
import { CreatePostRequest, UpdatePostRequest } from '@/types/post';

export const objectIdSchema = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  'Invalid ObjectId format'
);

export const phoneSchema = z.string().regex(
  /^[6-9]\d{9}$/,
  'Invalid Indian phone number format'
);

export const pincodeSchema = z.string().regex(
  /^[1-9][0-9]{5}$/,
  'Invalid pincode format'
);

export const slugSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Invalid slug format'
);

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: passwordSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['customer', 'admin']).optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['customer', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

// Lightweight profile update schema for self-service updates
export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const addressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  address: z.string().min(10).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: pincodeSchema,
  isDefault: z.boolean().default(false),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().optional(), // Slug is auto-generated, so optional in input
  description: z.string().min(10).max(5000),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  images: z.array(
    z.string().refine(
      (value) => {
        // Allow local upload paths (uploads/products/xxx or uploads/categories/xxx)
        const isLocalUpload = /^uploads\/(products|categories)\//.test(value);
        // Allow HTTP/HTTPS URLs
        const isValidUrl = /^https?:\/\/.+/i.test(value);
        return isLocalUpload || isValidUrl;
      },
      'Images must be either uploaded files or valid URLs'
    )
  ).min(1, 'At least one image is required'),
  category: z.string().min(1),
  subcategory: z.string().max(100).optional(),
  brand: z.string().min(1).max(100),
  stock: z.number().int().min(0),
  tags: z.array(z.string().max(50)).default([]),
  features: z.array(z.string().max(200)).default([]),
  ingredients: z.array(z.string().max(100)).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewProduct: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['card', 'upi', 'netbanking', 'wallet', 'cod', 'emi']),
  couponCode: z.string().max(50).optional(),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(10, 'Maximum 10 items can be added at once'),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(10),
});

// Flexible ObjectId validator that supports both boolean-style and error-object usage
export function validateObjectId(id: string, field?: string): any {
  const isValid = !!id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

  if (field) {
    // When a field name is provided, return null when valid, else an error object
    return isValid ? null : { field, message: 'Invalid ID format' };
  }

  // Backward-compatible usage returning isValid/message
  return { isValid, message: isValid ? undefined : 'Invalid ID format' };
}

export function validateEmail(email: string): { isValid: boolean; message?: string } {
  const result = z.string().email().safeParse(email);
  return {
    isValid: result.success,
    message: result.success ? undefined : 'Invalid email format',
  };
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  const result = passwordSchema.safeParse(password);
  return {
    isValid: result.success,
    message: result.success ? undefined : result.error.errors[0]?.message,
  };
}

export function formatZodError(error: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  return formattedErrors;
}

export const userValidation = {
  create: (data: any) => {
    const result = createUserSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  },
  update: (data: any) => {
    const result = updateUserSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  },
  login: (data: any) => {
    const result = loginSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  },
  updateProfile: (data: any) => {
    const result = updateUserProfileSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  },
};

// ... rest of the file remains unchanged

export const productValidation = {
  create: (data: any) => {
    const result = createProductSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  },
  update: (data: any) => {
    const result = updateProductSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
};

export const orderValidation = {
  create: (data: any) => {
    const result = createOrderSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
};

export const cartValidation = {
  addItem: (data: any) => {
    const result = addToCartSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  },
  updateItem: (data: any) => {
    const result = updateCartItemSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
};

// =========================
// Post validations
// =========================

const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().url().optional(),
  category: objectIdSchema,
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

const updatePostSchema = createPostSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const postValidation = {
  create: (data: CreatePostRequest) => {
    const result = createPostSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success
        ? []
        : result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
    };
  },
  update: (data: UpdatePostRequest) => {
    const result = updatePostSchema.safeParse(data);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success
        ? []
        : result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
    };
  },
};