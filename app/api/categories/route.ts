/**
 * Categories API Routes
 * 
 * GET /api/categories - List all categories
 * POST /api/categories - Create new category
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

/**
 * GET /api/categories
 * Retrieve all categories
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`categories_get_${clientIP}`, 100, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Check if admin is requesting all categories
    const showAll = request.nextUrl.searchParams.get('all') === 'true';
    const query = showAll ? {} : { isActive: true };
    
    // Fetch categories based on query
    const categories = await Category.find(query)
      .sort({ name: 1 })
      .lean();

    // Calculate real-time product counts for each category
    const categoriesWithRealCounts = await Promise.all(
      categories.map(async (category) => {
        // Get real-time product count
        const realProductCount = await Product.countDocuments({
          category: category._id,
          isActive: true
        });
        
        // Update stored count if different (async, don't wait)
        if (category.productCount !== realProductCount) {
          Category.findByIdAndUpdate(category._id, {
            productCount: realProductCount
          }).catch(err => console.error('Error updating category count:', err));
        }
        
        return {
          ...category,
          productCount: realProductCount // Use real-time count
        };
      })
    );

    // Format response data with enhanced SEO fields
    const formattedCategories = categoriesWithRealCounts.map(category => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      icon: category.icon,
      color: category.color,
      subcategories: category.subcategories,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      productCount: category.productCount || 0,
      sortOrder: category.sortOrder,
      
      // Enhanced SEO fields
      seoTitle: category.seoTitle || `${category.name} - Premium Beauty Products | BeautyMart`,
      seoDescription: category.seoDescription || `Shop premium ${category.name.toLowerCase()} products at BeautyMart. ${category.productCount || 0} products available. ✓ Top Brands ✓ Authentic ✓ Free Delivery`,
      seoKeywords: category.seoKeywords || [
        category.name.toLowerCase(),
        'beauty products',
        'skincare',
        'makeup',
        'authentic products',
        'premium beauty'
      ],
      
      // SEO-friendly URL path
      canonicalUrl: `/categories/${category.slug}`,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Categories', url: '/categories' },
        { name: category.name, url: `/categories/${category.slug}` }
      ]
    }));

    return createSuccessResponse(
      formattedCategories,
      `Retrieved ${categories.length} categories`
    );

  } catch (error) {
    return handleApiError(error, 'GET /api/categories');
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  return withAuth(async (req, _user) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(req);
      const rateLimitResult = rateLimit(`categories_post_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Parse request body
      const body = await req.json();

      // Validate required fields
      if (!body.name || !body.slug) {
        return createErrorResponse(
          'Name and slug are required',
          400,
          'Validation Error'
        );
      }

      // Create new category with enhanced SEO fields
      const newCategory = new Category({
        name: body.name,
        slug: body.slug,
        description: body.description || '',
        image: body.image || '',
        icon: body.icon || '',
        color: body.color || '',
        parentCategory: body.parentCategory || null,
        subcategories: body.subcategories || [],
        isActive: body.isActive !== undefined ? body.isActive : true,
        isFeatured: body.isFeatured || false,
        sortOrder: body.sortOrder || 0,
        productCount: 0,
        
        // Auto-generate SEO fields if not provided
        seoTitle: body.seoTitle || `${body.name} - Premium Beauty Products | BeautyMart`,
        seoDescription: body.seoDescription || `Shop premium ${body.name.toLowerCase()} products at BeautyMart. Discover top brands and authentic products with free delivery.`,
        seoKeywords: body.seoKeywords || [
          body.name.toLowerCase(),
          'beauty products',
          'skincare',
          'makeup',
          'authentic products',
          'premium beauty'
        ]
      });

      await newCategory.save();

      // Format response with enhanced SEO fields
      const formattedCategory = {
        id: newCategory._id.toString(),
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        image: newCategory.image,
        icon: newCategory.icon,
        color: newCategory.color,
        parentCategory: newCategory.parentCategory,
        subcategories: newCategory.subcategories,
        isActive: newCategory.isActive,
        isFeatured: newCategory.isFeatured,
        sortOrder: newCategory.sortOrder,
        productCount: newCategory.productCount,
        
        // Enhanced SEO fields
        seoTitle: newCategory.seoTitle,
        seoDescription: newCategory.seoDescription,
        seoKeywords: newCategory.seoKeywords,
        
        // SEO-friendly URL path
        canonicalUrl: `/categories/${newCategory.slug}`,
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Categories', url: '/categories' },
          { name: newCategory.name, url: `/categories/${newCategory.slug}` }
        ]
      };

      return createSuccessResponse(
        formattedCategory,
        'Category created successfully'
      );

    } catch (error) {
      return handleApiError(error, 'POST /api/categories');
    }
  }, ['admin'])(request);
}
