import { Logger } from '../utils/logger.js';
import { AnthropicService } from './anthropic-service.js';
import { SmartPromptEnricher, UserInput } from './prompt-enricher.js';
import { ComponentCache } from './component-cache.js';
import { PromptCompressor } from './prompt-compressor.js';
import { EventEmitter } from 'events';

export interface StreamMessage {
  type: 'analysis' | 'cost-estimate' | 'cache-optimization' | 'compression' | 'step' | 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
  timestamp: number;
}

export interface CostEstimate {
  tokens: number;
  credits: number;
  breakdown: {
    step1: number;
    step2: number;
    cached: number;
  };
}

export class GenerationStream extends EventEmitter {
  private logger: Logger;
  private anthropicService: AnthropicService;
  private promptEnricher: SmartPromptEnricher;
  private componentCache: ComponentCache;
  private promptCompressor: PromptCompressor;

  constructor() {
    super();
    this.logger = new Logger();
    this.anthropicService = new AnthropicService();
    this.promptEnricher = new SmartPromptEnricher();
    this.componentCache = new ComponentCache();
    this.promptCompressor = new PromptCompressor();
  }

  /**
   * Lance la génération avec streaming temps réel
   */
  async stream(userInput: UserInput | string): Promise<Map<string, string>> {
    try {
      this.broadcast({
        type: 'analysis',
        message: '🧠 Démarrage de la génération intelligente...'
      });

      // 1. Enrichissement et analyse
      const enrichedInput = await this.analyzeAndEnrich(userInput);
      
      // 2. Estimation des coûts
      await this.estimateAndBroadcastCosts(enrichedInput);
      
      // 3. Génération architecture
      this.broadcast({
        type: 'step',
        message: '📋 Génération de l\'architecture...',
        data: { step: 'architecture', progress: 10 },
      });
      
      const architecture = await this.generateArchitectureWithStreaming(enrichedInput);
      
      // 4. Génération application en 3 étapes avec streaming
      const files = await this.generateAppWithStreaming(architecture);
      
      this.broadcast({
        type: 'complete',
        message: `✅ Application générée avec succès ! ${files.size} fichiers créés`,
        data: { fileCount: files.size },
      });
      
      return files;
      
    } catch (error: any) {
      this.broadcast({
        type: 'error',
        message: `❌ Erreur: ${error.message}`,
        data: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Analyse et enrichissement du prompt utilisateur
   */
  private async analyzeAndEnrich(userInput: UserInput | string): Promise<UserInput> {
    if (typeof userInput === 'string') {
      // Détection automatique du type/scope si prompt simple
      const analyzed = this.analyzeSimplePrompt(userInput);
      
      this.broadcast({
        type: 'analysis',
        message: `📝 Je comprends : ${this.explainIntent(analyzed)}`,
        data: analyzed,
      });
      
      return analyzed;
    }
    
    this.broadcast({
      type: 'analysis',
      message: `📝 Prompt enrichi détecté : ${userInput.type} ${userInput.scope}`,
      data: userInput,
    });
    
    return userInput;
  }

  /**
   * Analyse d'un prompt simple pour détecter le type/scope
   */
  private analyzeSimplePrompt(prompt: string): UserInput {
    const lower = prompt.toLowerCase();
    
    let type = 'webapp';
    let scope = 'mvp';
    
    // Détection type
    if (lower.includes('dashboard') || lower.includes('analytics') || lower.includes('admin')) {
      type = 'dashboard';
    } else if (lower.includes('landing') || lower.includes('page marketing')) {
      type = 'landing';
    } else if (lower.includes('boutique') || lower.includes('e-commerce') || lower.includes('shop')) {
      type = 'ecommerce';
    } else if (lower.includes('mobile') || lower.includes('app') && lower.includes('ios')) {
      type = 'mobile';
    }
    
    // Détection scope
    if (lower.includes('complet') || lower.includes('full') || lower.includes('avancé')) {
      scope = 'complete';
    } else if (lower.includes('landing') || lower.includes('page')) {
      scope = 'landing';
    }
    
    return {
      type,
      scope,
      description: prompt,
      tech: 'nextjs',
      style: 'modern',
      images: []
    };
  }

  /**
   * Explication de l'intention détectée
   */
  private explainIntent(input: UserInput): string {
    const typeNames = {
      'webapp': 'application web',
      'mobile': 'application mobile',
      'dashboard': 'dashboard analytics', 
      'landing': 'landing page',
      'ecommerce': 'boutique e-commerce',
      'internal': 'outil interne'
    };
    
    const scopeNames = {
      'complete': 'version complète (15-30 pages)',
      'mvp': 'MVP (5-10 pages)',
      'landing': 'landing page uniquement'
    };
    
    return `${typeNames[input.type as keyof typeof typeNames] || 'application'} - ${scopeNames[input.scope as keyof typeof scopeNames] || 'version standard'}`;
  }

  /**
   * Estimation et broadcast des coûts
   */
  private async estimateAndBroadcastCosts(input: UserInput): Promise<void> {
    const stats = this.componentCache.getCacheStats();
    const availableForStyle = stats.byStyle[input.style] || 0;
    
    const estimate: CostEstimate = {
      tokens: 10000, // Estimation base
      credits: 0.15,
      breakdown: {
        step1: 3000, // Architecture
        step2: 7000, // Génération (réduit par cache)
        cached: availableForStyle
      }
    };
    
    // Réduction par cache
    if (availableForStyle > 0) {
      estimate.tokens -= (availableForStyle * 500); // ~500 tokens par composant économisé
      estimate.credits = estimate.tokens * 0.000015; // Prix Claude Sonnet
    }
    
    this.broadcast({
      type: 'cost-estimate',
      message: `💰 Coût estimé : ${estimate.credits.toFixed(3)} crédits (~${estimate.tokens} tokens)`,
      data: estimate,
    });
    
    if (availableForStyle > 0) {
      this.broadcast({
        type: 'cache-optimization',
        message: `🚀 ${availableForStyle} composants récupérés du cache (économie de ${(availableForStyle * 500)} tokens)`,
        data: { cached: availableForStyle, tokensSaved: availableForStyle * 500 },
      });
    }
  }

  /**
   * Génération architecture avec streaming
   */
  private async generateArchitectureWithStreaming(input: UserInput): Promise<any> {
    const startTime = Date.now();
    
    // Enrichissement du prompt
    const enrichedPrompt = await this.promptEnricher.enrich(input);
    
    // Compression
    const compressedPrompt = this.promptCompressor.compressArchitecturePrompt(enrichedPrompt);
    const compressionStats = this.promptCompressor.getCompressionStats(enrichedPrompt, compressedPrompt);
    
    this.broadcast({
      type: 'compression',
      message: `⚡ Prompt compressé : ${compressionStats.percentageSaved}% tokens économisés`,
      data: compressionStats,
    });
    
    // Génération
    this.broadcast({
      type: 'progress',
      message: '🤖 Appel API Claude pour architecture...',
      data: { step: 'architecture', status: 'calling' },
    });
    
    const result = await this.anthropicService.generateArchitecture(input);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    this.broadcast({
      type: 'progress',
      message: `✅ Architecture générée en ${duration}s`,
      data: { step: 'architecture', status: 'complete', duration },
    });
    
    return JSON.parse(result);
  }

  /**
   * Génération application avec streaming des 3 étapes
   */
  private async generateAppWithStreaming(architecture: any): Promise<Map<string, string>> {
    const steps = [
      { name: 'base', label: '📦 Structure de base', progress: 30 },
      { name: 'components', label: '🎨 Composants UI', progress: 60 },  
      { name: 'pages', label: '📄 Pages spécifiques', progress: 90 }
    ];
    
    this.broadcast({
      type: 'step',
      message: '🚀 Démarrage génération en 3 étapes...',
      data: { totalSteps: steps.length },
    });
    
    const files = await this.anthropicService.generateAppInSteps(architecture);
    
    // Simulation du streaming des étapes (les logs sont déjà dans anthropic-service)
    // En production, on pourrait écouter les logs et les relayer
    
    return files;
  }

  /**
   * Broadcast d'un message vers les clients connectés
   */
  private broadcast(message: Omit<StreamMessage, 'timestamp'>): void {
    const fullMessage: StreamMessage = {
      ...message,
      timestamp: Date.now()
    };
    
    // Emit pour EventEmitter (pour WebSocket)
    this.emit('message', fullMessage);
    
    // Log pour debug
    this.logger.log('INFO', `[STREAM] ${message.type}: ${message.message}`);
  }

  /**
   * Estimation intelligente des coûts basée sur le prompt
   */
  private estimateCostFromPrompt(input: UserInput): CostEstimate {
    const baseTokens = {
      'webapp': { complete: 12000, mvp: 8000, landing: 3000 },
      'dashboard': { complete: 10000, mvp: 7000, landing: 2500 },
      'ecommerce': { complete: 15000, mvp: 10000, landing: 4000 },
      'mobile': { complete: 13000, mvp: 9000, landing: 3500 },
      'landing': { complete: 4000, mvp: 3000, landing: 2000 },
      'internal': { complete: 9000, mvp: 6000, landing: 2500 }
    };
    
    const tokens = baseTokens[input.type as keyof typeof baseTokens]?.[input.scope as keyof typeof baseTokens['webapp']] || 8000;
    
    return {
      tokens,
      credits: tokens * 0.000015,
      breakdown: {
        step1: 3000,
        step2: tokens - 3000,
        cached: 0
      }
    };
  }
}