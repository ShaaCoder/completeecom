/**
 * Category by Slug API Route
 * 
 * GET /api/categories/[slug] - Get individual category by slug with enhanced SEO data
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import { generateCategoryMetadata, generateBreadcrumbStructuredData } from '@/lib/seo-utils';

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * GET /api/categories/[slug]
 * Retrieve individual category by slug with enhanced SEO metadata and products
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`category_get_${clientIP}`, 60, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    const { slug } = params;

    if (!slug) {
      return createErrorResponse(
        'Category identifier is required',
        400,
        'Invalid Request'
      );
    }

    // Determine if the slug is a MongoDB ObjectId or a slug string
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    
    // Find category by slug or ObjectId and populate subcategories
    const query = isObjectId 
      ? { _id: slug, isActive: true }
      : { slug: slug, isActive: true };
      
    const category = await Category.findOne(query)
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image seoTitle seoDescription seoKeywords productCount',
      options: { sort: { sortOrder: 1, name: 1 } }
    })
    .populate({
      path: 'parentCategory',
      select: 'name slug'
    })
    .lean();

    if (!category) {
      return createErrorResponse(
        'Category not found',
        404,
        `Category with ${isObjectId ? 'ID' : 'slug'} '${slug}' not found`
      );
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    // Get featured products from this category
    const featuredProducts = await Product.find({
      category: category._id,
      isActive: true,
      isFeatured: true
    })
    .select('name slug price originalPrice images brand rating reviewCount')
    .limit(8)
    .lean();

    // Generate breadcrumb data
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Categories', url: '/category' }
    ];

    // Add parent category to breadcrumb if available
    if (category.parentCategory && typeof category.parentCategory === 'object' && 'name' in category.parentCategory) {
      breadcrumbs.push({
        name: (category.parentCategory as any).name,
        url: `/categories/${(category.parentCategory as any).slug}`
      });
    }

    // Add current category to breadcrumb
    breadcrumbs.push({
      name: category.name,
      url: `/category/${category.slug}`
    });

    // Format enhanced category response
    const formattedCategory = {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      icon: category.icon,
      color: category.color,
      parentCategory: category.parentCategory,
      subcategories: category.subcategories || [],
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      productCount: productCount,
      sortOrder: category.sortOrder,
      
      // Enhanced SEO fields
      seoTitle: category.seoTitle || `${category.name} - Premium Beauty Products | BeautyMart`,
      seoDescription: category.seoDescription || `Shop premium ${category.name.toLowerCase()} products at BeautyMart. ${productCount} products available. ✓ Top Brands ✓ Authentic ✓ Free Delivery`,
      seoKeywords: category.seoKeywords || [
        category.name.toLowerCase(),
        'beauty products',
        'skincare',
        'makeup',
        'authentic products',
        'premium beauty'
      ],
      
      // SEO enhancement data
      canonicalUrl: `/category/${category.slug}`,
      breadcrumbs: breadcrumbs.map(crumb => ({
        ...crumb,
        url: crumb.url.replace(/^\/categories\b/, '/category')
      })),
      
      // Featured products from this category
      featuredProducts: featuredProducts.map(product => ({
        id: String(product._id),
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images,
        brand: product.brand,
        rating: product.rating,
        reviewCount: product.reviewCount
      })),
      
      // Additional SEO metadata for frontend use
      seo: {
        title: category.seoTitle || `${category.name} - Premium Beauty Products | BeautyMart`,
        description: category.seoDescription || `Shop premium ${category.name.toLowerCase()} products at BeautyMart. ${productCount} products available. Discover top brands and authentic products with free delivery.`,
        keywords: category.seoKeywords || [
          category.name.toLowerCase(),
          'beauty products',
          'skincare',
          'makeup',
          'cosmetics',
          'authentic products',
          'premium beauty',
          'free delivery'
        ],
        openGraph: {
          title: category.seoTitle || `${category.name} - Premium Beauty Products`,
          description: category.seoDescription || `Shop premium ${category.name.toLowerCase()} products at BeautyMart. ${productCount} products available.`,
          image: category.image || '',
          url: `/category/${category.slug}`,
          type: 'website'
        },
        twitter: {
          card: 'summary_large_image',
          title: category.seoTitle || `${category.name} - Premium Beauty Products`,
          description: category.seoDescription || `Shop premium ${category.name.toLowerCase()} products at BeautyMart. ${productCount} products available.`,
          image: category.image || ''
        }
      },
      
      // Structured data for SEO
      structuredData: {
        breadcrumb: generateBreadcrumbStructuredData(breadcrumbs)
      }
    };

    return createSuccessResponse(
      formattedCategory,
      `Retrieved category: ${category.name}`
    );

  } catch (error) {
    return handleApiError(error, 'GET /api/categories/[slug]');
  }
}

/**
 * PUT /api/categories/[slug]
 * Update a category (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request) => {
    try {
      await connectDB();

      const updates = await request.json();
      
      // Auto-generate SEO fields if not provided in updates
      if (updates.name && !updates.seoTitle) {
        updates.seoTitle = `${updates.name} - Premium Beauty Products | BeautyMart`;
      }
      
      if (updates.name && !updates.seoDescription) {
        updates.seoDescription = `Shop premium ${updates.name.toLowerCase()} products at BeautyMart. Discover top brands and authentic products with free delivery.`;
      }
      
      if (updates.name && (!updates.seoKeywords || updates.seoKeywords.length === 0)) {
        updates.seoKeywords = [
          updates.name.toLowerCase(),
          'beauty products',
          'skincare',
          'makeup',
          'authentic products',
          'premium beauty'
        ];
      }

      // Determine if the slug is a MongoDB ObjectId or a slug string
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);
      const query = isObjectId ? { _id: params.slug } : { slug: params.slug };
      
      const category = await Category.findOneAndUpdate(
        query, 
        updates, 
        { new: true, runValidators: true }
      )
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        select: 'name slug description image seoTitle seoDescription seoKeywords',
        options: { sort: { sortOrder: 1, name: 1 } }
      });

      if (!category) {
        return createErrorResponse('Category not found', 404, 'Not Found');
      }

      const formatted = {
        id: String(category._id),
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        icon: category.icon,
        color: category.color,
        parentCategory: category.parentCategory,
        subcategories: category.subcategories,
        isActive: category.isActive,
        isFeatured: category.isFeatured,
        sortOrder: category.sortOrder,
        productCount: category.productCount,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
        seoKeywords: category.seoKeywords
      };

      return createSuccessResponse(formatted, 'Category updated successfully');
    } catch (error) {
      return handleApiError(error, `PUT /api/categories/${params.slug}`);
    }
  }, ['admin'])(request);
}

/**
 * DELETE /api/categories/[slug]
 * Delete a category (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async () => {
    try {
      await connectDB();
      
      // Determine if the slug is a MongoDB ObjectId or a slug string
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);
      const query = isObjectId ? { _id: params.slug } : { slug: params.slug };
      
      const deleted = await Category.findOneAndDelete(query);
      
      if (!deleted) {
        return createErrorResponse('Category not found', 404, 'Not Found');
      }
      
      return createSuccessResponse(
        { slug: params.slug }, 
        'Category deleted successfully'
      );
    } catch (error) {
      return handleApiError(error, `DELETE /api/categories/${params.slug}`);
    }
  }, ['admin'])(request);
}