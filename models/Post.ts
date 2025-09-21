/**
 * Post Model
 * 
 * Mongoose schema and model for Post entity with:
 * - Rich content management
 * - SEO optimization fields
 * - Automatic slug generation
 * - Reading time calculation
 * - View tracking and engagement metrics
 * - Publishing workflow
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IPostDocument } from '@/types/post';

// Post schema definition
const PostSchema = new Schema<IPostDocument>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text', // Text index for search
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      index: 'text', // Text index for search
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    featuredImage: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Featured image must be a valid image URL',
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Post category is required'],
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Status must be draft, published, or archived',
      },
      default: 'draft',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    likeCount: {
      type: Number,
      default: 0,
      min: [0, 'Like count cannot be negative'],
    },
    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
    readingTime: {
      type: Number,
      default: 1,
      min: [1, 'Reading time must be at least 1 minute'],
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title cannot exceed 60 characters'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ author: 1, status: 1 });
PostSchema.index({ category: 1, status: 1 });
PostSchema.index({ tags: 1, status: 1 });
PostSchema.index({ isPublished: 1, publishedAt: -1 });
PostSchema.index({ viewCount: -1 });
PostSchema.index({ likeCount: -1 });

// Text index for full-text search
PostSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    excerpt: 5,
    tags: 3,
    content: 1
  }
});

// Virtual for comments
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
});

// Pre-save middleware
PostSchema.pre('save', function (next) {
  // Generate slug if title is modified or document is new
  if (this.isModified('title') || this.isNew) {
    this.slug = this.generateSlug();
  }

  // Calculate reading time if content is modified
  if (this.isModified('content')) {
    this.readingTime = this.calculateReadingTime();
  }

  // Auto-generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 200)
      .trim() + '...';
  }

  // Set published status and date
  if (this.status === 'published' && !this.isPublished) {
    this.isPublished = true;
    this.publishedAt = new Date();
  } else if (this.status !== 'published') {
    this.isPublished = false;
  }

  next();
});

// Post-save middleware to update category post count
PostSchema.post('save', async function (doc) {
  if (this.isModified('category') || this.isModified('status')) {
    const Category = mongoose.model('Category');
    
    // Update current category count
    if (doc.category) {
      const category = await Category.findById(doc.category);
      if (category) {
        await category.updatePostCount();
      }
    }

    // Update previous category count if category was changed
    if (this.isModified('category')) {
      const originalCategory = this.getChanges().$set?.category;
      if (originalCategory && originalCategory !== doc.category) {
        const prevCategory = await Category.findById(originalCategory);
        if (prevCategory) {
          await prevCategory.updatePostCount();
        }
      }
    }
  }
});

// Instance method to generate slug
PostSchema.methods.generateSlug = function (): string {
  let baseSlug = this.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Ensure slug is unique by appending timestamp if needed
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
};

// Instance method to calculate reading time
PostSchema.methods.calculateReadingTime = function (): number {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = this.content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .split(/\s+/)
    .filter((word: string) => word.length > 0).length;
  
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Instance method to increment view count
PostSchema.methods.incrementViewCount = async function (): Promise<void> {
  this.viewCount += 1;
  await this.save();
};

// Static method to find published posts
PostSchema.statics.findPublished = function (filter = {}) {
  return this.find({ 
    ...filter, 
    status: 'published', 
    isPublished: true 
  }).sort({ publishedAt: -1 });
};

// Static method to find posts by author
PostSchema.statics.findByAuthor = function (authorId: string, includeUnpublished = false) {
  const filter: any = { author: authorId };
  if (!includeUnpublished) {
    filter.status = 'published';
    filter.isPublished = true;
  }
  return this.find(filter).sort({ createdAt: -1 });
};

// Static method to find posts by category
PostSchema.statics.findByCategory = function (categoryId: string) {
  return this.find({ 
    category: categoryId, 
    status: 'published', 
    isPublished: true 
  }).sort({ publishedAt: -1 });
};

// Static method to find posts by tags
PostSchema.statics.findByTags = function (tags: string[]) {
  return this.find({ 
    tags: { $in: tags }, 
    status: 'published', 
    isPublished: true 
  }).sort({ publishedAt: -1 });
};

// Static method for full-text search
PostSchema.statics.search = function (query: string, limit = 10) {
  return this.find(
    { 
      $text: { $search: query },
      status: 'published',
      isPublished: true
    },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit);
};

// Create and export the Post model
const Post: Model<IPostDocument> = 
  mongoose.models.Post || mongoose.model<IPostDocument>('Post', PostSchema);

export default Post;