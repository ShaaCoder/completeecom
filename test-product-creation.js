const fetch = require('node-fetch');

// Test product creation
async function testProductCreation() {
  console.log('Testing product creation...');
  
  // First, let's get categories to see available options
  try {
    console.log('1. Fetching categories...');
    const categoriesResponse = await fetch('http://localhost:3000/api/categories');
    const categoriesData = await categoriesResponse.json();
    console.log('Categories response:', JSON.stringify(categoriesData, null, 2));
    
    if (!categoriesData.success || !categoriesData.data || categoriesData.data.length === 0) {
      console.log('No categories found! This might be the issue.');
      return;
    }
    
    const firstCategory = categoriesData.data[0];
    console.log('Using category:', firstCategory.name, 'with ID:', firstCategory.id);
    
    // Now test product creation
    console.log('2. Testing product creation...');
    const testProduct = {
      name: 'Test Product ' + Date.now(),
      description: 'This is a test product created to debug the issue',
      price: 99.99,
      originalPrice: 149.99,
      images: ['https://example.com/test-image.jpg'],
      category: firstCategory.id,
      subcategory: 'test-subcategory',
      brand: 'Test Brand',
      stock: 50,
      tags: ['test', 'debug'],
      features: ['Test feature 1', 'Test feature 2'],
      ingredients: ['Test ingredient'],
      isNew: true,
      isBestseller: false,
      isFeatured: false
    };
    
    console.log('Product data:', JSON.stringify(testProduct, null, 2));
    
    const productResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // This needs to be replaced with actual token
      },
      body: JSON.stringify(testProduct)
    });
    
    const productData = await productResponse.json();
    console.log('Product creation response:', JSON.stringify(productData, null, 2));
    
    if (productResponse.status !== 200) {
      console.error('Product creation failed with status:', productResponse.status);
      console.error('Response:', productData);
    } else {
      console.log('✅ Product created successfully!');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testProductCreation();