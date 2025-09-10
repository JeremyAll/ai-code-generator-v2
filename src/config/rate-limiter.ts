import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { TimestampManager } from '../utils/timestamp.js';

export interface RateLimitStats {
  requestCount: number;
  tokenCount: number;
  totalCost: number;
  lastReset: Date;
  dailyLimit: number;
  tokensPerMinute: number;
  requestsPerMinute: number;
}

export interface RequestRecord {
  timestamp: Date;
  tokens: number;
  cost: number;
  success: boolean;
  model: string;
  duration: number;
}

export class RateLimiter {
  private logger: Logger;
  private statsFile: string;
  private stats: RateLimitStats = {
    requestCount: 0,
    tokenCount: 0,
    totalCost: 0,
    lastReset: new Date(),
    dailyLimit: 50,
    tokensPerMinute: 100000,
    requestsPerMinute: 60
  };
  private requestHistory: RequestRecord[] = [];
  
  // Limites par défaut (peuvent être overridées par variables d'env)
  private maxRequestsPerMinute: number;
  private maxTokensPerMinute: number;
  private maxDailyCost: number;
  private maxGenerationsPerDay: number;

  constructor() {
    this.logger = new Logger();
    this.statsFile = path.join('./logs', 'rate-limit-stats.json');
    
    // Charger limites depuis l'environnement
    this.maxRequestsPerMinute = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60');
    this.maxTokensPerMinute = parseInt(process.env.MAX_TOKENS_PER_MINUTE || '100000');
    this.maxDailyCost = parseFloat(process.env.MAX_DAILY_COST || '50.00');
    this.maxGenerationsPerDay = parseInt(process.env.MAX_GENERATIONS_PER_DAY || '50');

    this.loadStats();
    this.cleanupOldRequests();
  }

  private async loadStats(): Promise<void> {
    try {
      if (await fs.pathExists(this.statsFile)) {
        const data = await fs.readJSON(this.statsFile);
        this.stats = {
          ...data,
          lastReset: new Date(data.lastReset)
        };
        
        // Reset quotidien si nécessaire
        if (this.shouldResetDaily()) {
          this.resetDailyStats();
        }
      } else {
        this.initializeStats();
      }
    } catch (error) {
      this.logger.warn('⚠️ Erreur chargement stats rate limiting, initialisation par défaut', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.initializeStats();
    }
  }

  private initializeStats(): void {
    this.stats = {
      requestCount: 0,
      tokenCount: 0,
      totalCost: 0,
      lastReset: new Date(),
      dailyLimit: this.maxGenerationsPerDay,
      tokensPerMinute: 0,
      requestsPerMinute: 0
    };
    this.saveStats();
  }

  private shouldResetDaily(): boolean {
    const now = new Date();
    const lastReset = this.stats.lastReset;
    
    return now.getDate() !== lastReset.getDate() || 
           now.getMonth() !== lastReset.getMonth() || 
           now.getFullYear() !== lastReset.getFullYear();
  }

  private resetDailyStats(): void {
    const previousStats = { ...this.stats };
    
    this.stats = {
      ...this.stats,
      requestCount: 0,
      tokenCount: 0,
      totalCost: 0,
      lastReset: new Date()
    };

    this.logger.info('🔄 Reset quotidien des limites', {
      previousStats: {
        requests: previousStats.requestCount,
        tokens: previousStats.tokenCount,
        cost: previousStats.totalCost
      },
      resetTime: TimestampManager.getReadableTimestamp()
    });

    this.saveStats();
  }

  private cleanupOldRequests(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const initialLength = this.requestHistory.length;
    
    this.requestHistory = this.requestHistory.filter(
      request => request.timestamp > oneHourAgo
    );

    if (initialLength !== this.requestHistory.length) {
      this.logger.debug(`🧹 Nettoyage historique: ${initialLength - this.requestHistory.length} requêtes supprimées`);
    }
  }

  async checkLimit(): Promise<{
    allowed: boolean;
    reason?: string;
    waitTime?: number;
    currentUsage: {
      dailyRequests: number;
      dailyTokens: number;
      dailyCost: number;
      minuteRequests: number;
      minuteTokens: number;
    };
  }> {
    this.cleanupOldRequests();
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    // Calculer usage de la dernière minute
    const recentRequests = this.requestHistory.filter(req => req.timestamp > oneMinuteAgo);
    const minuteRequests = recentRequests.length;
    const minuteTokens = recentRequests.reduce((sum, req) => sum + req.tokens, 0);

    const currentUsage = {
      dailyRequests: this.stats.requestCount,
      dailyTokens: this.stats.tokenCount,
      dailyCost: this.stats.totalCost,
      minuteRequests,
      minuteTokens
    };

    // Vérifications des limites
    if (this.stats.requestCount >= this.maxGenerationsPerDay) {
      this.logger.warn('🚫 Limite quotidienne de générations atteinte', {
        current: this.stats.requestCount,
        limit: this.maxGenerationsPerDay
      });
      
      return {
        allowed: false,
        reason: `Limite quotidienne atteinte (${this.maxGenerationsPerDay} générations/jour)`,
        currentUsage
      };
    }

    if (this.stats.totalCost >= this.maxDailyCost) {
      this.logger.warn('💰 Limite quotidienne de coût atteinte', {
        current: this.stats.totalCost.toFixed(2),
        limit: this.maxDailyCost.toFixed(2)
      });
      
      return {
        allowed: false,
        reason: `Limite de coût quotidien atteinte ($${this.maxDailyCost})`,
        currentUsage
      };
    }

    if (minuteRequests >= this.maxRequestsPerMinute) {
      const waitTime = 60 - Math.floor((now.getTime() - recentRequests[0].timestamp.getTime()) / 1000);
      
      this.logger.warn('⏱️ Limite de requêtes par minute atteinte', {
        current: minuteRequests,
        limit: this.maxRequestsPerMinute,
        waitTime: `${waitTime}s`
      });
      
      return {
        allowed: false,
        reason: `Limite de requêtes par minute atteinte (${this.maxRequestsPerMinute}/min)`,
        waitTime,
        currentUsage
      };
    }

    if (minuteTokens >= this.maxTokensPerMinute) {
      const waitTime = 60 - Math.floor((now.getTime() - recentRequests[0].timestamp.getTime()) / 1000);
      
      this.logger.warn('🔤 Limite de tokens par minute atteinte', {
        current: minuteTokens,
        limit: this.maxTokensPerMinute,
        waitTime: `${waitTime}s`
      });
      
      return {
        allowed: false,
        reason: `Limite de tokens par minute atteinte (${this.maxTokensPerMinute}/min)`,
        waitTime,
        currentUsage
      };
    }

    // Avertissements préventifs
    if (this.stats.requestCount > this.maxGenerationsPerDay * 0.8) {
      this.logger.warn('⚠️ Approche de la limite quotidienne', {
        current: this.stats.requestCount,
        limit: this.maxGenerationsPerDay,
        percentage: Math.round((this.stats.requestCount / this.maxGenerationsPerDay) * 100)
      });
    }

    if (this.stats.totalCost > this.maxDailyCost * 0.8) {
      this.logger.warn('💸 Approche de la limite de coût', {
        current: this.stats.totalCost.toFixed(2),
        limit: this.maxDailyCost.toFixed(2),
        percentage: Math.round((this.stats.totalCost / this.maxDailyCost) * 100)
      });
    }

    return {
      allowed: true,
      currentUsage
    };
  }

  recordRequest(tokens: number, cost: number, success: boolean = true, model: string = '', duration: number = 0): void {
    const request: RequestRecord = {
      timestamp: new Date(),
      tokens,
      cost,
      success,
      model,
      duration
    };

    // Ajouter à l'historique
    this.requestHistory.push(request);

    // Mettre à jour les stats quotidiennes
    if (success) {
      this.stats.requestCount++;
      this.stats.tokenCount += tokens;
      this.stats.totalCost += cost;
    }

    // Logger la requête
    this.logger.info('📊 Requête API enregistrée', {
      tokens,
      cost: cost.toFixed(4),
      success,
      model,
      duration: `${duration}ms`,
      dailyTotal: {
        requests: this.stats.requestCount,
        tokens: this.stats.tokenCount,
        cost: this.stats.totalCost.toFixed(2)
      }
    });

    this.saveStats();
    this.cleanupOldRequests();
  }

  private async saveStats(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.statsFile));
      await fs.writeJSON(this.statsFile, this.stats, { spaces: 2 });
    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde stats rate limiting', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getCurrentStats(): RateLimitStats & {
    minuteRequests: number;
    minuteTokens: number;
    averageCostPerRequest: number;
    averageTokensPerRequest: number;
  } {
    this.cleanupOldRequests();
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentRequests = this.requestHistory.filter(req => req.timestamp > oneMinuteAgo);
    
    const minuteRequests = recentRequests.length;
    const minuteTokens = recentRequests.reduce((sum, req) => sum + req.tokens, 0);
    
    return {
      ...this.stats,
      minuteRequests,
      minuteTokens,
      averageCostPerRequest: this.stats.requestCount > 0 ? 
        this.stats.totalCost / this.stats.requestCount : 0,
      averageTokensPerRequest: this.stats.requestCount > 0 ? 
        this.stats.tokenCount / this.stats.requestCount : 0
    };
  }

  async getDetailedReport(): Promise<{
    summary: any;
    hourlyBreakdown: Array<{hour: string, requests: number, tokens: number, cost: number}>;
    modelUsage: Record<string, {requests: number, tokens: number, cost: number}>;
    successRate: number;
  }> {
    const stats = this.getCurrentStats();
    
    // Analyse horaire (dernières 24h)
    const hourlyBreakdown: Array<{hour: string, requests: number, tokens: number, cost: number}> = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourRequests = this.requestHistory.filter(req => 
        req.timestamp >= hourStart && req.timestamp < hourEnd
      );
      
      hourlyBreakdown.push({
        hour: hourStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        requests: hourRequests.length,
        tokens: hourRequests.reduce((sum, req) => sum + req.tokens, 0),
        cost: hourRequests.reduce((sum, req) => sum + req.cost, 0)
      });
    }
    
    // Usage par modèle
    const modelUsage: Record<string, {requests: number, tokens: number, cost: number}> = {};
    
    this.requestHistory.forEach(req => {
      if (!modelUsage[req.model]) {
        modelUsage[req.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      modelUsage[req.model].requests++;
      modelUsage[req.model].tokens += req.tokens;
      modelUsage[req.model].cost += req.cost;
    });
    
    // Taux de succès
    const totalRequests = this.requestHistory.length;
    const successfulRequests = this.requestHistory.filter(req => req.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    
    return {
      summary: {
        ...stats,
        limits: {
          dailyGenerations: this.maxGenerationsPerDay,
          dailyCost: this.maxDailyCost,
          requestsPerMinute: this.maxRequestsPerMinute,
          tokensPerMinute: this.maxTokensPerMinute
        },
        usage: {
          dailyGenerationsPercent: (stats.requestCount / this.maxGenerationsPerDay) * 100,
          dailyCostPercent: (stats.totalCost / this.maxDailyCost) * 100,
          minuteRequestsPercent: (stats.minuteRequests / this.maxRequestsPerMinute) * 100,
          minuteTokensPercent: (stats.minuteTokens / this.maxTokensPerMinute) * 100
        }
      },
      hourlyBreakdown,
      modelUsage,
      successRate
    };
  }

  // Méthode utilitaire pour attendre si rate limiting
  async waitIfNeeded(): Promise<void> {
    const check = await this.checkLimit();
    
    if (!check.allowed && check.waitTime) {
      this.logger.info(`⏳ Attente de ${check.waitTime}s pour respecter les limites...`);
      await new Promise(resolve => setTimeout(resolve, check.waitTime! * 1000));
    }
  }

  // Méthode pour vérifier si une requête peut être faite
  async canMakeRequest(): Promise<boolean> {
    this.cleanupOldRequests();
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentRequests = this.requestHistory.filter(r => r.timestamp > oneMinuteAgo);
    
    // Vérifier limite par minute
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      return false;
    }
    
    // Vérifier tokens par minute
    const recentTokens = recentRequests.reduce((sum, req) => sum + req.tokens, 0);
    if (recentTokens >= this.maxTokensPerMinute) {
      return false;
    }
    
    // Vérifier limite quotidienne
    if (this.stats.requestCount >= this.maxGenerationsPerDay) {
      return false;
    }
    
    // Vérifier coût quotidien
    if (this.stats.totalCost >= this.maxDailyCost) {
      return false;
    }
    
    return true;
  }
}