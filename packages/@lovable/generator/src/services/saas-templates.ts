import { Logger } from '../utils/logger.js';

export interface SaasTemplate {
  id: string;
  name: string;
  category: 'generator' | 'productivity' | 'design' | 'ecommerce' | 'social';
  description: string;
  tags: string[];
  features: string[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string;
    auth: string;
  };
  pricing: {
    freemium: boolean;
    plans: {
      name: string;
      price: number;
      features: string[];
    }[];
  };
  components: string[];
  pages: string[];
  enrichedPrompt: string;
}

export class SaasTemplateManager {
  private logger: Logger;
  private templates: Map<string, SaasTemplate> = new Map();

  constructor() {
    this.logger = new Logger();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templates: SaasTemplate[] = [
      {
        id: 'lovable-clone',
        name: 'Code Generator Platform',
        category: 'generator',
        description: 'Plateforme SaaS de génération d\'applications avec IA comme Lovable/Bolt.new',
        tags: ['ai', 'code-generation', 'saas', 'developer-tools'],
        features: [
          'Split-screen interface (chat + preview)',
          'Real-time code generation',
          'Multi-framework support',
          'Project management',
          'Export & deployment',
          'Template library'
        ],
        techStack: {
          frontend: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
          backend: ['Next.js API Routes', 'Anthropic Claude', 'WebSocket'],
          database: 'PostgreSQL with Prisma',
          auth: 'NextAuth.js'
        },
        pricing: {
          freemium: true,
          plans: [
            { name: 'Free', price: 0, features: ['3 projects/month', 'Basic templates'] },
            { name: 'Pro', price: 9, features: ['50 projects/month', 'All templates', 'Priority support'] },
            { name: 'Team', price: 29, features: ['Unlimited projects', 'Collaboration', 'Custom branding'] }
          ]
        },
        components: [
          'SplitLayout', 'ChatInterface', 'PreviewFrame', 'ProjectSidebar',
          'CodeEditor', 'FileExplorer', 'TemplateGallery', 'ExportModal'
        ],
        pages: [
          'Landing', 'Generate', 'Projects', 'Templates', 'Settings', 'Pricing', 'Dashboard'
        ],
        enrichedPrompt: `Créer une plateforme SaaS de génération d'applications IA avec interface split-screen moderne, système de chat temps réel, preview live, gestion de projets, templates pré-configurés, et monétisation freemium.`
      },

      {
        id: 'notion-clone',
        name: 'Collaborative Workspace',
        category: 'productivity',
        description: 'Plateforme collaborative comme Notion avec éditeur riche et bases de données',
        tags: ['collaboration', 'workspace', 'editor', 'database'],
        features: [
          'Rich text editor avec blocks',
          'Database avec vues multiples',
          'Collaboration temps réel',
          'Templates et permissions',
          'Import/Export avancé',
          'API et intégrations'
        ],
        techStack: {
          frontend: ['Next.js 14', 'React 18', 'Slate.js', 'Tailwind CSS'],
          backend: ['Next.js API', 'Socket.io', 'Redis'],
          database: 'PostgreSQL with Prisma',
          auth: 'NextAuth.js'
        },
        pricing: {
          freemium: true,
          plans: [
            { name: 'Personal', price: 0, features: ['Unlimited pages', '5MB uploads'] },
            { name: 'Pro', price: 4, features: ['Unlimited uploads', 'Version history'] },
            { name: 'Team', price: 8, features: ['Team collaboration', 'Admin tools'] }
          ]
        },
        components: [
          'BlockEditor', 'DatabaseView', 'KanbanBoard', 'Calendar',
          'PageTree', 'CommentSystem', 'PermissionsPanel', 'TemplateLibrary'
        ],
        pages: [
          'Workspace', 'Page', 'Database', 'Templates', 'Trash', 'Settings', 'Team'
        ],
        enrichedPrompt: `Créer une plateforme collaborative avec éditeur de contenu par blocks, système de base de données avec vues multiples, collaboration temps réel, et gestion d'équipes.`
      },

      {
        id: 'figma-clone',
        name: 'Design Collaboration Tool',
        category: 'design',
        description: 'Outil de design collaboratif avec canvas infini et outils vectoriels',
        tags: ['design', 'collaboration', 'vector', 'prototyping'],
        features: [
          'Canvas infini avec outils vectoriels',
          'Collaboration multi-curseurs',
          'Système de composants',
          'Auto-layout et contraintes',
          'Prototypage interactif',
          'Export multi-formats'
        ],
        techStack: {
          frontend: ['Next.js 14', 'React 18', 'Fabric.js', 'Tailwind CSS'],
          backend: ['Next.js API', 'WebSocket', 'Canvas API'],
          database: 'PostgreSQL with Prisma',
          auth: 'NextAuth.js'
        },
        pricing: {
          freemium: true,
          plans: [
            { name: 'Starter', price: 0, features: ['3 projects', 'Basic tools'] },
            { name: 'Professional', price: 12, features: ['Unlimited projects', 'Advanced tools'] },
            { name: 'Organization', price: 45, features: ['Team features', 'Design systems'] }
          ]
        },
        components: [
          'Canvas', 'ToolsPanel', 'LayersPanel', 'PropertiesPanel',
          'ComponentLibrary', 'PrototypeMode', 'CommentOverlay', 'ExportModal'
        ],
        pages: [
          'Dashboard', 'Editor', 'Prototype', 'Components', 'Team', 'Version History'
        ],
        enrichedPrompt: `Créer un outil de design collaboratif avec canvas infini, outils vectoriels, système de composants, collaboration temps réel multi-curseurs, et prototypage interactif.`
      },

      {
        id: 'shopify-clone',
        name: 'E-commerce Platform',
        category: 'ecommerce',
        description: 'Plateforme e-commerce complète avec storefront et admin dashboard',
        tags: ['ecommerce', 'storefront', 'admin', 'payment'],
        features: [
          'Storefront responsive avec panier',
          'Admin dashboard complet',
          'Gestion produits et inventory',
          'Système de paiement intégré',
          'Analytics et rapports',
          'Multi-devise et shipping'
        ],
        techStack: {
          frontend: ['Next.js 14', 'React 18', 'Tailwind CSS', 'Recharts'],
          backend: ['Next.js API', 'Stripe', 'Email services'],
          database: 'PostgreSQL with Prisma',
          auth: 'NextAuth.js'
        },
        pricing: {
          freemium: false,
          plans: [
            { name: 'Basic', price: 29, features: ['Online store', 'Unlimited products'] },
            { name: 'Shopify', price: 79, features: ['Professional reports', 'Gift cards'] },
            { name: 'Advanced', price: 299, features: ['Advanced report builder', 'Third-party calculated shipping rates'] }
          ]
        },
        components: [
          'ProductGrid', 'ShoppingCart', 'CheckoutFlow', 'AdminDashboard',
          'OrderManagement', 'InventorySystem', 'PaymentGateway', 'CustomerPortal'
        ],
        pages: [
          'Home', 'Products', 'Product', 'Cart', 'Checkout', 'Account',
          'Admin Dashboard', 'Orders', 'Customers', 'Analytics'
        ],
        enrichedPrompt: `Créer une plateforme e-commerce avec storefront moderne, système de panier avancé, dashboard admin complet, gestion des commandes, et intégration paiement.`
      },

      {
        id: 'discord-clone',
        name: 'Team Communication Platform',
        category: 'social',
        description: 'Plateforme de communication d\'équipe avec chat, vocal et vidéo',
        tags: ['chat', 'communication', 'voice', 'video', 'teams'],
        features: [
          'Chat temps réel par channels',
          'Voice et vidéo calls',
          'Serveurs avec rôles',
          'Partage de fichiers',
          'Bots et intégrations',
          'Mobile responsive'
        ],
        techStack: {
          frontend: ['Next.js 14', 'React 18', 'Socket.io-client', 'WebRTC'],
          backend: ['Next.js API', 'Socket.io', 'WebRTC signaling'],
          database: 'PostgreSQL with Prisma',
          auth: 'NextAuth.js'
        },
        pricing: {
          freemium: true,
          plans: [
            { name: 'Free', price: 0, features: ['Unlimited messages', '8MB file uploads'] },
            { name: 'Nitro', price: 10, features: ['100MB uploads', 'HD video', 'Custom emoji'] },
            { name: 'Server Boost', price: 5, features: ['Enhanced audio', 'Custom server features'] }
          ]
        },
        components: [
          'ServerSidebar', 'ChannelList', 'ChatArea', 'VoicePanel',
          'UserList', 'MessageComposer', 'FileUpload', 'EmojiPicker'
        ],
        pages: [
          'Home', 'Server', 'DirectMessages', 'Settings', 'Nitro Store'
        ],
        enrichedPrompt: `Créer une plateforme de communication avec chat temps réel, appels vocaux/vidéo, système de serveurs et channels, et gestion des rôles utilisateurs.`
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    this.logger.log('INFO', `${templates.length} templates SaaS initialisés`);
  }

  /**
   * Recherche de templates par mots-clés
   */
  findTemplateByKeywords(description: string): SaasTemplate | null {
    const keywords = description.toLowerCase().split(/\s+/);
    
    // Mapping de mots-clés vers templates
    const keywordMappings: { [key: string]: string } = {
      'lovable': 'lovable-clone',
      'bolt': 'lovable-clone',
      'code generator': 'lovable-clone',
      'générateur': 'lovable-clone',
      'notion': 'notion-clone',
      'airtable': 'notion-clone',
      'workspace': 'notion-clone',
      'figma': 'figma-clone',
      'design tool': 'figma-clone',
      'canvas': 'figma-clone',
      'shopify': 'shopify-clone',
      'e-commerce': 'shopify-clone',
      'ecommerce': 'shopify-clone',
      'discord': 'discord-clone',
      'slack': 'discord-clone',
      'chat': 'discord-clone'
    };

    // Score par template
    const templateScores = new Map<string, number>();

    for (const keyword of keywords) {
      for (const [pattern, templateId] of Object.entries(keywordMappings)) {
        if (keyword.includes(pattern) || pattern.includes(keyword)) {
          templateScores.set(templateId, (templateScores.get(templateId) || 0) + 1);
        }
      }
    }

    // Retourne le template avec le meilleur score
    let bestTemplate: string | null = null;
    let bestScore = 0;

    for (const [templateId, score] of templateScores) {
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = templateId;
      }
    }

    if (bestTemplate && bestScore >= 1) {
      this.logger.log('INFO', `Template détecté: ${bestTemplate} (score: ${bestScore})`);
      return this.templates.get(bestTemplate) || null;
    }

    return null;
  }

  /**
   * Récupère tous les templates d'une catégorie
   */
  getTemplatesByCategory(category: SaasTemplate['category']): SaasTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * Récupère un template par ID
   */
  getTemplate(id: string): SaasTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Liste tous les templates disponibles
   */
  getAllTemplates(): SaasTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Recherche templates par tags
   */
  searchByTags(tags: string[]): SaasTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => 
        tags.some(tag => 
          template.tags.some(templateTag => 
            templateTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
  }

  /**
   * Statistiques des templates
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    mostPopularTags: Array<{ tag: string; count: number }>;
  } {
    const stats = {
      total: this.templates.size,
      byCategory: {} as Record<string, number>,
      mostPopularTags: [] as Array<{ tag: string; count: number }>
    };

    // Statistiques par catégorie
    const categories = Array.from(this.templates.values()).map(t => t.category);
    for (const category of categories) {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    // Tags les plus populaires
    const tagCounts = new Map<string, number>();
    for (const template of this.templates.values()) {
      for (const tag of template.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    stats.mostPopularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }
}