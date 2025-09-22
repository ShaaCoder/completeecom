/**
 * Debug Order Email API
 * 
 * POST /api/debug/test-order-email - Test order confirmation email with mock data
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth
} from '@/lib/api-helpers';
import Order from '@/models/Order';
import User from '@/models/User';
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  return withAuth(async (req, currentUser) => {
    try {
      await connectDB();

      const body = await req.json();
      const { orderId, useRealOrder = false } = body;

      console.log('🐛 Debug: Starting test order email');
      console.log('🐛 Debug: Current user:', { id: currentUser._id, email: currentUser.email, name: currentUser.name });

      if (useRealOrder && orderId) {
        // Use real order from database
        const order = await Order.findById(orderId);
        if (!order) {
          return createErrorResponse('Order not found', 404, 'Not Found');
        }

        const customer = await User.findById(order.userId).select('name email');
        if (!customer) {
          return createErrorResponse('Customer not found', 404, 'Not Found');
        }

        console.log('🐛 Debug: Using real order:', order.orderNumber);
        console.log('🐛 Debug: Customer:', { name: customer.name, email: customer.email });

        const emailSent = await emailService.sendOrderConfirmation({
          orderId: (order._id as any).toString(),
          orderNumber: order.orderNumber,
          orderDate: order.createdAt.toISOString(),
          customerEmail: customer.email,
          customerName: customer.name,
          items: order.items.map(item => ({
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            variant: item.variant,
          })),
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          shippingAddress: order.shippingAddress,
        });

        return createSuccessResponse({
          emailSent,
          orderNumber: order.orderNumber,
          customerEmail: customer.email,
        }, emailSent ? 'Test email sent successfully' : 'Failed to send test email');

      } else {
        // Use mock order data
        console.log('🐛 Debug: Using mock order data');
        
        const mockOrderData = {
          orderId: 'mock-order-id',
          orderNumber: 'ORD-TEST-' + Date.now(),
          orderDate: new Date().toISOString(),
          customerEmail: currentUser.email, // Use current user's email
          customerName: currentUser.name,
          items: [
            {
              name: 'Test Product 1',
              image: 'https://via.placeholder.com/150',
              price: 999,
              quantity: 1,
              variant: 'Red/Large',
            },
            {
              name: 'Test Product 2',
              image: 'https://via.placeholder.com/150',
              price: 1499,
              quantity: 2,
            },
          ],
          subtotal: 3997,
          shipping: 100,
          discount: 0,
          total: 4097,
          shippingAddress: {
            name: currentUser.name,
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            phone: '9876543210',
          },
        };

        console.log('🐛 Debug: Mock order data:', mockOrderData);

        const emailSent = await emailService.sendOrderConfirmation(mockOrderData);

        return createSuccessResponse({
          emailSent,
          orderNumber: mockOrderData.orderNumber,
          customerEmail: mockOrderData.customerEmail,
          mockData: true,
        }, emailSent ? 'Mock test email sent successfully' : 'Failed to send mock test email');
      }

    } catch (error) {
      console.error('🐛 Debug: Error in test-order-email:', error);
      return handleApiError(error, 'POST /api/debug/test-order-email');
    }
  }, ['customer', 'admin'])(request);
}