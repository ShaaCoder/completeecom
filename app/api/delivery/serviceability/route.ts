/**
 * Delivery Serviceability Check API
 * POST /api/delivery/serviceability
 */

import { NextRequest } from 'next/server';
import { deliveryPartner } from '@/lib/delivery';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromPincode, toPincode, weight, codAmount } = body;

    if (!fromPincode || !toPincode || !weight) {
      return createErrorResponse(
        'fromPincode, toPincode, and weight are required',
        400,
        'Validation Error'
      );
    }

    const serviceabilityResults = await deliveryPartner.checkServiceability(
      fromPincode,
      toPincode,
      parseFloat(weight),
      codAmount ? parseFloat(codAmount) : undefined
    );

    return createSuccessResponse(
      serviceabilityResults,
      'Serviceability check completed'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/delivery/serviceability');
  }
}