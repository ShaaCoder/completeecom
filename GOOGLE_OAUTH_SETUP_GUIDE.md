# Google OAuth Setup Guide

## Overview
This guide will help you complete the Google OAuth integration for customer sign-in in your e-commerce application.

## What's Been Implemented

### ✅ Completed Features:
1. **Dependencies Installed**: NextAuth and MongoDB adapter
2. **User Model Updated**: Added Google OAuth support fields
3. **NextAuth Configuration**: Custom setup with Google provider
4. **API Routes**: NextAuth API handlers for OAuth flow
5. **Authentication Library**: Extended with Google OAuth functions
6. **UI Components**: Google Sign-In button added to login form
7. **Type Safety**: NextAuth TypeScript declarations

### 🔧 Components Created/Modified:
- `lib/nextauth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - API route handler  
- `models/User.ts` - Updated for OAuth support
- `types/user.ts` - Updated user types
- `types/next-auth.d.ts` - TypeScript declarations
- `components/auth/login-form.tsx` - Added Google Sign-In button
- `components/auth-provider.tsx` - Added SessionProvider
- `lib/auth.ts` - Added OAuth helper functions

## Setup Steps

### 1. Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 2. Update Environment Variables
Replace the placeholder values in your `.env` file:
```env
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

### 3. Test the Integration
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Click "Continue with Google" button
4. Complete Google OAuth flow
5. Verify user is created/updated in MongoDB
6. Check that user is redirected to profile page

## How Google OAuth Works

### Authentication Flow:
1. **User clicks "Continue with Google"**
2. **Redirected to Google** for consent
3. **Google redirects back** with authorization code
4. **NextAuth exchanges code** for user info
5. **User created/updated** in MongoDB
6. **JWT tokens generated** for session
7. **User redirected** to profile page

### User Creation Process:
- **New users**: Automatically created with Google data
- **Existing users**: Updated with Google OAuth info if not already linked
- **Username generation**: Auto-generated from email (e.g., john.doe@gmail.com → john.doe)
- **Email verification**: Automatically verified for Google users
- **Default role**: Customer

## Database Changes

### New User Fields:
```typescript
{
  oauthProvider: 'google' | null,
  oauthId: string, // Google user ID
  avatar: string, // Google profile picture URL
  tokenVersion: number, // For refresh token management
  password?: string, // Optional for OAuth users
}
```

## Testing Checklist

### ✅ Manual Tests:
1. **New Google User Sign-In**
   - [ ] User created in database
   - [ ] Correct user data populated
   - [ ] Redirected to profile page
   - [ ] Session maintained

2. **Existing Email Google Sign-In**
   - [ ] Existing user updated with OAuth info
   - [ ] No duplicate users created
   - [ ] Previous data preserved

3. **Session Management**
   - [ ] User stays logged in after page refresh
   - [ ] Logout works correctly
   - [ ] Tokens properly managed

4. **UI/UX**
   - [ ] Google button appears correctly
   - [ ] Loading states work
   - [ ] Error handling works
   - [ ] Success messages shown

## Security Features

### Implemented Security:
- **Secure token generation** with existing JWT system
- **Rate limiting** for authentication attempts  
- **Token versioning** for refresh token invalidation
- **Email verification** automatic for Google users
- **Proper session management** with NextAuth

## Troubleshooting

### Common Issues:

1. **Google OAuth Error**: Check client ID/secret in .env
2. **Redirect URI Mismatch**: Ensure URIs match in Google Console
3. **MongoDB Connection**: Verify database connection string
4. **Token Issues**: Check JWT secrets are configured
5. **Type Errors**: Ensure TypeScript declarations are loaded

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Check MongoDB for user creation
4. Test API endpoints directly
5. Check NextAuth debug logs (enabled in dev)

## Next Steps

### Optional Enhancements:
1. **Add more OAuth providers** (Facebook, Apple, etc.)
2. **Account linking UI** for users with multiple login methods
3. **Social profile sync** to update user info from Google
4. **Enhanced error pages** for OAuth failures
5. **Admin panel integration** for OAuth user management

## Production Deployment

### Before Going Live:
1. **Update redirect URIs** in Google Console
2. **Set production environment variables**
3. **Test OAuth flow** on production domain
4. **Configure HTTPS** (required for OAuth)
5. **Monitor error rates** and user feedback

---

Your Google OAuth integration is now ready! Users can easily sign in with their Google accounts, making the registration process much smoother for customers. 🎉