/**
 * Product by Slug API Routes
 * 
 * GET /api/products/[slug] - Get product by slug
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import { Product as ProductType } from '@/types/index';

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * GET /api/products/[slug]
 * Retrieve a specific product by slug
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

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
    const rateLimitResult = rateLimit(`product_get_${clientIP}`, 100, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Find product by slug with enhanced category population
    const product = await Product.findOne({ 
      slug: params.slug, 
      isActive: true 
    })
    .populate('category', 'name slug description image seoTitle seoDescription seoKeywords')
    .lean();

    if (!product) {
      return createErrorResponse(
        'Product not found',
        404,
        `Product with slug '${params.slug}' not found`
      );
    }

    // Generate breadcrumb data
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Products', url: '/products' }
    ];

    // Add category to breadcrumb if available
    if (product.category && typeof product.category === 'object' && 'name' in product.category) {
      breadcrumbs.push({
        name: (product.category as any).name,
        url: `/categories/${(product.category as any).slug}`
      });
    }

    // Add current product to breadcrumb
    breadcrumbs.push({
      name: product.name,
      url: `/products/${product.slug}`
    });

    // Format enhanced product response
    const formattedProduct: any = {
      id: String(product._id),
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
      } as any : typeof product.category === 'object' && '_id' in product.category ? String(product.category._id) : product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      tags: product.tags,
      features: product.features,
      ingredients: product.ingredients,
      isNew: product.isNewProduct,
      isBestseller: product.isBestseller,
      isFeatured: product.isFeatured,
      
      // Enhanced SEO fields
      metaTitle: product.metaTitle || `${product.name} - ${product.brand} | BeautyMart`,
      metaDescription: product.metaDescription || `Buy ${product.name} by ${product.brand}. ${product.description.substring(0, 120)}... ✓ Authentic ✓ Free Delivery ✓ Easy Returns`,
      keywords: product.keywords || [
        product.name.toLowerCase(),
        product.brand.toLowerCase(),
        product.category && typeof product.category === 'object' ? (product.category as any).name.toLowerCase() : '',
        product.subcategory?.toLowerCase(),
        'beauty products',
        'authentic products'
      ].filter(Boolean),
      
      // Product details
      sku: product.sku,
      color: product.color,
      size: product.size,
      weight: product.weight,
      material: product.material,
      scent: product.scent,
      gender: product.gender,
      ageGroup: product.ageGroup,
      manufacturer: product.manufacturer,
      countryOfOrigin: product.countryOfOrigin,
      allergens: product.allergens,
      dietaryInfo: product.dietaryInfo,
      skinType: product.skinType,
      hairType: product.hairType,
      variants: product.variants,
      minOrderQuantity: product.minOrderQuantity,
      maxOrderQuantity: product.maxOrderQuantity,
      
      // SEO enhancement data
      canonicalUrl: `/products/${product.slug}`,
      breadcrumbs: breadcrumbs,
      
      // Additional SEO metadata for frontend use
      seo: {
        title: product.metaTitle || `${product.name} - ${product.brand} | BeautyMart`,
        description: product.metaDescription || `Buy ${product.name} by ${product.brand}. ${product.description.substring(0, 150)}... ✓ Authentic Products ✓ Free Delivery ✓ Easy Returns`,
        keywords: product.keywords || [
          product.name.toLowerCase(),
          product.brand.toLowerCase(),
          product.category && typeof product.category === 'object' ? (product.category as any).name.toLowerCase() : '',
          product.subcategory?.toLowerCase(),
          'beauty products',
          'skincare',
          'makeup',
          'authentic products'
        ].filter(Boolean),
        openGraph: {
          title: product.metaTitle || `${product.name} - ${product.brand}`,
          description: product.metaDescription || `Buy ${product.name} by ${product.brand}. ${product.description.substring(0, 120)}...`,
          image: product.images[0] || '',
          url: `/products/${product.slug}`,
          type: 'product',
          price: {
            amount: product.price,
            currency: 'INR'
          },
          availability: product.stock > 0 ? 'in stock' : 'out of stock'
        },
        twitter: {
          card: 'product',
          title: product.metaTitle || `${product.name} - ${product.brand}`,
          description: product.metaDescription || `Buy ${product.name} by ${product.brand}. ${product.description.substring(0, 120)}...`,
          image: product.images[0] || ''
        }
      }
    };

    return createSuccessResponse<any>(
      formattedProduct,
      'Product retrieved successfully'
    );

  } catch (error) {
    return handleApiError(error, `GET /api/products/${params.slug}`);
  }
}

/**
 * PUT /api/products/[slug]
 * Update a product (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request) => {
    try {
      await connectDB();
      const updates = await request.json();
      const product = await Product.findOneAndUpdate({ slug: params.slug }, updates, { new: true, runValidators: true })
        .populate('category', 'name slug description image');
      if (!product) {
        return createErrorResponse('Product not found', 404, 'Not Found');
      }
      const formatted: ProductType = {
        id: String(product._id),
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        description: product.description,
        images: product.images,
        category: product.category && typeof product.category === 'object' && '_id' in product.category && 'name' in product.category ? {
          id: String(product.category._id),
          name: (product.category as any).name,
          slug: (product.category as any).slug,
          description: (product.category as any).description,
          image: (product.category as any).image
        } : typeof product.category === 'object' && '_id' in product.category ? String(product.category._id) : product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        tags: product.tags,
        features: product.features,
        ingredients: product.ingredients,
        isNew: product.isNewProduct,
        isBestseller: product.isBestseller,
      };
      return createSuccessResponse<ProductType>(formatted, 'Product updated successfully');
    } catch (error) {
      return handleApiError(error, `PUT /api/products/${params.slug}`);
    }
  }, ['admin'])(request);
}

/**
 * DELETE /api/products/[slug]
 * Delete a product (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async () => {
    try {
      await connectDB();
      const deleted = await Product.findOneAndDelete({ slug: params.slug });
      if (!deleted) {
        return createErrorResponse('Product not found', 404, 'Not Found');
      }
      return createSuccessResponse<{ slug: string }>({ slug: params.slug }, 'Product deleted successfully');
    } catch (error) {
      return handleApiError(error, `DELETE /api/products/${params.slug}`);
    }
  }, ['admin'])(request);
}