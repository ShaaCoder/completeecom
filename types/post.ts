/**
 * Post Type Definitions
 * 
 * Comprehensive TypeScript interfaces for Post model
 * including API request/response types and relationships
 */

import { Document, Types } from 'mongoose';
import { IUser } from './user';

// Base Post interface
export interface IPost {
  _id?: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  author: Types.ObjectId | IUser;
  category: Types.ObjectId;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  publishedAt?: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number; // in minutes
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Post document interface (for Mongoose)
export interface IPostDocument extends IPost, Document {
  _id: Types.ObjectId;
  generateSlug(): string;
  calculateReadingTime(): number;
  incrementViewCount(): Promise<void>;
  toJSON(): Partial<IPost>;
}

// Post creation request
export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category: string;
  tags?: string[];
  status?: 'draft' | 'published';
  seoTitle?: string;
  seoDescription?: string;
}

// Post update request
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
}

// Post response with populated fields
export interface PostResponse {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  status: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// Post list response (minimal data for listings)
export interface PostListResponse {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  status: string;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number;
  createdAt: string;
}

// Post query parameters
export interface PostQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount' | 'likeCount' | 'title';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

// Post statistics
export interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  averageReadingTime: number;
  postsByCategory: Array<{
    category: string;
    count: number;
  }>;
  popularTags: Array<{
    tag: string;
    count: number;
  }>;
}