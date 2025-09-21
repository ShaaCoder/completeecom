/**
 * Simple script to add basic categories to the database
 * Run this with: node scripts/add-categories.js
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beautymart';

// Category schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  subcategories: [{ type: String }],
  isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

const categories = [
  {
    name: 'Makeup',
    slug: 'makeup',
    description: 'Discover our collection of makeup products for a flawless look',
    image: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
    subcategories: ['Face', 'Eyes', 'Lips', 'Nails']
  },
  {
    name: 'Skincare',
    slug: 'skincare',
    description: 'Nurture your skin with our premium skincare range',
    image: 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
    subcategories: ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreen']
  },
  {
    name: 'Hair Care',
    slug: 'haircare',
    description: 'Transform your hair with our professional hair care products',
    image: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
    subcategories: ['Shampoo', 'Conditioner', 'Styling', 'Treatment']
  },
  {
    name: 'Fragrance',
    slug: 'fragrance',
    description: 'Find your signature scent from our curated fragrance collection',
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg',
    subcategories: ['Women', 'Men', 'Unisex']
  },
  {
    name: 'Body Care',
    slug: 'bodycare',
    description: 'Pamper your body with our luxurious body care essentials',
    image: 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
    subcategories: ['Shower', 'Moisturizer', 'Deodorant']
  }
];

async function addCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📂 Adding categories...');
    
    for (const categoryData of categories) {
      try {
        const category = new Category(categoryData);
        await category.save();
        console.log(`✅ Added category: ${categoryData.name}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Category already exists: ${categoryData.name}`);
        } else {
          console.error(`❌ Error adding category ${categoryData.name}:`, error.message);
        }
      }
    }

    console.log('🎉 Categories added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addCategories();
