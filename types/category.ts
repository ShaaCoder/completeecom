/**
 * Category Type Definitions
 * 
 * TypeScript interfaces for Category model with hierarchical structure
 */

import { Document, Types } from 'mongoose';

// Base Category interface
export interface ICategory {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  parentCategory?: Types.ObjectId | ICategory;
  subcategories?: Types.ObjectId[] | ICategory[];
  productCount: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Category document interface (for Mongoose)
export interface ICategoryDocument extends ICategory, Document {
  _id: Types.ObjectId;
  generateSlug(): string;
  updateProductCount(): Promise<void>;
  getAncestors(): Promise<ICategoryDocument[]>;
  getDescendants(): Promise<ICategoryDocument[]>;
  isDescendantOf(categoryId: Types.ObjectId): Promise<boolean>;
  toJSON(): Partial<ICategory>;
}

// Category creation request
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  parentCategory?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

// Category update request
export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  parentCategory?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

// Category response
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  parentCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategories?: CategoryResponse[];
  productCount: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// Category tree response (for hierarchical display)
export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  productCount: number;
  children: CategoryTree[];
  level: number;
}

// Category breadcrumb
export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

// Category query parameters
export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  parentCategory?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'productCount';
  sortOrder?: 'asc' | 'desc';
  includeSubcategories?: boolean;
}

// Category statistics
export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  featuredCategories: number;
  rootCategories: number;
  averageProductsPerCategory: number;
  topCategories: Array<{
    category: CategoryResponse;
    productCount: number;
    revenue: number;
  }>;
}