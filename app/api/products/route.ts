/**
 * Products API Routes
 * 
 * GET /api/products - List products with pagination, filtering, and search
 * POST /api/products - Create new product
 */

import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Import Category model
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  getPaginationParams,
  createPaginationInfo,
  getSortParams,
  getSearchParams,
  buildQuery,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import { productValidation } from '@/lib/validations';
import { CreateProductRequest } from '@/types/product';
import { Product as ProductType } from '@/types/index';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * Retrieve products with pagination, filtering, and search
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

      // External URL
      if (/^https?:\/\//i.test(imagePath)) return imagePath;

      // Normalize leading slash
      let rel = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

      // Only check local uploads
      if (rel.startsWith('uploads/')) {
        const abs = path.join(publicDir, rel);
        try {
          if (fs.existsSync(abs)) {
            return '/' + rel;
          }
        } catch (_) {
          // ignore fs errors and fall through to placeholder
        }
        // Fallback when file is missing
        return '/placeholder-image.svg';
      }

      // Default: ensure leading slash
      return '/' + rel;
    };

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`products_get_${clientIP}`, 100, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Extract pagination parameters
    const { page, limit, skip } = getPaginationParams(request);

    // Extract sort parameters - handle both new 'sort' param and legacy sortBy/sortOrder
    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get('sort');
    
    let sortParams: { [key: string]: 1 | -1 };
    
    // Handle the new sort parameter format from frontend
    if (sortParam) {
      switch (sortParam) {
        case 'featured':
          // Sort by featured first, then by rating, then by creation date
          sortParams = { isFeatured: -1, rating: -1, reviewCount: -1, createdAt: -1 };
          break;
        case 'price_asc':
          sortParams = { price: 1 };
          break;
        case 'price_desc':
          sortParams = { price: -1 };
          break;
        case 'newest':
          sortParams = { createdAt: -1 };
          break;
        case 'rating':
          // Sort by rating desc, then by review count desc
          sortParams = { rating: -1, reviewCount: -1 };
          break;
        default:
          sortParams = { createdAt: -1 };
      }
    } else {
      // Fallback to legacy getSortParams for backward compatibility
      sortParams = getSortParams(
        request,
        ['createdAt', 'updatedAt', 'price', 'rating', 'name'],
        'createdAt',
        'desc'
      );
    }

    // Extract search and filter parameters
    const { search, filters } = getSearchParams(request);

    // Store category for processing after buildQuery
    let categoryObjectId: any = null;
    if (filters.category) {
      // Check if it's a valid ObjectId, if not, try to find category by slug
      if (filters.category.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a valid ObjectId, use it directly
        categoryObjectId = new mongoose.Types.ObjectId(filters.category);
      } else {
        // It might be a slug, we need to find the category first
        // Try exact slug match first, then try slug that starts with the param
        let category = await Category.findOne({ slug: filters.category, isActive: true });
        if (!category) {
          category = await Category.findOne({ 
            slug: { $regex: `^${filters.category}-` }, 
            isActive: true 
          });
        }
        if (!category) {
          // Try to match based on slug prefix (e.g., 'electronics' matches 'electronics-234100')
          category = await Category.findOne({
            $or: [
              { slug: { $regex: `^${filters.category}-` } },
              { name: { $regex: new RegExp(`^${filters.category}$`, 'i') } }
            ],
            isActive: true
          });
        }
        if (category) {
          categoryObjectId = new mongoose.Types.ObjectId(category._id);
        } else {
          // If category not found, return empty results (don't set to null, just skip the filter)
          categoryObjectId = undefined; // Don't filter by category at all
        }
      }
    }
    
    // Build base query (excluding category to prevent string conversion)
    const filtersWithoutCategory = { ...filters };
    delete filtersWithoutCategory.category;
    let query = buildQuery(
      { ...filtersWithoutCategory, search },
      ['name', 'description', 'brand']
    );

    // Only show active products for public API
    query.isActive = true;
    
    // Apply category filter AFTER buildQuery to preserve ObjectId type
    if (categoryObjectId) {
      query.category = categoryObjectId;
    } else if (filters.category && categoryObjectId !== undefined) {
      // Category was specified but not found, return no results
      query.category = null;
    }
    // If categoryObjectId is undefined, don't add category filter (show all products)

    // Execute query with pagination
    // Convert string ObjectIds to proper MongoDB ObjectIds in the query
    if (query.category && typeof query.category === 'string') {
      query.category = new mongoose.Types.ObjectId(query.category);
    }
    
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug description image')
        .sort(sortParams)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Create pagination info
    const pagination = createPaginationInfo(page, limit, totalCount);

    // Format response data with enhanced SEO fields
    const formattedProducts: ProductType[] = products.map((product: any) => ({
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
        image: resolveImageUrl((product.category as any).image || ''),
        seoTitle: (product.category as any).seoTitle,
        seoDescription: (product.category as any).seoDescription,
        seoKeywords: (product.category as any).seoKeywords
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
      isFeatured: product.isFeatured,
      
      // Enhanced SEO fields
      metaTitle: product.metaTitle || `${product.name} - ${product.brand} | BeautyMart`,
      metaDescription: product.metaDescription || `Buy ${product.name} by ${product.brand}. ${product.description.substring(0, 120)}... ✓ Authentic ✓ Free Delivery`,
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
    }));

    return createSuccessResponse<ProductType[]>(
      formattedProducts,
      `Retrieved ${products.length} products`,
      pagination
    );

  } catch (error) {
    return handleApiError(error, 'GET /api/products');
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  return withAuth(async (req, _user) => {
    try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = rateLimit(`products_post_${clientIP}`, 10, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Parse request body
    const body: CreateProductRequest = await req.json();

    // Validate input
    const validation = productValidation.create(body);
    if (!validation.isValid) {
      const errors: Record<string, string[]> = {};
      validation.errors.forEach(error => {
        if (!errors[error.field]) {
          errors[error.field] = [];
        }
        errors[error.field].push(error.message);
      });

      return createErrorResponse(
        'Validation failed',
        400,
        'Validation Error',
        errors
      );
    }

    // Validate category exists if provided
    if (body.category) {
      const categoryExists = await Category.findById(body.category);
      if (!categoryExists) {
        return createErrorResponse(
          'Invalid category',
          400,
          `The specified category ${body.category} does not exist`
        );
      }
    }

    // Create new product
    const newProduct = new Product(body);
    
    // Ensure slug is generated before saving
    if (!newProduct.slug && newProduct.name) {
      newProduct.slug = newProduct.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6);
      newProduct.slug = `${newProduct.slug}-${timestamp}`;
    }
    
    await newProduct.save();

    // Populate category for response
    await newProduct.populate('category', 'name slug description image');

    // Auto-generate SEO metadata if not provided
    if (!newProduct.metaTitle) {
      newProduct.metaTitle = `${newProduct.name} - ${newProduct.brand} | BeautyMart`;
    }
    if (!newProduct.metaDescription) {
      newProduct.metaDescription = `Buy ${newProduct.name} by ${newProduct.brand}. ${newProduct.description.substring(0, 120)}... ✓ Authentic ✓ Free Delivery`;
    }
    if (!newProduct.keywords || newProduct.keywords.length === 0) {
      newProduct.keywords = [
        newProduct.name.toLowerCase(),
        newProduct.brand.toLowerCase(),
        newProduct.subcategory?.toLowerCase(),
        'beauty products',
        'authentic products'
      ].filter(Boolean) as string[];
    }
    await newProduct.save();

    // Format response with enhanced SEO fields
    const formattedProduct: any = {
      id: String(newProduct._id),
      name: newProduct.name,
      slug: newProduct.slug,
      price: newProduct.price,
      originalPrice: newProduct.originalPrice,
      description: newProduct.description,
      images: newProduct.images,
      category: newProduct.category && typeof newProduct.category === 'object' && '_id' in newProduct.category && 'name' in newProduct.category ? {
        id: String(newProduct.category._id),
        name: (newProduct.category as any).name,
        slug: (newProduct.category as any).slug,
        description: (newProduct.category as any).description,
        image: (newProduct.category as any).image
      } as any : typeof newProduct.category === 'object' && '_id' in newProduct.category ? String(newProduct.category._id) : newProduct.category,
      subcategory: newProduct.subcategory,
      brand: newProduct.brand,
      stock: newProduct.stock,
      rating: newProduct.rating,
      reviewCount: newProduct.reviewCount,
      tags: newProduct.tags,
      features: newProduct.features,
      ingredients: newProduct.ingredients,
      isNew: newProduct.isNewProduct,
      isBestseller: newProduct.isBestseller,
      isFeatured: newProduct.isFeatured,
      
      // Enhanced SEO fields
      metaTitle: newProduct.metaTitle,
      metaDescription: newProduct.metaDescription,
      keywords: newProduct.keywords,
      
      // Product details
      sku: newProduct.sku,
      color: newProduct.color,
      size: newProduct.size,
      weight: newProduct.weight,
      material: newProduct.material,
      scent: newProduct.scent,
      gender: newProduct.gender,
      ageGroup: newProduct.ageGroup,
      manufacturer: newProduct.manufacturer,
      countryOfOrigin: newProduct.countryOfOrigin,
      allergens: newProduct.allergens,
      dietaryInfo: newProduct.dietaryInfo,
      skinType: newProduct.skinType,
      hairType: newProduct.hairType,
      variants: newProduct.variants,
      minOrderQuantity: newProduct.minOrderQuantity,
      maxOrderQuantity: newProduct.maxOrderQuantity,
    };

    return createSuccessResponse<any>(
      formattedProduct,
      'Product created successfully'
    );

  } catch (error) {
    return handleApiError(error, 'POST /api/products');
  }
  }, ['admin'])(request);
}