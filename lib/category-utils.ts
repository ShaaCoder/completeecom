/**
 * Category utility functions
 * Handles category display and manipulation across the application
 */

import { Product } from '@/types';
import { Category } from '@/hooks/use-categories';

/**
 * Get category name from product category (handles both string and object formats)
 */
export function getCategoryName(product: Product, categories: Category[] = []): string {
  if (typeof product.category === 'object' && product.category && 'name' in product.category) {
    return product.category.name;
  }
  if (typeof product.category === 'string') {
    const category = categories.find(c => c.id === product.category);
    return category?.name || 'Category';
  }
  return 'Category';
}

/**
 * Get category ID from product category (handles both string and object formats)
 */
export function getCategoryId(product: Product): string {
  if (typeof product.category === 'object' && product.category && 'id' in product.category) {
    return product.category.id;
  }
  if (typeof product.category === 'string') {
    return product.category;
  }
  return '';
}

/**
 * Get category slug from product category (handles both string and object formats)
 */
export function getCategorySlug(product: Product, categories: Category[] = []): string {
  if (typeof product.category === 'object' && product.category && 'slug' in product.category) {
    return product.category.slug;
  }
  if (typeof product.category === 'string') {
    const category = categories.find(c => c.id === product.category);
    return category?.slug || '';
  }
  return '';
}

/**
 * Check if product category is populated (object format)
 */
export function isCategoryPopulated(product: Product): boolean {
  return typeof product.category === 'object' && product.category !== null && 'name' in product.category;
}

/**
 * Get category link URL
 */
export function getCategoryLink(product: Product, categories: Category[] = []): string {
  const categoryId = getCategoryId(product);
  return categoryId ? `/category/${categoryId}` : '#';
}
