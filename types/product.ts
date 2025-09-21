/**
 * Product Type Definitions
 */

import { Document, Types } from 'mongoose';

// Product variant interface
interface ProductVariant {
  color?: string;
  size?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  sku?: string;
  images?: string[];
}

// Weight and dimensions interfaces
interface Weight {
  value?: number;
  unit?: 'g' | 'kg' | 'lb' | 'oz' | 'ml' | 'l';
}

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: 'cm' | 'in' | 'm';
}

// Category-specific interfaces
interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface ExpiryInfo {
  shelfLife?: {
    value?: number;
    unit?: 'days' | 'weeks' | 'months' | 'years';
  };
  storageInstructions?: string;
}

interface TechnicalSpecs {
  brand?: string;
  model?: string;
  warranty?: {
    duration?: number;
    unit?: 'days' | 'months' | 'years';
    type?: 'manufacturer' | 'seller' | 'extended';
  };
  powerRequirements?: string;
  connectivity?: string[];
  compatibility?: string[];
}

interface ShippingInfo {
  weight?: number;
  requiresSpecialHandling?: boolean;
  fragile?: boolean;
  hazardous?: boolean;
  shippingClass?: 'standard' | 'heavy' | 'oversized' | 'fragile' | 'hazardous';
}

// Base Product interface with all new fields
export interface IProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Types.ObjectId | string | {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
  };
  subcategory?: string;
  brand: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  ingredients?: string[];
  isActive: boolean;
  isFeatured: boolean;
  isNewProduct?: boolean;
  isBestseller?: boolean;
  
  // Product Variants and Physical Properties
  variants?: ProductVariant[];
  weight?: Weight;
  dimensions?: Dimensions;
  
  // SKU and Barcode
  sku?: string;
  barcode?: string;
  
  // Category-specific fields
  nutritionalInfo?: NutritionalInfo;
  allergens?: ('nuts' | 'dairy' | 'gluten' | 'soy' | 'eggs' | 'fish' | 'shellfish' | 'sesame' | 'sulfites')[];
  dietaryInfo?: ('vegetarian' | 'vegan' | 'gluten-free' | 'organic' | 'non-gmo' | 'keto' | 'low-carb' | 'sugar-free')[];
  expiryInfo?: ExpiryInfo;
  
  // Fashion & Apparel
  material?: string;
  careInstructions?: string[];
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
  gender?: 'men' | 'women' | 'unisex' | 'kids' | 'baby';
  ageGroup?: 'infant' | 'toddler' | 'kids' | 'teen' | 'adult' | 'senior' | 'all-ages';
  
  // Electronics
  technicalSpecs?: TechnicalSpecs;
  
  // Beauty & Personal Care
  skinType?: ('dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | 'mature' | 'acne-prone')[];
  hairType?: ('straight' | 'wavy' | 'curly' | 'coily' | 'fine' | 'thick' | 'damaged' | 'color-treated')[];
  scent?: string;
  spf?: number;
  
  // General Product Properties
  color?: string;
  size?: string;
  pattern?: string;
  style?: string;
  
  // Shipping and Handling
  shippingInfo?: ShippingInfo;
  
  // Inventory Management
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  restockDate?: Date;
  
  // Additional Product Information
  manufacturer?: string;
  countryOfOrigin?: string;
  certifications?: string[];
  
  // SEO and Marketing
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Product document interface (for Mongoose)
export interface IProductDocument extends IProduct, Document {
  updateStock(quantity: number, operation: 'add' | 'subtract'): Promise<void>;
  checkStock(quantity: number): boolean;
  toJSON(): Partial<IProduct>;
}

// Product creation request
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string; // For creation, we expect string (ObjectId as string)
  subcategory?: string;
  brand: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  features?: string[];
  ingredients?: string[];
  isFeatured?: boolean;
  isNewProduct?: boolean;
  isBestseller?: boolean;
  
  // Essential new fields
  sku?: string;
  barcode?: string;
  color?: string;
  size?: string;
  weight?: {
    value?: number;
    unit?: 'g' | 'kg' | 'lb' | 'oz' | 'ml' | 'l';
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'in' | 'm';
  };
  
  // Category-specific fields
  material?: string;
  scent?: string;
  gender?: 'men' | 'women' | 'unisex' | 'kids' | 'baby';
  ageGroup?: 'infant' | 'toddler' | 'kids' | 'teen' | 'adult' | 'senior' | 'all-ages';
  manufacturer?: string;
  countryOfOrigin?: string;
  
  // Arrays
  allergens?: string[];
  dietaryInfo?: string[];
  skinType?: string[];
  hairType?: string[];
  careInstructions?: string[];
  certifications?: string[];
  keywords?: string[];
  
  // Variants
  variants?: Array<{
    color?: string;
    size?: string;
    price?: number;
    originalPrice?: number;
    stock?: number;
    sku?: string;
    images?: string[];
  }>;
  
  // Nutritional info for food products
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  
  // Technical specs for electronics
  technicalSpecs?: {
    model?: string;
    warranty?: {
      duration?: number;
      unit?: 'days' | 'months' | 'years';
      type?: 'manufacturer' | 'seller' | 'extended';
    };
    powerRequirements?: string;
    connectivity?: string[];
    compatibility?: string[];
  };
  
  // Additional fields
  spf?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  metaTitle?: string;
  metaDescription?: string;
}

// Product update request
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  subcategory?: string;
  brand?: string;
  stock?: number;
  tags?: string[];
  features?: string[];
  ingredients?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNewProduct?: boolean; // Renamed from isNew
  isBestseller?: boolean;
}

// Product query parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  newProduct?: boolean; // Renamed from new
  bestseller?: boolean;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}