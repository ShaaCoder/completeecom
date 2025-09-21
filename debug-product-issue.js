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
const dbName = envVars.MONGODB_DB_NAME || 'test';

async function debugProductIssue() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('URI:', uri ? 'Set' : 'Not set');
    console.log('DB Name:', dbName);
    if (uri) {
      console.log('URI (first 50 chars):', uri.substring(0, 50) + '...');
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📦 Collections found:', collections.map(c => c.name));
    
    // Check products collection
    if (collections.some(c => c.name === 'products')) {
      console.log('\n📦 Products collection exists');
      const products = db.collection('products');
      const count = await products.countDocuments();
      console.log('Total products:', count);
      
      if (count > 0) {
        console.log('\n📋 Sample products:');
        const samples = await products.find({}).limit(5).toArray();
        samples.forEach((product, index) => {
          console.log(`${index + 1}. ID: ${product._id}`);
          console.log(`   Name: ${product.name || 'N/A'}`);
          console.log(`   Price: ${product.price || 'N/A'}`);
          console.log(`   Active: ${product.isActive || 'N/A'}`);
        });
        
        // Check the problematic product ID
        const problematicId = '68ce5517c9fd28b841352f6e';
        console.log(`\n🔍 Checking for problematic product ID: ${problematicId}`);
        
        // Check if it's a valid ObjectId format
        const isValidObjectId = mongoose.Types.ObjectId.isValid(problematicId);
        console.log(`Valid ObjectId format: ${isValidObjectId}`);
        
        if (isValidObjectId) {
          const productByObjectId = await products.findOne({ 
            _id: new mongoose.Types.ObjectId(problematicId) 
          });
          console.log(`Product found by ObjectId: ${productByObjectId ? 'Yes' : 'No'}`);
          
          if (productByObjectId) {
            console.log('Product details:', {
              id: productByObjectId._id,
              name: productByObjectId.name,
              price: productByObjectId.price,
              isActive: productByObjectId.isActive
            });
          }
        }
        
        // Also try as string (though less likely)
        const productByString = await products.findOne({ _id: problematicId });
        console.log(`Product found by string ID: ${productByString ? 'Yes' : 'No'}`);
        
        // Check for any products with similar IDs
        console.log(`\n🔍 Looking for similar product IDs...`);
        const similarProducts = await products.find({
          _id: { $regex: problematicId.substring(0, 10) }
        }).toArray();
        console.log(`Products with similar IDs: ${similarProducts.length}`);
        
        // Check active products
        console.log(`\n📊 Product statistics:`);
        const activeCount = await products.countDocuments({ isActive: true });
        const inactiveCount = await products.countDocuments({ isActive: false });
        console.log(`Active products: ${activeCount}`);
        console.log(`Inactive products: ${inactiveCount}`);
        
      } else {
        console.log('❌ No products found in database');
        console.log('\n💡 This could be the root cause of the issue!');
        console.log('The checkout is trying to validate a product that doesn\'t exist.');
      }
    } else {
      console.log('❌ Products collection does not exist');
      console.log('\n💡 This is likely the root cause of the issue!');
      console.log('The database has no products collection.');
    }
    
    // Check other relevant collections
    console.log('\n🔍 Checking other collections:');
    for (const collection of ['users', 'orders', 'categories']) {
      if (collections.some(c => c.name === collection)) {
        const count = await db.collection(collection).countDocuments();
        console.log(`${collection}: ${count} documents`);
      } else {
        console.log(`${collection}: Collection doesn't exist`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

console.log('🚀 Starting MongoDB debug script...');
debugProductIssue();