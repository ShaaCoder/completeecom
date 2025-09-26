export interface ImageUploadConfig {
  maxSizeInMB: number;
  allowedTypes: string[];
  quality: number;
}

export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  quality: 0.8
};

export function validateImageFile(
  file: File, 
  config: ImageUploadConfig = DEFAULT_IMAGE_CONFIG
): { isValid: boolean; error?: string } {
  // Check file size
  const maxSizeInBytes = config.maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${config.maxSizeInMB}MB`
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type must be one of: ${config.allowedTypes.join(', ')}`
    };
  }

  return { isValid: true };
}

export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
}

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder-image.svg';

  // Rewrite Pexels page URLs to direct CDN image URLs
  // Example: https://www.pexels.com/photo/...-991509/ -> https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg
  const pexelsPageMatch = imagePath.match(/^https?:\/\/www\.pexels\.com\/photo\/[^/]*-(\d+)\/?$/i);
  if (pexelsPageMatch && pexelsPageMatch[1]) {
    const id = pexelsPageMatch[1];
    return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
  }
  
  // If it's already a full URL (http/https), return as is
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }
  
  // If it's a local upload path, ensure it starts with /
  if (imagePath.startsWith('uploads/')) {
    return `/${imagePath}`;
  }
  
  // If it already starts with /, return as is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Default: add leading slash
  return `/${imagePath}`;
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create image preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ImageUploadError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}