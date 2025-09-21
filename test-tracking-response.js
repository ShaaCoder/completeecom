// Test the mock tracking response structure
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

function getTrackingUrl(trackingNumber, carrier) {
  if (!trackingNumber) return undefined;

  const urls = {
    shiprocket: `https://shiprocket.co/tracking/${trackingNumber}`,
    delhivery: `https://www.delhivery.com/track/package/${trackingNumber}`,
    bluedart: `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${trackingNumber}`,
    dtdc: `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${trackingNumber}`
  };

  return urls[carrier || 'shiprocket'];
}

function buildBasicTimeline(order) {
  const timeline = [];

  timeline.push({
    status: 'Order Placed',
    description: 'Order received',
    timestamp: order.createdAt?.toISOString(),
    completed: true,
    icon: 'check-circle'
  });

  if (['confirmed', 'shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Order Confirmed',
      description: 'Order confirmed and being prepared',
      timestamp: order.confirmedAt?.toISOString() || order.createdAt?.toISOString(),
      completed: true,
      icon: 'package'
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Shipped',
      description: 'Package is on the way',
      timestamp: order.shippedAt?.toISOString(),
      completed: true,
      icon: 'truck'
    });
  }

  if (order.status === 'delivered') {
    timeline.push({
      status: 'Delivered',
      description: 'Package delivered',
      timestamp: order.deliveredAt?.toISOString(),
      completed: true,
      icon: 'check-circle'
    });
  }

  return timeline;
}

function getPublicTrackingInfo(order, trackingNumber) {
  // Very limited information for public access
  const publicResponse = {
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt?.toISOString(),
      estimatedDeliveryAt: order.expectedDeliveryAt?.toISOString()
    },
    tracking: {
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      currentStatus: order.status,
      lastUpdated: new Date().toISOString(),
      trackingUrl: getTrackingUrl(order.trackingNumber, order.carrier)
    },
    timeline: buildBasicTimeline(order),
    accessLevel: 'public',
    message: 'For full tracking details, please log in to your account'
  };

  return {
    success: true,
    data: publicResponse,
    message: 'Public order tracking retrieved'
  };
}

// Test the complete flow
console.log('🧪 Testing mock tracking API response...\n');

const trackingNumber = 'MOCK1734568909123ABCD';
const mockOrder = generateMockOrder(trackingNumber);
const response = getPublicTrackingInfo(mockOrder, trackingNumber);

console.log('✅ Mock order generated successfully');
console.log('📦 Order Number:', response.data.order.orderNumber);
console.log('📍 Status:', response.data.order.status);
console.log('🚚 Tracking Number:', response.data.tracking.trackingNumber);
console.log('🔗 Tracking URL:', response.data.tracking.trackingUrl);
console.log('⏰ Timeline Events:', response.data.timeline.length);
console.log('🔒 Access Level:', response.data.accessLevel);
console.log('\n📋 Full Response Structure:');
console.log(JSON.stringify(response, null, 2));