const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Test script to measure image upload performance
async function testImageUploadSpeed() {
  console.log('🧪 Testing optimized image upload speed...\n');
  
  const testImages = [
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d0b?w=800',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800'
  ];
  
  const results = [];
  
  for (const [index, imageUrl] of testImages.entries()) {
    console.log(`📥 Downloading test image ${index + 1}...`);
    
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    
    console.log(`📊 Original size: ${Math.round(imageBuffer.length / 1024)}KB`);
    
    const formData = new FormData();
    formData.append('images', imageBuffer, `test-image-${index + 1}.jpg`);
    formData.append('type', 'products');
    formData.append('optimization', 'balanced');
    
    console.log('⚡ Uploading with optimizations...');
    const startTime = Date.now();
    
    try {
      const uploadResponse = await fetch('http://localhost:3000/api/upload/images', {
        method: 'POST',
        body: formData,
        timeout: 30000
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }
      
      const result = await uploadResponse.json();
      const totalTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ Upload ${index + 1} completed in ${totalTime}ms`);
        console.log(`📈 Stats:`, result.stats);
        console.log(`🎯 Generated variants:`, result.images.length);
        console.log('─'.repeat(50));
        
        results.push({
          imageIndex: index + 1,
          originalSize: Math.round(imageBuffer.length / 1024),
          processingTime: totalTime,
          variants: result.images.length,
          stats: result.stats
        });
      } else {
        console.log(`❌ Upload ${index + 1} failed:`, result.error);
      }
    } catch (error) {
      console.log(`💥 Error uploading image ${index + 1}:`, error.message);
    }
    
    // Small delay between uploads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📋 PERFORMANCE SUMMARY');
  console.log('='.repeat(50));
  
  if (results.length > 0) {
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const totalVariants = results.reduce((sum, r) => sum + r.variants, 0);
    const avgOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0) / results.length;
    
    console.log(`🚀 Average upload time: ${Math.round(avgTime)}ms`);
    console.log(`📦 Total images processed: ${results.length}`);
    console.log(`🔄 Total variants generated: ${totalVariants}`);
    console.log(`📊 Average original size: ${Math.round(avgOriginalSize)}KB`);
    console.log(`⚡ Performance: ${Math.round(avgOriginalSize / (avgTime / 1000))}KB/s`);
    
    // Performance rating
    if (avgTime < 2000) {
      console.log('🏆 EXCELLENT: Ultra-fast upload speed!');
    } else if (avgTime < 5000) {
      console.log('⭐ GOOD: Fast upload speed');
    } else if (avgTime < 10000) {
      console.log('👌 OKAY: Acceptable upload speed');
    } else {
      console.log('⚠️  SLOW: Consider optimization');
    }
  }
  
  console.log('\n✨ Test completed!');
}

// Performance tips
function showOptimizationTips() {
  console.log('\n💡 PERFORMANCE OPTIMIZATION TIPS:');
  console.log('─'.repeat(50));
  console.log('1. Use WebP format for 25-35% smaller file sizes');
  console.log('2. Enable parallel processing (already implemented)');
  console.log('3. Use appropriate optimization levels:');
  console.log('   • fast: For quick uploads, basic optimization');
  console.log('   • balanced: Good balance of speed and quality');
  console.log('   • quality: Best quality, slower processing');
  console.log('4. Ensure adequate server resources (CPU/RAM)');
  console.log('5. Consider CDN for image delivery');
}

// Run the test
if (require.main === module) {
  testImageUploadSpeed()
    .then(() => {
      showOptimizationTips();
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
    });
}

module.exports = { testImageUploadSpeed };