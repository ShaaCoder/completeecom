/**
 * NextAuth Configuration
 * 
 * Custom NextAuth setup with Google OAuth provider
 * and integration with existing JWT authentication system
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import { env } from '@/lib/env';
import connectDB from '@/lib/mongodb';

const client = new MongoClient(env.MONGODB_URI);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow linking Google OAuth to an existing account with the same email.
      // Safe for Google since emails are verified; avoids OAuthAccountNotLinked errors.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn('[auth] Missing credentials');
            return null;
          }

// Ensure DB connection
          await connectDB();

          const email = String(credentials.email).toLowerCase();
          console.log('[auth] Attempting to find user:', email);
          
          const user = await User.findOne({ email, isActive: true }).select('+password');
          if (!user) {
            console.warn('[auth] User not found or inactive:', email);
            return null;
          }

          console.log('[auth] User found, checking password');
          const valid = await user.comparePassword(String(credentials.password));
          if (!valid) {
            console.warn('[auth] Invalid password for:', email);
            return null;
          }
          
          console.log('[auth] Password valid, updating last login');
          // Update last login
          user.lastLoginAt = new Date();
          await user.save();

          console.log('[auth] Login successful for:', email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatar,
            role: user.role,
          } as any;
        } catch (e) {
          console.error('[auth] authorize error:', e);
          return null;
        }
      },
    }),
  ],

  // Database adapter for session persistence
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: env.MONGODB_DB_NAME,
  }),

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours - extend session when user is active
  },

  // Account linking is handled in the callbacks

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        console.log('Google sign-in attempt for:', user.email);
        // Just allow the sign-in, we'll handle user creation in JWT callback
        return true;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      try {
// Ensure DB connection when needed
        await connectDB();

        // Handle Google OAuth: ensure user exists in our User collection
        if (account?.provider === 'google' && user) {
          let dbUser = await User.findOne({ email: token.email });
          if (!dbUser) {
            const usernameBase = token.email?.split('@')[0] || 'user';
            let uniqueUsername = usernameBase;
            let counter = 1;
            while (await User.findOne({ username: uniqueUsername })) {
              uniqueUsername = `${usernameBase}${counter++}`;
            }
            dbUser = new User({
              name: user.name,
              username: uniqueUsername,
              email: user.email,
              oauthProvider: 'google',
              oauthId: account.providerAccountId,
              avatar: user.image,
              isEmailVerified: true,
              role: 'customer',
            });
            await dbUser.save();
          } else {
            let needsUpdate = false;
            if (!dbUser.username) {
              const usernameBase = token.email?.split('@')[0] || 'user';
              let uniqueUsername = usernameBase;
              let counter = 1;
              while (await User.findOne({ username: uniqueUsername })) {
                uniqueUsername = `${usernameBase}${counter++}`;
              }
              dbUser.username = uniqueUsername;
              needsUpdate = true;
            }
            if (!dbUser.oauthProvider) {
              dbUser.oauthProvider = 'google';
              dbUser.oauthId = account.providerAccountId;
              dbUser.avatar = (user as any).image || dbUser.avatar;
              dbUser.isEmailVerified = true;
              needsUpdate = true;
            }
            if (needsUpdate) await dbUser.save();
          }

          const fullUser = await User.findOne({ email: token.email });
          if (fullUser) {
            (token as any).userId = fullUser._id.toString();
            (token as any).role = fullUser.role;
            (token as any).avatar = fullUser.avatar;
          }
        }

        // Handle credentials login: user object is present only on initial sign-in
        if (user && account?.provider === 'credentials') {
          (token as any).userId = (user as any).id;
          (token as any).role = (user as any).role;
          (token as any).avatar = (user as any).image;
          token.email = (user as any).email;
          token.name = (user as any).name;
        }
      } catch (error) {
        console.error('Error in JWT callback:', error);
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        (session.user as any).id = (token as any).userId as string;
        (session.user as any).role = (token as any).role as string;
        session.user.image = (token as any).avatar as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  events: {
    async signIn(message) {
      if (message.account?.provider === 'google') {
        try {
// Connect to MongoDB
          await connectDB();

          // Update last login
          await User.findOneAndUpdate(
            { email: message.user.email },
            { lastLoginAt: new Date() }
          );
        } catch (error) {
          console.error('Error updating last login:', error);
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 // 7 days to match session maxAge
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 // 1 hour for callback URL
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 24 hours for CSRF token
      }
    }
  },

  useSecureCookies: process.env.NODE_ENV === 'production',
};
