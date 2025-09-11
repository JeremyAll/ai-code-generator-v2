import { Logger } from '../utils/logger.js';

interface ImageData {
  regular: string;
  small: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
  downloadUrl: string;
}

interface ImagePlaceholders {
  [key: string]: string;
}

export class ImageEnhancer {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger();
  }
  
  /**
   * Améliorer le code généré avec des images réelles contextuelles
   */
  enhancePromptWithImages(
    generatedCode: string, 
    images: ImageData[],
    domain: string
  ): string {
    if (!images || images.length === 0) {
      this.logger.warn('⚠️ Aucune image fournie pour l\'amélioration');
      return generatedCode;
    }
    
    this.logger.info('🖼️ Amélioration du code avec images réelles', {
      domain,
      imagesCount: images.length,
      codeLength: generatedCode.length
    });
    
    let enhanced = generatedCode;
    
    try {
      // 1. Remplacer les URLs picsum par de vraies images
      enhanced = this.replacePicsumUrls(enhanced, images);
      
      // 2. Remplacer les placeholders contextuels génériques
      enhanced = this.replaceGenericPlaceholders(enhanced, images);
      
      // 3. Remplacer les placeholders spécifiques au domaine
      enhanced = this.replaceDomainSpecificPlaceholders(enhanced, images, domain);
      
      // 4. Ajouter des attributs alt descriptifs
      enhanced = this.enhanceImageAltAttributes(enhanced, images, domain);
      
      // 5. Optimiser les URLs d'images selon le contexte
      enhanced = this.optimizeImageUrls(enhanced, images);
      
      this.logger.info('✅ Code amélioré avec succès', {
        replacements: this.countReplacements(generatedCode, enhanced)
      });
      
      return enhanced;
      
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'amélioration des images', {
        error: error instanceof Error ? error.message : 'Unknown error',
        domain
      });
      return generatedCode; // Retourner le code original en cas d'erreur
    }
  }
  
  /**
   * Remplacer les URLs picsum.photos par de vraies images
   */
  private replacePicsumUrls(code: string, images: ImageData[]): string {
    const picsumPattern = /https:\/\/picsum\.photos\/(\d+)(?:\/(\d+))?(?:\?[^"\s]*)?/g;
    
    return code.replace(picsumPattern, (match, width, height) => {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      
      // Choisir la taille appropriée selon les dimensions demandées
      const requestedWidth = parseInt(width);
      if (requestedWidth <= 200) {
        return randomImage?.thumb || match;
      } else if (requestedWidth <= 400) {
        return randomImage?.small || match;
      } else {
        return randomImage?.regular || match;
      }
    });
  }
  
  /**
   * Remplacer les placeholders génériques
   */
  private replaceGenericPlaceholders(code: string, images: ImageData[]): string {
    const placeholders: ImagePlaceholders = {
      '{IMAGE_HERO}': images[0]?.regular || '',
      '{IMAGE_HERO_SMALL}': images[0]?.small || '',
      '{IMAGE_PRODUCT}': images[1]?.regular || '',
      '{IMAGE_PRODUCT_SMALL}': images[1]?.small || '',
      '{IMAGE_FEATURE}': images[2]?.regular || '',
      '{IMAGE_FEATURE_SMALL}': images[2]?.small || '',
      '{IMAGE_GALLERY_1}': images[3]?.regular || '',
      '{IMAGE_GALLERY_2}': images[4]?.regular || '',
      '{IMAGE_GALLERY_3}': images[5]?.regular || '',
      '{IMAGE_BACKGROUND}': images[Math.floor(Math.random() * images.length)]?.regular || '',
      '{IMAGE_BANNER}': images[0]?.regular || '',
      '{IMAGE_CARD}': images[Math.floor(Math.random() * images.length)]?.small || '',
      '{IMAGE_THUMBNAIL}': images[Math.floor(Math.random() * images.length)]?.thumb || ''
    };
    
    let enhanced = code;
    Object.entries(placeholders).forEach(([placeholder, imageUrl]) => {
      if (imageUrl) {
        enhanced = enhanced.replace(new RegExp(placeholder, 'g'), imageUrl);
      }
    });
    
    return enhanced;
  }
  
  /**
   * Remplacer les placeholders spécifiques au domaine
   */
  private replaceDomainSpecificPlaceholders(code: string, images: ImageData[], domain: string): string {
    const domainPlaceholders: Record<string, ImagePlaceholders> = {
      'food': {
        '{FOOD_HERO}': images[0]?.regular || '',
        '{RECIPE_IMAGE}': images[1]?.regular || '',
        '{DISH_PHOTO}': images[2]?.regular || '',
        '{INGREDIENT_PHOTO}': images[3]?.small || '',
        '{CHEF_PHOTO}': images[4]?.regular || ''
      },
      
      'fitness': {
        '{WORKOUT_IMAGE}': images[0]?.regular || '',
        '{GYM_PHOTO}': images[1]?.regular || '',
        '{EXERCISE_DEMO}': images[2]?.regular || '',
        '{TRAINER_PHOTO}': images[3]?.regular || ''
      },
      
      'ecommerce_b2c': {
        '{PRODUCT_HERO}': images[0]?.regular || '',
        '{PRODUCT_GALLERY}': images[1]?.regular || '',
        '{CATEGORY_IMAGE}': images[2]?.regular || '',
        '{SHOP_BANNER}': images[3]?.regular || ''
      },
      
      'health_medical': {
        '{MEDICAL_HERO}': images[0]?.regular || '',
        '{DOCTOR_PHOTO}': images[1]?.regular || '',
        '{CLINIC_IMAGE}': images[2]?.regular || '',
        '{HEALTH_BANNER}': images[3]?.regular || ''
      },
      
      'edtech_school': {
        '{CLASSROOM_IMAGE}': images[0]?.regular || '',
        '{STUDENT_PHOTO}': images[1]?.regular || '',
        '{LEARNING_BANNER}': images[2]?.regular || '',
        '{COURSE_THUMBNAIL}': images[3]?.small || ''
      },
      
      'real_estate': {
        '{PROPERTY_HERO}': images[0]?.regular || '',
        '{HOUSE_EXTERIOR}': images[1]?.regular || '',
        '{INTERIOR_PHOTO}': images[2]?.regular || '',
        '{ROOM_IMAGE}': images[3]?.regular || ''
      }
    };
    
    const placeholders = domainPlaceholders[domain] || {};
    
    let enhanced = code;
    Object.entries(placeholders).forEach(([placeholder, imageUrl]) => {
      if (imageUrl) {
        enhanced = enhanced.replace(new RegExp(placeholder, 'g'), imageUrl);
      }
    });
    
    return enhanced;
  }
  
  /**
   * Améliorer les attributs alt des images
   */
  private enhanceImageAltAttributes(code: string, images: ImageData[], domain: string): string {
    // Pattern pour trouver les balises img sans alt ou avec alt générique
    const imgPattern = /<img([^>]*?)(?:alt=["'][^"']*["'])?([^>]*?)>/g;
    
    return code.replace(imgPattern, (match, before, after) => {
      const srcMatch = match.match(/src=["']([^"']*)["']/);
      if (srcMatch) {
        const imageUrl = srcMatch[1];
        const imageData = images.find(img => 
          imageUrl.includes(img.regular) || 
          imageUrl.includes(img.small) || 
          imageUrl.includes(img.thumb)
        );
        
        if (imageData) {
          const altText = this.generateContextualAlt(imageData.alt, domain);
          // Supprimer l'ancien alt s'il existe et ajouter le nouveau
          const cleanMatch = match.replace(/\s*alt=["'][^"']*["']/g, '');
          return cleanMatch.replace('<img', `<img alt="${altText}"`);
        }
      }
      return match;
    });
  }
  
  /**
   * Générer un texte alt contextuel
   */
  private generateContextualAlt(originalAlt: string, domain: string): string {
    const domainContexts: Record<string, string> = {
      'food': 'Délicieux plat culinaire',
      'fitness': 'Exercice de fitness et bien-être',
      'ecommerce_b2c': 'Produit de qualité premium',
      'health_medical': 'Service médical professionnel',
      'edtech_school': 'Environnement d\'apprentissage moderne',
      'real_estate': 'Propriété immobilière attrayante'
    };
    
    const context = domainContexts[domain] || 'Image professionnelle';
    return originalAlt || context;
  }
  
  /**
   * Optimiser les URLs d'images selon le contexte d'utilisation
   */
  private optimizeImageUrls(code: string, images: ImageData[]): string {
    // Optimiser selon la taille de l'élément conteneur
    let optimized = code;
    
    // Pour les avatars et petites images (< 100px)
    optimized = optimized.replace(
      /(class=["'][^"']*(?:avatar|icon|thumb)[^"']*["'][^>]*src=["'])([^"']*)([^>]*>)/g,
      (match, prefix, url, suffix) => {
        const image = images.find(img => url.includes(img.regular));
        if (image) {
          return prefix + image.thumb + suffix;
        }
        return match;
      }
    );
    
    // Pour les cards et éléments moyens
    optimized = optimized.replace(
      /(class=["'][^"']*(?:card|medium)[^"']*["'][^>]*src=["'])([^"']*)([^>]*>)/g,
      (match, prefix, url, suffix) => {
        const image = images.find(img => url.includes(img.regular));
        if (image) {
          return prefix + image.small + suffix;
        }
        return match;
      }
    );
    
    return optimized;
  }
  
  /**
   * Compter le nombre de remplacements effectués
   */
  private countReplacements(original: string, enhanced: string): number {
    const originalMatches = original.match(/https:\/\/[^\s"'>]+/g) || [];
    const enhancedMatches = enhanced.match(/https:\/\/[^\s"'>]+/g) || [];
    
    return Math.abs(enhancedMatches.length - originalMatches.length);
  }
  
  /**
   * Extraire les métadonnées des images du code
   */
  extractImageMetadata(code: string): {
    totalImages: number;
    picsumCount: number;
    realImagesCount: number;
    placeholderCount: number;
  } {
    const allImages = code.match(/<img[^>]*>/g) || [];
    const picsumImages = code.match(/https:\/\/picsum\.photos\/[^\s"'>]+/g) || [];
    const placeholders = code.match(/\{IMAGE_[^}]+\}/g) || [];
    
    return {
      totalImages: allImages.length,
      picsumCount: picsumImages.length,
      realImagesCount: allImages.length - picsumImages.length,
      placeholderCount: placeholders.length
    };
  }
}

/**
 * Fonction utilitaire pour compatibilité avec l'ancienne API
 */
export function enhancePromptWithImages(
  generatedCode: string, 
  images: ImageData[],
  domain: string
): string {
  const enhancer = new ImageEnhancer();
  return enhancer.enhancePromptWithImages(generatedCode, images, domain);
}