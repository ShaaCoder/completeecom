/**
 * Product Model
 * 
 * Mongoose schema and model for Product entity
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IProductDocument } from '@/types/product';

// Product schema definition
const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: 'text',
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      index: 'text',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    images: [{
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Allow local upload paths (uploads/products/xxx or uploads/categories/xxx)
          const isLocalUpload = /^uploads\/(products|categories)\//.test(v);
          // Allow HTTP/HTTPS URLs
          const isValidUrl = /^https?:\/\/.+/i.test(v);
          return isLocalUpload || isValidUrl;
        },
        message: 'Each image must be either an uploaded file or a valid HTTP/HTTPS URL',
      },
    }],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Subcategory cannot exceed 100 characters'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Product brand is required'],
      trim: true,
      minlength: [1, 'Brand must be at least 1 character'],
      maxlength: [100, 'Brand cannot exceed 100 characters'],
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      index: true,
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
      index: true,
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    features: [{
      type: String,
      trim: true,
      maxlength: [200, 'Feature cannot exceed 200 characters'],
    }],
    ingredients: [{
      type: String,
      trim: true,
      maxlength: [100, 'Ingredient cannot exceed 100 characters'],
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewProduct: { // Renamed from isNew
      type: Boolean,
      default: false,
      index: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Product Variants and Physical Properties
    variants: [{
      color: {
        type: String,
        trim: true,
        maxlength: [50, 'Color cannot exceed 50 characters']
      },
      size: {
        type: String,
        trim: true,
        maxlength: [50, 'Size cannot exceed 50 characters']
      },
      price: {
        type: Number,
        min: [0, 'Variant price cannot be negative']
      },
      originalPrice: {
        type: Number,
        min: [0, 'Variant original price cannot be negative']
      },
      stock: {
        type: Number,
        min: [0, 'Variant stock cannot be negative'],
        default: 0
      },
      sku: {
        type: String,
        trim: true,
        maxlength: [100, 'SKU cannot exceed 100 characters']
      },
      images: [{
        type: String,
        validate: {
          validator: function (v: string) {
            // Allow local upload paths (uploads/products/xxx or uploads/categories/xxx)
            const isLocalUpload = /^uploads\/(products|categories)\//.test(v);
            // Allow HTTP/HTTPS URLs
            const isValidUrl = /^https?:\/\/.+/i.test(v);
            return isLocalUpload || isValidUrl;
          },
          message: 'Each variant image must be either an uploaded file or a valid HTTP/HTTPS URL',
        }
      }]
    }],
    
    // Physical Properties
    weight: {
      value: {
        type: Number,
        min: [0, 'Weight cannot be negative']
      },
      unit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz', 'ml', 'l'],
        default: 'g'
      }
    },
    
    dimensions: {
      length: {
        type: Number,
        min: [0, 'Length cannot be negative']
      },
      width: {
        type: Number,
        min: [0, 'Width cannot be negative']
      },
      height: {
        type: Number,
        min: [0, 'Height cannot be negative']
      },
      unit: {
        type: String,
        enum: ['cm', 'in', 'm'],
        default: 'cm'
      }
    },
    
    // SKU and Barcode
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple null values
      maxlength: [100, 'SKU cannot exceed 100 characters'],
      index: true
    },
    
    barcode: {
      type: String,
      trim: true,
      maxlength: [100, 'Barcode cannot exceed 100 characters']
    },
    
    // Category-specific fields
    // Food & Beverage
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number
    },
    
    allergens: [{
      type: String,
      trim: true,
      enum: ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'fish', 'shellfish', 'sesame', 'sulfites'],
    }],
    
    dietaryInfo: [{
      type: String,
      trim: true,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'organic', 'non-gmo', 'keto', 'low-carb', 'sugar-free'],
    }],
    
    expiryInfo: {
      shelfLife: {
        value: Number,
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months', 'years']
        }
      },
      storageInstructions: String
    },
    
    // Fashion & Apparel
    material: {
      type: String,
      trim: true,
      maxlength: [200, 'Material cannot exceed 200 characters']
    },
    
    careInstructions: [{
      type: String,
      trim: true,
      maxlength: [100, 'Care instruction cannot exceed 100 characters']
    }],
    
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all-season']
    },
    
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex', 'kids', 'baby']
    },
    
    ageGroup: {
      type: String,
      enum: ['infant', 'toddler', 'kids', 'teen', 'adult', 'senior', 'all-ages']
    },
    
    // Electronics
    technicalSpecs: {
      brand: String,
      model: String,
      warranty: {
        duration: Number,
        unit: {
          type: String,
          enum: ['days', 'months', 'years']
        },
        type: {
          type: String,
          enum: ['manufacturer', 'seller', 'extended']
        }
      },
      powerRequirements: String,
      connectivity: [String],
      compatibility: [String]
    },
    
    // Beauty & Personal Care
    skinType: [{
      type: String,
      enum: ['dry', 'oily', 'combination', 'sensitive', 'normal', 'mature', 'acne-prone']
    }],
    
    hairType: [{
      type: String,
      enum: ['straight', 'wavy', 'curly', 'coily', 'fine', 'thick', 'damaged', 'color-treated']
    }],
    
    scent: {
      type: String,
      trim: true,
      maxlength: [100, 'Scent cannot exceed 100 characters']
    },
    
    spf: {
      type: Number,
      min: [0, 'SPF cannot be negative'],
      max: [100, 'SPF cannot exceed 100']
    },
    
    // General Product Properties
    color: {
      type: String,
      trim: true,
      maxlength: [50, 'Color cannot exceed 50 characters'],
      index: true
    },
    
    size: {
      type: String,
      trim: true,
      maxlength: [50, 'Size cannot exceed 50 characters'],
      index: true
    },
    
    pattern: {
      type: String,
      trim: true,
      maxlength: [50, 'Pattern cannot exceed 50 characters']
    },
    
    style: {
      type: String,
      trim: true,
      maxlength: [50, 'Style cannot exceed 50 characters']
    },
    
    // Shipping and Handling
    shippingInfo: {
      weight: Number, // in grams
      requiresSpecialHandling: {
        type: Boolean,
        default: false
      },
      fragile: {
        type: Boolean,
        default: false
      },
      hazardous: {
        type: Boolean,
        default: false
      },
      shippingClass: {
        type: String,
        enum: ['standard', 'heavy', 'oversized', 'fragile', 'hazardous']
      }
    },
    
    // Inventory Management
    minOrderQuantity: {
      type: Number,
      min: [1, 'Minimum order quantity must be at least 1'],
      default: 1
    },
    
    maxOrderQuantity: {
      type: Number,
      min: [1, 'Maximum order quantity must be at least 1']
    },
    
    restockDate: Date,
    
    // Additional Product Information
    manufacturer: {
      type: String,
      trim: true,
      maxlength: [100, 'Manufacturer cannot exceed 100 characters']
    },
    
    countryOfOrigin: {
      type: String,
      trim: true,
      maxlength: [100, 'Country of origin cannot exceed 100 characters']
    },
    
    certifications: [{
      type: String,
      trim: true,
      maxlength: [100, 'Certification cannot exceed 100 characters']
    }],
    
    // SEO and Marketing
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    
    keywords: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Keyword cannot exceed 50 characters']
    }]
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
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ isActive: 1, isNewProduct: 1 }); // Updated index
ProductSchema.index({ isActive: 1, isBestseller: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ brand: 1, isActive: 1 });
ProductSchema.index({ price: 1, isActive: 1 });
ProductSchema.index({ rating: -1, isActive: 1 });
ProductSchema.index({ stock: 1, isActive: 1 });
ProductSchema.index({ tags: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });

// New indexes for variant and product properties
ProductSchema.index({ color: 1, isActive: 1 });
ProductSchema.index({ size: 1, isActive: 1 });
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ gender: 1, isActive: 1 });
ProductSchema.index({ ageGroup: 1, isActive: 1 });
ProductSchema.index({ allergens: 1, isActive: 1 });
ProductSchema.index({ dietaryInfo: 1, isActive: 1 });
ProductSchema.index({ skinType: 1, isActive: 1 });
ProductSchema.index({ hairType: 1, isActive: 1 });
ProductSchema.index({ manufacturer: 1, isActive: 1 });
ProductSchema.index({ certifications: 1, isActive: 1 });
ProductSchema.index({ 'variants.color': 1, isActive: 1 });
ProductSchema.index({ 'variants.size': 1, isActive: 1 });

// Text index for full-text search
ProductSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
  features: 'text',
  ingredients: 'text',
  color: 'text',
  size: 'text',
  material: 'text',
  sku: 'text',
  manufacturer: 'text',
  keywords: 'text',
  scent: 'text'
}, {
  weights: {
    name: 10,
    brand: 8,
    sku: 6,
    color: 5,
    size: 5,
    tags: 4,
    features: 3,
    material: 3,
    manufacturer: 3,
    keywords: 2,
    ingredients: 2,
    scent: 2,
    description: 1
  }
});

// Pre-save middleware to generate slug (runs before validation)
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    this.slug = `${this.slug}-${timestamp}`;
  }
  next();
});

// Pre-validate middleware to ensure slug is set
ProductSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    this.slug = `${this.slug}-${timestamp}`;
  }
  next();
});

// Instance method to update stock
ProductSchema.methods.updateStock = async function (
  quantity: number, 
  operation: 'add' | 'subtract'
): Promise<void> {
  if (operation === 'add') {
    this.stock += quantity;
  } else if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  }
  
  await this.save();
};

// Instance method to check stock availability
ProductSchema.methods.checkStock = function (quantity: number): boolean {
  return this.stock >= quantity;
};

// Static method to find active products
ProductSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Static method to find featured products
ProductSchema.statics.findFeatured = function (limit = 10) {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to find products by category
ProductSchema.statics.findByCategory = function (category: string, options = {}) {
  return this.find({ 
    category: category, 
    isActive: true,
    ...options
  })
  .sort({ createdAt: -1 });
};

// Static method for full-text search
ProductSchema.statics.search = function (query: string, options = {}) {
  return this.find(
    { 
      $text: { $search: query },
      isActive: true,
      ...options
    },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } });
};

// Create and export the Product model
const Product: Model<IProductDocument> = 
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;