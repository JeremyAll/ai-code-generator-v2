/**
 * PHASE 6.1 - INTELLIGENCE CONTEXTUELLE
 * Analyseur sémantique des prompts utilisateur
 */

export interface SemanticAnalysis {
  intent: string;
  domain: string;
  confidence: number;
  entities: Array<{
    type: 'feature' | 'tech' | 'style' | 'target' | 'complexity';
    value: string;
    confidence: number;
  }>;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  targetAudience: 'personal' | 'small-business' | 'enterprise' | 'developer';
  keyFeatures: string[];
  techPreferences: Array<{
    category: 'frontend' | 'backend' | 'database' | 'deployment';
    preference: string;
    explicit: boolean;
  }>;
}

export interface IntentPattern {
  pattern: RegExp;
  intent: string;
  domain: string;
  weight: number;
}

export class SemanticAnalyzer {
  private intentPatterns: IntentPattern[] = [
    // SaaS Patterns
    {
      pattern: /(?:saas|dashboard|analytics|metrics|admin|app|subscription|billing)/i,
      intent: 'build_saas_application',
      domain: 'saas',
      weight: 1.0
    },
    {
      pattern: /(?:crm|customer|gestion|relation|lead|pipeline)/i,
      intent: 'build_crm_system',
      domain: 'saas',
      weight: 0.9
    },
    
    // E-commerce Patterns
    {
      pattern: /(?:boutique|shop|store|ecommerce|vente|produit|panier|commande)/i,
      intent: 'build_ecommerce_site',
      domain: 'ecommerce',
      weight: 1.0
    },
    {
      pattern: /(?:marketplace|place de marché|vendeur|acheteur|multi-vendor)/i,
      intent: 'build_marketplace',
      domain: 'ecommerce',
      weight: 0.95
    },
    
    // Blog/CMS Patterns
    {
      pattern: /(?:blog|cms|article|contenu|publication|éditoriale)/i,
      intent: 'build_blog_cms',
      domain: 'blog',
      weight: 1.0
    },
    {
      pattern: /(?:news|actualités|magazine|presse|journal)/i,
      intent: 'build_news_site',
      domain: 'blog',
      weight: 0.9
    },
    
    // Portfolio Patterns
    {
      pattern: /(?:portfolio|portfolio|vitrine|présentation|showcase)/i,
      intent: 'build_portfolio',
      domain: 'portfolio',
      weight: 1.0
    },
    {
      pattern: /(?:agence|studio|freelance|créatif|designer)/i,
      intent: 'build_agency_site',
      domain: 'portfolio',
      weight: 0.85
    }
  ];

  private techPatterns = [
    // Frontend
    { pattern: /react/i, category: 'frontend', tech: 'react' },
    { pattern: /next\.?js/i, category: 'frontend', tech: 'nextjs' },
    { pattern: /vue/i, category: 'frontend', tech: 'vue' },
    { pattern: /svelte/i, category: 'frontend', tech: 'svelte' },
    
    // Styling
    { pattern: /tailwind/i, category: 'frontend', tech: 'tailwindcss' },
    { pattern: /bootstrap/i, category: 'frontend', tech: 'bootstrap' },
    { pattern: /material.ui|mui/i, category: 'frontend', tech: 'mui' },
    
    // Backend
    { pattern: /node\.?js|express/i, category: 'backend', tech: 'nodejs' },
    { pattern: /python|django|flask/i, category: 'backend', tech: 'python' },
    { pattern: /php|laravel/i, category: 'backend', tech: 'php' },
    
    // Database
    { pattern: /mongodb|mongo/i, category: 'database', tech: 'mongodb' },
    { pattern: /postgres|postgresql/i, category: 'database', tech: 'postgresql' },
    { pattern: /mysql/i, category: 'database', tech: 'mysql' },
    { pattern: /supabase/i, category: 'database', tech: 'supabase' }
  ];

  private complexityIndicators = [
    { pattern: /simple|basique|basic|minimal/i, complexity: 'simple', weight: 1.0 },
    { pattern: /complexe|avancé|advanced|enterprise|professionnel/i, complexity: 'complex', weight: 1.0 },
    { pattern: /multi.?user|multi.?tenant|scalable|performance/i, complexity: 'enterprise', weight: 0.9 },
    { pattern: /auth|authentication|autorisation|sécurité|security/i, complexity: 'medium', weight: 0.7 }
  ];

  analyze(prompt: string): SemanticAnalysis {
    const analysis: SemanticAnalysis = {
      intent: '',
      domain: '',
      confidence: 0,
      entities: [],
      complexity: 'medium',
      targetAudience: 'small-business',
      keyFeatures: [],
      techPreferences: []
    };

    // 1. Analyse des intentions et domaines
    const intentResults = this.analyzeIntent(prompt);
    analysis.intent = intentResults.intent;
    analysis.domain = intentResults.domain;
    analysis.confidence = intentResults.confidence;

    // 2. Extraction des entités techniques
    analysis.techPreferences = this.extractTechPreferences(prompt);

    // 3. Analyse de la complexité
    analysis.complexity = this.determineComplexity(prompt);

    // 4. Détermination de l'audience cible
    analysis.targetAudience = this.determineTargetAudience(prompt);

    // 5. Extraction des fonctionnalités clés
    analysis.keyFeatures = this.extractKeyFeatures(prompt, analysis.domain);

    // 6. Enrichissement des entités
    analysis.entities = this.extractAllEntities(prompt, analysis);

    return analysis;
  }

  private analyzeIntent(prompt: string): { intent: string; domain: string; confidence: number } {
    let bestMatch = { intent: 'build_web_application', domain: 'app', confidence: 0.3 };

    for (const pattern of this.intentPatterns) {
      const matches = prompt.match(pattern.pattern);
      if (matches) {
        const confidence = Math.min(pattern.weight, 0.95);
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: pattern.intent,
            domain: pattern.domain,
            confidence
          };
        }
      }
    }

    return bestMatch;
  }

  private extractTechPreferences(prompt: string): Array<{
    category: 'frontend' | 'backend' | 'database' | 'deployment';
    preference: string;
    explicit: boolean;
  }> {
    const preferences: Array<{
      category: 'frontend' | 'backend' | 'database' | 'deployment';
      preference: string;
      explicit: boolean;
    }> = [];

    for (const tech of this.techPatterns) {
      if (tech.pattern.test(prompt)) {
        preferences.push({
          category: tech.category as 'frontend' | 'backend' | 'database' | 'deployment',
          preference: tech.tech,
          explicit: true
        });
      }
    }

    return preferences;
  }

  private determineComplexity(prompt: string): 'simple' | 'medium' | 'complex' | 'enterprise' {
    let complexity: 'simple' | 'medium' | 'complex' | 'enterprise' = 'medium';
    let bestScore = 0;

    for (const indicator of this.complexityIndicators) {
      if (indicator.pattern.test(prompt)) {
        if (indicator.weight > bestScore) {
          complexity = indicator.complexity as 'simple' | 'medium' | 'complex' | 'enterprise';
          bestScore = indicator.weight;
        }
      }
    }

    // Heuristiques supplémentaires basées sur la longueur et le contenu
    const words = prompt.split(/\s+/).length;
    const hasAdvancedFeatures = /api|database|auth|payment|notification|email|admin|dashboard/i.test(prompt);
    const hasEnterpriseFeatures = /multi-tenant|scalability|performance|security|audit|compliance/i.test(prompt);

    if (words > 100 || hasEnterpriseFeatures) {
      complexity = 'enterprise';
    } else if (words > 50 || hasAdvancedFeatures) {
      complexity = 'complex';
    } else if (words < 20 && /simple|basic|minimal/i.test(prompt)) {
      complexity = 'simple';
    }

    return complexity;
  }

  private determineTargetAudience(prompt: string): 'personal' | 'small-business' | 'enterprise' | 'developer' {
    if (/personal|personnel|privé|hobby/i.test(prompt)) return 'personal';
    if (/enterprise|entreprise|corporation|scalable|multi-tenant/i.test(prompt)) return 'enterprise';
    if (/developer|dev|api|sdk|library|framework/i.test(prompt)) return 'developer';
    return 'small-business';
  }

  private extractKeyFeatures(prompt: string, domain: string): string[] {
    const features: string[] = [];
    
    const featurePatterns = {
      common: [
        { pattern: /auth|authentication|login|signup/i, feature: 'authentication' },
        { pattern: /dashboard|admin|administration/i, feature: 'admin_dashboard' },
        { pattern: /notification|email|sms|alert/i, feature: 'notifications' },
        { pattern: /search|recherche|filter|filtrage/i, feature: 'search_filtering' },
        { pattern: /responsive|mobile|tablet/i, feature: 'responsive_design' }
      ],
      saas: [
        { pattern: /subscription|abonnement|billing|facturation/i, feature: 'subscription_management' },
        { pattern: /analytics|métriques|statistics|stats/i, feature: 'analytics' },
        { pattern: /multi.?tenant|multi.?user/i, feature: 'multi_tenancy' }
      ],
      ecommerce: [
        { pattern: /panier|cart|basket/i, feature: 'shopping_cart' },
        { pattern: /payment|paiement|checkout|commande/i, feature: 'payment_processing' },
        { pattern: /inventory|stock|produit/i, feature: 'inventory_management' }
      ],
      blog: [
        { pattern: /comment|commentaire|discussion/i, feature: 'comments_system' },
        { pattern: /tag|catégorie|category/i, feature: 'content_categorization' },
        { pattern: /seo|référencement|meta/i, feature: 'seo_optimization' }
      ],
      portfolio: [
        { pattern: /gallery|galerie|image|photo/i, feature: 'media_gallery' },
        { pattern: /contact|form|formulaire/i, feature: 'contact_form' },
        { pattern: /testimonial|témoignage|review/i, feature: 'testimonials' }
      ]
    };

    // Extraire les features communes
    for (const { pattern, feature } of featurePatterns.common) {
      if (pattern.test(prompt) && !features.includes(feature)) {
        features.push(feature);
      }
    }

    // Extraire les features spécifiques au domaine
    if (featurePatterns[domain as keyof typeof featurePatterns]) {
      for (const { pattern, feature } of featurePatterns[domain as keyof typeof featurePatterns]) {
        if (pattern.test(prompt) && !features.includes(feature)) {
          features.push(feature);
        }
      }
    }

    return features;
  }

  private extractAllEntities(prompt: string, analysis: SemanticAnalysis): Array<{
    type: 'feature' | 'tech' | 'style' | 'target' | 'complexity';
    value: string;
    confidence: number;
  }> {
    const entities: Array<{
      type: 'feature' | 'tech' | 'style' | 'target' | 'complexity';
      value: string;
      confidence: number;
    }> = [];

    // Entités de fonctionnalités
    for (const feature of analysis.keyFeatures) {
      entities.push({
        type: 'feature',
        value: feature,
        confidence: 0.8
      });
    }

    // Entités techniques
    for (const tech of analysis.techPreferences) {
      entities.push({
        type: 'tech',
        value: tech.preference,
        confidence: tech.explicit ? 0.9 : 0.6
      });
    }

    // Entité complexité
    entities.push({
      type: 'complexity',
      value: analysis.complexity,
      confidence: 0.7
    });

    // Entité audience cible
    entities.push({
      type: 'target',
      value: analysis.targetAudience,
      confidence: 0.6
    });

    return entities;
  }
}