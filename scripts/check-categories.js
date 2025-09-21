/**
 * Category Database Inspector
 * 
 * This script checks your existing categories and shows how the dynamic data flows
 * Usage: node scripts/check-categories.js
 */

const mongoose = require('mongoose');

// MongoDB connection URL
const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-ecommerce-db';

// Category schema (matching your existing model)
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  image: String,
  icon: String,
  color: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: Boolean,
  isFeatured: Boolean,
  sortOrder: Number,
  productCount: Number,
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
}, {
  timestamps: true
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

async function inspectCategories() {
  try {
    console.log('🔍 Inspecting your existing categories...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Get all categories
    const allCategories = await Category.find({});
    const activeCategories = await Category.find({ isActive: true });
    const featuredCategories = await Category.find({ isFeatured: true });
    const rootCategories = await Category.find({ parentCategory: null });

    // Display summary
    console.log('\n📊 Category Summary:');
    console.log(`   • Total Categories: ${allCategories.length}`);
    console.log(`   • Active Categories: ${activeCategories.length}`);
    console.log(`   • Featured Categories: ${featuredCategories.length}`);
    console.log(`   • Root Categories: ${rootCategories.length}`);

    if (allCategories.length === 0) {
      console.log('\n❌ No categories found in database!');
      console.log('   Your "Shop by Category" section will show empty state.');
      return;
    }

    // Calculate total products
    const totalProducts = allCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    console.log(`   • Total Products Across Categories: ${totalProducts}`);

    // Display categories that will appear in the showcase
    console.log('\n🎯 Categories shown in "Shop by Category" (active only):');
    if (activeCategories.length === 0) {
      console.log('   ❌ No active categories found!');
    } else {
      activeCategories
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .forEach((cat, index) => {
          const featured = cat.isFeatured ? ' ⭐ FEATURED' : '';
          const products = cat.productCount ? ` (${cat.productCount} products)` : ' (0 products)';
          console.log(`   ${index + 1}. ${cat.name}${products}${featured}`);
          if (cat.description) {
            console.log(`      Description: ${cat.description.substring(0, 80)}...`);
          }
          if (cat.image) {
            console.log(`      Image: ${cat.image}`);
          }
        });
    }

    // Show featured categories separately
    if (featuredCategories.length > 0) {
      console.log('\n⭐ Featured Categories (highlighted in showcase):');
      featuredCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.productCount || 0} products)`);
      });
    }

    // Check for categories with missing data
    console.log('\n🔧 Data Quality Check:');
    const categoriesWithoutImages = allCategories.filter(cat => !cat.image);
    const categoriesWithoutDescriptions = allCategories.filter(cat => !cat.description);
    const categoriesWithoutProducts = allCategories.filter(cat => !cat.productCount || cat.productCount === 0);

    if (categoriesWithoutImages.length > 0) {
      console.log(`   ⚠️  ${categoriesWithoutImages.length} categories missing images`);
    }
    if (categoriesWithoutDescriptions.length > 0) {
      console.log(`   ⚠️  ${categoriesWithoutDescriptions.length} categories missing descriptions`);
    }
    if (categoriesWithoutProducts.length > 0) {
      console.log(`   ⚠️  ${categoriesWithoutProducts.length} categories with 0 products`);
    }

    // Show API endpoint simulation
    console.log('\n🌐 API Endpoint Simulation:');
    console.log('   Your frontend calls: GET /api/categories');
    console.log('   Which returns the following structure:');
    
    const sampleCategory = activeCategories[0];
    if (sampleCategory) {
      console.log('\n   Sample API Response:');
      console.log(JSON.stringify({
        success: true,
        data: [{
          id: sampleCategory._id.toString(),
          name: sampleCategory.name,
          slug: sampleCategory.slug,
          description: sampleCategory.description,
          image: sampleCategory.image,
          productCount: sampleCategory.productCount || 0,
          isActive: sampleCategory.isActive,
          isFeatured: sampleCategory.isFeatured
        }]
      }, null, 2));
    }

    console.log('\n✅ Your categories are already dynamic!');
    console.log('   The CategoryShowcase component automatically displays this data.');

  } catch (error) {
    console.error('❌ Error inspecting categories:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your MongoDB server is running and the connection URL is correct.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the inspection
inspectCategories();