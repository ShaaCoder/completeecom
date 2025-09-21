/**
 * Comment Type Definitions
 * 
 * Comprehensive TypeScript interfaces for Comment model
 * including nested comments and moderation features
 */

import { Document, Types } from 'mongoose';
import { IUser } from './user';
import { IPost } from './post';

// Base Comment interface
export interface IComment {
  _id?: Types.ObjectId;
  content: string;
  author: Types.ObjectId | IUser;
  post: Types.ObjectId | IPost;
  parentComment?: Types.ObjectId | IComment;
  replies: Types.ObjectId[] | IComment[];
  isApproved: boolean;
  isEdited: boolean;
  editedAt?: Date;
  likeCount: number;
  dislikeCount: number;
  reportCount: number;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatedBy?: Types.ObjectId | IUser;
  moderatedAt?: Date;
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comment document interface (for Mongoose)
export interface ICommentDocument extends IComment, Document {
  _id: Types.ObjectId;
  addReply(replyId: Types.ObjectId): Promise<void>;
  removeReply(replyId: Types.ObjectId): Promise<void>;
  approve(moderatorId: Types.ObjectId): Promise<void>;
  reject(moderatorId: Types.ObjectId, reason: string): Promise<void>;
  toJSON(): Partial<IComment>;
}

// Comment creation request
export interface CreateCommentRequest {
  content: string;
  post: string;
  parentComment?: string;
}

// Comment update request
export interface UpdateCommentRequest {
  content?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationReason?: string;
}

// Comment response with populated fields
export interface CommentResponse {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  post: {
    _id: string;
    title: string;
    slug: string;
  };
  parentComment?: {
    _id: string;
    author: {
      username: string;
    };
  };
  replies: CommentResponse[];
  isApproved: boolean;
  isEdited: boolean;
  editedAt?: string;
  likeCount: number;
  dislikeCount: number;
  reportCount: number;
  moderationStatus: string;
  moderatedBy?: {
    _id: string;
    username: string;
  };
  moderatedAt?: string;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment list response (for comment threads)
export interface CommentListResponse {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  parentComment?: string;
  replyCount: number;
  isApproved: boolean;
  isEdited: boolean;
  editedAt?: string;
  likeCount: number;
  dislikeCount: number;
  moderationStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Comment query parameters
export interface CommentQueryParams {
  page?: number;
  limit?: number;
  post?: string;
  author?: string;
  parentComment?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged';
  sortBy?: 'createdAt' | 'updatedAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
  includeReplies?: boolean;
}

// Comment moderation request
export interface CommentModerationRequest {
  action: 'approve' | 'reject' | 'flag';
  reason?: string;
}

// Comment statistics
export interface CommentStats {
  totalComments: number;
  approvedComments: number;
  pendingComments: number;
  rejectedComments: number;
  flaggedComments: number;
  averageCommentsPerPost: number;
  topCommenters: Array<{
    user: {
      _id: string;
      username: string;
    };
    commentCount: number;
  }>;
}