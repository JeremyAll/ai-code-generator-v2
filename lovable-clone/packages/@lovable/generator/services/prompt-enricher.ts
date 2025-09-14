import { Logger } from '../utils/logger.js';

export interface UserInput {
  type: string;
  scope: string;
  description: string;
  tech: string;
  style: string;
  images: string[];
}

export interface VisualContext {
  colors: string[];
  style: string;
  components: string[];
  layout: string;
}

interface DomainTemplate {
  structure: string[];
  colors: string[];
  images: string[];
  layout: string;
  components: string[];
}

const DOMAIN_TEMPLATES: Record<string, DomainTemplate> = {
  'e-commerce': {
    structure: ['hero-shop', 'products-grid', 'cart', 'checkout', 'testimonials'],
    colors: ['#10b981', '#f59e0b'], // vert/orange commerce
    images: ['products', 'shopping', 'delivery', 'payment', 'customer-service'],
    layout: 'grid-focused',
    components: ['ProductCard', 'CartButton', 'PriceTag', 'Rating', 'PaymentForm']
  },
  'portfolio': {
    structure: ['hero-minimal', 'projects-masonry', 'skills', 'about', 'contact'],
    colors: ['#1f2937', '#fbbf24'], // noir/jaune créatif
    images: ['workspace', 'design', 'creative', 'developer', 'project'],
    layout: 'masonry-grid',
    components: ['ProjectCard', 'SkillBadge', 'ContactForm', 'SocialLinks']
  },
  'saas': {
    structure: ['hero-gradient', 'features-grid', 'pricing-tiers', 'testimonials', 'cta'],
    colors: ['#6366f1', '#ec4899'], // indigo/rose tech
    images: ['dashboard', 'analytics', 'team', 'technology', 'growth'],
    layout: 'feature-focused',
    components: ['FeatureCard', 'PricingCard', 'TestimonialCard', 'CTAButton']
  },
  'blog': {
    structure: ['hero-editorial', 'featured-posts', 'categories', 'recent-posts', 'newsletter'],
    colors: ['#0f172a', '#0ea5e9'], // slate/bleu éditorial
    images: ['writing', 'articles', 'reading', 'editorial', 'journalism'],
    layout: 'editorial-grid',
    components: ['PostCard', 'CategoryTag', 'AuthorBio', 'NewsletterForm']
  },
  'restaurant': {
    structure: ['hero-food', 'menu-categories', 'chef-special', 'location', 'reservation'],
    colors: ['#dc2626', '#f59e0b'], // rouge/orange appétissant
    images: ['food', 'restaurant', 'chef', 'dining', 'cuisine'],
    layout: 'menu-focused',
    components: ['MenuCard', 'ReservationForm', 'LocationMap', 'ReviewCard']
  }
};

export class SmartPromptEnricher {
  private logger: Logger;
  private domainTemplates = DOMAIN_TEMPLATES;

  constructor() {
    this.logger = new Logger();
  }

  async enrich(userInput: UserInput): Promise<string> {
    const { type, scope, description, tech, style, images } = userInput;
    
    this.logger.log('INFO', 'Enrichissement intelligent du prompt', {
      type,
      scope,
      descriptionLength: description.length,
      tech,
      style,
      imagesCount: images.length
    });
    
    // 🎯 DÉTECTION ET APPLICATION DU TEMPLATE DOMAINE
    const detectedDomain = this.detectDomainFromDescription(description);
    const template = this.getDomainTemplate(detectedDomain);
    
    this.logger.log('INFO', `🎨 Template ${detectedDomain} détecté`, template);
    
    // Base enrichment selon le type AVEC template domaine
    let enrichedPrompt = this.getBasePromptWithDomain(type, scope, template);
    
    // Ajout spécifications techniques
    enrichedPrompt += this.getTechStackSpecs(tech, style);
    
    // Ajout template spécifique au domaine
    enrichedPrompt += this.getDomainSpecificPrompt(template);
    
    // Détection de templates spéciaux
    const enrichedDescription = this.detectAndEnrichSpecialTemplates(description);
    enrichedPrompt += `\n\nDescription utilisateur: ${enrichedDescription}`;
    
    // Si description courte, on enrichit massivement
    if (enrichedDescription.length < 100) {
      this.logger.log('INFO', 'Description courte détectée, enrichissement automatique');
      enrichedPrompt += this.getTypeSpecificFeatures(type);
    }
    
    // Si images uploadées, analyse visuelle
    if (images.length > 0) {
      this.logger.log('INFO', `Analyse de ${images.length} images de référence`);
      enrichedPrompt += this.getVisualReferencePrompt(images.length);
    }
    
    // Ajout des best practices finales
    enrichedPrompt += this.getBestPracticesPrompt(type, scope);
    
    this.logger.log('INFO', 'Prompt enrichi généré', {
      originalLength: description.length,
      enrichedLength: enrichedPrompt.length,
      enrichmentRatio: (enrichedPrompt.length / description.length).toFixed(1)
    });
    
    return enrichedPrompt;
  }
  
  private getBasePrompt(type: string, scope: string): string {
    const prompts: { [key: string]: string } = {
      'webapp-complete': `
Créer une application web complète et professionnelle avec:

ARCHITECTURE & STRUCTURE:
- 15-30 pages fonctionnelles bien organisées
- Architecture modulaire et scalable
- Routing dynamique avec protection des routes
- State management centralisé (Redux/Zustand)
- Structure de dossiers claire et maintenable

AUTHENTIFICATION & SÉCURITÉ:
- Système d'auth complet (register, login, forgot password, reset)
- Gestion des rôles et permissions
- Protection CSRF et validation côté serveur
- Sessions sécurisées avec JWT
- 2FA optionnel

INTERFACE UTILISATEUR:
- Dashboard utilisateur personnalisable
- Interface admin complète avec CRUD
- Design responsive et accessible (WCAG 2.1)
- Animations fluides et micro-interactions
- Mode sombre/clair

FONCTIONNALITÉS BACKEND:
- API RESTful complète avec documentation
- Base de données optimisée avec relations
- Cache Redis pour les performances
- Upload de fichiers avec validation
- Logs et monitoring intégrés

QUALITÉ & TESTS:
- Tests unitaires et d'intégration
- Validation des formulaires côté client/serveur
- Gestion d'erreurs robuste
- Performance optimisée (lazy loading, compression)
- SEO et PWA ready`,

      'webapp-mvp': `
Créer un MVP fonctionnel et efficace avec:

FONCTIONNALITÉS CORE:
- 5-10 pages essentielles bien définies
- Features principales uniquement (80/20 rule)
- Auth basique sécurisée (login/register)
- Dashboard utilisateur simple
- CRUD de base pour les entités principales

DESIGN & UX:
- Interface moderne et intuitive
- Design responsive mobile-first
- Composants réutilisables
- Navigation claire et logique

TECHNIQUE:
- Architecture simple mais solide
- API RESTful de base
- Base de données optimisée
- Validation des données
- Déploiement facile`,

      'landing-landing': `
Créer une landing page premium high-conversion avec:

SECTIONS ESSENTIELLES:
- Hero section impactante avec value proposition claire
- Features grid avec bénéfices utilisateur
- Social proof (testimonials, logos clients)
- Pricing table transparent et optimisé
- CTA optimisés et bien placés
- FAQ pour lever les objections

DESIGN & ANIMATIONS:
- Animations smooth et engageantes
- Scroll-triggered effects
- Parallax subtil
- Micro-interactions premium
- Design moderne et professionnel

CONVERSION:
- A/B testing ready
- Analytics intégré
- Lead magnets
- Exit-intent popup
- Newsletter signup
- Contact form optimisé`,

      'dashboard-complete': `
Créer un dashboard analytics professionnel avec:

VISUALISATIONS:
- Vue d'ensemble avec KPIs temps réel
- Graphiques interactifs (line, bar, pie, heatmap, scatter)
- Tables de données avec tri/filtrage avancé
- Comparaisons période à période
- Métriques de performance

FONCTIONNALITÉS:
- Export PDF/CSV/Excel
- Rapports programmables
- Alertes et notifications
- Drill-down sur les données
- Real-time updates via WebSocket
- Bookmarks et vues sauvegardées

INTERFACE:
- Dark/light mode
- Dashboard personnalisable
- Responsive design
- Sidebar navigation
- Filtres globaux
- Widget drag & drop`,

      'ecommerce-complete': `
Créer une boutique e-commerce complète avec:

CATALOGUE & PRODUITS:
- Catalogue avec filtres avancés (prix, catégorie, marque, ratings)
- Recherche intelligente avec suggestions
- Fiches produits détaillées avec galerie
- Variations produits (taille, couleur)
- Stock management temps réel
- Reviews et ratings clients

EXPÉRIENCE D'ACHAT:
- Panier persistant multi-device
- Checkout optimisé multi-étapes
- Calcul shipping dynamique
- Coupons et codes promo
- Wishlist et comparateur
- Recommandations IA

GESTION:
- Admin panel complet
- Gestion commandes et retours
- Analytics ventes détaillées
- CRM intégré
- Multi-payment (Stripe, PayPal)
- Inventory management`,

      'mobile-complete': `
Créer une app mobile native-like avec:

EXPÉRIENCE MOBILE:
- Navigation native avec gestures
- Animations fluides 60fps
- Interface adaptée au tactile
- Pull-to-refresh
- Infinite scroll optimisé

FONCTIONNALITÉS DEVICE:
- Offline mode avec sync
- Push notifications
- Camera/Gallery access
- Geolocation et maps
- Contacts et calendrier
- Biometric auth

PERFORMANCE:
- Lazy loading images
- Background sync
- Local storage intelligent
- Network status handling
- Battery usage optimisé`,

      'internal-complete': `
Créer un outil métier professionnel avec:

GESTION:
- CRUD avancé avec bulk actions
- Workflow et validation métier
- Reporting et analytics
- Import/Export données
- Audit trail complet

COLLABORATION:
- Multi-utilisateurs avec rôles
- Commentaires et historique
- Notifications intelligentes
- Partage et permissions
- Version control des documents

INTÉGRATIONS:
- API pour outils existants
- Single Sign-On (SSO)
- Webhooks et automatisation
- Export vers Excel/PDF
- Synchronisation données`
    };
    
    const key = `${type}-${scope}`;
    return prompts[key] || prompts['webapp-complete'];
  }

  private getTechStackSpecs(tech: string, style: string): string {
    const techSpecs: { [key: string]: string } = {
      'nextjs': `
STACK TECHNIQUE:
- Framework: Next.js 14 avec App Router
- TypeScript strict mode activé
- Styling: Tailwind CSS avec custom design system
- Database: Prisma avec PostgreSQL
- Auth: NextAuth.js v5 avec providers multiples
- State: Zustand pour state management
- UI: shadcn/ui + Radix primitives
- Validation: Zod schemas
- API: Route handlers avec middleware
- Deployment: Vercel optimized`,

      'react': `
STACK TECHNIQUE:
- Framework: React 18 avec Vite
- TypeScript avec types stricts
- Styling: Styled-components + Tailwind
- Routing: React Router v6
- State: Redux Toolkit + RTK Query
- UI: Material-UI v5 ou Chakra UI
- Forms: React Hook Form + Yup
- Testing: Vitest + React Testing Library
- Build: Vite avec optimizations`,

      'vue': `
STACK TECHNIQUE:
- Framework: Vue 3 Composition API
- TypeScript avec Vue TSC
- Styling: Vue 3 + Tailwind + Headless UI
- Routing: Vue Router 4
- State: Pinia store
- UI: PrimeVue ou Naive UI
- Forms: VeeValidate + Yup
- Build: Vite optimized`,

      'svelte': `
STACK TECHNIQUE:
- Framework: SvelteKit avec TypeScript
- Styling: Tailwind + Svelte transitions
- State: Svelte stores + page stores
- UI: Skeleton UI ou Carbon Components
- Forms: Superforms avec Zod
- Database: Prisma + Supabase
- Deployment: Vercel/Netlify adapter`,

      'remix': `
STACK TECHNIQUE:
- Framework: Remix avec TypeScript
- Styling: Tailwind CSS
- Database: Prisma avec relations
- Auth: Remix Auth strategies
- UI: Reach UI + custom components
- Forms: Remix forms avec validation
- Sessions: Cookie-based
- Deployment: Fly.io ou Railway`
    };

    const styleSpecs: { [key: string]: string } = {
      'modern': `
DESIGN MODERNE:
- Palette: Gradients et couleurs vibrantes
- Typography: Font stack moderne (Inter, SF Pro)
- Layout: Grid CSS et Flexbox avancé
- Animations: Framer Motion ou CSS transitions
- Components: Glass morphism et neumorphism
- Spacing: 8pt grid system`,

      'minimal': `
DESIGN MINIMALISTE:
- Palette: Monochromatique avec accents
- Typography: Espacement généreux
- Layout: Beaucoup de whitespace
- Animations: Subtiles et purposeful
- Components: Clean et functional
- Focus: Contenu avant tout`,

      'playful': `
DESIGN LUDIQUE:
- Palette: Couleurs vives et contrastées
- Typography: Fonts expressives
- Layout: Asymétrique et dynamique
- Animations: Bouncy et expressives
- Components: Rounded corners, shadows
- Interactions: Fun micro-animations`,

      'corporate': `
DESIGN CORPORATE:
- Palette: Couleurs professionnelles
- Typography: Lisibilité et hiérarchie
- Layout: Structure et consistance
- Animations: Subtiles et professionnelles
- Components: Clean et accessible
- Branding: Cohérent et sérieux`,

      'glassmorphism': `
DESIGN GLASSMORPHISM:
- Effects: Backdrop blur et transparence
- Palette: Couleurs avec alpha
- Layout: Layering et profondeur
- Animations: Smooth transitions
- Components: Glass cards et overlays
- Lighting: Subtle gradients et glows`
    };

    return (techSpecs[tech] || techSpecs['nextjs']) + '\n' + (styleSpecs[style] || styleSpecs['modern']);
  }

  private getTypeSpecificFeatures(type: string): string {
    const features: { [key: string]: string } = {
      'webapp': `

FONCTIONNALITÉS AUTO-AJOUTÉES:
- Notifications temps réel avec toast/banner
- Search global avec autocomplete intelligent
- Profil utilisateur avec avatar upload
- Settings avec préférences sauvegardées
- Export/Import données (CSV, JSON, PDF)
- Intégrations OAuth (Google, GitHub, LinkedIn)
- PWA avec service worker et offline mode
- SEO optimisé avec meta tags dynamiques
- Analytics intégré (GA4, Posthog)
- Command palette (Cmd+K) pour navigation rapide`,

      'dashboard': `

WIDGETS DASHBOARD AUTO-AJOUTÉS:
- Real-time metrics avec WebSocket updates
- Graphiques comparatifs période sur période
- Heatmaps d'activité utilisateur
- Funnel de conversion avec drill-down
- User activity timeline avec filtres
- Alertes configurables avec seuils
- Rapports programmés par email
- Widget personnalisables par drag & drop
- Export dashboards en PDF branded
- Annotations sur graphiques pour contexte`,

      'ecommerce': `

FONCTIONNALITÉS E-COMMERCE AUTO-AJOUTÉES:
- Recommandations produits avec IA collaborative filtering
- Comparateur de produits side-by-side
- Programme fidélité avec points et rewards
- Coupons avec conditions avancées
- Multi-devise avec taux temps réel
- Calcul shipping dynamique par zones
- Abandoned cart recovery avec emails
- Inventory management avec low-stock alerts
- Reviews avec photos et verification
- Cross-selling et upselling intelligent`,

      'landing': `

SECTIONS LANDING AUTO-AJOUTÉES:
- Social proof avec logos clients animés
- FAQ accordion avec search intégré
- Contact form multi-étapes avec validation
- Newsletter signup avec lead magnets
- Blog preview avec articles récents
- Case studies avec métriques
- Trust badges et certifications
- Exit-intent popup avec offre spéciale
- Live chat integration
- A/B testing ready pour optimisation`,

      'mobile': `

FONCTIONNALITÉS MOBILE AUTO-AJOUTÉES:
- Pull-to-refresh sur listes
- Infinite scroll avec skeleton loading
- Swipe gestures pour actions
- Haptic feedback sur interactions
- Voice commands et speech-to-text
- QR code scanner intégré
- Share API pour contenu social
- Background app refresh
- Local notifications scheduling
- Biometric authentication (TouchID/FaceID)`,

      'internal': `

FONCTIONNALITÉS MÉTIER AUTO-AJOUTÉES:
- Bulk operations avec progress tracking
- Advanced filtering et search
- Data validation avec business rules
- Audit trail avec user tracking
- Scheduled reports via email
- Role-based permissions granulaires
- Comment system avec mentions
- Document versioning et rollback
- Integration APIs avec rate limiting
- Custom fields configurables par admin`
    };

    return features[type] || features['webapp'];
  }

  private getVisualReferencePrompt(imageCount: number): string {
    return `

RÉFÉRENCES VISUELLES FOURNIES:
- ${imageCount} image(s) de référence uploadée(s)
- Analyser et reproduire le style visuel des images
- Respecter la palette de couleurs détectée
- Adapter les composants UI similaires
- Maintenir la cohérence avec l'inspiration fournie
- Extraire les patterns de design et les appliquer
- Utiliser les proportions et layouts similaires

IMPORTANT: Les références visuelles ont priorité sur les styles par défaut.`;
  }

  private getBestPracticesPrompt(type: string, scope: string): string {
    return `

STANDARDS DE QUALITÉ REQUIS:
- Code clean avec commentaires en français
- Error handling robuste avec messages utilisateur
- Loading states pour toutes les actions async
- Validation côté client ET serveur
- Responsive design mobile-first
- Accessibilité WCAG 2.1 niveau AA
- Performance optimisée (Core Web Vitals)
- SEO best practices appliquées
- Security headers et validation input
- Tests automatisés pour fonctionnalités critiques

FORMAT DE RÉPONSE:
- Génère TOUS les fichiers nécessaires
- Structure claire des dossiers
- README.md avec instructions setup
- Package.json avec scripts optimisés
- Configuration development/production
- Documentation API si applicable

DONNÉES DE TEST:
- Génère des données réalistes et cohérentes
- Utilise des noms français authentiques
- Crée du contenu contextuel au domaine
- Intègre des images placeholder de qualité
- Simule des scénarios d'usage réels`;
  }

  /**
   * Détection et enrichissement des templates spéciaux
   */
  private detectAndEnrichSpecialTemplates(description: string): string {
    const lower = description.toLowerCase();
    
    // Détection Lovable/Bolt clone
    if (lower.includes('lovable') || lower.includes('bolt') || 
        (lower.includes('générateur') && lower.includes('code')) ||
        (lower.includes('plateforme') && lower.includes('ia'))) {
      
      this.logger.log('INFO', '🎯 Template Lovable détecté - enrichissement spécialisé');
      
      return `
Créer une plateforme SaaS de génération d'applications IA avec:

INTERFACE PREMIUM:
- Split-screen moderne : sidebar chat (30%) + preview iframe (70%)
- Sidebar avec projets sauvegardés et historique
- Chat IA en temps réel avec streaming des messages
- Preview avec hot-reload pendant la génération
- File explorer intégré avec syntax highlighting

FEATURES CORE:
- Génération full-stack Next.js 14 + TypeScript
- Système de cache intelligent (composants réutilisables)
- Compression automatique des prompts (économie tokens)
- Templates pré-générés pour démarrage rapide
- Export code ZIP en un clic
- Déploiement Vercel/Netlify intégré

ARCHITECTURE TECHNIQUE:
- Backend: Next.js API routes + Anthropic Claude
- Frontend: React 18 + Tailwind + Framer Motion
- Database: Prisma + PostgreSQL pour projets/historique
- Auth: NextAuth.js avec Google/GitHub
- Storage: Vercel Blob pour assets

DESIGN SYSTEM PREMIUM:
- Palette: noir (#0a0a0b), violet (#7c3aed), gris (#94949c)
- Glassmorphism sur toutes les cards et overlays
- Animations fluides avec Framer Motion
- Typography: Inter pour UI, JetBrains Mono pour code
- Dark mode natif avec transitions smooth

PAGES STRUCTURE:
- Landing page avec hero section + features showcase
- /generate avec interface de génération temps réel
- /projects pour gestion projets utilisateur
- /settings pour configuration compte et préférences
- /pricing avec plans freemium/pro/enterprise

MONETIZATION STRATEGY:
- Freemium: 3 projets/mois, templates de base
- Pro (€9/mois): 50 projets, tous templates, priority support
- Team (€29/mois): unlimited projects, collaboration, custom branding
- Enterprise (€99/mois): white-label, API access, SLA

AVANTAGES CONCURRENTIELS:
- 50% moins cher que Lovable grâce au cache intelligent
- Génération 3-étapes évitant les timeouts
- Templates métier spécialisés (e-commerce, SaaS, etc.)
- Support français natif avec documentation

FEATURES AVANCÉES:
- Custom components library par utilisateur
- Brand guidelines upload avec auto-application
- Multi-framework support (Next.js, Nuxt, SvelteKit)
- Advanced animations avec presets configurables
- SEO optimization intégrée automatique
- Performance monitoring intégré

${description}`;
    }
    
    // Détection autres templates populaires
    if (lower.includes('notion') || lower.includes('airtable')) {
      return this.enrichNotionClone(description);
    }
    
    if (lower.includes('figma') || lower.includes('design tool')) {
      return this.enrichDesignTool(description);
    }
    
    if (lower.includes('shopify') || lower.includes('e-commerce')) {
      return this.enrichEcommerce(description);
    }
    
    return description;
  }

  /**
   * Enrichissement pour clone Notion/Airtable
   */
  private enrichNotionClone(description: string): string {
    return `
Créer une plateforme de gestion de contenus collaborative avec:

EDITOR FEATURES:
- Rich text editor avec blocks modulaires
- Drag & drop pour réorganisation
- Templates de pages pré-configurés  
- Système de tags et organisation hiérarchique

COLLABORATION:
- Permissions granulaires par page/workspace
- Commentaires en temps réel
- Historique des versions avec rollback
- Notifications intelligentes

DATABASE & VIEWS:
- Tables relationnelles avec types de champs custom
- Vues multiples (kanban, calendar, gallery, timeline)
- Filtres et tris avancés
- Formules et calculs automatiques

${description}`;
  }

  /**
   * Enrichissement pour outil de design
   */
  private enrichDesignTool(description: string): string {
    return `
Créer un outil de design collaboratif avec:

CANVAS & TOOLS:
- Canvas infini avec zoom/pan fluide
- Outils vectoriels (rectangle, circle, pen, text)
- Système de calques avec organisation
- Grille et guides magnétiques

DESIGN SYSTEM:
- Bibliothèque de composants réutilisables
- Variables de design (couleurs, espacements, typo)
- Auto-layout intelligent
- Export multi-formats (PNG, SVG, PDF)

COLLABORATION TEMPS RÉEL:
- Multi-curseurs avec avatars utilisateurs
- Commentaires contextuels sur éléments
- Versions et branching
- Intégrations développeur (Figma tokens)

${description}`;
  }

  /**
   * Enrichissement pour e-commerce
   */
  private enrichEcommerce(description: string): string {
    return `
Créer une plateforme e-commerce complète avec:

STOREFRONT PREMIUM:
- Design responsive avec animations premium
- Product catalog avec filtres avancés
- Search intelligent avec suggestions
- Wishlist et comparateur produits

CHECKOUT OPTIMISÉ:
- One-page checkout avec auto-completion
- Multi-payment (Stripe, PayPal, Apple Pay)
- Calcul shipping temps réel
- Abandoned cart recovery automatique

ADMIN DASHBOARD:
- Analytics ventes temps réel
- Gestion inventory avec alerts stock
- Customer management avec segmentation
- Marketing automation (emails, coupons)

FEATURES AVANCÉES:
- SEO optimization automatique
- Multi-currency avec taux live
- Reviews système avec modération
- Recommandations IA basées sur comportement

${description}`;
  }

  /**
   * Calcule le coût en crédits selon la complexité
   */
  static calculateCredits(type: string, scope: string, hasImages: boolean): number {
    const baseCosts: { [key: string]: { [key: string]: number } } = {
      'landing': { landing: 0.5, mvp: 0.75, complete: 1 },
      'webapp': { landing: 1, mvp: 1.5, complete: 2 },
      'mobile': { landing: 1, mvp: 2, complete: 3 },
      'dashboard': { landing: 0.75, mvp: 1.5, complete: 2 },
      'ecommerce': { landing: 1, mvp: 2, complete: 3 },
      'internal': { landing: 0.5, mvp: 1, complete: 1.5 }
    };

    let credits = baseCosts[type]?.[scope] || 1;

    // Surcoût pour analyse d'images
    if (hasImages) credits += 0.5;

    return Math.round(credits * 10) / 10; // Arrondi à 1 décimale
  }

  /**
   * Détecte le domaine d'application depuis la description
   */
  private detectDomainFromDescription(description: string): string {
    const desc = description.toLowerCase();
    
    // Mots-clés spécifiques par domaine
    if (desc.includes('shop') || desc.includes('store') || desc.includes('product') || desc.includes('cart') || desc.includes('ecommerce') || desc.includes('e-commerce')) {
      return 'e-commerce';
    }
    if (desc.includes('portfolio') || desc.includes('project') || desc.includes('work') || desc.includes('creative') || desc.includes('designer') || desc.includes('developer')) {
      return 'portfolio';
    }
    if (desc.includes('saas') || desc.includes('dashboard') || desc.includes('analytics') || desc.includes('subscription') || desc.includes('pricing') || desc.includes('feature')) {
      return 'saas';
    }
    if (desc.includes('blog') || desc.includes('article') || desc.includes('post') || desc.includes('news') || desc.includes('editorial') || desc.includes('content')) {
      return 'blog';
    }
    if (desc.includes('restaurant') || desc.includes('menu') || desc.includes('food') || desc.includes('chef') || desc.includes('dining') || desc.includes('reservation')) {
      return 'restaurant';
    }
    
    return 'saas'; // Par défaut
  }

  /**
   * Récupère le template pour un domaine
   */
  private getDomainTemplate(domain: string): DomainTemplate {
    return this.domainTemplates[domain] || this.domainTemplates['saas'];
  }

  /**
   * Génère un prompt de base enrichi avec le template domaine
   */
  private getBasePromptWithDomain(type: string, scope: string, template: DomainTemplate): string {
    return `
🎯 TEMPLATE ${type.toUpperCase()} - ${scope.toUpperCase()}

STRUCTURE SPÉCIALISÉE:
${template.structure.map(section => `- ${section}`).join('\n')}

PALETTE COULEURS:
- Primaire: ${template.colors[0]}
- Secondaire: ${template.colors[1]}

COMPOSANTS REQUIS:
${template.components.map(comp => `- ${comp}`).join('\n')}

LAYOUT STYLE: ${template.layout}

IMAGES CONTEXTUELLES REQUISES:
${template.images.map(img => `- ${img} (via Unsplash)`).join('\n')}
    `.trim();
  }

  /**
   * Génère un prompt spécifique au domaine
   */
  private getDomainSpecificPrompt(template: DomainTemplate): string {
    return `

DIRECTIVES DOMAINE SPÉCIFIQUES:
- Utilise OBLIGATOIREMENT les couleurs définies
- Implémente TOUS les composants listés
- Respecte la structure de page définie
- Intègre des images Unsplash pour chaque thème: ${template.images.join(', ')}
- Layout optimisé: ${template.layout}

VALIDATION DOMAINE:
✅ Structure conforme au template
✅ Couleurs cohérentes
✅ Composants spécialisés
✅ Images contextuelles Unsplash
    `.trim();
  }
}

/**
 * Fonction utilitaire pour traiter les images uploadées
 * (Placeholder pour future intégration GPT-4V)
 */
export async function processUploadedImages(images: string[]): Promise<VisualContext> {
  // TODO: Intégrer avec GPT-4V pour analyser les images
  // Pour l'instant, retourne une analyse basique
  
  return {
    colors: ['#7c3aed', '#0a0a0b', '#ffffff'], // Couleurs par défaut
    style: 'modern',
    components: ['navbar-sticky', 'hero-centered', 'cards-grid'],
    layout: 'topnav'
  };
}

/**
 * Enrichit le prompt avec le contexte visuel
 */
export function enrichWithVisualContext(prompt: string, visualContext: VisualContext): string {
  return `
${prompt}

DESIGN REQUIREMENTS (from uploaded images):
- Primary colors: ${visualContext.colors.join(', ')}
- UI Style: ${visualContext.style}
- Use these UI patterns: ${visualContext.components.join(', ')}
- Layout structure: ${visualContext.layout}

IMPORTANT: Match the visual style of the uploaded references exactly.
  `.trim();
}
