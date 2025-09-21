/**
 * Database Seeding Script
 * 
 * Seeds the database with sample data for testing
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Order from '@/models/Order';

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@beautymart.com',
    username: 'shadow',
    password: 'Admin123',
    role: 'admin',
    isEmailVerified: true,
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'User123!',
    phone: '9876543210',
    role: 'customer',
    addresses: [
      {
        id: new mongoose.Types.ObjectId().toString(),
        name: 'Priya Sharma',
        phone: '9876543210',
        address: '123 MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        isDefault: true,
      }
    ]
  }
];

const sampleCategories = [
  {
    name: 'Makeup',
    slug: 'makeup',
    description: 'Discover our collection of makeup products for a flawless look',
    image: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
    subcategories: ['Face', 'Eyes', 'Lips', 'Nails'],
    isActive: true,
    productCount: 0
  },
  {
    name: 'Skincare',
    slug: 'skincare',
    description: 'Nurture your skin with our premium skincare range',
    image: 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
    subcategories: ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreen'],
    isActive: true,
    productCount: 0
  },
  {
    name: 'Hair Care',
    slug: 'haircare',
    description: 'Transform your hair with our professional hair care products',
    image: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
    subcategories: ['Shampoo', 'Conditioner', 'Styling', 'Treatment'],
    isActive: true,
    productCount: 0
  },
  {
    name: 'Fragrance',
    slug: 'fragrance',
    description: 'Find your signature scent from our curated fragrance collection',
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg',
    subcategories: ['Women', 'Men', 'Unisex'],
    isActive: true,
    productCount: 0
  },
  {
    name: 'Body Care',
    slug: 'bodycare',
    description: 'Pamper your body with our luxurious body care essentials',
    image: 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
    subcategories: ['Shower', 'Moisturizer', 'Deodorant'],
    isActive: true,
    productCount: 0
  }
];

const sampleProducts = [
  {
    name: 'Radiance Foundation SPF 30',
    description: 'Full coverage foundation with SPF protection for all-day wear and natural radiance.',
    price: 1299,
    originalPrice: 1599,
    images: [
      'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'
    ],
    category: 'makeup',
    subcategory: 'Face',
    brand: 'GlowUp',
    stock: 45,
    rating: 4.5,
    reviewCount: 128,
    tags: ['bestseller', 'spf', 'full-coverage'],
    features: ['SPF 30 Protection', '16-hour wear', 'Transfer-resistant', 'Available in 20 shades'],
    isBestseller: true,
    isFeatured: true
  },
  {
    name: 'Vitamin C Brightening Serum',
    description: 'Potent vitamin C serum that brightens skin and reduces dark spots for a radiant complexion.',
    price: 899,
    images: [
      'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg'
    ],
    category: 'skincare',
    subcategory: 'Serums',
    brand: 'Pure Glow',
    stock: 32,
    rating: 4.7,
    reviewCount: 89,
    tags: ['vitamin-c', 'brightening', 'anti-aging'],
    features: ['20% Vitamin C', 'Dermatologist tested', 'Cruelty-free', 'Suitable for all skin types'],
    ingredients: ['Vitamin C', 'Hyaluronic Acid', 'Niacinamide'],
    isNew: true,
    isFeatured: true
  },
  {
    name: 'Luxury Rose Gold Lipstick',
    description: 'Creamy, long-wearing lipstick with a luxurious rose gold finish and nourishing formula.',
    price: 649,
    originalPrice: 799,
    images: [
      'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'
    ],
    category: 'makeup',
    subcategory: 'Lips',
    brand: 'Velvet Touch',
    stock: 67,
    rating: 4.3,
    reviewCount: 234,
    tags: ['long-wearing', 'creamy', 'luxury'],
    features: ['8-hour wear', 'Enriched with Vitamin E', 'Smooth application', 'Available in 15 shades'],
    isBestseller: true,
    isFeatured: true
  },
  {
    name: 'Hydrating Night Moisturizer',
    description: 'Rich, nourishing night cream that deeply hydrates and repairs skin while you sleep.',
    price: 1199,
    images: [
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
      'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg'
    ],
    category: 'skincare',
    subcategory: 'Moisturizers',
    brand: 'NightGlow',
    stock: 28,
    rating: 4.6,
    reviewCount: 156,
    tags: ['hydrating', 'night-care', 'anti-aging'],
    features: ['Deep hydration', 'Anti-aging peptides', 'Non-comedogenic', 'Fragrance-free'],
    ingredients: ['Hyaluronic Acid', 'Peptides', 'Ceramides', 'Shea Butter'],
    isFeatured: true
  },
  {
    name: 'Shimmer Eyeshadow Palette',
    description: '12-shade eyeshadow palette with highly pigmented shimmer and matte shades for stunning eye looks.',
    price: 1599,
    originalPrice: 1999,
    images: [
      'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'
    ],
    category: 'makeup',
    subcategory: 'Eyes',
    brand: 'ColorPop',
    stock: 19,
    rating: 4.8,
    reviewCount: 342,
    tags: ['palette', 'shimmer', 'pigmented'],
    features: ['12 versatile shades', 'Highly pigmented', 'Blendable formula', 'Long-lasting'],
    isNew: true,
    isFeatured: true
  },
  {
    name: 'Argan Oil Hair Treatment',
    description: 'Nourishing argan oil treatment that repairs damaged hair and adds natural shine.',
    price: 799,
    images: [
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg'
    ],
    category: 'haircare',
    subcategory: 'Treatment',
    brand: 'Pure Hair',
    stock: 41,
    rating: 4.4,
    reviewCount: 98,
    tags: ['argan-oil', 'repair', 'shine'],
    features: ['100% Pure Argan Oil', 'Repairs damaged hair', 'Adds shine', 'Heat protection'],
    ingredients: ['Argan Oil', 'Vitamin E', 'Essential Oils'],
    isFeatured: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    
    // Seed categories
    console.log('📂 Seeding categories...');
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    // Seed users
    console.log('👥 Seeding users...');
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Seed products
    console.log('📦 Seeding products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${createdProducts.length} products`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Display created data
    console.log('\n📊 Seeded Data Summary:');
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Products: ${createdProducts.length}`);
    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@beautymart.com / Admin123!');
    console.log('Customer: priya@example.com / User123!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;