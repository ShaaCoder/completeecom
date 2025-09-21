/**
 * Fix Category Product Count Inconsistency
 * 
 * This script identifies and fixes the mismatch between:
 * 1. Category.productCount field (stored count)
 * 2. Actual number of products linked to each category
 * 
 * Usage: node scripts/fix-category-product-counts.js
 */

const mongoose = require('mongoose');

// MongoDB connection URL
const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-ecommerce-db';

// Define schemas (simplified for this script)
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  productCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function fixCategoryProductCounts() {
  try {
    console.log('🔧 Starting category product count fix...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log(`📊 Found ${categories.length} categories to check\n`);

    const results = [];
    
    for (const category of categories) {
      console.log(`🔍 Checking category: ${category.name} (${category.slug})`);
      
      // Count actual products in this category
      const actualCount = await Product.countDocuments({ 
        category: category._id,
        isActive: true 
      });
      
      const storedCount = category.productCount || 0;
      
      console.log(`   Stored count: ${storedCount}`);
      console.log(`   Actual count: ${actualCount}`);
      
      if (storedCount !== actualCount) {
        console.log(`   ⚠️  MISMATCH DETECTED! Updating ${storedCount} → ${actualCount}`);
        
        // Update the category with the correct count
        await Category.findByIdAndUpdate(category._id, {
          productCount: actualCount
        });
        
        results.push({
          category: category.name,
          slug: category.slug,
          oldCount: storedCount,
          newCount: actualCount,
          fixed: true
        });
        
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`   ✅ Count is correct`);
        results.push({
          category: category.name,
          slug: category.slug,
          count: actualCount,
          fixed: false
        });
      }
      console.log('');
    }

    // Display summary
    console.log('📋 SUMMARY REPORT\n');
    console.log('=' * 50);
    
    const fixedCategories = results.filter(r => r.fixed);
    const correctCategories = results.filter(r => !r.fixed);
    
    if (fixedCategories.length > 0) {
      console.log(`🔧 Fixed ${fixedCategories.length} categories:\n`);
      fixedCategories.forEach(result => {
        console.log(`   ${result.category}: ${result.oldCount} → ${result.newCount} products`);
      });
      console.log('');
    }
    
    if (correctCategories.length > 0) {
      console.log(`✅ ${correctCategories.length} categories were already correct:\n`);
      correctCategories.forEach(result => {
        console.log(`   ${result.category}: ${result.count} products`);
      });
      console.log('');
    }

    // Verify the fix by re-fetching category data
    console.log('🔍 VERIFICATION - Updated category counts:\n');
    const updatedCategories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    updatedCategories.forEach(cat => {
      console.log(`   ${cat.name.padEnd(15)} | ${String(cat.productCount).padStart(3)} products | ${cat.slug}`);
    });

    // Calculate totals
    const totalProducts = updatedCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    console.log(`\n📊 Total products across all categories: ${totalProducts}`);

    console.log('\n🎉 Category product count fix completed successfully!');
    console.log('\n💡 Your "Shop by Category" section should now show accurate counts.');

  } catch (error) {
    console.error('❌ Error fixing category product counts:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your MongoDB server is running and the connection URL is correct.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Additional function to analyze product-category relationships
async function analyzeProductCategories() {
  try {
    console.log('🔍 Analyzing product-category relationships...\n');
    
    await mongoose.connect(MONGODB_URL);
    
    // Find products without categories
    const productsWithoutCategory = await Product.find({ 
      $or: [
        { category: null },
        { category: { $exists: false } }
      ],
      isActive: true 
    });
    
    console.log(`🔍 Products without category: ${productsWithoutCategory.length}`);
    if (productsWithoutCategory.length > 0) {
      console.log('   These products will not appear in any category page:');
      productsWithoutCategory.slice(0, 5).forEach(product => {
        console.log(`   - ${product.name} (${product.slug})`);
      });
      if (productsWithoutCategory.length > 5) {
        console.log(`   ... and ${productsWithoutCategory.length - 5} more`);
      }
    }
    
    // Find products with invalid category references
    const allProducts = await Product.find({ isActive: true }).populate('category');
    const productsWithInvalidCategories = allProducts.filter(product => 
      product.category && typeof product.category === 'object' && !product.category._id
    );
    
    console.log(`🔍 Products with invalid category references: ${productsWithInvalidCategories.length}`);
    
    // Find the most popular categories by product count
    const categoryProductCounts = await Product.aggregate([
      { $match: { isActive: true, category: { $exists: true, $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('\n📊 Top categories by actual product count:');
    categoryProductCounts.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.category.name}: ${item.count} products`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error analyzing product categories:', error);
  }
}

// Command line handling
const args = process.argv.slice(2);

if (args.includes('--analyze')) {
  analyzeProductCategories();
} else {
  fixCategoryProductCounts();
}

module.exports = {
  fixCategoryProductCounts,
  analyzeProductCategories
};