/**
 * Image Optimization Service
 * 
 * Handles image processing using Sharp library:
 * - Resize images to optimal dimensions
 * - Compress images to reduce file size
 * - Convert images to WebP format
 * - Generate thumbnails
 */

import sharp from 'sharp';
import { createLogger } from '../core/logs/logger';

const logger = createLogger('image-optimizer');

// Predefined image sizes for different use cases
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
  LOGO: { width: 400, height: 200 }, // For workspace logos
  AVATAR: { width: 200, height: 200 }, // For user avatars
} as const;

// Compression quality settings (0-100)
export const QUALITY_SETTINGS = {
  HIGH: 90,
  MEDIUM: 75,
  LOW: 60,
} as const;

/**
 * Image optimization options
 */
export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'original';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  maintainAspectRatio?: boolean;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

/**
 * Image Optimizer Service Class
 */
export class ImageOptimizer {
  /**
   * Optimize an image with specified options
   */
  static async optimize(
    inputBuffer: Buffer,
    options: OptimizeImageOptions = {}
  ): Promise<OptimizationResult> {
    try {
      const originalSize = inputBuffer.length;

      // Get image metadata
      const metadata = await sharp(inputBuffer).metadata();
      const originalFormat = metadata.format || 'unknown';

      logger.debug('Optimizing image', {
        component: 'ImageOptimizer',
        originalSize,
        originalFormat,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        options,
      });

      // Start Sharp pipeline
      let pipeline = sharp(inputBuffer);

      // Resize if dimensions specified
      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: options.fit || 'inside',
          withoutEnlargement: true, // Don't upscale images
        });
      }

      // Convert to specified format
      const targetFormat = options.format === 'original' ? originalFormat : (options.format || 'webp');
      const quality = options.quality || QUALITY_SETTINGS.MEDIUM;

      switch (targetFormat) {
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality, mozjpeg: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, compressionLevel: 9 });
          break;
        default:
          // Keep original format
          break;
      }

      // Execute pipeline
      const result = await pipeline.toBuffer({ resolveWithObject: true });

      const compressionRatio = ((originalSize - result.info.size) / originalSize) * 100;

      logger.info('Image optimized successfully', {
        component: 'ImageOptimizer',
        originalSize,
        newSize: result.info.size,
        compressionRatio: compressionRatio.toFixed(2) + '%',
        format: result.info.format,
        width: result.info.width,
        height: result.info.height,
      });

      return {
        buffer: result.data,
        format: result.info.format,
        width: result.info.width,
        height: result.info.height,
        size: result.info.size,
        originalSize,
        compressionRatio,
      };
    } catch (error) {
      logger.error('Failed to optimize image', {
        component: 'ImageOptimizer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a thumbnail from an image
   */
  static async createThumbnail(
    inputBuffer: Buffer,
    size: typeof IMAGE_SIZES[keyof typeof IMAGE_SIZES] = IMAGE_SIZES.THUMBNAIL
  ): Promise<Buffer> {
    try {
      return await sharp(inputBuffer)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: QUALITY_SETTINGS.MEDIUM })
        .toBuffer();
    } catch (error) {
      logger.error('Failed to create thumbnail', {
        component: 'ImageOptimizer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Thumbnail creation failed');
    }
  }

  /**
   * Generate multiple sizes of an image (responsive images)
   */
  static async generateResponsiveSizes(
    inputBuffer: Buffer,
    sizes: Array<{ width: number; height?: number; suffix: string }>
  ): Promise<Array<{ buffer: Buffer; suffix: string; width: number; height: number }>> {
    try {
      const results = await Promise.all(
        sizes.map(async ({ width, height, suffix }) => {
          const result = await sharp(inputBuffer)
            .resize(width, height, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: QUALITY_SETTINGS.HIGH })
            .toBuffer({ resolveWithObject: true });

          return {
            buffer: result.data,
            suffix,
            width: result.info.width,
            height: result.info.height,
          };
        })
      );

      logger.info('Generated responsive image sizes', {
        component: 'ImageOptimizer',
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to generate responsive sizes', {
        component: 'ImageOptimizer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Responsive image generation failed');
    }
  }

  /**
   * Convert image to WebP format
   */
  static async convertToWebP(
    inputBuffer: Buffer,
    quality: number = QUALITY_SETTINGS.HIGH
  ): Promise<Buffer> {
    try {
      return await sharp(inputBuffer)
        .webp({ quality })
        .toBuffer();
    } catch (error) {
      logger.error('Failed to convert to WebP', {
        component: 'ImageOptimizer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('WebP conversion failed');
    }
  }

  /**
   * Validate if a buffer is a valid image
   */
  static async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  /**
   * Get image metadata without processing
   */
  static async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      logger.error('Failed to get image metadata', {
        component: 'ImageOptimizer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to get image metadata');
    }
  }

  /**
   * Optimize logo specifically (workspace branding)
   */
  static async optimizeLogo(inputBuffer: Buffer): Promise<OptimizationResult> {
    return this.optimize(inputBuffer, {
      maxWidth: IMAGE_SIZES.LOGO.width,
      maxHeight: IMAGE_SIZES.LOGO.height,
      quality: QUALITY_SETTINGS.HIGH,
      format: 'webp',
      fit: 'inside',
    });
  }

  /**
   * Optimize avatar/profile picture
   */
  static async optimizeAvatar(inputBuffer: Buffer): Promise<OptimizationResult> {
    return this.optimize(inputBuffer, {
      maxWidth: IMAGE_SIZES.AVATAR.width,
      maxHeight: IMAGE_SIZES.AVATAR.height,
      quality: QUALITY_SETTINGS.HIGH,
      format: 'webp',
      fit: 'cover',
    });
  }
}
