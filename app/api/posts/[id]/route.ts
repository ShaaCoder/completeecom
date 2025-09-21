/**
 * Post by ID API Routes
 * 
 * Handles operations for specific posts:
 * GET /api/posts/[id] - Get post by ID
 * PUT /api/posts/[id] - Update post by ID
 * DELETE /api/posts/[id] - Delete post by ID
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import Category from '@/models/Category';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { postValidation, validateObjectId } from '@/lib/validations';
import { PostResponse, UpdatePostRequest } from '@/types/post';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/posts/[id]
 * Retrieve a specific post by ID
 * Public for published posts, authenticated for unpublished posts
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`post_get_${clientIP}`, 100, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Validate post ID
    const idValidation = validateObjectId(params.id, 'postId');
    if (idValidation) {
      return createErrorResponse(
        idValidation.message,
        400,
        'Validation Error'
      );
    }

    // Check authentication for unpublished posts
    const authHeader = request.headers.get('authorization');
    let currentUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { user } = await import('@/lib/api-helpers').then(m => m.authenticateUser(request));
        currentUser = user;
      } catch (error) {
        // Continue as unauthenticated user
      }
    }

    // Find post
    const post = await Post.findById(params.id)
      .populate('author', 'username firstName lastName avatar')
      .populate('category', 'name slug');

    if (!post) {
      return createErrorResponse(
        'Post not found',
        404,
        'Not Found'
      );
    }

    // Check if user can access this post
    const isPublished = post.status === 'published' && post.isPublished;
    const postAuthorId = (post.author as any)?._id
      ? String((post.author as any)._id)
      : String(post.author);
    const isAuthor = currentUser && currentUser._id.toString() === postAuthorId;
    const isAdmin = currentUser && ['admin', 'moderator'].includes(currentUser.role);

    if (!isPublished && !isAuthor && !isAdmin) {
      return createErrorResponse(
        'Post not found',
        404,
        'Not Found'
      );
    }

    // Increment view count for published posts
    if (isPublished) {
      await post.incrementViewCount();
    }

    // Format response
    const authorPop: any = post.author as any;
    const categoryPop: any = post.category as any;
    const formattedPost: PostResponse = {
      _id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      author: {
        _id: authorPop?._id ? authorPop._id.toString() : String(post.author),
        username: authorPop?.username || '',
        firstName: authorPop?.firstName || '',
        lastName: authorPop?.lastName || '',
        avatar: authorPop?.avatar,
      },
      category: {
        _id: categoryPop?._id ? categoryPop._id.toString() : String(post.category),
        name: categoryPop?.name || '',
        slug: categoryPop?.slug || '',
      },
      tags: post.tags,
      status: post.status,
      isPublished: post.isPublished,
      publishedAt: post.publishedAt?.toISOString(),
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      readingTime: post.readingTime,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    return createSuccessResponse<PostResponse>(
      formattedPost,
      'Post retrieved successfully'
    );

  } catch (error) {
    return handleApiError(error, `GET /api/posts/${params.id}`);
  }
}

/**
 * PUT /api/posts/[id]
 * Update a specific post by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`post_put_${clientIP}`, 20, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Validate post ID
      const idValidation = validateObjectId(params.id, 'postId');
      if (idValidation) {
        return createErrorResponse(
          idValidation.message,
          400,
          'Validation Error'
        );
      }

      // Find post
      const post = await Post.findById(params.id);
      if (!post) {
        return createErrorResponse(
          'Post not found',
          404,
          'Not Found'
        );
      }

      // Check permissions
      const isAuthor = currentUser._id.toString() === post.author.toString();
      const isAdmin = ['admin', 'moderator'].includes(currentUser.role);

      if (!isAuthor && !isAdmin) {
        return createErrorResponse(
          'Access denied',
          403,
          'Authorization Error'
        );
      }

      // Parse request body
      const body: UpdatePostRequest = await request.json();

      // Validate input
      const validation = postValidation.update(body);
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

      // Verify category exists if being updated
      if (body.category) {
        const category = await Category.findById(body.category);
        if (!category || !category.isActive) {
          return createErrorResponse(
            'Invalid category',
            400,
            'Category Not Found'
          );
        }
      }

      // Update post
      const updatedPost = await Post.findByIdAndUpdate(
        params.id,
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('author', 'username firstName lastName avatar')
        .populate('category', 'name slug');

      if (!updatedPost) {
        return createErrorResponse(
          'Post not found',
          404,
          'Not Found'
        );
      }

      // Format response
      const upAuthor: any = updatedPost.author as any;
      const upCategory: any = updatedPost.category as any;
      const formattedPost: PostResponse = {
        _id: updatedPost._id.toString(),
        title: updatedPost.title,
        slug: updatedPost.slug,
        content: updatedPost.content,
        excerpt: updatedPost.excerpt,
        featuredImage: updatedPost.featuredImage,
        author: {
          _id: upAuthor?._id ? upAuthor._id.toString() : String(updatedPost.author),
          username: upAuthor?.username || '',
          firstName: upAuthor?.firstName || '',
          lastName: upAuthor?.lastName || '',
          avatar: upAuthor?.avatar,
        },
        category: {
          _id: upCategory?._id ? upCategory._id.toString() : String(updatedPost.category),
          name: upCategory?.name || '',
          slug: upCategory?.slug || '',
        },
        tags: updatedPost.tags,
        status: updatedPost.status,
        isPublished: updatedPost.isPublished,
        publishedAt: updatedPost.publishedAt?.toISOString(),
        viewCount: updatedPost.viewCount,
        likeCount: updatedPost.likeCount,
        commentCount: updatedPost.commentCount,
        readingTime: updatedPost.readingTime,
        seoTitle: updatedPost.seoTitle,
        seoDescription: updatedPost.seoDescription,
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
      };

      return createSuccessResponse<PostResponse>(
        formattedPost,
        'Post updated successfully'
      );

    } catch (error) {
      return handleApiError(error, `PUT /api/posts/${params.id}`);
    }
  })(request);
}

/**
 * DELETE /api/posts/[id]
 * Delete a specific post by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`post_delete_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Validate post ID
      const idValidation = validateObjectId(params.id, 'postId');
      if (idValidation) {
        return createErrorResponse(
          idValidation.message,
          400,
          'Validation Error'
        );
      }

      // Find post
      const post = await Post.findById(params.id);
      if (!post) {
        return createErrorResponse(
          'Post not found',
          404,
          'Not Found'
        );
      }

      // Check permissions
      const isAuthor = currentUser._id.toString() === post.author.toString();
      const isAdmin = ['admin', 'moderator'].includes(currentUser.role);

      if (!isAuthor && !isAdmin) {
        return createErrorResponse(
          'Access denied',
          403,
          'Authorization Error'
        );
      }

      // Delete post
      await Post.findByIdAndDelete(params.id);

      // TODO: Handle cascading deletes for comments
      // This should be done in a transaction or background job

      return createSuccessResponse(
        { id: params.id },
        'Post deleted successfully'
      );

    } catch (error) {
      return handleApiError(error, `DELETE /api/posts/${params.id}`);
    }
  })(request);
}