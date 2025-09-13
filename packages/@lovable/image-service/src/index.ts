// Core services
export { UnsplashService, type ImageResult } from './unsplash-service';
export { ImageOptimizer, type OptimizationOptions } from './image-optimizer';
export { DomainImageService, type DomainImageConfig } from './domain-images';
export { ImageCredits, type CreditOptions } from './image-credits';

import { UnsplashService, ImageResult } from './unsplash-service';
import { ImageOptimizer } from './image-optimizer';
import { DomainImageService } from './domain-images';
import { ImageCredits } from './image-credits';

/**
 * Main helper function to enhance generated code with beautiful images
 * @param code - The generated HTML/React code to enhance
 * @param domain - The application domain (e.g., 'ecommerce', 'saas', 'landing')
 * @param options - Configuration options
 * @returns Enhanced code with images, credits, and metadata
 */
export async function enhanceWithImages(
  code: string,
  domain: string,
  options: {
    unsplashKey?: string;
    sections?: string[];
    includeCredits?: boolean;
    creditFormat?: 'markdown' | 'html' | 'json' | 'txt';
    optimizeImages?: boolean;
    framework?: 'react' | 'vue' | 'angular' | 'vanilla';
  } = {}
): Promise<{
  code: string;
  images: Record<string, ImageResult[]>;
  credits: string;
  metadata: {
    totalImages: number;
    sections: string[];
    domain: string;
    generatedAt: string;
  };
}> {
  const {
    unsplashKey,
    sections = [],
    includeCredits = true,
    creditFormat = 'markdown',
    optimizeImages = true,
    framework = 'vanilla'
  } = options;
  
  // Initialize services
  const imageService = new DomainImageService(unsplashKey);
  const creditsManager = new ImageCredits();
  
  try {
    // Get images for the specified domain
    const images = await imageService.getImagesForDomain(domain, sections);
    
    // Enhance code with images
    let enhancedCode = imageService.injectImagesIntoCode(code, images, domain);
    
    // Generate framework-specific components if needed
    if (framework !== 'vanilla') {
      const components = imageService.generateFrameworkComponents(images, framework);
      // Could inject components into code here based on framework
    }
    
    // Generate credits
    const allImages = Object.values(images).flat();
    const credits = includeCredits 
      ? creditsManager.generateCreditsFile(allImages, { 
          format: creditFormat,
          includeDescription: true,
          groupBySection: true 
        })
      : '';
    
    return {
      code: enhancedCode,
      images,
      credits,
      metadata: {
        totalImages: allImages.length,
        sections: Object.keys(images),
        domain,
        generatedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error enhancing with images:', error);
    
    // Return fallback with original code
    return {
      code,
      images: {},
      credits: '',
      metadata: {
        totalImages: 0,
        sections: [],
        domain,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Quick helper to get images for a specific domain
 * @param domain - The application domain
 * @param count - Number of images to get per section
 * @param unsplashKey - Optional Unsplash API key
 * @returns Images organized by section
 */
export async function getImagesForDomain(
  domain: string,
  count: number = 5,
  unsplashKey?: string
): Promise<Record<string, ImageResult[]>> {
  const imageService = new DomainImageService(unsplashKey);
  return imageService.getImagesForDomain(domain);
}

/**
 * Search for specific images
 * @param query - Search query
 * @param options - Search options
 * @returns Array of images
 */
export async function searchImages(
  query: string,
  options: {
    count?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    unsplashKey?: string;
  } = {}
): Promise<ImageResult[]> {
  const { count = 5, orientation = 'landscape', unsplashKey } = options;
  const unsplash = new UnsplashService(unsplashKey);
  return unsplash.searchImages(query, count, orientation);
}

/**
 * Optimize image URLs for better performance
 * @param imageUrl - Original image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function optimizeImageUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'avif';
  } = {}
): string {
  const optimizer = new ImageOptimizer();
  return optimizer.optimizeUrl(imageUrl, options);
}

/**
 * Generate responsive image markup
 * @param image - Image data
 * @param alt - Alt text
 * @param options - Generation options
 * @returns HTML/JSX markup
 */
export function generateResponsiveImage(
  image: ImageResult,
  alt: string,
  options: {
    framework?: 'react' | 'vue' | 'angular' | 'vanilla';
    className?: string;
    sizes?: number[];
    formats?: ('webp' | 'avif' | 'jpg')[];
  } = {}
): string {
  const optimizer = new ImageOptimizer();
  const { framework = 'vanilla' } = options;
  
  if (framework === 'react') {
    return optimizer.generateReactPictureComponent(image, alt, options);
  }
  
  return optimizer.generatePictureElement(image, alt, options);
}

/**
 * Generate credits for a set of images
 * @param images - Array of images or images grouped by section
 * @param format - Output format
 * @returns Credits content
 */
export function generateImageCredits(
  images: ImageResult[] | Record<string, ImageResult[]>,
  format: 'markdown' | 'html' | 'json' | 'txt' = 'markdown'
): string {
  const creditsManager = new ImageCredits();
  return creditsManager.generateCreditsFile(images, { format });
}

/**
 * Validate Unsplash API key
 * @param apiKey - Unsplash API key to validate
 * @returns Promise<boolean> - Whether the key is valid
 */
export async function validateUnsplashKey(apiKey: string): Promise<boolean> {
  const unsplash = new UnsplashService(apiKey);
  return unsplash.validateApiKey();
}

/**
 * Get random high-quality image
 * @param options - Options for random image
 * @returns Promise<ImageResult | null>
 */
export async function getRandomImage(
  options: {
    featured?: boolean;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    unsplashKey?: string;
  } = {}
): Promise<ImageResult | null> {
  const { featured = false, orientation = 'landscape', unsplashKey } = options;
  const unsplash = new UnsplashService(unsplashKey);
  return unsplash.getRandomImage(featured, orientation);
}

/**
 * Get images by category
 * @param category - Image category (hero, product, team, etc.)
 * @param count - Number of images
 * @param unsplashKey - Optional API key
 * @returns Promise<ImageResult[]>
 */
export async function getImagesByCategory(
  category: string,
  count: number = 5,
  unsplashKey?: string
): Promise<ImageResult[]> {
  const unsplash = new UnsplashService(unsplashKey);
  return unsplash.getImagesByCategory(category, count);
}

/**
 * Replace placeholders in code with real images
 * @param code - Code containing placeholder images
 * @param domain - Application domain for context
 * @param unsplashKey - Optional API key
 * @returns Promise with enhanced code
 */
export async function replacePlaceholderImages(
  code: string,
  domain: string,
  unsplashKey?: string
): Promise<{ code: string; images: ImageResult[] }> {
  const imageService = new DomainImageService(unsplashKey);
  const images = await imageService.getImagesForDomain(domain);
  const enhancedCode = imageService.injectImagesIntoCode(code, images, domain);
  
  return {
    code: enhancedCode,
    images: Object.values(images).flat()
  };
}

// Default export with all main functions
export default {
  enhanceWithImages,
  getImagesForDomain,
  searchImages,
  optimizeImageUrl,
  generateResponsiveImage,
  generateImageCredits,
  validateUnsplashKey,
  getRandomImage,
  getImagesByCategory,
  replacePlaceholderImages,
  
  // Classes for advanced usage
  UnsplashService,
  ImageOptimizer,
  DomainImageService,
  ImageCredits
};

// Type exports for TypeScript users
export type {
  ImageResult,
  OptimizationOptions,
  DomainImageConfig,
  CreditOptions
};