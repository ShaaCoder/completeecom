/**
 * Authentication Utilities
 *
 * JWT token generation, validation, and authentication middleware
 * with refresh token support and security best practices
 */

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { IUserDocument } from '@/types/user';
import { env } from '@/lib/env';

// Token payload interface
export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Refresh token payload interface
export interface RefreshTokenPayload extends JwtPayload {
  userId: string;
  tokenVersion: number;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user: IUserDocument): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'beautymart-api',
    audience: 'beautymart-client',
  } as SignOptions);
}

/**
 * Generate JWT refresh token and store in MongoDB
 */
export async function generateRefreshToken(user: IUserDocument): Promise<string> {
  const payload: RefreshTokenPayload = {
    userId: user._id.toString(),
    tokenVersion: (user.tokenVersion || 0) + 1,
  };

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'beautymart-api',
    audience: 'beautymart-client',
  } as SignOptions);

  user.refreshToken = hashToken(refreshToken);
  user.tokenVersion = payload.tokenVersion;
  await user.save();

  return refreshToken;
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'beautymart-api',
      audience: 'beautymart-client',
    }) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify JWT refresh token
 */
export async function verifyRefreshToken(token: string, user: IUserDocument): Promise<RefreshTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'beautymart-api',
      audience: 'beautymart-client',
    }) as RefreshTokenPayload;

    if (!user.refreshToken || !verifyHashedToken(token, user.refreshToken)) {
      return null;
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): { token: string; expires: Date } {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return { token, expires };
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): { token: string; expires: Date } {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expires };
}

/**
 * Hash token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify hashed token
 */
export function verifyHashedToken(token: string, hashedToken: string): boolean {
  const hash = hashToken(token);

  // Convert both hashes into Uint8Array
  const a = new Uint8Array(Buffer.from(hash, "hex"));
  const b = new Uint8Array(Buffer.from(hashedToken, "hex"));

  // timingSafeEqual requires equal length
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration.getTime() < Date.now();
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return generateSecureToken(16);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password should contain at least one uppercase letter');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password should contain at least one lowercase letter');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Password should contain at least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Password should contain at least one special character');

  const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('Password is too common');
  }

  return { score, feedback, isValid: score >= 4 && feedback.length === 0 };
}

/**
 * Rate limiting for authentication attempts
 */
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkAuthRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const attempts = authAttempts.get(identifier);

  if (!attempts || now - attempts.lastAttempt > windowMs) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }

  if (attempts.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: attempts.lastAttempt + windowMs };
  }

  attempts.count += 1;
  attempts.lastAttempt = now;
  authAttempts.set(identifier, attempts);

  return { allowed: true, remaining: maxAttempts - attempts.count, resetTime: attempts.lastAttempt + windowMs };
}

export function clearAuthRateLimit(identifier: string): void {
  authAttempts.delete(identifier);
}

/**
 * Create or update Google OAuth user
 */
export async function createOrUpdateGoogleUser(googleUserData: {
  email: string;
  name: string;
  image?: string;
  googleId: string;
}): Promise<IUserDocument> {
  const User = (await import('@/models/User')).default;
  
  // Check if user already exists
  let user = await User.findOne({ email: googleUserData.email });
  
  if (user) {
    // Update existing user with Google OAuth info if not already set
    if (!user.oauthProvider) {
      user.oauthProvider = 'google';
      user.oauthId = googleUserData.googleId;
      user.avatar = googleUserData.image || user.avatar;
      user.isEmailVerified = true; // Google emails are verified
      await user.save();
    }
  } else {
    // Create new user
    const username = googleUserData.email.split('@')[0] || 'user';
    let uniqueUsername = username;
    let counter = 1;
    
    // Ensure username is unique
    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${username}${counter}`;
      counter++;
    }
    
    user = new User({
      name: googleUserData.name,
      username: uniqueUsername,
      email: googleUserData.email,
      oauthProvider: 'google',
      oauthId: googleUserData.googleId,
      avatar: googleUserData.image,
      isEmailVerified: true, // Google emails are verified
      role: 'customer',
    });
    
    await user.save();
  }
  
  return user;
}

/**
 * Find user by OAuth provider and ID
 */
export async function findUserByOAuth(provider: string, oauthId: string): Promise<IUserDocument | null> {
  const User = (await import('@/models/User')).default;
  return User.findOne({ oauthProvider: provider, oauthId });
}

/**
 * Generate JWT tokens for OAuth user
 */
export async function generateOAuthTokens(user: IUserDocument): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  
  return { accessToken, refreshToken };
}
