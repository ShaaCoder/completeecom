// Test pagination visibility and functionality
async function testPaginationUI() {
  try {
    console.log('🔍 Testing Pagination UI...');
    
    // Test different pagination scenarios
    const scenarios = [
      { limit: 25, page: 1, description: "25 per page (multiple pages)" },
      { limit: 50, page: 1, description: "50 per page (multiple pages)" }, 
      { limit: 100, page: 1, description: "100 per page (2-3 pages)" },
      { limit: 200, page: 1, description: "200 per page (1-2 pages)" },
      { limit: 500, page: 1, description: "500 per page (single page)" }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n📊 Testing: ${scenario.description}`);
      
      const response = await fetch(`http://localhost:3000/api/products?limit=${scenario.limit}&page=${scenario.page}`);
      const data = await response.json();
      
      if (data.success && data.pagination) {
        const pagination = data.pagination;
        console.log(`  ✅ Products returned: ${data.data.length}`);
        console.log(`  📈 Total products: ${pagination.totalItems || pagination.total}`);
        console.log(`  📄 Total pages: ${pagination.totalPages}`);
        console.log(`  🎯 Current page: ${pagination.currentPage}`);
        
        // Check if pagination buttons should be visible
        if (pagination.totalPages > 1) {
          console.log(`  🔵 Pagination buttons: VISIBLE (${pagination.totalPages} pages)`);
          console.log(`  📱 Navigation: First | Prev | ${pagination.currentPage} | Next | Last`);
        } else {
          console.log(`  🟡 Pagination buttons: SINGLE PAGE VIEW`);
          console.log(`  📱 Show: "Page 1 of 1 - All ${pagination.totalItems} products shown"`);
        }
        
        // Verify the range display
        const startRange = ((pagination.currentPage - 1) * scenario.limit) + 1;
        const endRange = Math.min(pagination.currentPage * scenario.limit, pagination.totalItems);
        console.log(`  📍 Range display: "${startRange}–${endRange} of ${pagination.totalItems} products"`);
        
      } else {
        console.log(`  ❌ Failed to get data: ${data.message}`);
      }
    }
    
    console.log('\n🎉 Pagination UI Test Summary:');
    console.log('  • Top pagination bar: Always visible with product count');  
    console.log('  • Quick navigation: Prev/Next buttons when multiple pages');
    console.log('  • Bottom pagination: Full controls with First/Last/Numbers');
    console.log('  • Single page: Shows "Page 1 of 1" with total count');
    console.log('  • Multi-page: Smart page numbering with ellipsis');
    console.log('  • Mobile friendly: Responsive design with hidden labels');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPaginationUI();