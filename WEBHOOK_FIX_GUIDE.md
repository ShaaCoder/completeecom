# 🔧 Webhook Configuration Fix Guide

## Problem
Payments are completing in Stripe but orders remain "pending" because webhooks aren't properly configured.

## Evidence Found
✅ **Email system is working** - Server logs show successful email sends
✅ **Webhook endpoint is accessible** - Returns proper 400 for signature verification
✅ **Order processing works** - Manual status updates trigger emails correctly

## Root Cause
Stripe webhook configuration issue - either wrong URL or wrong webhook secret.

## 🔍 Step 1: Check Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Login to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're in **Test mode** (not Live mode)

2. **Navigate to Webhooks**
   - Go to: **Developers** → **Webhooks**
   - Look for your webhook endpoint

3. **Verify Webhook URL**
   - The webhook URL should be: `https://yourdomain.com/api/payments/webhook`
   - For local testing: `http://localhost:3000/api/payments/webhook`
   
   ⚠️ **Common mistake**: Using `/api/webhook` instead of `/api/payments/webhook`

4. **Check Events**
   - Ensure these events are selected:
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`

## 🔑 Step 2: Update Webhook Secret

1. **Get Webhook Secret**
   - Click on your webhook in Stripe Dashboard
   - Click **"Reveal secret"** in the "Signing secret" section
   - Copy the secret (starts with `whsec_`)

2. **Update Environment Variables**
   - Create `.env.local` file in project root if it doesn't exist
   - Add/update this line:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
     ```

3. **Restart Your Server**
   ```powershell
   # Stop current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## 🧪 Step 3: Test with Stripe CLI (Recommended)

For local development, use Stripe CLI to forward webhooks:

1. **Install Stripe CLI**
   ```powershell
   # Download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```powershell
   stripe login
   ```

3. **Forward Webhooks to Local Server**
   ```powershell
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

4. **Test Payment**
   - Make a test payment in your app
   - Watch the Stripe CLI output
   - Check server logs for webhook processing

## 🔍 Step 4: Debug Webhook Delivery

If webhooks still aren't working:

1. **Check Webhook Logs in Stripe**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your webhook → View logs
   - Look for failed deliveries or error messages

2. **Check Server Logs**
   - Watch your Next.js server console
   - Look for webhook-related logs

3. **Test Webhook Endpoint Manually**
   ```powershell
   # Run this script to test endpoint:
   node simulate-webhook.js
   ```

## 🎯 Quick Fix for Local Testing

If you want to test immediately without fixing Stripe webhooks:

1. **Manual Order Status Update**
   - Go to your admin panel: http://localhost:3000/admin
   - Find a pending order
   - Change status to "confirmed"
   - Email should be sent automatically

2. **API Test**
   ```powershell
   # Test the confirmation email directly:
   Invoke-WebRequest -Uri "http://localhost:3000/api/debug/webhook-test" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{}"
   ```

## ✅ Expected Results After Fix

1. **Successful Payment Flow:**
   - Customer completes payment on Stripe
   - Stripe sends webhook to your server
   - Your server processes webhook
   - Order status changes to "confirmed"
   - Confirmation email is sent automatically
   - Customer receives email confirmation

2. **Server Logs Should Show:**
   ```
   Checkout session completed: cs_test_xxxxx
   Order NYKxxxxx confirmed and stock updated
   📧 Webhook: Sending order confirmation email for: NYKxxxxx
   ✅ Webhook: Confirmation email sent successfully for order: NYKxxxxx
   📨 Webhook: Message ID: <message-id@gmail.com>
   ```

## 🚨 Emergency Workaround

If you need to send confirmation emails for existing paid orders immediately:

```javascript
// Run this in your browser console on admin page:
fetch('/api/orders/send-confirmations', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log(data));
```

## 📞 Need Help?

If you're still having issues:
1. Check the webhook delivery logs in Stripe Dashboard
2. Share the exact error messages from server logs
3. Verify your `.env.local` has the correct webhook secret
4. Try using Stripe CLI for local testing

---

**Bottom Line**: Your email system is working perfectly! The issue is just Stripe webhook configuration. Fix the webhook URL and secret, and everything will work seamlessly.