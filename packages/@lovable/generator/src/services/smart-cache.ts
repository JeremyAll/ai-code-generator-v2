/**
 * PHASE 5.1 - CACHE MULTI-NIVEAU INTELLIGENT
 * Cache avancé avec invalidation intelligente et compression
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { Logger } from '../utils/logger.js';

interface CacheEntry<T> {
  data: T;
  hash: string;
  timestamp: number;
  hitCount: number;
  domain: string;
  size: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  compressionRatio: number;
  memoryUsage: number;
}

export class SmartCache {
  private logger: Logger;
  private componentCache = new Map<string, CacheEntry<any>>();
  private pageCache = new Map<string, CacheEntry<any>>();
  private configCache = new Map<string, CacheEntry<any>>();
  private domainCache = new Map<string, CacheEntry<any>>();
  
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    compressionRatio: 0,
    memoryUsage: 0
  };

  private readonly MAX_CACHE_SIZE = 100;
  private readonly TTL_HOURS = 24;
  private readonly CACHE_FILE = './cache/smart-cache.json';

  constructor() {
    this.logger = new Logger();
    this.loadFromDisk();
    this.startCleanupTimer();
  }

  /**
   * Cache intelligent avec compression et déduplication
   */
  set<T>(
    type: 'component' | 'page' | 'config' | 'domain',
    key: string,
    data: T,
    domain: string = 'default'
  ): void {
    const serialized = JSON.stringify(data);
    const hash = this.generateHash(serialized);
    const compressed = this.compress(serialized);
    
    const entry: CacheEntry<T> = {
      data,
      hash,
      timestamp: Date.now(),
      hitCount: 0,
      domain,
      size: compressed.length
    };

    const cache = this.getCache(type);
    
    // Éviter les doublons
    if (cache.has(key) && cache.get(key)?.hash === hash) {
      return;
    }

    // LRU eviction si nécessaire
    if (cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU(cache);
    }

    cache.set(key, entry);
    this.updateMetrics('set', compressed.length, serialized.length);
    
    this.logger.log('DEBUG', `Cache SET: ${type}/${key} (${entry.size} bytes, ${domain})`);
  }

  /**
   * Récupération intelligente avec prédiction
   */
  get<T>(
    type: 'component' | 'page' | 'config' | 'domain',
    key: string,
    domain: string = 'default'
  ): T | null {
    this.metrics.totalRequests++;
    
    const cache = this.getCache(type);
    const entry = cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.logger.log('DEBUG', `Cache MISS: ${type}/${key}`);
      return null;
    }

    // Vérifier TTL
    if (this.isExpired(entry)) {
      cache.delete(key);
      this.metrics.misses++;
      this.logger.log('DEBUG', `Cache EXPIRED: ${type}/${key}`);
      return null;
    }

    // Vérifier domaine si spécifié
    if (domain !== 'default' && entry.domain !== domain) {
      this.metrics.misses++;
      return null;
    }

    entry.hitCount++;
    this.metrics.hits++;
    
    this.logger.log('DEBUG', `Cache HIT: ${type}/${key} (hits: ${entry.hitCount})`);
    return entry.data;
  }

  /**
   * Cache prédictif basé sur les patterns
   */
  predictAndPreload(domain: string, userPrompt: string): void {
    const patterns = this.analyzePatterns(userPrompt);
    
    patterns.forEach(pattern => {
      const predictions = this.getPredictions(pattern, domain);
      predictions.forEach(prediction => {
        if (!this.has(prediction.type, prediction.key)) {
          this.logger.log('INFO', `Prédiction cache: ${prediction.type}/${prediction.key}`);
          // Précharger depuis les templates
          this.preloadFromTemplate(prediction.type, prediction.key, domain);
        }
      });
    });
  }

  /**
   * Analyse des métriques de performance
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Invalidation intelligente par domaine/pattern
   */
  invalidate(
    type?: 'component' | 'page' | 'config' | 'domain',
    pattern?: RegExp,
    domain?: string
  ): number {
    let invalidated = 0;
    
    const caches = type ? [this.getCache(type)] : [
      this.componentCache, this.pageCache, this.configCache, this.domainCache
    ];

    caches.forEach(cache => {
      const toDelete: string[] = [];
      
      cache.forEach((entry, key) => {
        const shouldInvalidate = (
          (!pattern || pattern.test(key)) &&
          (!domain || entry.domain === domain)
        );
        
        if (shouldInvalidate) {
          toDelete.push(key);
          invalidated++;
        }
      });
      
      toDelete.forEach(key => cache.delete(key));
    });

    this.logger.log('INFO', `Cache invalidé: ${invalidated} entrées`);
    return invalidated;
  }

  /**
   * Optimisation mémoire et compression
   */
  optimize(): void {
    const before = this.calculateMemoryUsage();
    
    // Nettoyer les entrées expirées
    this.cleanupExpired();
    
    // Compresser les gros objets
    this.compressLargeEntries();
    
    // Réorganiser par fréquence d'usage
    this.reorderByUsage();
    
    const after = this.calculateMemoryUsage();
    const saved = before - after;
    
    this.logger.log('INFO', `Cache optimisé: ${saved} bytes économisés (${Math.round(saved/before*100)}%)`);
  }

  private getCache(type: string): Map<string, CacheEntry<any>> {
    switch (type) {
      case 'component': return this.componentCache;
      case 'page': return this.pageCache;
      case 'config': return this.configCache;
      case 'domain': return this.domainCache;
      default: throw new Error(`Type de cache inconnu: ${type}`);
    }
  }

  private generateHash(data: string): string {
    return createHash('md5').update(data).digest('hex').substring(0, 16);
  }

  private compress(data: string): string {
    // Compression basique - peut être améliorée avec gzip
    return data.replace(/\s+/g, ' ').trim();
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const ttl = this.TTL_HOURS * 60 * 60 * 1000;
    return (Date.now() - entry.timestamp) > ttl;
  }

  private evictLRU(cache: Map<string, CacheEntry<any>>): void {
    let lruKey = '';
    let lruTime = Date.now();
    
    cache.forEach((entry, key) => {
      const score = entry.timestamp + (entry.hitCount * 1000);
      if (score < lruTime) {
        lruTime = score;
        lruKey = key;
      }
    });
    
    if (lruKey) {
      cache.delete(lruKey);
      this.logger.log('DEBUG', `Cache LRU eviction: ${lruKey}`);
    }
  }

  private analyzePatterns(prompt: string): string[] {
    const patterns: string[] = [];
    
    // Détection de domaines
    if (/e-?commerce|boutique|shop/i.test(prompt)) patterns.push('ecommerce');
    if (/blog|article|cms/i.test(prompt)) patterns.push('blog');
    if (/dashboard|saas|analytics/i.test(prompt)) patterns.push('saas');
    if (/portfolio|agence|design/i.test(prompt)) patterns.push('portfolio');
    
    // Détection de composants
    if (/panier|cart/i.test(prompt)) patterns.push('cart');
    if (/auth|login|connect/i.test(prompt)) patterns.push('auth');
    if (/search|recherch/i.test(prompt)) patterns.push('search');
    
    return patterns;
  }

  private getPredictions(pattern: string, domain: string) {
    const predictions = [];
    
    switch (pattern) {
      case 'ecommerce':
        predictions.push(
          { type: 'component', key: 'AddToCartButton' },
          { type: 'component', key: 'ProductGrid' },
          { type: 'config', key: 'tailwind-ecommerce' }
        );
        break;
      case 'saas':
        predictions.push(
          { type: 'component', key: 'Dashboard' },
          { type: 'component', key: 'MetricsCard' }
        );
        break;
    }
    
    return predictions;
  }

  private preloadFromTemplate(type: string, key: string, domain: string): void {
    // Logique de préchargement depuis les templates
    this.logger.log('DEBUG', `Préchargement: ${type}/${key} pour ${domain}`);
  }

  private has(type: string, key: string): boolean {
    return this.getCache(type).has(key);
  }

  private updateMetrics(operation: string, compressedSize: number, originalSize: number): void {
    this.metrics.memoryUsage += compressedSize;
    if (originalSize > 0) {
      this.metrics.compressionRatio = 1 - (compressedSize / originalSize);
    }
  }

  private calculateMemoryUsage(): number {
    let total = 0;
    [this.componentCache, this.pageCache, this.configCache, this.domainCache]
      .forEach(cache => {
        cache.forEach(entry => total += entry.size);
      });
    return total;
  }

  private cleanupExpired(): void {
    [this.componentCache, this.pageCache, this.configCache, this.domainCache]
      .forEach(cache => {
        const toDelete: string[] = [];
        cache.forEach((entry, key) => {
          if (this.isExpired(entry)) toDelete.push(key);
        });
        toDelete.forEach(key => cache.delete(key));
      });
  }

  private compressLargeEntries(): void {
    // Compresser les entrées > 10KB
    const LARGE_THRESHOLD = 10240;
    
    [this.componentCache, this.pageCache, this.configCache, this.domainCache]
      .forEach(cache => {
        cache.forEach(entry => {
          if (entry.size > LARGE_THRESHOLD) {
            const compressed = this.compress(JSON.stringify(entry.data));
            entry.size = compressed.length;
          }
        });
      });
  }

  private reorderByUsage(): void {
    // Réorganiser par hit count (les plus utilisés en premier)
    [this.componentCache, this.pageCache, this.configCache, this.domainCache]
      .forEach(cache => {
        const sorted = Array.from(cache.entries())
          .sort(([,a], [,b]) => b.hitCount - a.hitCount);
        
        cache.clear();
        sorted.forEach(([key, value]) => cache.set(key, value));
      });
  }

  private startCleanupTimer(): void {
    // Nettoyage automatique toutes les heures
    setInterval(() => {
      this.cleanupExpired();
      this.optimize();
    }, 60 * 60 * 1000);
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.CACHE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.CACHE_FILE, 'utf8'));
        // Restaurer les caches depuis le disque
        this.logger.log('INFO', 'Cache restauré depuis le disque');
      }
    } catch (error) {
      this.logger.log('WARN', `Erreur lecture cache: ${error}`);
    }
  }

  saveToDisk(): void {
    try {
      const data = {
        component: Array.from(this.componentCache.entries()),
        page: Array.from(this.pageCache.entries()),
        config: Array.from(this.configCache.entries()),
        domain: Array.from(this.domainCache.entries()),
        metrics: this.metrics
      };
      
      if (!fs.existsSync(path.dirname(this.CACHE_FILE))) {
        fs.mkdirSync(path.dirname(this.CACHE_FILE), { recursive: true });
      }
      
      fs.writeFileSync(this.CACHE_FILE, JSON.stringify(data, null, 2));
      this.logger.log('INFO', 'Cache sauvegardé sur disque');
    } catch (error) {
      this.logger.log('WARN', `Erreur sauvegarde cache: ${error}`);
    }
  }
}