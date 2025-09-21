# Shiprocket Integration Setup Guide

## Overview
This e-commerce application uses **Shiprocket** as the primary delivery partner for order fulfillment and tracking.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Shiprocket Configuration (Primary Delivery Partner)
SHIPROCKET_EMAIL=your-shiprocket-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_PICKUP_LOCATION_ID=9924650

# Force Mock Mode (for development/testing)
FORCE_MOCK_DELIVERY=true
```

## Getting Shiprocket Credentials

1. **Sign up for Shiprocket Account**
   - Visit: https://www.shiprocket.in/
   - Create a seller account
   - Complete KYC verification

2. **Get API Credentials**
   - Login to Shiprocket dashboard
   - Go to Settings → API Settings
   - Generate API credentials
   - Copy your email and password

3. **Configure Pickup Address**
   - In Shiprocket dashboard, go to Settings → Pickup Address
   - Add your warehouse/fulfillment center address
   - Note the **Location ID** (e.g., "9924650") from the address details
   - Set this Location ID in your environment variables as `SHIPROCKET_PICKUP_LOCATION_ID`

## Features Available

### ✅ Admin Features
- **Create Shipment**: Generate Shiprocket shipments directly from order management
- **Serviceability Check**: Verify delivery to specific pincodes
- **Order Status Updates**: Automatically update order status when shipment is created
- **Tracking Integration**: Real-time tracking information

### ✅ User Features
- **Order Tracking**: Users can track their orders with Shiprocket AWB numbers
- **Delivery Timeline**: See estimated delivery dates and current status
- **Tracking History**: Complete delivery timeline with location updates

## Mock Mode (Development)

If Shiprocket credentials are not configured, the system automatically falls back to **mock mode**:
- Generates realistic AWB numbers
- Creates mock tracking information
- Updates order status as if real shipment was created
- Perfect for development and testing

## API Endpoints

### Create Shipment
```
POST /api/delivery/create-shipment
{
  "orderId": "ORDER123",
  "provider": "shiprocket"
}
```

### Check Serviceability
```
POST /api/delivery/serviceability
{
  "fromPincode": "400001",
  "toPincode": "110001",
  "weight": 500,
  "codAmount": 0
}
```

### Track Shipment
```
GET /api/delivery/track/[awb]
```

## Order Status Flow

1. **Order Placed** → Customer places order
2. **Payment Confirmed** → Payment processed
3. **Order Confirmed** → Admin confirms order
4. **Shipped** → Admin creates Shiprocket shipment
5. **In Transit** → Package picked up and in transit
6. **Out for Delivery** → Package out for delivery
7. **Delivered** → Package delivered to customer

## Troubleshooting

### Common Issues

1. **"Wrong Pickup location entered"**
   - This error occurs when Shiprocket credentials are configured but pickup location "Primary" doesn't exist
   - **Solution**: Add `FORCE_MOCK_DELIVERY=true` to your `.env.local` file
   - Or configure a proper pickup location in your Shiprocket dashboard

2. **"Shipment creation failed"**
   - Check if Shiprocket credentials are correct
   - Verify pickup address is configured in Shiprocket dashboard
   - Ensure order has valid shipping address

3. **"Serviceability check failed"**
   - Verify pincode format (6 digits)
   - Check if weight is reasonable (in grams)
   - Ensure pickup pincode is serviceable

4. **Mock mode not working**
   - Check console logs for error messages
   - Verify API endpoints are accessible
   - Ensure order data is valid

### Support

For Shiprocket-specific issues:
- Shiprocket Support: https://support.shiprocket.in/
- API Documentation: https://documentation.shiprocket.in/

For application issues:
- Check console logs for detailed error messages
- Verify environment variables are set correctly
- Ensure database connection is working
