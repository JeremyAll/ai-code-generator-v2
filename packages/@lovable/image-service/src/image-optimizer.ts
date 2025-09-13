import { ImageResult } from './unsplash-service';

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'crop';
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export class ImageOptimizer {
  // Optimize URL with parameters for different CDNs
  optimizeUrl(url: string, options: OptimizationOptions = {}): string {
    // For Unsplash URLs
    if (url.includes('unsplash.com') || url.includes('images.unsplash.com')) {
      return this.optimizeUnsplashUrl(url, options);
    }
    
    // For source.unsplash.com (legacy API)
    if (url.includes('source.unsplash.com')) {
      return this.optimizeSourceUnsplashUrl(url, options);
    }
    
    // For other CDNs, try generic optimization
    return this.optimizeGenericUrl(url, options);
  }
  
  private optimizeUnsplashUrl(url: string, options: OptimizationOptions): string {
    const params = new URLSearchParams();
    
    // Unsplash-specific parameters
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', Math.min(100, Math.max(1, options.quality)).toString());
    if (options.format && options.format !== 'jpg') params.append('fm', options.format);
    if (options.fit) {
      // Map generic fit values to Unsplash parameters
      const fitMap = {
        'cover': 'crop',
        'contain': 'fit',
        'fill': 'fill',
        'crop': 'crop'
      };
      params.append('fit', fitMap[options.fit] || 'crop');
    }
    if (options.blur) params.append('blur', Math.min(100, Math.max(0, options.blur)).toString());
    if (options.brightness) params.append('bri', Math.min(100, Math.max(-100, options.brightness)).toString());
    if (options.contrast) params.append('con', Math.min(100, Math.max(-100, options.contrast)).toString());
    if (options.saturation) params.append('sat', Math.min(100, Math.max(-100, options.saturation)).toString());
    
    // Auto-optimize for better performance
    params.append('auto', 'compress,format');
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  private optimizeSourceUnsplashUrl(url: string, options: OptimizationOptions): string {
    // For source.unsplash.com, we can only modify dimensions
    if (options.width && options.height) {
      return url.replace(/\/\d+x\d+\//, `/${options.width}x${options.height}/`);
    } else if (options.width) {
      return url.replace(/\/(\d+)x\d+\//, `/${options.width}x${Math.round(options.width * 0.75)}/`);
    }
    
    return url;
  }
  
  private optimizeGenericUrl(url: string, options: OptimizationOptions): string {
    // For other URLs, return as-is (could be extended for other CDNs)
    return url;
  }
  
  // Generate responsive srcset
  generateSrcSet(
    baseUrl: string, 
    sizes: number[] = [320, 640, 768, 1024, 1280, 1920],
    options: Omit<OptimizationOptions, 'width'> = {}
  ): string {
    return sizes
      .map(size => {
        const optimizedUrl = this.optimizeUrl(baseUrl, { ...options, width: size });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }
  
  // Generate sizes attribute for responsive images
  generateSizes(breakpoints?: { mobile?: number; tablet?: number; desktop?: number }): string {
    const bp = {
      mobile: breakpoints?.mobile || 640,
      tablet: breakpoints?.tablet || 768,
      desktop: breakpoints?.desktop || 1024
    };
    
    return [
      `(max-width: ${bp.mobile}px) 100vw`,
      `(max-width: ${bp.tablet}px) 90vw`,
      `(max-width: ${bp.desktop}px) 80vw`,
      '1280px'
    ].join(', ');
  }
  
  // Generate optimized picture element
  generatePictureElement(
    image: ImageResult,
    alt: string,
    options: {
      sizes?: number[];
      formats?: ('webp' | 'avif' | 'jpg')[];
      className?: string;
      loading?: 'lazy' | 'eager';
      quality?: number;
    } = {}
  ): string {
    const {
      sizes = [320, 640, 768, 1024, 1280, 1920],
      formats = ['webp', 'jpg'],
      className = 'w-full h-full object-cover',
      loading = 'lazy',
      quality = 80
    } = options;
    
    const sizesAttr = this.generateSizes();
    
    // Generate source elements for each format
    const sources = formats.slice(0, -1).map(format => {
      const srcSet = this.generateSrcSet(image.url, sizes, { format, quality });
      return `  <source type="image/${format}" srcset="${srcSet}" sizes="${sizesAttr}" />`;
    }).join('\n');
    
    // Generate fallback img with last format
    const fallbackFormat = formats[formats.length - 1];
    const fallbackSrcSet = this.generateSrcSet(image.url, sizes, { format: fallbackFormat, quality });
    const fallbackSrc = this.optimizeUrl(image.url, { width: 800, format: fallbackFormat, quality });
    
    return `<picture>
${sources}
  <img
    src="${fallbackSrc}"
    srcset="${fallbackSrcSet}"
    sizes="${sizesAttr}"
    alt="${alt}"
    loading="${loading}"
    decoding="async"
    class="${className}"
  />
</picture>`;
  }
  
  // Generate React/JSX picture component
  generateReactPictureComponent(
    image: ImageResult,
    alt: string,
    options: {
      sizes?: number[];
      formats?: ('webp' | 'avif' | 'jpg')[];
      className?: string;
      loading?: 'lazy' | 'eager';
      quality?: number;
    } = {}
  ): string {
    const {
      sizes = [320, 640, 768, 1024, 1280, 1920],
      formats = ['webp', 'jpg'],
      className = 'w-full h-full object-cover',
      loading = 'lazy',
      quality = 80
    } = options;
    
    const sizesAttr = this.generateSizes();
    
    // Generate source elements for each format
    const sources = formats.slice(0, -1).map(format => {
      const srcSet = this.generateSrcSet(image.url, sizes, { format, quality });
      return `    <source type="image/${format}" srcSet="${srcSet}" sizes="${sizesAttr}" />`;
    }).join('\n');
    
    // Generate fallback img with last format
    const fallbackFormat = formats[formats.length - 1];
    const fallbackSrcSet = this.generateSrcSet(image.url, sizes, { format: fallbackFormat, quality });
    const fallbackSrc = this.optimizeUrl(image.url, { width: 800, format: fallbackFormat, quality });
    
    return `<picture>
${sources}
    <img
      src="${fallbackSrc}"
      srcSet="${fallbackSrcSet}"
      sizes="${sizesAttr}"
      alt="${alt}"
      loading="${loading}"
      decoding="async"
      className="${className}"
    />
</picture>`;
  }
  
  // Generate Next.js Image component
  generateNextImageComponent(
    image: ImageResult,
    alt: string,
    options: {
      width?: number;
      height?: number;
      priority?: boolean;
      quality?: number;
      className?: string;
    } = {}
  ): string {
    const {
      width = 800,
      height = 600,
      priority = false,
      quality = 80,
      className = 'w-full h-full object-cover'
    } = options;
    
    return `<Image
  src="${image.url}"
  alt="${alt}"
  width={${width}}
  height={${height}}
  quality={${quality}}
  priority={${priority}}
  className="${className}"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyejFhheScvudoTkwjzn//Z"
/>`;
  }
  
  // Get optimal dimensions for different use cases
  getOptimalDimensions(useCase: 'hero' | 'card' | 'thumbnail' | 'avatar' | 'banner'): { width: number; height: number } {
    const dimensions = {
      hero: { width: 1920, height: 1080 },
      card: { width: 400, height: 300 },
      thumbnail: { width: 200, height: 150 },
      avatar: { width: 150, height: 150 },
      banner: { width: 1200, height: 400 }
    };
    
    return dimensions[useCase];
  }
}