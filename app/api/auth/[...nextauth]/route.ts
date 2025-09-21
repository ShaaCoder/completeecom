/**
 * NextAuth API Route Handler
 * 
 * Handles all NextAuth requests including Google OAuth flow
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/nextauth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };