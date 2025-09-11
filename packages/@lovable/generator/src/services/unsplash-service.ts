import { createApi } from 'unsplash-js';
import { Logger } from '../utils/logger.js';
import { ApiConfig } from '../config/api-config.js';

interface UnsplashImage {
  regular: string;
  small: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
  downloadUrl: string;
}

interface UnsplashSearchResult {
  images: UnsplashImage[];
  total: number;
  query: string;
}

export class UnsplashService {
  private unsplash;
  private cache = new Map<string, UnsplashImage[]>();
  private logger: Logger;
  private config: ReturnType<ApiConfig['getUnsplashConfig']>;
  
  constructor(accessKey?: string) {
    this.logger = new Logger();
    this.config = ApiConfig.getInstance().getUnsplashConfig();
    
    const key = accessKey || this.config.accessKey;
    if (!key) {
      throw new Error('Unsplash access key is required');
    }
    
    this.unsplash = createApi({ accessKey: key });
    
    this.logger.info('📸 Service Unsplash initialisé', {
      perPage: this.config.perPage,
      quality: this.config.quality
    });
  }
  
  /**
   * Obtenir des images pour un domaine spécifique
   */
  async getImagesForDomain(domain: string, count: number = 10): Promise<UnsplashSearchResult> {
    try {
      this.logger.debug(`🔍 Recherche d'images pour le domaine: ${domain}`, { count });
      
      const queries = this.getDomainQueries(domain);
      const allImages: UnsplashImage[] = [];
      
      for (const query of queries) {
        const cacheKey = `${query}_${count}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && cached.length > 0) {
          this.logger.debug(`💾 Images trouvées en cache pour: ${query}`);
          allImages.push(...cached.slice(0, Math.ceil(count / queries.length)));
          continue;
        }
        
        try {
          const result = await this.unsplash.search.getPhotos({
            query,
            perPage: Math.min(this.config.perPage, Math.ceil(count / queries.length)),
            orientation: 'landscape'
          });
          
          if (result.response && result.response.results.length > 0) {
            const images = result.response.results.map(photo => ({
              regular: photo.urls.regular,
              small: photo.urls.small,
              thumb: photo.urls.thumb,
              alt: photo.alt_description || `Image ${domain}`,
              author: photo.user.name,
              authorUrl: photo.user.links.html,
              downloadUrl: photo.links.download_location
            }));
            
            this.cache.set(cacheKey, images);
            allImages.push(...images);
            
            this.logger.debug(`✅ ${images.length} images récupérées pour: ${query}`);
          }
        } catch (queryError) {
          this.logger.warn(`⚠️ Erreur pour la requête "${query}":`, { error: queryError instanceof Error ? queryError.message : 'Unknown error' });
        }
        
        // Délai entre les requêtes pour respecter les limites
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const result: UnsplashSearchResult = {
        images: allImages.slice(0, count),
        total: allImages.length,
        query: queries.join(', ')
      };
      
      this.logger.info(`📸 Images récupérées avec succès`, {
        domain,
        imagesCount: result.images.length,
        totalFound: result.total,
        queries: queries.length
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des images', {
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Retourner des images par défaut en cas d'erreur
      return {
        images: this.getDefaultImages(domain, count),
        total: 0,
        query: domain
      };
    }
  }
  
  /**
   * Obtenir une image aléatoire pour un domaine
   */
  async getRandomImageForDomain(domain: string): Promise<UnsplashImage | null> {
    try {
      const queries = this.getDomainQueries(domain);
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const result = await this.unsplash.photos.getRandom({
        query: randomQuery,
        orientation: 'landscape',
        count: 1
      });
      
      if (result.response && !Array.isArray(result.response)) {
        const photo = result.response;
        return {
          regular: photo.urls.regular,
          small: photo.urls.small,
          thumb: photo.urls.thumb,
          alt: photo.alt_description || `Image ${domain}`,
          author: photo.user.name,
          authorUrl: photo.user.links.html,
          downloadUrl: photo.links.download_location
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error('❌ Erreur récupération image aléatoire', { domain, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }
  
  /**
   * Obtenir les requêtes de recherche pour un domaine
   */
  private getDomainQueries(domain: string): string[] {
    const domainQueries: Record<string, string[]> = {
      // Business & SaaS
      'saas_analytics': ['business dashboard', 'data analytics', 'charts graphs', 'business meeting'],
      'saas_productivity': ['office workspace', 'team collaboration', 'modern office', 'productivity'],
      'saas_communication': ['video call', 'team meeting', 'communication', 'remote work'],
      'saas_crm': ['business handshake', 'customer service', 'sales meeting', 'office'],
      'saas_hrtech': ['job interview', 'team building', 'office people', 'recruitment'],
      
      // Commerce & Marketplace
      'ecommerce_b2c': ['product photography', 'shopping', 'retail store', 'online shopping'],
      'ecommerce_b2b': ['warehouse', 'business logistics', 'wholesale', 'industrial'],
      'marketplace_goods': ['marketplace', 'vendors', 'products display', 'retail'],
      'marketplace_services': ['service providers', 'freelance', 'gig economy', 'professionals'],
      'marketplace_rental': ['rental property', 'apartment', 'real estate', 'housing'],
      
      // Finance & Legal
      'fintech_banking': ['banking', 'finance', 'money', 'credit cards'],
      'fintech_payment': ['payment', 'pos terminal', 'credit card', 'digital payment'],
      'fintech_trading': ['trading', 'stock market', 'investment', 'financial charts'],
      'fintech_lending': ['loan', 'mortgage', 'financial planning', 'investment'],
      'legaltech_contracts': ['legal documents', 'contract signing', 'lawyer office', 'legal'],
      'legaltech_compliance': ['compliance', 'audit', 'legal documentation', 'regulations'],
      
      // Santé & Bien-être
      'health_medical': ['medical', 'hospital', 'doctor', 'healthcare'],
      'health_wellness': ['wellness', 'yoga', 'meditation', 'healthy lifestyle'],
      'health_mental': ['mental health', 'therapy', 'counseling', 'relaxation'],
      'health_pharma': ['pharmacy', 'medicine', 'pills', 'medical supplies'],
      
      // Éducation & Formation
      'edtech_school': ['classroom', 'students', 'learning', 'school'],
      'edtech_higher': ['university', 'college', 'graduation', 'academic'],
      'edtech_professional': ['professional training', 'workshop', 'seminar', 'certification'],
      'edtech_skills': ['skill learning', 'courses', 'online education', 'studying'],
      
      // Industries spécifiques
      'proptech': ['real estate', 'modern house', 'apartment interior', 'architecture'],
      'insurtech': ['insurance', 'car insurance', 'home insurance', 'protection'],
      'agritech': ['agriculture', 'farming', 'crops', 'modern farm'],
      'logistics': ['logistics', 'shipping', 'warehouse', 'delivery truck'],
      'manufacturing': ['factory', 'manufacturing', 'industrial', 'production'],
      'hospitality': ['hotel', 'restaurant', 'hospitality', 'travel'],
      
      // Media & Entertainment
      'content_streaming': ['streaming', 'video production', 'entertainment', 'media'],
      'content_publishing': ['publishing', 'journalism', 'writing', 'news'],
      'content_creation': ['content creation', 'photography', 'video', 'creative'],
      'gaming': ['gaming', 'esports', 'video games', 'gamer setup'],
      
      // Social & Community
      'social_network': ['social media', 'networking', 'community', 'social gathering'],
      'social_dating': ['dating', 'couple', 'romance', 'meeting people'],
      'social_events': ['event', 'conference', 'meetup', 'gathering'],
      'community_forum': ['forum', 'discussion', 'community', 'collaboration'],
      
      // Services professionnels
      'agency_marketing': ['marketing', 'advertising', 'digital marketing', 'creative agency'],
      'agency_design': ['design', 'creative', 'graphic design', 'ux design'],
      'consulting': ['consulting', 'business meeting', 'strategy', 'professional'],
      'freelance_platform': ['freelance', 'remote work', 'digital nomad', 'coworking'],
      
      // Food & Recipes
      'food': ['restaurant food', 'cooking', 'chef', 'gourmet meals', 'food photography'],
      'recipes': ['cooking', 'kitchen', 'ingredients', 'recipe book', 'meal prep'],
      
      // Fitness
      'fitness': ['gym workout', 'fitness', 'exercise', 'personal trainer'],
      'yoga': ['yoga', 'meditation', 'wellness', 'mindfulness'],
      
      // Default fallbacks
      'default': ['modern office', 'technology', 'business', 'digital']
    };
    
    return domainQueries[domain] || domainQueries['default'];
  }
  
  /**
   * Obtenir des images par défaut en cas d'erreur
   */
  private getDefaultImages(domain: string, count: number): UnsplashImage[] {
    const defaultImages: UnsplashImage[] = [
      {
        regular: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&w=1080',
        small: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&w=400',
        thumb: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&w=200',
        alt: `Image par défaut ${domain}`,
        author: 'Default',
        authorUrl: '',
        downloadUrl: ''
      }
    ];
    
    // Répéter l'image par défaut pour atteindre le count demandé
    return Array(Math.min(count, 10)).fill(defaultImages[0]);
  }
  
  /**
   * Vider le cache
   */
  clearCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();
    this.logger.info('🗑️ Cache Unsplash vidé', { entriesRemoved: cacheSize });
  }
  
  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): {
    entries: number;
    totalImages: number;
    cacheSize: string;
  } {
    let totalImages = 0;
    for (const images of this.cache.values()) {
      totalImages += images.length;
    }
    
    const cacheSize = JSON.stringify(Array.from(this.cache.entries())).length;
    
    return {
      entries: this.cache.size,
      totalImages,
      cacheSize: `${Math.round(cacheSize / 1024)} KB`
    };
  }
  
  /**
   * Précharger des images pour des domaines populaires
   */
  async preloadImagesForDomains(domains: string[]): Promise<void> {
    this.logger.info('🔄 Préchargement d\'images pour domaines populaires', { domains });
    
    for (const domain of domains) {
      try {
        await this.getImagesForDomain(domain, 5);
        // Petit délai entre les domaines
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.logger.warn(`⚠️ Erreur préchargement pour ${domain}:`, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    this.logger.info('✅ Préchargement terminé', { 
      domainsCount: domains.length,
      cacheStats: this.getCacheStats()
    });
  }
}