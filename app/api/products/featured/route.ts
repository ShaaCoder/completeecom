/**
 * Featured Products API Route
 * 
 * GET /api/products/featured - Get featured products
 */

import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Import Category model
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { IProduct } from '@/types/product';

/**
 * GET /api/products/featured
 * Retrieve featured products
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Ensure Category model is registered
    Category;

    // Helper to normalize and validate image URLs; replaces missing local files with placeholder
    const path = await import('path');
    const fs = await import('fs');
    const publicDir = path.join(process.cwd(), 'public');

    const resolveImageUrl = (imagePath: string): string => {
      if (!imagePath) return '/placeholder-image.svg';
      if (/^https?:\/\//i.test(imagePath)) return imagePath; // external URL
      let rel = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
      if (rel.startsWith('uploads/')) {
        const abs = path.join(publicDir, rel);
        try { if (fs.existsSync(abs)) return '/' + rel; } catch (_) {}
        return '/placeholder-image.svg';
      }
      return '/' + rel;
    };

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`featured_products_get_${clientIP}`, 100, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Get featured products, or if none exist, get latest products
    let products = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .populate('category', 'name slug description image')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

    // If no featured products, get latest active products
    if (products.length === 0) {
      products = await Product.find({ 
        isActive: true 
      })
      .populate('category', 'name slug description image')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    }

    // Format response data
    const formattedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      description: product.description,
      images: Array.isArray(product.images) ? product.images.map((img: string) => resolveImageUrl(img)) : [],
      category: product.category && typeof product.category === 'object' && '_id' in product.category && 'name' in product.category ? {
        id: String(product.category._id),
        name: (product.category as any).name,
        slug: (product.category as any).slug,
        description: (product.category as any).description,
        image: resolveImageUrl((product.category as any).image || '')
      } : typeof product.category === 'object' && '_id' in product.category ? String(product.category._id) : product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      tags: product.tags,
      features: product.features,
      ingredients: product.ingredients,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isNew: product.isNewProduct, // Map isNewProduct to isNew for frontend
      isBestseller: product.isBestseller,
    }));

    return createSuccessResponse(
      formattedProducts,
      `Retrieved ${products.length} featured products`
    );

  } catch (error) {
    return handleApiError(error, 'GET /api/products/featured');
  }
}