// app/api/orders/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { createSuccessResponse, createErrorResponse, handleApiError, getClientIP, rateLimit } from '@/lib/api-helpers';
import { emitOrderEvent } from '@/lib/sse';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return createErrorResponse(
        'Authentication required',
        401,
        'Unauthorized'
      );
    }

    // Get user from database using session info
    const currentUser = await User.findOne({ 
      email: session.user.email 
    }).select('-password');

    if (!currentUser) {
      return createErrorResponse(
        'User not found',
        404,
        'Not Found'
      );
    }
    const clientIP = getClientIP(request);
    const rl = rateLimit(`orders_list_${clientIP}`, 60, 60000);
    if (!rl.allowed) {
      return createErrorResponse('Too many requests', 429, 'Rate limit exceeded');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const mine = searchParams.get('mine') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;

    // Permissions: admin sees all; user sees only own or when mine=true
    if (currentUser.role !== 'admin') {
      filter.userId = currentUser._id.toString();
    } else if (mine) {
      filter.userId = currentUser._id.toString();
    }

      const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Order.countDocuments(filter)
      ]);

      const formattedOrders = orders.map((order: any) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt?.toISOString(),
        updatedAt: order.updatedAt?.toISOString(),
        paymentAt: order.paymentAt ? order.paymentAt.toISOString() : undefined,
        confirmedAt: order.confirmedAt ? order.confirmedAt.toISOString() : undefined,
        shippedAt: order.shippedAt ? order.shippedAt.toISOString() : undefined,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : undefined,
        expectedDeliveryAt: order.expectedDeliveryAt ? order.expectedDeliveryAt.toISOString() : undefined,
      }));

    return createSuccessResponse(formattedOrders, `Retrieved ${formattedOrders.length} orders`, {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
      nextPage: page * limit < total ? page + 1 : undefined,
      prevPage: page > 1 ? page - 1 : undefined,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/orders');
  }
}

// Optional: POST create order (admin manual create) – emits SSE
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return createErrorResponse(
        'Authentication required',
        401,
        'Unauthorized'
      );
    }

    // Get user from database using session info
    const currentUser = await User.findOne({ 
      email: session.user.email 
    }).select('-password');

    if (!currentUser) {
      return createErrorResponse(
        'User not found',
        404,
        'Not Found'
      );
    }

    if (currentUser.role !== 'admin') {
      return createErrorResponse('Insufficient permissions', 403, 'Authorization Error');
    }

    const body = await request.json();
    const order = await Order.create(body);
    const formatted = {
      id: String(order._id),
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt?.toISOString(),
      updatedAt: order.updatedAt?.toISOString(),
    } as const;

    emitOrderEvent('created', { id: formatted.id, orderNumber: formatted.orderNumber, status: formatted.status });

    return createSuccessResponse(formatted, 'Order created');
  } catch (error) {
    return handleApiError(error, 'POST /api/orders');
  }
}
