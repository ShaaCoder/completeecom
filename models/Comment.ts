/**
 * Comment Model
 * 
 * Mongoose schema and model for Comment entity with:
 * - Nested comment structure (replies)
 * - Content moderation system
 * - Like/dislike functionality
 * - Reporting and flagging system
 * - Automatic approval workflow
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ICommentDocument } from '@/types/comment';

// Comment schema definition
const CommentSchema = new Schema<ICommentDocument>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
      index: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    replies: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    }],
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve by default, can be changed based on requirements
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: [0, 'Like count cannot be negative'],
    },
    dislikeCount: {
      type: Number,
      default: 0,
      min: [0, 'Dislike count cannot be negative'],
    },
    reportCount: {
      type: Number,
      default: 0,
      min: [0, 'Report count cannot be negative'],
    },
    moderationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'flagged'],
        message: 'Moderation status must be pending, approved, rejected, or flagged',
      },
      default: 'approved',
      index: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Moderation reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
CommentSchema.index({ post: 1, isApproved: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, isApproved: 1 });
CommentSchema.index({ moderationStatus: 1, createdAt: -1 });
CommentSchema.index({ post: 1, parentComment: 1, isApproved: 1 });

// Virtual for reply count
CommentSchema.virtual('replyCount').get(function () {
  return this.replies ? this.replies.length : 0;
});

// Pre-save middleware
CommentSchema.pre('save', function (next) {
  // Set moderation status based on approval
  if (this.isModified('isApproved')) {
    this.moderationStatus = this.isApproved ? 'approved' : 'rejected';
  }

  // Track edit timestamp
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }

  next();
});

// Post-save middleware to update post comment count
CommentSchema.post('save', async function (doc) {
  if (this.isNew || this.isModified('isApproved')) {
    const Post = mongoose.model('Post');
    const post = await Post.findById(doc.post);
    
    if (post) {
      // Count approved comments for this post
      const commentCount = await mongoose.model('Comment').countDocuments({
        post: doc.post,
        isApproved: true,
      });
      
      post.commentCount = commentCount;
      await post.save();
    }
  }
});

// Post-remove middleware to update post comment count
CommentSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  const Post = mongoose.model('Post');
  const post = await Post.findById(doc.post);
  
  if (post) {
    // Recalculate comment count
    const commentCount = await mongoose.model('Comment').countDocuments({
      post: doc.post,
      isApproved: true,
    });
    
    post.commentCount = commentCount;
    await post.save();
  }

  // Remove this comment from parent's replies array
  if (doc.parentComment) {
    await mongoose.model('Comment').findByIdAndUpdate(
      doc.parentComment,
      { $pull: { replies: doc._id } }
    );
  }

  // Delete all replies to this comment
  await mongoose.model('Comment').deleteMany({ parentComment: doc._id });
});

// Instance method to add reply
CommentSchema.methods.addReply = async function (replyId: mongoose.Types.ObjectId): Promise<void> {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    await this.save();
  }
};

// Instance method to remove reply
CommentSchema.methods.removeReply = async function (replyId: mongoose.Types.ObjectId): Promise<void> {
  this.replies = this.replies.filter((id: any) => !id.equals(replyId));
  await this.save();
};

// Instance method to approve comment
CommentSchema.methods.approve = async function (moderatorId: mongoose.Types.ObjectId): Promise<void> {
  this.isApproved = true;
  this.moderationStatus = 'approved';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = undefined as any;
  await this.save();
};

// Instance method to reject comment
CommentSchema.methods.reject = async function (
  moderatorId: mongoose.Types.ObjectId, 
  reason: string
): Promise<void> {
  this.isApproved = false;
  this.moderationStatus = 'rejected';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  await this.save();
};

// Static method to find approved comments
CommentSchema.statics.findApproved = function (filter = {}) {
  return this.find({ 
    ...filter, 
    isApproved: true,
    moderationStatus: 'approved'
  }).sort({ createdAt: -1 });
};

// Static method to find comments by post
CommentSchema.statics.findByPost = function (postId: string, includeReplies = true) {
  const query = this.find({ 
    post: postId, 
    isApproved: true 
  });

  if (includeReplies) {
    return query.populate({
      path: 'replies',
      match: { isApproved: true },
      populate: {
        path: 'author',
        select: 'username firstName lastName avatar'
      }
    }).sort({ createdAt: -1 });
  }

  return query.sort({ createdAt: -1 });
};

// Static method to find top-level comments (no parent)
CommentSchema.statics.findTopLevel = function (postId: string) {
  return this.find({ 
    post: postId, 
    parentComment: null,
    isApproved: true 
  }).sort({ createdAt: -1 });
};

// Static method to find comments needing moderation
CommentSchema.statics.findPendingModeration = function () {
  return this.find({ 
    moderationStatus: { $in: ['pending', 'flagged'] }
  }).sort({ createdAt: -1 });
};

// Static method to find comments by author
CommentSchema.statics.findByAuthor = function (authorId: string) {
  return this.find({ 
    author: authorId,
    isApproved: true 
  }).sort({ createdAt: -1 });
};

// Create and export the Comment model
const Comment: Model<ICommentDocument> = 
  mongoose.models.Comment || mongoose.model<ICommentDocument>('Comment', CommentSchema);

export default Comment;