/**
 * MongoDB Connection Utility
 * 
 * This module provides a robust MongoDB connection using Mongoose with:
 * - Connection pooling for optimal performance
 * - Automatic reconnection with exponential backoff
 * - Comprehensive error handling and retry logic
 * - Connection state management and monitoring
 * - Production-ready configuration
 */

import mongoose from 'mongoose';
import { env } from '@/lib/env';

// Define connection interface for type safety
interface MongoConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global connection cache to prevent multiple connections in development
declare global {
  var mongoose: MongoConnection | undefined;
}

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

if (!MONGODB_DB_NAME) {
  throw new Error(
    'Please define the MONGODB_DB_NAME environment variable inside .env.local'
  );
}

// Connection options for optimal performance and reliability
const options: mongoose.ConnectOptions = {
  dbName: MONGODB_DB_NAME, // Ensure consistent DB selection
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 15, // Increased pool size for better performance
  serverSelectionTimeoutMS: 10000, // Increased timeout for better reliability
  socketTimeoutMS: 60000, // Increased socket timeout
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: 'majority',
  maxIdleTimeMS: 60000, // Increased idle time
  minPoolSize: 3, // Maintain more connections
  heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
  maxStalenessSeconds: 90, // Allow slightly stale reads for better performance
  compressors: 'zlib', // Enable compression for network efficiency
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection caching and error handling
 * Implements exponential backoff for connection retries
 * @param retryAttempt - Current retry attempt number
 * @returns Promise<typeof mongoose> - Mongoose connection instance
 */
async function connectDB(retryAttempt = 0): Promise<typeof mongoose> {
  // Return existing connection if available and healthy
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  // Clear stale connection
  if (cached!.conn && mongoose.connection.readyState !== 1) {
    cached!.conn = null;
    cached!.promise = null;
  }

  // Create new connection if no cached promise exists
  if (!cached!.promise) {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second
    
    cached!.promise = mongoose.connect(MONGODB_URI!, options).then((mongoose) => {
      
      // Enhanced connection event handlers for monitoring
      mongoose.connection.on('connected', () => {
        console.log('🟢 MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        console.error('🔴 MongoDB connection error:', err);
        // Don't exit process, let it retry
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('🟡 MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🟢 MongoDB reconnected successfully');
      });

      mongoose.connection.on('connecting', () => {
        console.log('🟡 MongoDB connecting...');
      });

      mongoose.connection.on('close', () => {
        console.log('🔴 MongoDB connection closed');
      });

      // Graceful shutdown handlers
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await mongoose.connection.close();
        process.exit(0);
      });

      return mongoose;
    }).catch(async (error) => {
      cached!.promise = null; // Reset promise on failure
      
      if (retryAttempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryAttempt); // Exponential backoff
        console.warn(`🔄 MongoDB connection failed (attempt ${retryAttempt + 1}/${maxRetries}). Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return connectDB(retryAttempt + 1);
      }
      
      console.error('🔴 MongoDB connection failed after all retry attempts');
      throw error;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (error) {
    cached!.promise = null; // Reset promise on failure
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * Useful for testing or graceful shutdowns
 */
export async function disconnectDB(): Promise<void> {
  if (cached?.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

/**
 * Check MongoDB connection status
 * @returns boolean - Connection status
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection status string
 * @returns string - Human readable connection status
 */
export function getConnectionStatus(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

/**
 * Get connection statistics
 * @returns object - Connection statistics
 */
export function getConnectionStats() {
  const connection = mongoose.connection;
  return {
    readyState: getConnectionStatus(),
    host: connection.host,
    port: connection.port,
    name: connection.name,
    collections: Object.keys(connection.collections),
    models: Object.keys(mongoose.models),
  };
}

export default connectDB;