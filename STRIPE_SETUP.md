# Stripe Payment Integration Setup

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Your Stripe Keys

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get API Keys**: 
   - Go to Dashboard → Developers → API Keys
   - Copy the "Publishable key" (starts with `pk_test_`)
   - Copy the "Secret key" (starts with `sk_test_`)
3. **Set up Webhook**:
   - Go to Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret (starts with `whsec_`)

## Features Implemented

### ✅ Payment Methods
- **Credit/Debit Cards** (Visa, Mastercard, American Express)
- **UPI** (PhonePe, Google Pay, Paytm)
- **Net Banking** (All major Indian banks)
- **Wallets** (Paytm, PhonePe, etc.)
- **Cash on Delivery** (COD)

### ✅ API Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/verify` - Verify payment completion
- `POST /api/payments/create-checkout` - Create checkout session
- `POST /api/payments/webhook` - Handle Stripe webhooks

### ✅ Frontend Components
- `StripeCheckout` - Simple checkout with redirect to Stripe
- `StripePayment` - Embedded payment form (requires additional setup)
- Updated checkout page with Stripe integration
- Order success page with payment verification

## How It Works

1. **Customer selects payment method** (Card/UPI via Stripe or COD)
2. **For Stripe payments**:
   - Creates a checkout session with order details
   - Redirects to Stripe's secure payment page
   - Customer completes payment on Stripe
   - Redirects back to success page
3. **For COD**:
   - Creates order directly in database
   - No payment processing required
4. **Webhook handles**:
   - Payment completion
   - Order status updates
   - Stock management

## Testing

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test UPI IDs
- `success@razorpay`
- `failure@razorpay`

## Security Features

- ✅ Webhook signature verification
- ✅ Rate limiting on all endpoints
- ✅ Authentication required for payments
- ✅ Secure key management
- ✅ PCI compliance (handled by Stripe)

## Next Steps

1. Add your Stripe keys to `.env.local`
2. Test the payment flow
3. Set up webhook endpoint in Stripe dashboard
4. Test with real payment methods
5. Deploy and configure production keys

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe India Guide](https://stripe.com/docs/payments/india)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
