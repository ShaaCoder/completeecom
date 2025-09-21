/**
 * Cart Cleanup Script
 * 
 * This script can be run in the browser console to clean up invalid cart items
 * or you can add it to your application to run automatically.
 */

// Function to clean cart in browser localStorage
function cleanLocalStorageCart() {
  const cartKey = 'cart-storage';
  
  try {
    const cartData = localStorage.getItem(cartKey);
    
    if (cartData) {
      const parsedData = JSON.parse(cartData);
      console.log('Current cart data:', parsedData);
      
      if (parsedData.state && parsedData.state.items) {
        const items = parsedData.state.items;
        console.log(`Found ${items.length} items in cart`);
        
        // List the problematic item
        const problematicProductId = '68ce5517c9fd28b841352f6e';
        const hasProblematicItem = items.some(item => item.productId === problematicProductId);
        
        if (hasProblematicItem) {
          console.log(`❌ Found problematic product ID: ${problematicProductId}`);
          
          // Remove the problematic item
          const cleanedItems = items.filter(item => item.productId !== problematicProductId);
          
          // Update cart data
          parsedData.state.items = cleanedItems;
          
          // Save back to localStorage
          localStorage.setItem(cartKey, JSON.stringify(parsedData));
          
          console.log(`✅ Removed problematic item. Cart now has ${cleanedItems.length} items`);
          console.log('Updated cart items:', cleanedItems);
        } else {
          console.log('✅ No problematic items found in cart');
        }
      } else {
        console.log('No cart items found');
      }
    } else {
      console.log('No cart data found in localStorage');
    }
  } catch (error) {
    console.error('Error cleaning cart:', error);
  }
}

// Function to validate cart items against the API
async function validateCartItems() {
  const cartKey = 'cart-storage';
  
  try {
    const cartData = localStorage.getItem(cartKey);
    
    if (!cartData) {
      console.log('No cart data found');
      return;
    }
    
    const parsedData = JSON.parse(cartData);
    const items = parsedData.state?.items || [];
    
    if (items.length === 0) {
      console.log('Cart is empty');
      return;
    }
    
    console.log(`Validating ${items.length} cart items...`);
    
    // Call the validation API
    const response = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      const { validItems, invalidItems, summary } = result.data;
      
      console.log(`📊 Validation Summary:`);
      console.log(`Total items: ${summary.totalItems}`);
      console.log(`Valid items: ${summary.validCount}`);
      console.log(`Invalid items: ${summary.invalidCount}`);
      
      if (invalidItems.length > 0) {
        console.log('❌ Invalid items found:');
        invalidItems.forEach(item => {
          console.log(`  - ${item.name} (${item.productId}): ${item.reason}`);
        });
        
        // Update cart with only valid items
        parsedData.state.items = validItems;
        localStorage.setItem(cartKey, JSON.stringify(parsedData));
        
        console.log('✅ Cart has been updated with valid items only');
        
        // Reload the page to reflect changes
        if (confirm('Cart has been cleaned up. Reload the page to see changes?')) {
          window.location.reload();
        }
      } else {
        console.log('✅ All cart items are valid');
      }
    } else {
      console.error('Validation failed:', result.message);
    }
    
  } catch (error) {
    console.error('Error validating cart:', error);
  }
}

// Export functions for use in console or application
if (typeof window !== 'undefined') {
  window.cleanLocalStorageCart = cleanLocalStorageCart;
  window.validateCartItems = validateCartItems;
  
  console.log('Cart cleanup functions available:');
  console.log('- cleanLocalStorageCart(): Remove specific problematic items');
  console.log('- validateCartItems(): Validate all items against API and clean up');
}

// For Node.js environment (if needed)
if (typeof module !== 'undefined') {
  module.exports = {
    cleanLocalStorageCart,
    validateCartItems
  };
}