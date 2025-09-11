/**
 * PHASE 7.4 - MONITORING & OBSERVABILITÉ
 * Collecteur de métriques et système de monitoring
 */

import fs from 'fs';
import path from 'path';
import { ValidationResult } from '../testing/app-validator.js';
import { PipelineRun } from '../testing/ci-cd-pipeline.js';

export interface MetricsData {
  timestamp: Date;
  sessionId: string;
  metrics: {
    generation: GenerationMetrics;
    quality: QualityMetrics;
    performance: PerformanceMetrics;
    user: UserMetrics;
    system: SystemMetrics;
  };
}

export interface GenerationMetrics {
  totalAttempts: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageDuration: number;
  averageScore: number;
  domainDistribution: Record<string, number>;
  complexityDistribution: Record<string, number>;
}

export interface QualityMetrics {
  averageOverallScore: number;
  averageCompilationScore: number;
  averageQualityScore: number;
  averageAccessibilityScore: number;
  commonIssues: Array<{ issue: string; frequency: number }>;
  autoFixesApplied: number;
  autoFixesSuccessful: number;
}

export interface PerformanceMetrics {
  averageBundleSize: number;
  averageLoadTime: number;
  averageMemoryUsage: number;
  cacheHitRate: number;
  apiLatency: {
    anthropic: number;
    average: number;
    percentile95: number;
  };
}

export interface UserMetrics {
  activeUsers: number;
  newUsers: number;
  userSatisfaction: number;
  mostUsedFeatures: Array<{ feature: string; usage: number }>;
  userExpertiseLevels: Record<string, number>;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  errorRate: number;
  throughput: number;
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'quality' | 'performance' | 'system' | 'user';
  title: string;
  description: string;
  metrics: Record<string, number>;
  threshold: number;
  currentValue: number;
  resolved: boolean;
}

export class MetricsCollector {
  private metricsHistory: MetricsData[] = [];
  private alerts: Alert[] = [];
  private metricsDir: string;
  private alertRules: AlertRule[] = [];

  constructor() {
    this.metricsDir = path.join(process.cwd(), 'metrics');
    this.ensureMetricsDirectory();
    this.initializeAlertRules();
  }

  private ensureMetricsDirectory(): void {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        name: 'Low Success Rate',
        category: 'quality',
        severity: 'warning',
        condition: (metrics) => metrics.generation.successfulGenerations / 
                               Math.max(metrics.generation.totalAttempts, 1) < 0.8,
        threshold: 0.8,
        getMessage: (value) => `Taux de succès faible: ${Math.round(value * 100)}%`
      },
      {
        name: 'High Error Rate',
        category: 'system',
        severity: 'error',
        condition: (metrics) => metrics.system.errorRate > 0.1,
        threshold: 0.1,
        getMessage: (value) => `Taux d'erreur élevé: ${Math.round(value * 100)}%`
      },
      {
        name: 'Poor Quality Score',
        category: 'quality',
        severity: 'warning',
        condition: (metrics) => metrics.quality.averageOverallScore < 70,
        threshold: 70,
        getMessage: (value) => `Score qualité faible: ${Math.round(value)}%`
      },
      {
        name: 'High API Latency',
        category: 'performance',
        severity: 'warning',
        condition: (metrics) => metrics.performance.apiLatency.average > 10000,
        threshold: 10000,
        getMessage: (value) => `Latence API élevée: ${Math.round(value / 1000)}s`
      },
      {
        name: 'Large Bundle Size',
        category: 'performance',
        severity: 'info',
        condition: (metrics) => metrics.performance.averageBundleSize > 1000000,
        threshold: 1000000,
        getMessage: (value) => `Taille bundle importante: ${Math.round(value / 1024)}KB`
      },
      {
        name: 'System Memory High',
        category: 'system',
        severity: 'critical',
        condition: (metrics) => metrics.system.memoryUsage > 0.9,
        threshold: 0.9,
        getMessage: (value) => `Utilisation mémoire critique: ${Math.round(value * 100)}%`
      }
    ];
  }

  async collectMetrics(sessionId: string): Promise<MetricsData> {
    console.log('📊 Collection des métriques...');

    const metrics: MetricsData = {
      timestamp: new Date(),
      sessionId,
      metrics: {
        generation: await this.collectGenerationMetrics(),
        quality: await this.collectQualityMetrics(),
        performance: await this.collectPerformanceMetrics(),
        user: await this.collectUserMetrics(),
        system: await this.collectSystemMetrics()
      }
    };

    // Sauvegarder les métriques
    this.metricsHistory.push(metrics);
    await this.saveMetrics(metrics);

    // Vérifier les alertes
    await this.checkAlerts(metrics);

    return metrics;
  }

  private async collectGenerationMetrics(): Promise<GenerationMetrics> {
    // Analyse des logs de génération récents
    const logFiles = this.getRecentLogFiles();
    let totalAttempts = 0;
    let successfulGenerations = 0;
    let failedGenerations = 0;
    let totalDuration = 0;
    let totalScore = 0;
    const domainDistribution: Record<string, number> = {};
    const complexityDistribution: Record<string, number> = {};

    for (const logFile of logFiles) {
      try {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (line.includes('[INFO] Session démarrée:')) {
            totalAttempts++;
          }
          
          if (line.includes('✅ Génération terminée')) {
            successfulGenerations++;
            const durationMatch = line.match(/en (\d+)ms/);
            if (durationMatch) {
              totalDuration += parseInt(durationMatch[1]);
            }
          }
          
          if (line.includes('❌ Génération échouée')) {
            failedGenerations++;
          }

          if (line.includes('Analyse sémantique:')) {
            const domainMatch = line.match(/\((\w+)\)/);
            if (domainMatch) {
              const domain = domainMatch[1];
              domainDistribution[domain] = (domainDistribution[domain] || 0) + 1;
            }
          }

          if (line.includes('Score de validation:')) {
            const scoreMatch = line.match(/(\d+)\/100/);
            if (scoreMatch) {
              totalScore += parseInt(scoreMatch[1]);
            }
          }
        }
      } catch (error) {
        // Ignorer erreurs de lecture des logs
      }
    }

    return {
      totalAttempts,
      successfulGenerations,
      failedGenerations,
      averageDuration: successfulGenerations > 0 ? totalDuration / successfulGenerations : 0,
      averageScore: successfulGenerations > 0 ? totalScore / successfulGenerations : 0,
      domainDistribution,
      complexityDistribution
    };
  }

  private async collectQualityMetrics(): Promise<QualityMetrics> {
    // Analyser les résultats de validation récents
    const validationFiles = this.getRecentValidationFiles();
    let totalScores = {
      overall: 0,
      compilation: 0,
      quality: 0,
      accessibility: 0
    };
    let count = 0;
    const issueFrequency: Record<string, number> = {};
    let autoFixesApplied = 0;
    let autoFixesSuccessful = 0;

    for (const validationFile of validationFiles) {
      try {
        const content = fs.readFileSync(validationFile, 'utf-8');
        const validation = JSON.parse(content) as ValidationResult;

        totalScores.overall += validation.overallScore;
        totalScores.compilation += validation.details.compilation.score;
        totalScores.quality += validation.details.quality.score;
        totalScores.accessibility += validation.details.accessibility.score;
        count++;

        // Analyser les problèmes communs
        for (const violation of validation.details.accessibility.violations) {
          issueFrequency[violation.rule] = (issueFrequency[violation.rule] || 0) + violation.count;
        }

      } catch (error) {
        // Ignorer erreurs de parsing
      }
    }

    const commonIssues = Object.entries(issueFrequency)
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      averageOverallScore: count > 0 ? totalScores.overall / count : 0,
      averageCompilationScore: count > 0 ? totalScores.compilation / count : 0,
      averageQualityScore: count > 0 ? totalScores.quality / count : 0,
      averageAccessibilityScore: count > 0 ? totalScores.accessibility / count : 0,
      commonIssues,
      autoFixesApplied,
      autoFixesSuccessful
    };
  }

  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Métriques de performance basées sur l'historique
    const performanceData = this.metricsHistory
      .filter(m => Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000) // 24h
      .map(m => m.metrics.performance)
      .filter(p => p);

    let averageBundleSize = 0;
    let averageLoadTime = 0;
    let averageMemoryUsage = 0;
    let apiLatencies: number[] = [];

    if (performanceData.length > 0) {
      averageBundleSize = performanceData.reduce((sum, p) => sum + (p.averageBundleSize || 0), 0) / performanceData.length;
      averageLoadTime = performanceData.reduce((sum, p) => sum + (p.averageLoadTime || 0), 0) / performanceData.length;
      averageMemoryUsage = performanceData.reduce((sum, p) => sum + (p.averageMemoryUsage || 0), 0) / performanceData.length;
      apiLatencies = performanceData.map(p => p.apiLatency?.anthropic || 0).filter(l => l > 0);
    }

    return {
      averageBundleSize,
      averageLoadTime,
      averageMemoryUsage,
      cacheHitRate: 0.75, // Valeur simulée
      apiLatency: {
        anthropic: apiLatencies.length > 0 ? apiLatencies.reduce((a, b) => a + b) / apiLatencies.length : 0,
        average: apiLatencies.length > 0 ? apiLatencies.reduce((a, b) => a + b) / apiLatencies.length : 0,
        percentile95: apiLatencies.length > 0 ? this.calculatePercentile(apiLatencies, 0.95) : 0
      }
    };
  }

  private async collectUserMetrics(): Promise<UserMetrics> {
    // Analyser les sessions utilisateur récentes
    const sessionsDir = path.join(process.cwd(), 'sessions');
    let activeUsers = 0;
    let newUsers = 0;
    const featureUsage: Record<string, number> = {};
    const expertiseLevels: Record<string, number> = {};

    if (fs.existsSync(sessionsDir)) {
      const sessionFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
      
      for (const sessionFile of sessionFiles) {
        try {
          const content = fs.readFileSync(path.join(sessionsDir, sessionFile), 'utf-8');
          const session = JSON.parse(content);

          const lastActivity = new Date(session.lastActivity);
          const isRecent = Date.now() - lastActivity.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 jours

          if (isRecent) {
            activeUsers++;
            
            if (session.generationCount <= 2) {
              newUsers++;
            }

            // Analyser l'usage des fonctionnalités
            for (const [feature, count] of Object.entries(session.preferences.frequentFeatures)) {
              featureUsage[feature] = (featureUsage[feature] || 0) + (count as number);
            }

            // Analyser les niveaux d'expertise
            for (const [domain, level] of Object.entries(session.preferences.domainExpertise)) {
              if (!expertiseLevels[domain] || (level as number) > expertiseLevels[domain]) {
                expertiseLevels[domain] = level as number;
              }
            }
          }
        } catch (error) {
          // Ignorer erreurs de parsing
        }
      }
    }

    const mostUsedFeatures = Object.entries(featureUsage)
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    return {
      activeUsers,
      newUsers,
      userSatisfaction: 4.2, // Simulé
      mostUsedFeatures,
      userExpertiseLevels: expertiseLevels
    };
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const process = globalThis.process;
    
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      cpuUsage: 0.15, // Simulé
      diskUsage: 0.45, // Simulé
      errorRate: 0.02, // Simulé - 2% d'erreurs
      throughput: 1.5 // Simulé - 1.5 générations/minute
    };
  }

  private async checkAlerts(metrics: MetricsData): Promise<void> {
    for (const rule of this.alertRules) {
      try {
        if (rule.condition(metrics.metrics)) {
          const alertId = `${rule.name}-${Date.now()}`;
          const currentValue = this.getCurrentValue(metrics.metrics, rule);
          
          const alert: Alert = {
            id: alertId,
            timestamp: new Date(),
            severity: rule.severity,
            category: rule.category,
            title: rule.name,
            description: rule.getMessage(currentValue),
            metrics: this.extractRelevantMetrics(metrics.metrics, rule.category),
            threshold: rule.threshold,
            currentValue,
            resolved: false
          };

          this.alerts.push(alert);
          console.log(`🚨 ALERTE ${rule.severity.toUpperCase()}: ${alert.description}`);
          
          // Sauvegarder l'alerte
          await this.saveAlert(alert);
        }
      } catch (error) {
        console.error(`Erreur vérification alerte ${rule.name}:`, error);
      }
    }
  }

  private getCurrentValue(metrics: MetricsData['metrics'], rule: AlertRule): number {
    switch (rule.name) {
      case 'Low Success Rate':
        return metrics.generation.successfulGenerations / Math.max(metrics.generation.totalAttempts, 1);
      case 'High Error Rate':
        return metrics.system.errorRate;
      case 'Poor Quality Score':
        return metrics.quality.averageOverallScore;
      case 'High API Latency':
        return metrics.performance.apiLatency.average;
      case 'Large Bundle Size':
        return metrics.performance.averageBundleSize;
      case 'System Memory High':
        return metrics.system.memoryUsage;
      default:
        return 0;
    }
  }

  private extractRelevantMetrics(metrics: MetricsData['metrics'], category: string): Record<string, number> {
    switch (category) {
      case 'quality':
        return {
          averageScore: metrics.quality.averageOverallScore,
          successRate: metrics.generation.successfulGenerations / Math.max(metrics.generation.totalAttempts, 1)
        };
      case 'performance':
        return {
          bundleSize: metrics.performance.averageBundleSize,
          apiLatency: metrics.performance.apiLatency.average,
          cacheHitRate: metrics.performance.cacheHitRate
        };
      case 'system':
        return {
          memoryUsage: metrics.system.memoryUsage,
          cpuUsage: metrics.system.cpuUsage,
          errorRate: metrics.system.errorRate
        };
      case 'user':
        return {
          activeUsers: metrics.user.activeUsers,
          satisfaction: metrics.user.userSatisfaction
        };
      default:
        return {};
    }
  }

  private getRecentLogFiles(): string[] {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) return [];

    try {
      return fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.log'))
        .map(f => path.join(logsDir, f))
        .filter(f => {
          const stats = fs.statSync(f);
          return Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000; // 24h
        });
    } catch {
      return [];
    }
  }

  private getRecentValidationFiles(): string[] {
    const validationDir = path.join(process.cwd(), 'validation-results');
    if (!fs.existsSync(validationDir)) return [];

    try {
      return fs.readdirSync(validationDir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(validationDir, f))
        .filter(f => {
          const stats = fs.statSync(f);
          return Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000; // 24h
        });
    } catch {
      return [];
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private async saveMetrics(metrics: MetricsData): Promise<void> {
    const filename = `metrics-${metrics.timestamp.toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.metricsDir, filename);
    
    try {
      let existingData = [];
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        existingData = JSON.parse(content);
      }
      
      existingData.push(metrics);
      fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Erreur sauvegarde métriques:', error);
    }
  }

  private async saveAlert(alert: Alert): Promise<void> {
    const filename = `alerts-${alert.timestamp.toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.metricsDir, filename);
    
    try {
      let existingAlerts = [];
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        existingAlerts = JSON.parse(content);
      }
      
      existingAlerts.push(alert);
      fs.writeFileSync(filepath, JSON.stringify(existingAlerts, null, 2));
    } catch (error) {
      console.error('Erreur sauvegarde alerte:', error);
    }
  }

  getRecentMetrics(hours: number = 24): MetricsData[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metricsHistory.filter(m => m.timestamp.getTime() > cutoff);
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  generateDashboardData(): any {
    const recent = this.getRecentMetrics(24);
    const activeAlerts = this.getActiveAlerts();

    if (recent.length === 0) {
      return {
        summary: { noData: true },
        alerts: activeAlerts
      };
    }

    const latest = recent[recent.length - 1].metrics;

    return {
      summary: {
        successRate: latest.generation.successfulGenerations / Math.max(latest.generation.totalAttempts, 1),
        averageScore: latest.quality.averageOverallScore,
        activeUsers: latest.user.activeUsers,
        systemHealth: 1 - latest.system.errorRate
      },
      trends: {
        generations: recent.map(m => ({
          timestamp: m.timestamp,
          successful: m.metrics.generation.successfulGenerations,
          failed: m.metrics.generation.failedGenerations
        })),
        quality: recent.map(m => ({
          timestamp: m.timestamp,
          score: m.metrics.quality.averageOverallScore
        })),
        performance: recent.map(m => ({
          timestamp: m.timestamp,
          latency: m.metrics.performance.apiLatency.average,
          bundleSize: m.metrics.performance.averageBundleSize
        }))
      },
      alerts: activeAlerts,
      topFeatures: latest.user.mostUsedFeatures.slice(0, 5),
      domainDistribution: latest.generation.domainDistribution
    };
  }
}

interface AlertRule {
  name: string;
  category: 'quality' | 'performance' | 'system' | 'user';
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: (metrics: MetricsData['metrics']) => boolean;
  threshold: number;
  getMessage: (value: number) => string;
}