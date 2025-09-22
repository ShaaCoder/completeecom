/**
 * Order Tracking API
 * GET /api/orders/track/[trackingNumber]
 * 
 * Provides comprehensive order tracking information including:
 * - Order details and status
 * - Real-time delivery partner tracking
 * - Estimated delivery times
 * - Tracking history and timeline
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { deliveryPartner } from '@/lib/delivery';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError,
  withAuth,
  getClientIP,
  rateLimit 
} from '@/lib/api-helpers';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  // Check if user wants authenticated tracking or public tracking
  const { searchParams } = new URL(request.url);
  const isAuthenticated = searchParams.get('auth') === 'true';
  const orderNumber = searchParams.get('orderNumber'); // Alternative: track by order number + phone
  const phone = searchParams.get('phone');

  if (isAuthenticated) {
    // Use authentication for full tracking access
    return withAuth(async (req, currentUser) => {
      return getAuthenticatedTracking(params.trackingNumber, currentUser, req);
    })(request);
  } else {
    // Public tracking with limited information
    return getPublicTracking(params.trackingNumber, request, orderNumber, phone);
  }
}

// Authenticated tracking - full access for order owner/admin
async function getAuthenticatedTracking(
  trackingNumber: string,
  currentUser: any,
  request: NextRequest
) {
  try {
    await connectDB();
    
    if (!trackingNumber) {
      return createErrorResponse('Tracking number is required', 400, 'Validation Error');
    }

    // Rate limiting for authenticated users
    const clientIP = getClientIP(request);
    const rl = rateLimit(`auth_track_${currentUser._id}`, 60, 60000); // 60 requests per minute
    if (!rl.allowed) {
      return createErrorResponse('Too many tracking requests', 429, 'Rate limit exceeded');
    }

    // Find order by tracking number or generate mock data
    let order = await Order.findOne({ 
      trackingNumber: trackingNumber.toUpperCase() 
    }).lean();
    
    // If no order found and it's a mock tracking number, generate mock data
    if (!order && trackingNumber.toUpperCase().startsWith('MOCK')) {
      order = generateMockOrder(trackingNumber.toUpperCase()) as any;
    }
    
    if (!order) {
      return createErrorResponse('Order not found with this tracking number', 404, 'Not Found');
    }

    // Security check: Users can only track their own orders, admins can track all
    if (currentUser.role !== 'admin' && order.userId !== currentUser._id.toString()) {
      return createErrorResponse('You are not authorized to track this order', 403, 'Access Denied');
    }

    // Get full tracking information for authenticated users
    return getFullTrackingInfo(order, trackingNumber);
  } catch (error) {
    return handleApiError(error, 'GET /api/orders/track/[trackingNumber] (authenticated)');
  }
}

// Public tracking - limited information, requires verification
async function getPublicTracking(
  trackingNumber: string,
  request: NextRequest,
  orderNumber?: string | null,
  phone?: string | null
) {
  try {
    if (!trackingNumber) {
      return createErrorResponse('Tracking number is required', 400, 'Validation Error');
    }

    // Rate limiting for public tracking API (more restrictive)
    const clientIP = getClientIP(request);
    const rl = rateLimit(`public_track_${clientIP}`, 20, 60000); // 20 requests per minute
    if (!rl.allowed) {
      return createErrorResponse('Too many tracking requests', 429, 'Rate limit exceeded');
    }

    let order;
    
    // Method 1: Track by tracking number only (limited info)
    if (!orderNumber && !phone) {
      // Check if it's a mock tracking number first
      if (trackingNumber.toUpperCase().startsWith('MOCK')) {
        order = generateMockOrder(trackingNumber.toUpperCase()) as any;
      } else {
        // Only connect to DB for real tracking numbers
        await connectDB();
        order = await Order.findOne({ 
          trackingNumber: trackingNumber.toUpperCase() 
        }).lean();
      }
      
      if (!order) {
        return createErrorResponse('Order not found with this tracking number', 404, 'Not Found');
      }
      
      // Return very limited public information
      return getPublicTrackingInfo(order, trackingNumber);
    }
    
    // Method 2: Track by order number + phone verification
    if (orderNumber && phone) {
      // Check if it's a mock order first
      if (orderNumber.toUpperCase().startsWith('ORD-') && phone === '+91 9876543210') {
        // Generate mock tracking number from order number
        const mockTrackingNumber = 'MOCK' + orderNumber.slice(4).replace(/-/g, '');
        order = generateMockOrder(mockTrackingNumber) as any;
      } else {
        // Only connect to DB for real orders
        await connectDB();
        order = await Order.findOne({ 
          orderNumber: orderNumber,
          'shippingAddress.phone': phone
        }).lean();
      }
      
      if (!order) {
        return createErrorResponse('Order not found or phone number does not match', 404, 'Not Found');
      }
      
      // Return more detailed info for verified users
      return getVerifiedTrackingInfo(order, orderNumber);
    }
    
    return createErrorResponse('Invalid tracking request', 400, 'Validation Error');
  } catch (error) {
    return handleApiError(error, 'GET /api/orders/track/[trackingNumber] (public)');
  }
}

// Full tracking info for authenticated users
async function getFullTrackingInfo(order: any, trackingNumber: string) {
  // Get real-time tracking from delivery partner if available
  let liveTracking = null;
  let trackingError = null;
  
  try {
    if (order.carrier && order.trackingNumber) {
      liveTracking = await deliveryPartner.trackShipment(
        order.trackingNumber, 
        order.carrier as any
      );
    }
  } catch (error) {
    console.warn('Live tracking failed:', error);
    trackingError = 'Live tracking temporarily unavailable';
  }

  // Build comprehensive tracking response (full access)
  const trackingResponse = {
    order: {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      createdAt: order.createdAt?.toISOString(),
      expectedDeliveryAt: order.expectedDeliveryAt?.toISOString(),
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: item.price
      })),
      shippingAddress: {
        name: order.shippingAddress.name,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode
      }
    },
    tracking: {
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      currentStatus: liveTracking?.status || order.status,
      currentLocation: liveTracking?.currentLocation,
      estimatedDelivery: liveTracking?.estimatedDelivery || order.expectedDeliveryAt?.toISOString(),
      deliveredAt: liveTracking?.deliveredAt || order.deliveredAt?.toISOString(),
      lastUpdated: new Date().toISOString(),
      trackingUrl: getTrackingUrl(order.trackingNumber, order.carrier),
      isLiveTracking: !!liveTracking,
      trackingError
    },
    timeline: buildTrackingTimeline(order, liveTracking),
    deliveryInfo: {
      canReschedule: ['pending', 'confirmed', 'shipped'].includes(order.status),
      canCancel: ['pending', 'confirmed'].includes(order.status),
      requiresSignature: order.total > 5000,
      deliveryInstructions: getDeliveryInstructions(order),
      contactInfo: {
        customerCare: '+91-1800-123-4567',
        whatsapp: '+91-9876543210'
      }
    },
    accessLevel: 'full'
  };

  return createSuccessResponse(trackingResponse, 'Order tracking retrieved successfully');
}

// Limited public tracking info
async function getPublicTrackingInfo(order: any, trackingNumber: string) {
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

  return createSuccessResponse(publicResponse, 'Public order tracking retrieved');
}

// Verified tracking info (order number + phone)
async function getVerifiedTrackingInfo(order: any, trackingNumber: string) {
  // Moderate level of information for phone-verified users
  const verifiedResponse = {
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt?.toISOString(),
      expectedDeliveryAt: order.expectedDeliveryAt?.toISOString(),
      itemCount: order.items.length,
      shippingAddress: {
        name: order.shippingAddress.name,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode
      }
    },
    tracking: {
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      currentStatus: order.status,
      lastUpdated: new Date().toISOString(),
      trackingUrl: getTrackingUrl(order.trackingNumber, order.carrier)
    },
    timeline: buildTrackingTimeline(order, null),
    accessLevel: 'verified',
    message: 'Phone number verified. For complete details and live tracking, please log in.'
  };

  return createSuccessResponse(verifiedResponse, 'Verified order tracking retrieved');
}

// Basic timeline for public access
function buildBasicTimeline(order: any) {
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

// Helper function to build tracking timeline
function buildTrackingTimeline(order: any, liveTracking: any) {
  const timeline = [];

  // Order placed
  timeline.push({
    status: 'Order Placed',
    description: 'Your order has been received and confirmed',
    timestamp: order.createdAt?.toISOString(),
    completed: true,
    icon: 'check-circle',
    location: 'Online'
  });

  // Payment
  if (order.paymentAt || order.paymentStatus === 'completed') {
    timeline.push({
      status: 'Payment Confirmed',
      description: 'Payment has been processed successfully',
      timestamp: order.paymentAt?.toISOString() || order.createdAt?.toISOString(),
      completed: order.paymentStatus === 'completed',
      icon: 'credit-card',
      location: 'Payment Gateway'
    });
  }

  // Order confirmed
  if (order.confirmedAt || ['confirmed', 'shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Order Confirmed',
      description: 'Your order is being prepared for shipment',
      timestamp: order.confirmedAt?.toISOString() || order.createdAt?.toISOString(),
      completed: ['confirmed', 'shipped', 'delivered'].includes(order.status),
      icon: 'package',
      location: 'Fulfillment Center'
    });
  }

  // Shipped
  if (order.shippedAt || ['shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Shipped',
      description: `Package is on the way${order.expectedDeliveryAt ? ` - Expected delivery: ${new Date(order.expectedDeliveryAt).toLocaleDateString()}` : ''}`,
      timestamp: order.shippedAt?.toISOString(),
      completed: ['shipped', 'delivered'].includes(order.status),
      icon: 'truck',
      location: liveTracking?.currentLocation || 'In Transit'
    });
  }

  // Add live tracking history if available
  if (liveTracking?.trackingHistory) {
    liveTracking.trackingHistory.forEach((track: any, index: number) => {
      timeline.push({
        status: track.status,
        description: track.remarks || track.status,
        timestamp: track.timestamp,
        completed: true,
        icon: getIconForStatus(track.status),
        location: track.location,
        isLive: true
      });
    });
  }

  // Delivered
  if (order.deliveredAt || order.status === 'delivered') {
    timeline.push({
      status: 'Delivered',
      description: 'Package has been delivered successfully',
      timestamp: order.deliveredAt?.toISOString(),
      completed: order.status === 'delivered',
      icon: 'check-circle',
      location: 'Destination'
    });
  }

  // Sort timeline by timestamp
  return timeline
    .filter(item => item.timestamp)
    .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
}

// Helper function to get tracking URL
function getTrackingUrl(trackingNumber?: string, carrier?: string): string | undefined {
  if (!trackingNumber) return undefined;

  const urls: Record<string, string> = {
    shiprocket: `https://shiprocket.co/tracking/${trackingNumber}`,
    delhivery: `https://www.delhivery.com/track/package/${trackingNumber}`,
    bluedart: `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${trackingNumber}`,
    dtdc: `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${trackingNumber}`
  };

  return urls[carrier || 'shiprocket'];
}

// Helper function to get icon for status
function getIconForStatus(status: string): string {
  const iconMap: Record<string, string> = {
    'Order Placed': 'check-circle',
    'Payment Confirmed': 'credit-card',
    'Order Confirmed': 'package',
    'Picked Up': 'hand',
    'In Transit': 'truck',
    'Out for Delivery': 'map-pin',
    'Delivered': 'check-circle',
    'Shipped': 'truck',
    'Exception': 'alert-triangle'
  };

  return iconMap[status] || 'circle';
}

// Helper function to get delivery instructions
function getDeliveryInstructions(order: any): string[] {
  const instructions = [];

  if (order.total > 5000) {
    instructions.push('ID verification required for high-value delivery');
  }

  if (order.paymentMethod === 'cod') {
    instructions.push('Cash on Delivery - Please keep exact amount ready');
  }

  instructions.push('Please be available at the delivery address during business hours (9 AM - 7 PM)');
  instructions.push('In case of absence, package will be delivered to the nearest pickup point');

  return instructions;
}

// Generate mock order for testing
function generateMockOrder(trackingNumber: string) {
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
