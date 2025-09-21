# Email Setup Guide for Order Confirmations

This guide will help you set up Gmail SMTP for sending order confirmation emails when customers place orders.

## 🚀 Quick Setup

### 1. Gmail App Password Setup

Since we're using Gmail SMTP, you'll need to create an App Password:

1. **Enable 2-Factor Authentication** on your Gmail account (if not already enabled)
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → Turn on

2. **Generate App Password**
   - Go to Google Account Settings → Security
   - Under "2-Step Verification" → "App passwords"
   - Select "Mail" as the app
   - Copy the generated 16-character password

### 2. Environment Variables

Create or update your `.env` file with these variables:

```env
# Gmail SMTP Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Your E-commerce Store
EMAIL_FROM_ADDRESS=your-gmail@gmail.com

# Optional: Company branding
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ Important:** 
- Use your Gmail App Password, NOT your regular Gmail password
- Add your `.env` file to `.gitignore` to keep credentials secure

### 3. Test Your Setup

#### Option 1: Test SMTP Connection
```bash
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"testType": "connection"}'
```

#### Option 2: Send Test Email
```bash
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"testType": "send", "testEmail": "test@example.com"}'
```

## 🔧 Features Included

### ✅ Automatic Order Confirmation Emails
- Sent automatically when payment is confirmed
- Beautiful HTML template with order details
- Customer information and shipping address
- Order items with images and pricing
- Professional branding

### ✅ Email Tracking
- Track when emails are sent
- Prevent duplicate emails
- Email delivery timestamps in database

### ✅ Manual Email Sending
- Admin can manually send confirmation emails
- Force resend functionality
- Support for different email types

### ✅ Robust Error Handling
- Email failures don't affect payment processing
- Detailed logging for troubleshooting
- Rate limiting for API endpoints

## 📧 Email Templates

### Order Confirmation Email Includes:
- 🎉 Congratulatory header
- 📋 Complete order details
- 🛍️ Product images and descriptions
- 💰 Pricing breakdown
- 🏠 Shipping address
- 📞 Customer support links
- 📱 Mobile-responsive design

## 🔌 API Endpoints

### Test Email Configuration
```http
POST /api/admin/test-email
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "testType": "connection" // or "send"
  "testEmail": "test@example.com" // required for "send" type
}
```

### Manual Email Sending
```http
POST /api/orders/{order_id}/send-email
Content-Type: application/json
Authorization: Bearer {user_token}

{
  "emailType": "confirmation", // or "shipped"
  "force": false // set to true to resend
}
```

## 🛠️ Troubleshooting

### Common Issues:

1. **"Authentication failed" error**
   - Make sure you're using the App Password, not your regular Gmail password
   - Verify 2-factor authentication is enabled

2. **"Less secure app access" error**
   - This shouldn't happen with App Passwords, but if it does:
   - Enable "Less secure app access" in Gmail settings (not recommended)
   - Better: Use OAuth2 (advanced setup)

3. **Rate limiting issues**
   - Gmail has sending limits: 500 emails/day for free accounts
   - 2000 emails/day for Google Workspace accounts

4. **Template not found errors**
   - Ensure the email template file exists at `lib/email-templates/order-confirmation.html`
   - Check file permissions

### Debug Mode:
Check your server logs for detailed error messages. Email service errors are logged but don't break the payment flow.

## 🔒 Security Best Practices

1. **Never hardcode credentials** - Use environment variables
2. **Use App Passwords** - More secure than regular passwords
3. **Rate limiting** - Prevent email spam/abuse
4. **Input validation** - All email addresses are validated
5. **Error handling** - Graceful failure handling

## 📊 Email Analytics

Track email delivery status in your Order model:
- `confirmationEmailSent`: Boolean flag
- `confirmationEmailSentAt`: Timestamp
- `shippingEmailSent`: Boolean flag  
- `shippingEmailSentAt`: Timestamp

## 🎨 Customization

### Modify Email Templates:
- Edit `lib/email-templates/order-confirmation.html`
- Use Handlebars syntax for dynamic content
- Test changes with the test email endpoint

### Add New Email Types:
1. Create new template files
2. Add template configs in `lib/email-config.ts`
3. Add methods to `lib/email-service.ts`
4. Update API endpoints as needed

## 📝 Example Integration

The email system is already integrated into your payment flow. When a payment is confirmed:

```typescript
// In /api/payments/verify
if (paymentIntent.status === 'succeeded') {
  // Update order status
  order.status = 'confirmed';
  order.paymentStatus = 'completed';
  
  // Send confirmation email automatically
  await emailService.sendOrderConfirmation({
    // order details...
  });
}
```

## 🚀 Production Deployment

For production:
1. Set up environment variables on your hosting platform
2. Consider using a dedicated email service (SendGrid, AWS SES) for higher volume
3. Monitor email delivery rates and failures
4. Set up proper DNS records (SPF, DKIM) for better deliverability

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Test with the provided API endpoints
4. Ensure all environment variables are correctly set

**Happy emailing! 📬**