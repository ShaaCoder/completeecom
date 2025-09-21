// Debug mock tracking function
function generateMockOrder(trackingNumber) {
  const now = new Date();
  const orderDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const shippedDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
  const expectedDelivery = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day from now
  
  return {
    _id: 'mock_' + trackingNumber,
    orderNumber: `ORD-${trackingNumber.slice(4)}`,
    userId: 'mock_user',
    status: 'shipped',
    paymentStatus: 'completed',
    paymentMethod: 'card',
    total: 2599,
    subtotal: 2299,
    shipping: 300,
    discount: 0,
    trackingNumber: trackingNumber,
    carrier: 'shiprocket',
    items: [
      {
        productId: 'mock_product_1',
        name: 'Premium Face Cream',
        price: 899,
        quantity: 1,
        image: '/placeholder-image.svg'
      },
      {
        productId: 'mock_product_2',
        name: 'Vitamin C Serum',
        price: 1400,
        quantity: 1,
        image: '/placeholder-image.svg'
      }
    ],
    shippingAddress: {
      name: 'John Demo Customer',
      address: '123 Demo Street, Test Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 9876543210'
    },
    createdAt: orderDate,
    updatedAt: now,
    confirmedAt: orderDate,
    shippedAt: shippedDate,
    expectedDeliveryAt: expectedDelivery,
    paymentAt: orderDate
  };
}

// Test the function
const mockOrder = generateMockOrder('MOCK1734568909123ABCD');
console.log('Mock order generated:', JSON.stringify(mockOrder, null, 2));