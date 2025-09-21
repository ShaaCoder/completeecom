/**
 * Create Shipment API
 * POST /api/delivery/create-shipment
 */

import { NextRequest } from 'next/server';
import { deliveryPartner, type CreateShipmentRequest, type DeliveryProvider } from '@/lib/delivery';
import Order from '@/models/Order';
import connectDB from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-helpers';
import { validateObjectId } from '@/lib/validations';
import { emitOrderEvent } from '@/app/api/orders/stream/route';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
      const { orderId, provider = 'shiprocket' } = body as { orderId: string; provider?: DeliveryProvider };

    if (!orderId) {
      return createErrorResponse(
        'orderId is required',
        400,
        'Validation Error'
      );
    }

    // Get order details (by id or orderNumber)
    const byId = validateObjectId(orderId).isValid;
    const order = await (byId ? Order.findById(orderId) : Order.findOne({ orderNumber: orderId }));
    if (!order) {
      return createErrorResponse(
        'Order not found',
        404,
        'Not Found'
      );
    }

    // Prepare shipment request (pickup address will be determined by Shiprocket pickup location ID)
    const shipmentRequest: CreateShipmentRequest = {
      orderId: order.orderNumber,
      pickupAddress: {
        name: 'Home-1', // This matches the ACTIVE pickup location name in Shiprocket
        phone: '7835996416',
        email: 'kavinswebstudio@gmail.com',
        address: 'H-653 Gram sabha pooth kalan, sanjeevni hospital',
        city: 'North West Delhi',
        state: 'Delhi',
        pincode: '110086',
        country: 'India',
      },
      deliveryAddress: {
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        country: 'India',
      },
      items: order.items.map(item => ({
        name: item.name,
        sku: item.productId,
        quantity: item.quantity,
        price: item.price,
        weight: 100, // Default 100g per item if not specified
      })),
      paymentMode: order.paymentStatus === 'completed' ? 'prepaid' : 'cod',
      codAmount: 0,
      declaredValue: order.total,
      weight: Math.max(500, order.items.reduce((sum, it) => sum + (100 * it.quantity), 0)),
    };

    console.log('Creating shipment with provider:', provider);
    console.log('Shipment request:', JSON.stringify(shipmentRequest, null, 2));

    const result = await deliveryPartner.createShipment(shipmentRequest, provider as DeliveryProvider);

    console.log('Shipment result:', JSON.stringify(result, null, 2));

    if (result.success) {
      // Update order with shipment/tracking details
      const updated = await Order.findByIdAndUpdate(order._id, {
        $set: {
          status: 'shipped',
          trackingNumber: result.awbNumber,
          carrier: provider,
          shippedAt: new Date(),
          expectedDeliveryAt: result.estimatedDelivery ? new Date(result.estimatedDelivery) : undefined,
        }
      }, { new: true }).lean();

      // Emit SSE
      emitOrderEvent('updated', { id: updated?._id.toString(), orderNumber: updated?.orderNumber, status: updated?.status, trackingNumber: updated?.trackingNumber });

      return createSuccessResponse(result, 'Shipment created successfully');
    } else {
      console.error('Shipment creation failed:', result.error);
      return createErrorResponse(
        result.error || 'Shipment creation failed',
        400,
        'Shipment Error'
      );
    }
  } catch (error) {
    return handleApiError(error, 'POST /api/delivery/create-shipment');
  }
}