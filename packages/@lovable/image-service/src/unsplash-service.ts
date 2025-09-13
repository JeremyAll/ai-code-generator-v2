import { createApi } from 'unsplash-js';

export interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  author: string;
  authorUrl: string;
  description: string;
  downloadUrl: string;
}

export class UnsplashService {
  private unsplash: any;
  private accessKey: string;
  
  constructor(accessKey?: string) {
    this.accessKey = accessKey || process.env.UNSPLASH_ACCESS_KEY || '';
    
    if (this.accessKey) {
      try {
        this.unsplash = createApi({
          accessKey: this.accessKey
        });
      } catch (error) {
        console.warn('Failed to initialize Unsplash API:', error);
        this.unsplash = null;
      }
    }
  }
  
  async searchImages(
    query: string,
    count: number = 5,
    orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
  ): Promise<ImageResult[]> {
    if (!this.unsplash) {
      console.warn('Unsplash API key not configured, using fallback images');
      return this.getFallbackImages(query, count);
    }
    
    try {
      const result = await this.unsplash.search.getPhotos({
        query,
        perPage: count,
        orientation
      });
      
      if (result.type === 'success') {
        return result.response.results.map((photo: any) => ({
          id: photo.id,
          url: photo.urls.regular,
          thumbnailUrl: photo.urls.thumb,
          author: photo.user.name,
          authorUrl: photo.user.links.html,
          description: photo.description || photo.alt_description || '',
          downloadUrl: photo.links.download
        }));
      }
      
      return this.getFallbackImages(query, count);
      
    } catch (error) {
      console.error('Unsplash API error:', error);
      return this.getFallbackImages(query, count);
    }
  }
  
  async getImagesByCategory(category: string, count: number = 5): Promise<ImageResult[]> {
    // Map categories to better search terms
    const categoryMap: Record<string, string> = {
      'hero': 'modern office professional',
      'product': 'product photography minimal',
      'team': 'team collaboration business',
      'testimonial': 'portrait professional headshot',
      'background': 'abstract gradient modern',
      'blog': 'lifestyle photography',
      'ecommerce': 'product minimal white background',
      'saas': 'technology dashboard modern',
      'landing': 'startup success modern',
      'portfolio': 'creative design workspace',
      'dashboard': 'analytics data visualization'
    };
    
    const searchTerm = categoryMap[category] || category;
    return this.searchImages(searchTerm, count);
  }
  
  async getRandomImage(
    featured: boolean = false,
    orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
  ): Promise<ImageResult | null> {
    if (!this.unsplash) {
      return this.getFallbackImages('random', 1)[0];
    }
    
    try {
      const result = await this.unsplash.photos.getRandom({
        featured,
        orientation,
        count: 1
      });
      
      if (result.type === 'success') {
        const photo = Array.isArray(result.response) ? result.response[0] : result.response;
        return {
          id: photo.id,
          url: photo.urls.regular,
          thumbnailUrl: photo.urls.thumb,
          author: photo.user.name,
          authorUrl: photo.user.links.html,
          description: photo.description || photo.alt_description || '',
          downloadUrl: photo.links.download
        };
      }
      
      return this.getFallbackImages('random', 1)[0];
      
    } catch (error) {
      console.error('Unsplash random image error:', error);
      return this.getFallbackImages('random', 1)[0];
    }
  }
  
  private getFallbackImages(query: string, count: number): ImageResult[] {
    // Use placeholder services as fallback
    const images: ImageResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 1000);
      images.push({
        id: `fallback-${seed}-${i}`,
        url: `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=${seed}`,
        thumbnailUrl: `https://source.unsplash.com/200x150/?${encodeURIComponent(query)}&sig=${seed}`,
        author: 'Unsplash',
        authorUrl: 'https://unsplash.com',
        description: `${query} image`,
        downloadUrl: ''
      });
    }
    
    return images;
  }
  
  // Validate API key
  async validateApiKey(): Promise<boolean> {
    if (!this.unsplash) {
      return false;
    }
    
    try {
      const result = await this.unsplash.photos.getRandom({ count: 1 });
      return result.type === 'success';
    } catch (error) {
      return false;
    }
  }
  
  // Get rate limit info
  async getRateLimitInfo(): Promise<{ remaining: number; total: number } | null> {
    if (!this.unsplash) {
      return null;
    }
    
    try {
      // This would need to be extracted from response headers in a real implementation
      return { remaining: 50, total: 50 }; // Placeholder
    } catch (error) {
      return null;
    }
  }
}