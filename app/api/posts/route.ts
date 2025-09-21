/**
 * Posts API Routes
 * 
 * Handles CRUD operations for posts:
 * GET /api/posts - List posts with pagination, filtering, and search
 * POST /api/posts - Create new post (authenticated users)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import Category from '@/models/Category';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  getPaginationParams,
  createPaginationInfo,
  getSortParams,
  getSearchParams,
  buildQuery,
  withAuth,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { postValidation, validateObjectId } from '@/lib/validations';
import { PostResponse, PostListResponse, CreatePostRequest } from '@/types/post';

/**
 * GET /api/posts
 * Retrieve posts with pagination, filtering, and search
 * Public endpoint for published posts, authenticated for all posts
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`posts_get_${clientIP}`, 100, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Extract pagination parameters
    const { page, limit, skip } = getPaginationParams(request);

    // Extract sort parameters
    const sortParams = getSortParams(
      request,
      ['createdAt', 'updatedAt', 'publishedAt', 'viewCount', 'likeCount', 'title'],
      'publishedAt',
      'desc'
    );

    // Extract search and filter parameters
    const { search, filters } = getSearchParams(request);

    // Build base query
    let query = buildQuery(
      { ...filters, search },
      ['title', 'content', 'excerpt']
    );

    // Check if user is authenticated to see unpublished posts
    const authHeader = request.headers.get('authorization');
    let isAuthenticated = false;
    let currentUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { user } = await import('@/lib/api-helpers').then(m => m.authenticateUser(request));
        if (user) {
          isAuthenticated = true;
          currentUser = user;
        }
      } catch (error) {
        // Continue as unauthenticated user
      }
    }

    // Non-authenticated users can only see published posts
    if (!isAuthenticated) {
      query.status = 'published';
      query.isPublished = true;
    } else if (filters.author && currentUser && filters.author !== currentUser._id.toString()) {
      // If filtering by author and not the current user, only show published posts
      const isAdmin = ['admin', 'moderator'].includes(currentUser.role);
      if (!isAdmin) {
        query.status = 'published';
        query.isPublished = true;
      }
    }

    // Handle category filter
    if (filters.category) {
      const categoryError = validateObjectId(filters.category, 'category');
      if (categoryError) {
        return createErrorResponse(
          categoryError.message,
          400,
          'Validation Error'
        );
      }
    }

    // Handle author filter
    if (filters.author) {
      const authorError = validateObjectId(filters.author, 'author');
      if (authorError) {
        return createErrorResponse(
          authorError.message,
          400,
          'Validation Error'
        );
      }
    }

    // Execute query with pagination
    const [posts, totalCount] = await Promise.all([
      Post.find(query)
        .populate('author', 'username firstName lastName avatar')
        .populate('category', 'name slug')
        .sort(sortParams)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query)
    ]);

    // Create pagination info
    const pagination = createPaginationInfo(page, limit, totalCount);

    // Format response data
    const formattedPosts: PostListResponse[] = posts.map((post: any) => {
      const author = post.author as any;
      const category = post.category as any;
      return {
        _id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        author: {
          _id: author?._id ? author._id.toString() : String(post.author),
          username: author?.username || '',
          firstName: author?.firstName || '',
          lastName: author?.lastName || '',
        },
        category: {
          _id: category?._id ? category._id.toString() : String(post.category),
          name: category?.name || '',
          slug: category?.slug || '',
        },
        tags: post.tags,
        status: post.status,
        publishedAt: post.publishedAt?.toISOString(),
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        readingTime: post.readingTime,
        createdAt: post.createdAt.toISOString(),
      };
    });

    return createSuccessResponse<PostListResponse[]>(
      formattedPosts,
      `Retrieved ${posts.length} posts`,
      pagination
    );

  } catch (error) {
    return handleApiError(error, 'GET /api/posts');
  }
}

/**
 * POST /api/posts
 * Create a new post (authenticated users only)
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`posts_post_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Parse request body
      const body: CreatePostRequest = await request.json();

      // Validate input
      const validation = postValidation.create(body);
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

      // Verify category exists
      const category = await Category.findById(body.category);
      if (!category || !category.isActive) {
        return createErrorResponse(
          'Invalid category',
          400,
          'Category Not Found'
        );
      }

      // Create new post
      const newPost = new Post({
        ...body,
        author: currentUser._id,
      });

      await newPost.save();

      // Populate the post with author and category info
      await newPost.populate('author', 'username firstName lastName avatar');
      await newPost.populate('category', 'name slug');

      // Format response
      const npAuthor: any = newPost.author as any;
      const npCategory: any = newPost.category as any;
      const formattedPost: PostResponse = {
        _id: newPost._id.toString(),
        title: newPost.title,
        slug: newPost.slug,
        content: newPost.content,
        excerpt: newPost.excerpt,
        featuredImage: newPost.featuredImage,
        author: {
          _id: npAuthor?._id ? npAuthor._id.toString() : String(newPost.author),
          username: npAuthor?.username || '',
          firstName: npAuthor?.firstName || '',
          lastName: npAuthor?.lastName || '',
          avatar: npAuthor?.avatar,
        },
        category: {
          _id: npCategory?._id ? npCategory._id.toString() : String(newPost.category),
          name: npCategory?.name || '',
          slug: npCategory?.slug || '',
        },
        tags: newPost.tags,
        status: newPost.status,
        isPublished: newPost.isPublished,
        publishedAt: newPost.publishedAt?.toISOString(),
        viewCount: newPost.viewCount,
        likeCount: newPost.likeCount,
        commentCount: newPost.commentCount,
        readingTime: newPost.readingTime,
        seoTitle: newPost.seoTitle,
        seoDescription: newPost.seoDescription,
        createdAt: newPost.createdAt.toISOString(),
        updatedAt: newPost.updatedAt.toISOString(),
      };

      return createSuccessResponse<PostResponse>(
        formattedPost,
        'Post created successfully'
      );

    } catch (error) {
      return handleApiError(error, 'POST /api/posts');
    }
  })(request);
}