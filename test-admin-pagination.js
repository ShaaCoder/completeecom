// Test script to verify admin pagination fix
async function testAdminPagination() {
  try {
    console.log('🔍 Testing admin pagination...');
    
    // Test with different limits
    const testLimits = [50, 100, 200, 500];
    
    for (const limit of testLimits) {
      console.log(`\n📊 Testing with limit: ${limit}`);
      
      const response = await fetch(`http://localhost:3000/api/products?limit=${limit}&page=1`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`  ✅ Success: Got ${data.data.length} products`);
        console.log(`  📈 Total in DB: ${data.pagination.totalItems || data.pagination.total}`);
        console.log(`  📄 Total pages: ${data.pagination.totalPages}`);
        console.log(`  📊 Current page: ${data.pagination.currentPage}`);
      } else {
        console.log(`  ❌ Failed: ${data.message}`);
      }
    }
    
    // Test if we can get all 205+ products
    console.log(`\n🎯 Testing to get all products with limit 500:`);
    const allResponse = await fetch('http://localhost:3000/api/products?limit=500&page=1');
    const allData = await allResponse.json();
    
    if (allData.success) {
      console.log(`  ✅ Retrieved ${allData.data.length} out of ${allData.pagination.totalItems || allData.pagination.total} total products`);
      
      if (allData.data.length >= 200) {
        console.log('  🎉 SUCCESS: Admin can now see all products!');
      } else {
        console.log('  ⚠️  Still limited to fewer products than expected');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAdminPagination();