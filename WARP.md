# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

BeautyMart is a full-stack e-commerce application specializing in beauty and cosmetics products. Built with Next.js 13 (App Router), TypeScript, MongoDB, and modern React patterns.

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **UI Components**: Radix UI primitives, Shadcn/ui components
- **State Management**: Zustand (cart), React Context (auth)
- **Payment**: Stripe integration with multiple payment methods
- **Delivery**: Shiprocket API integration with mock fallback
- **Validation**: Zod schemas throughout
- **Styling**: Tailwind CSS with CSS variables for theming

## Architecture

### Core Application Structure

```
app/                    # Next.js 13 App Router
├── api/               # API routes (serverless functions)
├── auth/              # Authentication pages
├── cart/              # Cart management
├── checkout/          # Order placement flow
├── orders/            # Order management and tracking
├── products/          # Product catalog
└── admin/             # Admin dashboard

lib/                   # Core utilities and configuration
├── mongodb.ts         # MongoDB connection with pooling
├── cart-store.ts      # Zustand cart state management
├── auth.ts            # JWT authentication utilities
├── validations.ts     # Zod validation schemas
├── stripe.ts          # Stripe payment configuration
└── delivery.ts        # Shiprocket/mock delivery system

components/            # Reusable React components
├── ui/                # Shadcn/ui base components
├── auth-provider.tsx  # Authentication context
├── product-card.tsx   # Product display components
└── checkout-*.tsx     # Checkout flow components

types/                 # TypeScript type definitions
├── index.ts           # Core types (Product, User, Order)
├── api.ts             # API response types
└── *.ts               # Domain-specific types
```

### Data Flow Architecture

1. **Frontend State**: Client-side cart (Zustand) + Authentication context
2. **API Layer**: Next.js API routes handle business logic and MongoDB operations
3. **Database**: MongoDB with Mongoose models and validation
4. **External Services**: Stripe (payments) + Shiprocket (delivery) with mock fallbacks

### Key Integration Points

- **Payment Flow**: Cart → Stripe Checkout Session → Webhook verification → Order creation
- **Order Management**: Order creation → Shiprocket shipment → Status tracking → Delivery updates
- **Authentication**: JWT-based with secure HTTP-only patterns
- **Validation**: End-to-end Zod schemas from frontend forms to database operations

## Common Development Commands

### Development Server
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Database Operations
```bash
npm run seed         # Seed database with sample data (uses scripts/seed-database.ts)
```

### Development Workflow
```bash
# Install dependencies
npm install

# Set up environment variables (see setup files)
# Copy .env.local.example to .env.local and configure

# Start development
npm run dev
```

## Environment Setup

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/beautymart
MONGODB_DB_NAME=beautymart

# Authentication
JWT_SECRET=your-jwt-secret-key

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shiprocket Delivery
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-password
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_PICKUP_LOCATION_ID=9924650

# Optional: Force mock delivery for development
FORCE_MOCK_DELIVERY=true

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup References
- Payment setup: See `STRIPE_SETUP.md` for complete Stripe configuration
- Delivery setup: See `SHIPROCKET_SETUP.md` for Shiprocket integration details

## Code Patterns and Conventions

### API Routes Pattern
```typescript
// Standard API response format
export async function GET() {
  try {
    await connectDB();
    // business logic
    return NextResponse.json({ data, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Validation Pattern
```typescript
// All inputs validated with Zod schemas from lib/validations.ts
const validation = userValidation.create(data);
if (!validation.isValid) {
  return NextResponse.json({ errors: validation.errors }, { status: 400 });
}
```

### State Management
- **Cart**: Zustand store with localStorage persistence (`lib/cart-store.ts`)
- **Auth**: React Context with JWT tokens (`components/auth-provider.tsx`)
- **Server State**: Direct API calls, no additional cache layer

### Component Architecture
- UI components use Shadcn/ui base components with Radix primitives
- Business components in `/components` directory
- Page-specific components co-located with pages
- Reusable hooks in `/hooks` directory

## Payment System Architecture

### Supported Payment Methods
- Credit/Debit Cards (via Stripe)
- UPI (PhonePe, Google Pay, Paytm)
- Net Banking
- Wallets
- Cash on Delivery (COD)

### Payment Flow
1. Cart → Checkout form with address/payment selection
2. Stripe: Creates checkout session → Redirects to Stripe → Webhook handles completion
3. COD: Direct order creation in database
4. All payments: Order status updates + inventory management

## Delivery System Architecture

### Primary: Shiprocket Integration
- Real shipment creation with tracking
- Serviceability checks for pincodes
- Automatic order status updates
- Live tracking information

### Fallback: Mock Delivery System
- Activated when Shiprocket credentials missing or `FORCE_MOCK_DELIVERY=true`
- Generates realistic AWB numbers and tracking data
- Perfect for development and testing

## Key API Endpoints

### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/[slug]` - Product details
- `GET /api/categories` - Product categories

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user profile

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - User's order history
- `GET /api/orders/[id]` - Order details

### Payments
- `POST /api/payments/create-checkout` - Create Stripe session
- `POST /api/payments/webhook` - Handle Stripe webhooks
- `POST /api/payments/verify` - Verify payment completion

### Delivery
- `POST /api/delivery/create-shipment` - Create shipment
- `POST /api/delivery/serviceability` - Check delivery availability
- `GET /api/delivery/track/[awb]` - Track shipment

## Database Schema Patterns

### Collections
- `users` - User accounts and addresses
- `products` - Product catalog with categories
- `orders` - Order history and status
- `categories` - Product categorization

### Key Features
- ObjectId validation throughout
- Comprehensive error handling
- Connection pooling with automatic reconnection
- Graceful shutdown handling

## Development Notes

### Mock vs Production Modes
- Payment: Always use test keys in development
- Delivery: Use `FORCE_MOCK_DELIVERY=true` for local development
- Database: Use local MongoDB or development cluster

### Testing Payment Flow
- Stripe test cards: `4242 4242 4242 4242` (success)
- Test UPI: `success@razorpay`
- COD orders work without external dependencies

### Common Debugging
- Check MongoDB connection in `/api/health/database`
- Verify environment variables in `/api/health/api`
- Test payment setup in `/api/health/payment`
- Check delivery integration in `/api/health/delivery`

### Performance Considerations
- MongoDB connection is pooled and cached globally
- Static images should be optimized (consider Next.js Image component)
- API routes include proper error boundaries
- Cart state persists in localStorage for better UX