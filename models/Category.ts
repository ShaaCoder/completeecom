/**
 * Category Model
 * 
 * Mongoose schema and model for Category entity with:
 * - Hierarchical categories (parent-child relationships)
 * - Automatic slug generation
 * - Product count tracking
 * - SEO optimization fields
 * - Sorting and organization features
 */

import mongoose, { Schema, Model } from 'mongoose';
import { generateSlug } from '@/lib/utils';
import { ICategoryDocument } from '@/types/category';

// Category schema definition
const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          const isHttpUrl = /^https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(v);
          const isDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(v);
          const isRelativePath = /^\/?(uploads|images|img|assets)\/[^\s?#]+(\.(jpg|jpeg|png|gif|webp|avif|svg))?$/i.test(v);
          return isHttpUrl || isDataUrl || isRelativePath;
        },
        message: 'Image must be a valid image URL or relative path',
      },
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon name cannot exceed 50 characters'],
    },
    color: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Color must be a valid hex color code',
      },
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    productCount: {
      type: Number,
      default: 0,
      min: [0, 'Product count cannot be negative'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
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
    seoKeywords: [{
      type: String,
      trim: true,
      maxlength: [50, 'SEO keyword cannot exceed 50 characters'],
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Make optional for now to avoid issues
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
CategorySchema.index({ isActive: 1, sortOrder: 1 });
CategorySchema.index({ parentCategory: 1, isActive: 1 });
CategorySchema.index({ slug: 1, isActive: 1 });
CategorySchema.index({ isFeatured: 1, isActive: 1 });
CategorySchema.index({ name: 'text', description: 'text' });

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  match: { isActive: true },
  options: { sort: { sortOrder: 1, name: 1 } },
});

// Virtual for products in this category
CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  match: { isActive: true },
});

// Pre-save middleware to generate slug
CategorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.generateSlug();
  }
  next();
});

// Pre-save middleware to prevent circular references
CategorySchema.pre('save', async function (next) {
  if (this.parentCategory && this.isModified('parentCategory')) {
    // Check if setting parent would create a circular reference
    const isCircular = await this.isDescendantOf(this.parentCategory as any);
    if (isCircular) {
      const error = new Error('Cannot set parent category: would create circular reference');
      return next(error);
    }
  }
  next();
});

// Instance method to generate slug from name
CategorySchema.methods.generateSlug = function (): string {
  let baseSlug = generateSlug(this.name);
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
};

// Instance method to update product count
CategorySchema.methods.updateProductCount = async function (): Promise<void> {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
  this.productCount = count;
  await this.save();
};

// Instance method to get ancestors (parent, grandparent, etc.)
CategorySchema.methods.getAncestors = async function (): Promise<ICategoryDocument[]> {
  const ancestors: ICategoryDocument[] = [];
  let current = this;
  
  while (current.parentCategory) {
    const parent = await mongoose.model('Category').findById(current.parentCategory);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  
  return ancestors;
};

// Instance method to get descendants (children, grandchildren, etc.)
CategorySchema.methods.getDescendants = async function (): Promise<ICategoryDocument[]> {
  const descendants: ICategoryDocument[] = [];
  
  const findChildren = async (categoryId: mongoose.Types.ObjectId) => {
    const children = await mongoose.model('Category').find({ 
      parentCategory: categoryId,
      isActive: true 
    });
    
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };
  
  await findChildren(this._id);
  return descendants;
};

// Instance method to check if category is descendant of another
CategorySchema.methods.isDescendantOf = async function (categoryId: mongoose.Types.ObjectId): Promise<boolean> {
  if (this._id.equals(categoryId)) return true;
  
  let current: any = this;
  while (current.parentCategory) {
    if (current.parentCategory.equals(categoryId)) return true;
    current = await mongoose.model('Category').findById(current.parentCategory);
    if (!current) break;
  }
  
  return false;
};

// Static method to find active categories
CategorySchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method to find root categories (no parent)
CategorySchema.statics.findRootCategories = function () {
  return this.find({ 
    parentCategory: null, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to find featured categories
CategorySchema.statics.findFeatured = function () {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to find categories with their subcategories
CategorySchema.statics.findWithSubcategories = function () {
  return this.find({ isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { sortOrder: 1, name: 1 } }
    })
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to build category tree
CategorySchema.statics.buildTree = async function () {
  const categories = await this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  const categoryMap = new Map();
  const tree: any[] = [];
  
  // Create map of categories
  categories.forEach((cat: any) => {
    categoryMap.set(cat._id.toString(), {
      ...cat.toObject(),
      children: []
    });
  });
  
  // Build tree structure
  categories.forEach((cat: any) => {
    const categoryObj = categoryMap.get(cat._id.toString());
    
    if (cat.parentCategory) {
      const parent = categoryMap.get(cat.parentCategory.toString());
      if (parent) {
        parent.children.push(categoryObj);
      }
    } else {
      tree.push(categoryObj);
    }
  });
  
  return tree;
};

// Pre-remove middleware to handle category deletion
CategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    // Move subcategories to parent or make them root categories
    await mongoose.model('Category').updateMany(
      { parentCategory: this._id },
      { parentCategory: this.parentCategory as any }
    );

    // Update products to remove category reference
    await mongoose.model('Product').updateMany(
      { category: this._id },
      { $unset: { category: 1 as any } }
    );

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Post-save middleware to update parent category product count
CategorySchema.post('save', async function (doc) {
  if (doc.parentCategory) {
    const parent = await mongoose.model('Category').findById(doc.parentCategory);
    if (parent) {
      await (parent as any).updateProductCount();
    }
  }
});

// Create and export the Category model
const Category: Model<ICategoryDocument> = 
  mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;