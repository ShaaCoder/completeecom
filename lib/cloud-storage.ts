/**
 * Cloud storage utility as fallback for local file uploads
 * This can be configured to use different cloud providers
 */

import { generateUniqueFileName } from './image-utils';

export interface CloudStorageProvider {
  upload(file: File, type: string): Promise<string>;
  delete(url: string): Promise<void>;
}

/**
 * Simple base64 storage provider (for emergency fallback)
 * Note: This should only be used for small images as a last resort
 */
export class Base64StorageProvider implements CloudStorageProvider {
  async upload(file: File, type: string): Promise<string> {
    if (file.size > 1024 * 1024) { // 1MB limit for base64
      throw new Error('File too large for base64 storage');
    }
    
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;
    
    return `data:${mimeType};base64,${base64}`;
  }
  
  async delete(url: string): Promise<void> {
    // Base64 data URLs don't need deletion
    return Promise.resolve();
  }
}

/**
 * Cloudinary provider (implement when needed)
 */
export class CloudinaryProvider implements CloudStorageProvider {
  constructor(
    private cloudName: string,
    private apiKey: string,
    private apiSecret: string
  ) {}
  
  async upload(file: File, type: string): Promise<string> {
    // Implement Cloudinary upload logic here
    throw new Error('Cloudinary provider not implemented yet');
  }
  
  async delete(url: string): Promise<void> {
    // Implement Cloudinary deletion logic here
    throw new Error('Cloudinary provider not implemented yet');
  }
}

/**
 * Get the appropriate storage provider based on environment
 */
export function getStorageProvider(): CloudStorageProvider {
  // In serverless environments, default to base64 storage as emergency fallback
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;
  const provider = process.env.STORAGE_PROVIDER || (isServerless ? 'base64' : 'local');
  
  switch (provider) {
    case 'base64':
      return new Base64StorageProvider();
    case 'cloudinary':
      return new CloudinaryProvider(
        process.env.CLOUDINARY_CLOUD_NAME || '',
        process.env.CLOUDINARY_API_KEY || '',
        process.env.CLOUDINARY_API_SECRET || ''
      );
    default:
      if (isServerless) {
        console.warn('No cloud storage provider configured, falling back to base64');
        return new Base64StorageProvider();
      }
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

/**
 * Upload with fallback strategy
 */
export async function uploadWithFallback(
  file: File, 
  type: string,
  primaryUploadFn: () => Promise<string>
): Promise<string> {
  try {
    // Try primary upload method (local storage)
    return await primaryUploadFn();
  } catch (error) {
    console.warn('Primary upload failed, trying fallback:', error instanceof Error ? error.message : String(error));
    
    // Fallback to cloud storage
    const cloudProvider = getStorageProvider();
    return await cloudProvider.upload(file, type);
  }
}