/**
 * Real-Time Tracking Updates API
 * GET /api/tracking/live
 * 
 * Server-Sent Events (SSE) endpoint for real-time tracking updates
 * Provides live notifications when order status changes occur
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { deliveryPartner } from '@/lib/delivery';
import { getConnections, getStatusChangeMessage, getConnectionStatus, setConnectionStatus, deleteConnectionStatus } from '@/lib/tracking-utils';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const trackingNumber = searchParams.get('trackingNumber');

  if (!orderId && !trackingNumber) {
    return new Response('Order ID or tracking number is required', { status: 400 });
  }

  // Get connections map
  const connections = getConnections();

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${orderId || trackingNumber}-${Date.now()}`;
      connections.set(connectionId, controller);

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Real-time tracking connected',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Set up periodic tracking updates
      const interval = setInterval(async () => {
        try {
          await connectDB();
          
          // Find order
          const order = orderId 
            ? await Order.findById(orderId).lean()
            : await Order.findOne({ trackingNumber: trackingNumber?.toUpperCase() }).lean();

          if (!order) {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'error',
              message: 'Order not found',
              timestamp: new Date().toISOString()
            })}\n\n`);
            return;
          }

          // Get live tracking data if available
          let liveTracking = null;
          let hasUpdates = false;

          if (order.trackingNumber && order.carrier) {
            try {
              liveTracking = await deliveryPartner.trackShipment(
                order.trackingNumber,
                order.carrier as any
              );

              // Check if status has changed
              const lastKnownStatus = getConnectionStatus(`${connectionId}-status`);
              if (liveTracking.status !== lastKnownStatus) {
                setConnectionStatus(`${connectionId}-status`, liveTracking.status);
                hasUpdates = true;
              }
            } catch (error) {
              console.error('Live tracking fetch error:', error);
            }
          }

          // Send update if there are changes
          if (hasUpdates || !getConnectionStatus(`${connectionId}-initialized`)) {
            setConnectionStatus(`${connectionId}-initialized`, 'true');
            
            controller.enqueue(`data: ${JSON.stringify({
              type: 'tracking_update',
              data: {
                orderId: (order._id as any).toString(),
                orderNumber: order.orderNumber,
                status: order.status,
                trackingNumber: order.trackingNumber,
                carrier: order.carrier,
                liveTracking,
                lastUpdated: new Date().toISOString(),
                hasNewUpdate: hasUpdates
              },
              timestamp: new Date().toISOString()
            })}\n\n`);

            // Send specific status change notification
            if (hasUpdates && liveTracking) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'status_change',
                data: {
                  orderId: (order._id as any).toString(),
                  orderNumber: order.orderNumber,
                  newStatus: liveTracking.status,
                  location: liveTracking.currentLocation,
                  message: getStatusChangeMessage(liveTracking.status, liveTracking.currentLocation)
                },
                timestamp: new Date().toISOString()
              })}\n\n`);
            }
          }

          // Send heartbeat
          controller.enqueue(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);

        } catch (error) {
          console.error('SSE tracking update error:', error);
          controller.enqueue(`data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to fetch tracking update',
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      }, 30000); // Update every 30 seconds

      // Cleanup function
      const cleanup = () => {
        clearInterval(interval);
        connections.delete(connectionId);
        deleteConnectionStatus(`${connectionId}-status`);
        deleteConnectionStatus(`${connectionId}-initialized`);
      };

      // Handle connection close
      request.signal.addEventListener('abort', cleanup);
      
      // Set cleanup timeout (10 minutes)
      setTimeout(cleanup, 10 * 60 * 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

