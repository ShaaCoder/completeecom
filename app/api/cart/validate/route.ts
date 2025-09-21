/**
 * Cart Validation API
 * 
 * POST /api/cart/validate - Validate cart items against database and return invalid items
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import Product from '@/models/Product';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ValidationRequest {
  items: CartItem[];
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: ValidationRequest = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return createErrorResponse(
        'Items array is required',
        400,
        'Validation Error'
      );
    }

    const validItems: CartItem[] = [];
    const invalidItems: Array<{
      productId: string;
      name: string;
      reason: string;
      originalItem: CartItem;
    }> = [];

    // Validate each cart item
    for (const item of items) {
      try {
        const product = await Product.findById(item.productId);

        if (!product) {
          invalidItems.push({
            productId: item.productId,
            name: item.name || 'Unknown Product',
            reason: 'Product no longer exists',
            originalItem: item
          });
          continue;
        }

        if (!product.isActive) {
          invalidItems.push({
            productId: item.productId,
            name: product.name,
            reason: 'Product is no longer available',
            originalItem: item
          });
          continue;
        }

        if (product.stock < item.quantity) {
          // For stock issues, we can potentially keep the item but adjust quantity
          if (product.stock > 0) {
            // Keep the item but with adjusted quantity
            validItems.push({
              ...item,
              quantity: product.stock,
              name: product.name,
              price: product.price,
              // Note: We update the item with current product data
            });
          } else {
            // No stock available, mark as invalid
            invalidItems.push({
              productId: item.productId,
              name: product.name,
              reason: 'Product is out of stock',
              originalItem: item
            });
          }
          continue;
        }

        // Item is valid, but update with current product data in case price changed
        validItems.push({
          ...item,
          name: product.name,
          price: product.price,
          // Keep the original quantity and image, but update name and price
        });

      } catch (error) {
        console.error(`Error validating product ${item.productId}:`, error);
        invalidItems.push({
          productId: item.productId,
          name: item.name || 'Unknown Product',
          reason: 'Error checking product availability',
          originalItem: item
        });
      }
    }

    return createSuccessResponse({
      validItems,
      invalidItems,
      summary: {
        totalItems: items.length,
        validCount: validItems.length,
        invalidCount: invalidItems.length,
        hasChanges: invalidItems.length > 0,
      }
    }, 'Cart validation completed');

  } catch (error) {
    return handleApiError(error, 'POST /api/cart/validate');
  }
}