import sharp from 'sharp';
import path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  progressive?: boolean;
  sizes?: Array<{ width: number; height?: number; suffix: string }>;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  filename: string;
  size: number;
  width: number;
  height: number;
  format: string;
}

export const DEFAULT_OPTIMIZATION_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'webp',
  progressive: true,
  sizes: [
    { width: 400, suffix: '_thumb' },
    { width: 800, suffix: '_medium' },
    { width: 1200, suffix: '_large' }
  ]
};

/**
 * Optimize a single image with Sharp for fast processing
 */
export async function optimizeImage(
  buffer: Buffer,
  filename: string,
  options: ImageOptimizationOptions = DEFAULT_OPTIMIZATION_OPTIONS
): Promise<OptimizedImageResult[]> {
  const results: OptimizedImageResult[] = [];
  const baseFilename = path.parse(filename).name;
  
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Always create optimized main image
    const mainOptimized = await createOptimizedVersion(
      image.clone(),
      baseFilename,
      options,
      ''
    );
    results.push(mainOptimized);
    
    // Create additional sizes if specified
    if (options.sizes && options.sizes.length > 0) {
      const sizePromises = options.sizes.map(size =>
        createOptimizedVersion(
          image.clone(),
          baseFilename,
          { ...options, maxWidth: size.width, maxHeight: size.height },
          size.suffix
        )
      );
      
      const additionalSizes = await Promise.all(sizePromises);
      results.push(...additionalSizes);
    }
    
    return results;
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error(`Failed to optimize image ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create an optimized version of an image
 */
async function createOptimizedVersion(
  image: sharp.Sharp,
  baseFilename: string,
  options: ImageOptimizationOptions,
  suffix: string = ''
): Promise<OptimizedImageResult> {
  const { maxWidth, maxHeight, quality, format, progressive } = options;
  
  // Resize if needed
  if (maxWidth || maxHeight) {
    image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Apply format and compression
  switch (format) {
    case 'webp':
      image.webp({ 
        quality,
        effort: 4 // Balance between compression and speed
      });
      break;
    case 'jpeg':
      image.jpeg({ 
        quality,
        progressive,
        mozjpeg: true // Better compression
      });
      break;
    case 'png':
      image.png({ 
        quality,
        progressive,
        compressionLevel: 8
      });
      break;
    case 'avif':
      image.avif({ 
        quality,
        effort: 4
      });
      break;
  }
  
  const optimizedBuffer = await image.toBuffer();
  const metadata = await sharp(optimizedBuffer).metadata();
  
  return {
    buffer: optimizedBuffer,
    filename: `${baseFilename}${suffix}.${format}`,
    size: optimizedBuffer.length,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: format || 'webp'
  };
}

/**
 * Process multiple images in parallel with concurrency control
 */
export async function processImagesInParallel(
  files: Array<{ buffer: Buffer; filename: string }>,
  options: ImageOptimizationOptions = DEFAULT_OPTIMIZATION_OPTIONS,
  concurrency: number = 3
): Promise<OptimizedImageResult[][]> {
  const results: OptimizedImageResult[][] = [];
  
  // Process images in batches to avoid overwhelming the system
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    
    const batchPromises = batch.map(file =>
      optimizeImage(file.buffer, file.filename, options)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Fast image validation using Sharp
 */
export async function validateImage(buffer: Buffer): Promise<{
  isValid: boolean;
  width?: number;
  height?: number;
  format?: string;
  size: number;
  error?: string;
}> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        size: buffer.length,
        error: 'Invalid image dimensions'
      };
    }
    
    return {
      isValid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length
    };
  } catch (error) {
    return {
      isValid: false,
      size: buffer.length,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generate multiple image sizes for responsive images
 */
export async function generateResponsiveImages(
  buffer: Buffer,
  filename: string
): Promise<OptimizedImageResult[]> {
  const responsiveSizes = [
    { width: 320, suffix: '_mobile' },
    { width: 640, suffix: '_tablet' },
    { width: 1024, suffix: '_desktop' },
    { width: 1920, suffix: '_hd' }
  ];
  
  return optimizeImage(buffer, filename, {
    ...DEFAULT_OPTIMIZATION_OPTIONS,
    sizes: responsiveSizes
  });
}