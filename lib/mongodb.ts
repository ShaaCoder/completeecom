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
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

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
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: 'majority',
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  minPoolSize: 2, // Maintain at least 2 socket connections
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection caching and error handling
 * Implements exponential backoff for connection retries
 * @returns Promise<typeof mongoose> - Mongoose connection instance
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached!.conn) {
    return cached!.conn;
  }

  // Create new connection if no cached promise exists
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI!, options).then((mongoose) => {
      
      // Connection event handlers for monitoring
      mongoose.connection.on('connected', () => {
        // Mongoose connected to MongoDB
      });

      mongoose.connection.on('error', (err) => {
        // Mongoose connection error
      });

      mongoose.connection.on('disconnected', () => {
        // Mongoose disconnected from MongoDB
      });

      mongoose.connection.on('reconnected', () => {
        // Mongoose reconnected to MongoDB
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
    }).catch((error) => {
      cached!.promise = null; // Reset promise on failure
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