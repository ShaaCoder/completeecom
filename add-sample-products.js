const mongoose = require('mongoose');
const fs = require('fs');

// Read .env file manually
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      envVars[key] = value;
    }
  }
});

const uri = envVars.MONGODB_URI;

const sampleProducts = [
  {
    name: 'Premium Hair Scrunchies Set',
    description: 'Set of 5 beautiful silk hair scrunchies perfect for any hair type. Gentle on hair and stylish.',
    price: 299,
    originalPrice: 399,
    images: [
      'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'
    ],
    brand: 'BeautyMart',
    stock: 50,
    rating: 4.5,
    reviewCount: 23,
    tags: ['hair', 'accessories', 'silk', 'scrunchies'],
    features: [
      'Made with premium silk',
      'Gentle on all hair types',
      'Available in multiple colors',
      'Durable and long-lasting'
    ],
    isActive: true,
    isFeatured: true,
    isNewProduct: false,
    isBestseller: true,
    color: 'Multi-color',
    material: 'Silk',
    careInstructions: ['Hand wash only', 'Air dry', 'Do not bleach'],
    gender: 'women'
  },
  {
    name: 'Hydrating Face Moisturizer',
    description: 'Lightweight, non-greasy moisturizer that provides 24-hour hydration for all skin types.',
    price: 899,
    originalPrice: 1199,
    images: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
    ],
    brand: 'GlowCare',
    stock: 30,
    rating: 4.8,
    reviewCount: 45,
    tags: ['skincare', 'moisturizer', 'hydration', 'face'],
    features: [
      'Non-comedogenic formula',
      '24-hour hydration',
      'Suitable for all skin types',
      'Dermatologist tested'
    ],
    ingredients: ['Hyaluronic Acid', 'Vitamin E', 'Aloe Vera', 'Glycerin'],
    isActive: true,
    isFeatured: true,
    isNewProduct: true,
    skinType: ['dry', 'normal', 'combination'],
    weight: { value: 50, unit: 'ml' }
  },
  {
    name: 'Professional Makeup Brush Set',
    description: 'Complete 12-piece makeup brush set with synthetic bristles, perfect for professional makeup application.',
    price: 1599,
    originalPrice: 2499,
    images: [
      'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=400',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'
    ],
    brand: 'ProBeauty',
    stock: 25,
    rating: 4.7,
    reviewCount: 67,
    tags: ['makeup', 'brushes', 'professional', 'tools'],
    features: [
      'Synthetic bristles',
      'Ergonomic handles',
      'Includes storage pouch',
      '12 essential brushes'
    ],
    isActive: true,
    isFeatured: false,
    isNewProduct: false,
    isBestseller: true,
    material: 'Synthetic bristles with wooden handles',
    careInstructions: ['Clean after each use', 'Use brush cleaner', 'Air dry flat']
  },
  {
    name: 'Vitamin C Serum',
    description: 'Brightening serum with 20% Vitamin C to reduce dark spots and improve skin radiance.',
    price: 1299,
    originalPrice: 1799,
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
      'https://images.unsplash.com/photo-1556228578-dd6f8f7b6a60?w=400'
    ],
    brand: 'VitaGlow',
    stock: 40,
    rating: 4.6,
    reviewCount: 89,
    tags: ['serum', 'vitamin-c', 'brightening', 'anti-aging'],
    features: [
      '20% Vitamin C concentration',
      'Reduces dark spots',
      'Improves skin texture',
      'Antioxidant protection'
    ],
    ingredients: ['L-Ascorbic Acid', 'Vitamin E', 'Ferulic Acid', 'Hyaluronic Acid'],
    isActive: true,
    isFeatured: true,
    isNewProduct: true,
    skinType: ['all', 'dull', 'mature'],
    weight: { value: 30, unit: 'ml' }
  },
  {
    name: 'Organic Lip Balm Set',
    description: 'Set of 3 organic lip balms with natural ingredients to keep your lips soft and moisturized.',
    price: 599,
    originalPrice: 799,
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      'https://images.unsplash.com/photo-1609205043729-0f9e5e6abd5c?w=400'
    ],
    brand: 'NatureLips',
    stock: 60,
    rating: 4.4,
    reviewCount: 34,
    tags: ['lip-care', 'organic', 'natural', 'moisturizing'],
    features: [
      '100% organic ingredients',
      'Three different flavors',
      'Long-lasting moisture',
      'Travel-friendly size'
    ],
    ingredients: ['Organic Coconut Oil', 'Shea Butter', 'Beeswax', 'Vitamin E'],
    isActive: true,
    isFeatured: false,
    isNewProduct: false,
    certifications: ['Organic', 'Cruelty-Free'],
    weight: { value: 4.5, unit: 'g' }
  }
];

async function addSampleProducts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully');

    // First, let's create a category for these products
    const categorySchema = new mongoose.Schema({
      name: String,
      slug: String,
      description: String,
      isActive: { type: Boolean, default: true }
    });

    const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
    
    let category = await Category.findOne({ name: 'Beauty & Personal Care' });
    if (!category) {
      category = new Category({
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Beauty and personal care products',
        isActive: true
      });
      await category.save();
      console.log('✅ Created Beauty & Personal Care category');
    }

    // Now create the product schema (simplified version)
    const productSchema = new mongoose.Schema({
      name: { type: String, required: true },
      slug: String,
      description: { type: String, required: true },
      price: { type: Number, required: true },
      originalPrice: Number,
      images: [String],
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      brand: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      tags: [String],
      features: [String],
      ingredients: [String],
      isActive: { type: Boolean, default: true },
      isFeatured: { type: Boolean, default: false },
      isNewProduct: { type: Boolean, default: false },
      isBestseller: { type: Boolean, default: false },
      color: String,
      material: String,
      careInstructions: [String],
      gender: String,
      skinType: [String],
      weight: {
        value: Number,
        unit: String
      },
      certifications: [String]
    }, { timestamps: true });

    // Add slug generation middleware
    productSchema.pre('save', function(next) {
      if (this.isModified('name') || this.isNew) {
        this.slug = this.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6);
        this.slug = `${this.slug}-${timestamp}`;
      }
      next();
    });

    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

    // Clear existing products to avoid duplicates
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Add sample products
    for (const productData of sampleProducts) {
      const product = new Product({
        ...productData,
        category: category._id
      });
      await product.save();
      console.log(`✅ Added product: ${product.name} (ID: ${product._id})`);
    }

    console.log(`\n🎉 Successfully added ${sampleProducts.length} sample products!`);
    
    // Show summary
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    
    console.log('\n📊 Database Summary:');
    console.log(`Total products: ${totalProducts}`);
    console.log(`Active products: ${activeProducts}`);
    console.log(`Featured products: ${featuredProducts}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

console.log('🚀 Adding sample products to database...');
addSampleProducts();