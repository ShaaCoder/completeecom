/**
 * Delivery Tracking API
 * GET /api/delivery/track/[trackingNumber]
 * 
 * Real-time delivery partner tracking integration
 * Supports multiple delivery partners and provides live tracking updates
 */

import { NextRequest } from 'next/server';
import { deliveryPartner } from '@/lib/delivery';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError,
  getClientIP,
  rateLimit 
} from '@/lib/api-helpers';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const trackingNumber = params.trackingNumber;
    
    if (!trackingNumber) {
      return createErrorResponse('Tracking number is required', 400, 'Validation Error');
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const rl = rateLimit(`delivery_track_${clientIP}`, 20, 60000); // 20 requests per minute
    if (!rl.allowed) {
      return createErrorResponse('Too many tracking requests', 429, 'Rate limit exceeded');
    }

    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier') || 'shiprocket';

    try {
      // Get live tracking data from delivery partner
      const trackingData = await deliveryPartner.trackShipment(
        trackingNumber.toUpperCase(),
        carrier as any
      );

      // Enhance tracking data with additional information
      const enhancedTracking = {
        ...trackingData,
        trackingUrl: getCarrierTrackingUrl(trackingNumber, carrier),
        refreshedAt: new Date().toISOString(),
        nextUpdateIn: getNextUpdateInterval(trackingData.status),
        deliveryProgress: calculateDeliveryProgress(trackingData.status),
        customerActions: getAvailableActions(trackingData.status)
      };

      return createSuccessResponse(enhancedTracking, 'Tracking data retrieved successfully');

    } catch (error) {
      console.error('Live tracking error:', error);
      
      // Return mock data for development/testing
      const mockTracking = {
        awbNumber: trackingNumber,
        status: 'In Transit',
        currentLocation: 'Mumbai',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        trackingHistory: [
          {
            status: 'Order Placed',
            location: 'Mumbai',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Order received and processed'
          },
          {
            status: 'Picked Up',
            location: 'Mumbai',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Package picked up from warehouse'
          },
          {
            status: 'In Transit',
            location: 'Delhi',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: 'Package in transit to destination'
          }
        ],
        trackingUrl: getCarrierTrackingUrl(trackingNumber, carrier),
        refreshedAt: new Date().toISOString(),
        nextUpdateIn: 30 * 60 * 1000, // 30 minutes
        deliveryProgress: 60, // 60% complete
        customerActions: ['Contact Support', 'Reschedule Delivery'],
        isMockData: true
      };

      return createSuccessResponse(mockTracking, 'Mock tracking data (Live tracking temporarily unavailable)');
    }

  } catch (error) {
    return handleApiError(error, 'GET /api/delivery/track/[trackingNumber]');
  }
}

// Helper function to get carrier tracking URL
function getCarrierTrackingUrl(trackingNumber: string, carrier: string): string {
  const urls: Record<string, string> = {
    shiprocket: `https://shiprocket.co/tracking/${trackingNumber}`,
    delhivery: `https://www.delhivery.com/track/package/${trackingNumber}`,
    bluedart: `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${trackingNumber}`,
    dtdc: `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${trackingNumber}`
  };

  return urls[carrier] || urls.shiprocket;
}

// Helper function to determine next update interval
function getNextUpdateInterval(status: string): number {
  const intervals: Record<string, number> = {
    'Order Placed': 4 * 60 * 60 * 1000, // 4 hours
    'Picked Up': 2 * 60 * 60 * 1000, // 2 hours
    'In Transit': 1 * 60 * 60 * 1000, // 1 hour
    'Out for Delivery': 30 * 60 * 1000, // 30 minutes
    'Delivered': 0, // No more updates needed
    'Exception': 1 * 60 * 60 * 1000 // 1 hour
  };

  return intervals[status] || 2 * 60 * 60 * 1000; // Default 2 hours
}

// Helper function to calculate delivery progress percentage
function calculateDeliveryProgress(status: string): number {
  const progressMap: Record<string, number> = {
    'Order Placed': 10,
    'Picked Up': 30,
    'In Transit': 60,
    'Out for Delivery': 90,
    'Delivered': 100,
    'Exception': 50 // Partial progress with issues
  };

  return progressMap[status] || 0;
}

// Helper function to get available customer actions
function getAvailableActions(status: string): string[] {
  const actionMap: Record<string, string[]> = {
    'Order Placed': ['Cancel Order', 'Contact Support'],
    'Picked Up': ['Track Package', 'Contact Support'],
    'In Transit': ['Track Package', 'Reschedule Delivery', 'Contact Support'],
    'Out for Delivery': ['Track Package', 'Contact Support', 'Delivery Instructions'],
    'Delivered': ['Rate Order', 'Report Issue', 'Reorder'],
    'Exception': ['Contact Support', 'Track Package']
  };

  return actionMap[status] || ['Contact Support'];
}