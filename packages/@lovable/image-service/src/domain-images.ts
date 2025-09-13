import { UnsplashService, ImageResult } from './unsplash-service';
import { ImageOptimizer } from './image-optimizer';

export interface DomainImageConfig {
  hero?: { query: string; count: number };
  features?: { query: string; count: number };
  products?: { query: string; count: number };
  team?: { query: string; count: number };
  testimonials?: { query: string; count: number };
  blog?: { query: string; count: number };
  gallery?: { query: string; count: number };
  background?: { query: string; count: number };
  cta?: { query: string; count: number };
  about?: { query: string; count: number };
}

export class DomainImageService {
  private unsplash: UnsplashService;
  private optimizer: ImageOptimizer;
  
  constructor(unsplashKey?: string) {
    this.unsplash = new UnsplashService(unsplashKey);
    this.optimizer = new ImageOptimizer();
  }
  
  async getImagesForDomain(
    domain: string,
    sections: string[] = []
  ): Promise<Record<string, ImageResult[]>> {
    const imageMap: Record<string, ImageResult[]> = {};
    const domainConfig = this.getDomainConfig(domain);
    
    // Get images for each section based on domain configuration
    for (const [section, config] of Object.entries(domainConfig)) {
      if (sections.length === 0 || sections.includes(section)) {
        try {
          imageMap[section] = await this.unsplash.searchImages(
            config.query,
            config.count,
            this.getOrientationForSection(section)
          );
        } catch (error) {
          console.warn(`Failed to get images for section ${section}:`, error);
          imageMap[section] = [];
        }
      }
    }
    
    return imageMap;
  }
  
  private getDomainConfig(domain: string): DomainImageConfig {
    const configs: Record<string, DomainImageConfig> = {
      ecommerce: {
        hero: { query: 'ecommerce shopping modern store', count: 1 },
        products: { query: 'product photography minimal white background', count: 8 },
        features: { query: 'shopping icons modern minimal', count: 4 },
        team: { query: 'retail team professional', count: 4 },
        testimonials: { query: 'happy customer portrait professional', count: 3 },
        background: { query: 'abstract modern gradient', count: 2 }
      },
      
      saas: {
        hero: { query: 'technology dashboard modern office', count: 1 },
        features: { query: 'tech icons minimal abstract', count: 6 },
        team: { query: 'startup team collaboration', count: 4 },
        testimonials: { query: 'business professional headshot', count: 3 },
        background: { query: 'tech abstract gradient blue', count: 2 }
      },
      
      landing: {
        hero: { query: 'success startup modern gradient', count: 1 },
        features: { query: 'modern icons minimal design', count: 4 },
        cta: { query: 'celebration success achievement', count: 1 },
        testimonials: { query: 'professional portrait confident', count: 3 },
        background: { query: 'abstract gradient modern colorful', count: 3 }
      },
      
      blog: {
        hero: { query: 'writing workspace minimal clean', count: 1 },
        blog: { query: 'lifestyle photography modern', count: 12 },
        about: { query: 'writer author portrait professional', count: 1 },
        features: { query: 'blog icons minimal', count: 4 },
        background: { query: 'paper texture minimal', count: 2 }
      },
      
      portfolio: {
        hero: { query: 'creative workspace design studio', count: 1 },
        gallery: { query: 'design portfolio creative work', count: 9 },
        about: { query: 'designer creative portrait', count: 1 },
        features: { query: 'design tools icons', count: 6 },
        background: { query: 'creative abstract artistic', count: 3 }
      },
      
      dashboard: {
        hero: { query: 'analytics dashboard modern', count: 1 },
        features: { query: 'data visualization charts', count: 6 },
        team: { query: 'data team analysts', count: 4 },
        background: { query: 'data abstract visualization', count: 2 }
      },
      
      healthcare: {
        hero: { query: 'healthcare medical modern', count: 1 },
        features: { query: 'medical icons minimal', count: 6 },
        team: { query: 'medical team doctors', count: 4 },
        testimonials: { query: 'patient happy portrait', count: 3 },
        background: { query: 'medical abstract clean', count: 2 }
      },
      
      education: {
        hero: { query: 'education learning modern', count: 1 },
        features: { query: 'education icons minimal', count: 6 },
        team: { query: 'teachers educators', count: 4 },
        testimonials: { query: 'students happy learning', count: 3 },
        background: { query: 'education abstract books', count: 2 }
      },
      
      finance: {
        hero: { query: 'finance banking modern professional', count: 1 },
        features: { query: 'finance icons minimal', count: 6 },
        team: { query: 'finance professionals', count: 4 },
        testimonials: { query: 'business client professional', count: 3 },
        background: { query: 'finance abstract money', count: 2 }
      },
      
      restaurant: {
        hero: { query: 'restaurant food modern dining', count: 1 },
        products: { query: 'food photography delicious', count: 12 },
        team: { query: 'chef restaurant staff', count: 4 },
        testimonials: { query: 'happy dining customers', count: 3 },
        background: { query: 'food abstract texture', count: 2 }
      }
    };
    
    return configs[domain] || {
      hero: { query: 'modern business professional', count: 1 },
      features: { query: 'minimal icons modern', count: 4 },
      team: { query: 'professional team', count: 4 },
      background: { query: 'abstract modern', count: 2 }
    };
  }
  
  private getOrientationForSection(section: string): 'landscape' | 'portrait' | 'squarish' {
    const orientationMap: Record<string, 'landscape' | 'portrait' | 'squarish'> = {
      hero: 'landscape',
      features: 'squarish',
      products: 'squarish',
      team: 'portrait',
      testimonials: 'portrait',
      blog: 'landscape',
      gallery: 'landscape',
      background: 'landscape',
      cta: 'landscape',
      about: 'portrait'
    };
    
    return orientationMap[section] || 'landscape';
  }
  
  // Inject images into generated code
  injectImagesIntoCode(
    code: string,
    images: Record<string, ImageResult[]>,
    domain: string
  ): string {
    let updatedCode = code;
    
    // Replace placeholder images
    updatedCode = this.replacePlaceholderImages(updatedCode, images);
    
    // Replace background images
    updatedCode = this.replaceBackgroundImages(updatedCode, images);
    
    // Add image optimization attributes
    updatedCode = this.addOptimizationAttributes(updatedCode);
    
    // Replace specific sections based on domain
    updatedCode = this.replaceDomainSpecificImages(updatedCode, images, domain);
    
    return updatedCode;
  }
  
  private replacePlaceholderImages(code: string, images: Record<string, ImageResult[]>): string {
    return code.replace(
      /src=["']\/placeholder\.(png|jpg|jpeg|webp)["']/g,
      (match) => {
        const randomImage = this.getRandomImage(images);
        return `src="${randomImage.url}"`;
      }
    );
  }
  
  private replaceBackgroundImages(code: string, images: Record<string, ImageResult[]>): string {
    // Replace CSS background images
    code = code.replace(
      /background-image:\s*url\(['"]?\/placeholder\.(png|jpg|jpeg|webp)['"]?\)/g,
      (match) => {
        const backgroundImage = images.background?.[0] || images.hero?.[0] || this.getRandomImage(images);
        return `background-image: url('${backgroundImage.url}')`;
      }
    );
    
    // Replace inline style background images
    code = code.replace(
      /backgroundImage:\s*['"]url\(\/placeholder\.(png|jpg|jpeg|webp)\)['\"]/g,
      (match) => {
        const backgroundImage = images.background?.[0] || images.hero?.[0] || this.getRandomImage(images);
        return `backgroundImage: "url(${backgroundImage.url})"`;
      }
    );
    
    return code;
  }
  
  private addOptimizationAttributes(code: string): string {
    // Add loading and decoding attributes to images
    return code.replace(
      /<img([^>]*?)>/g,
      (match, attrs) => {
        if (!attrs.includes('loading=')) {
          attrs += ' loading="lazy"';
        }
        if (!attrs.includes('decoding=')) {
          attrs += ' decoding="async"';
        }
        return `<img${attrs}>`;
      }
    );
  }
  
  private replaceDomainSpecificImages(
    code: string,
    images: Record<string, ImageResult[]>,
    domain: string
  ): string {
    // Replace hero images
    if (images.hero?.[0]) {
      code = code.replace(
        /data-hero-image=["']placeholder["']/g,
        `data-hero-image="${images.hero[0].url}"`
      );
    }
    
    // Replace team images
    if (images.team?.length) {
      images.team.forEach((image, index) => {
        code = code.replace(
          new RegExp(`data-team-${index}=["']placeholder["']`, 'g'),
          `data-team-${index}="${image.url}"`
        );
      });
    }
    
    // Replace product images for e-commerce
    if (domain === 'ecommerce' && images.products?.length) {
      images.products.forEach((image, index) => {
        code = code.replace(
          new RegExp(`data-product-${index}=["']placeholder["']`, 'g'),
          `data-product-${index}="${image.url}"`
        );
      });
    }
    
    return code;
  }
  
  private getRandomImage(images: Record<string, ImageResult[]>): ImageResult {
    const allImages = Object.values(images).flat();
    if (allImages.length === 0) {
      return {
        id: 'fallback',
        url: 'https://source.unsplash.com/800x600',
        thumbnailUrl: 'https://source.unsplash.com/200x150',
        author: 'Unsplash',
        authorUrl: 'https://unsplash.com',
        description: 'Random image',
        downloadUrl: ''
      };
    }
    return allImages[Math.floor(Math.random() * allImages.length)];
  }
  
  // Generate image components for specific frameworks
  generateFrameworkComponents(
    images: Record<string, ImageResult[]>,
    framework: 'react' | 'vue' | 'angular' | 'vanilla'
  ): Record<string, string> {
    const components: Record<string, string> = {};
    
    Object.entries(images).forEach(([section, sectionImages]) => {
      if (sectionImages.length > 0) {
        components[section] = this.generateSectionComponent(
          sectionImages[0],
          section,
          framework
        );
      }
    });
    
    return components;
  }
  
  private generateSectionComponent(
    image: ImageResult,
    section: string,
    framework: string
  ): string {
    const alt = `${section} image`;
    
    switch (framework) {
      case 'react':
        return this.optimizer.generateReactPictureComponent(image, alt);
      case 'vue':
        return this.generateVueComponent(image, alt);
      case 'angular':
        return this.generateAngularComponent(image, alt);
      default:
        return this.optimizer.generatePictureElement(image, alt);
    }
  }
  
  private generateVueComponent(image: ImageResult, alt: string): string {
    return `<picture>
  <source type="image/webp" :srcset="'${image.url}?fm=webp'" />
  <img
    :src="'${image.url}'"
    :alt="'${alt}'"
    loading="lazy"
    decoding="async"
    class="w-full h-full object-cover"
  />
</picture>`;
  }
  
  private generateAngularComponent(image: ImageResult, alt: string): string {
    return `<picture>
  <source type="image/webp" srcset="${image.url}?fm=webp" />
  <img
    src="${image.url}"
    alt="${alt}"
    loading="lazy"
    decoding="async"
    class="w-full h-full object-cover"
  />
</picture>`;
  }
}