/**
 * PHASE 6.2 - INTELLIGENCE CONTEXTUELLE
 * Gestionnaire de contexte et mémoire de session
 */

import fs from 'fs';
import path from 'path';
import { SemanticAnalysis } from './semantic-analyzer.js';

export interface UserSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  generationCount: number;
  preferences: UserPreferences;
  history: GenerationHistory[];
}

export interface UserPreferences {
  favoriteFrameworks: string[];
  favoriteStyles: string[];
  complexityPreference: 'simple' | 'medium' | 'complex' | 'enterprise';
  domainExpertise: Record<string, number>; // domaine -> niveau expertise (0-1)
  frequentFeatures: Record<string, number>; // feature -> fréquence d'usage
  qualityThreshold: number; // seuil de qualité attendu
  generationSpeed: 'fast' | 'balanced' | 'thorough';
}

export interface GenerationHistory {
  timestamp: Date;
  prompt: string;
  analysis: SemanticAnalysis;
  result: {
    success: boolean;
    score?: number;
    duration: number;
    files: number;
  };
  userFeedback?: {
    satisfaction: number; // 1-5
    issues: string[];
    improvements: string[];
  };
}

export interface ContextualRecommendation {
  type: 'tech' | 'feature' | 'architecture' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
}

export class ContextManager {
  private sessionsDir: string;
  private currentSession: UserSession | null = null;

  constructor() {
    this.sessionsDir = path.join(process.cwd(), 'sessions');
    this.ensureSessionsDirectory();
  }

  private ensureSessionsDirectory(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  createSession(sessionId: string): UserSession {
    const session: UserSession = {
      id: sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      generationCount: 0,
      preferences: this.getDefaultPreferences(),
      history: []
    };

    this.currentSession = session;
    this.saveSession(session);
    return session;
  }

  loadSession(sessionId: string): UserSession | null {
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(sessionPath, 'utf-8');
      const session: UserSession = JSON.parse(data);
      
      // Reconstituer les dates
      session.startTime = new Date(session.startTime);
      session.lastActivity = new Date(session.lastActivity);
      session.history = session.history.map(h => ({
        ...h,
        timestamp: new Date(h.timestamp)
      }));

      this.currentSession = session;
      return session;
    } catch (error) {
      console.error(`Erreur lors du chargement de la session ${sessionId}:`, error);
      return null;
    }
  }

  updateSession(analysis: SemanticAnalysis, result: any): void {
    if (!this.currentSession) return;

    // Mettre à jour l'activité
    this.currentSession.lastActivity = new Date();
    this.currentSession.generationCount++;

    // Ajouter à l'historique
    const historyEntry: GenerationHistory = {
      timestamp: new Date(),
      prompt: '', // Sera fourni par le workflow
      analysis,
      result: {
        success: result.success || false,
        score: result.report?.validation?.score,
        duration: result.duration || 0,
        files: result.files || 0
      }
    };

    this.currentSession.history.push(historyEntry);

    // Mettre à jour les préférences basées sur l'analyse
    this.updatePreferences(analysis, result);

    // Sauvegarder
    this.saveSession(this.currentSession);
  }

  private updatePreferences(analysis: SemanticAnalysis, result: any): void {
    if (!this.currentSession) return;

    const prefs = this.currentSession.preferences;

    // Mettre à jour l'expertise du domaine
    prefs.domainExpertise[analysis.domain] = 
      (prefs.domainExpertise[analysis.domain] || 0) + 0.1;

    // Mettre à jour les frameworks favoris
    for (const tech of analysis.techPreferences) {
      if (tech.explicit && result.success) {
        const index = prefs.favoriteFrameworks.indexOf(tech.preference);
        if (index === -1) {
          prefs.favoriteFrameworks.push(tech.preference);
        }
      }
    }

    // Mettre à jour les fonctionnalités fréquentes
    for (const feature of analysis.keyFeatures) {
      prefs.frequentFeatures[feature] = (prefs.frequentFeatures[feature] || 0) + 1;
    }

    // Ajuster la préférence de complexité basée sur les succès
    if (result.success && result.score > 80) {
      // Si génération réussie avec score élevé, on peut suggérer plus de complexité
      if (analysis.complexity === prefs.complexityPreference) {
        // L'utilisateur maîtrise ce niveau, on peut suggérer le niveau supérieur
        const complexityLevels = ['simple', 'medium', 'complex', 'enterprise'];
        const currentIndex = complexityLevels.indexOf(prefs.complexityPreference);
        if (currentIndex < complexityLevels.length - 1) {
          // Graduellement vers plus de complexité
          if (this.currentSession.generationCount > 3) {
            prefs.complexityPreference = complexityLevels[currentIndex + 1] as any;
          }
        }
      }
    }
  }

  generateRecommendations(analysis: SemanticAnalysis): ContextualRecommendation[] {
    const recommendations: ContextualRecommendation[] = [];

    if (!this.currentSession) return recommendations;

    const history = this.currentSession.history;
    const prefs = this.currentSession.preferences;

    // Recommandations basées sur l'historique
    if (history.length > 0) {
      const recentFailures = history.slice(-3).filter(h => !h.result.success);
      
      if (recentFailures.length >= 2) {
        recommendations.push({
          type: 'optimization',
          title: 'Simplifier la complexité',
          description: 'Vos dernières générations ont échoué. Essayez un prompt plus simple ou réduisez le nombre de fonctionnalités.',
          confidence: 0.8,
          reasoning: `${recentFailures.length} échecs récents détectés`,
          impact: 'high'
        });
      }
    }

    // Recommandations techniques basées sur l'expertise
    const domainExpertise = prefs.domainExpertise[analysis.domain] || 0;
    
    if (domainExpertise < 0.3) {
      recommendations.push({
        type: 'architecture',
        title: 'Architecture recommandée pour débutant',
        description: `Pour ${analysis.domain}, nous recommandons une structure simple avec les patterns essentiels.`,
        confidence: 0.7,
        reasoning: `Expertise limitée détectée dans le domaine ${analysis.domain}`,
        impact: 'medium'
      });
    } else if (domainExpertise > 0.7) {
      recommendations.push({
        type: 'feature',
        title: 'Fonctionnalités avancées suggérées',
        description: 'Basé sur votre expertise, nous pouvons ajouter des fonctionnalités avancées automatiquement.',
        confidence: 0.8,
        reasoning: `Forte expertise détectée dans ${analysis.domain}`,
        impact: 'medium'
      });
    }

    // Recommandations basées sur les frameworks favoris
    const suggestedFrameworks = this.getSuggestedFrameworks(analysis, prefs);
    
    if (suggestedFrameworks.length > 0 && analysis.techPreferences.length === 0) {
      recommendations.push({
        type: 'tech',
        title: 'Technologies recommandées',
        description: `Basé sur vos préférences, nous suggérons: ${suggestedFrameworks.join(', ')}`,
        confidence: 0.6,
        reasoning: 'Basé sur vos choix techniques précédents',
        impact: 'low'
      });
    }

    // Recommandation de fonctionnalités fréquentes
    const frequentFeatures = Object.entries(prefs.frequentFeatures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([feature]) => feature);

    if (frequentFeatures.length > 0 && analysis.keyFeatures.length < 3) {
      const missingFeatures = frequentFeatures.filter(f => !analysis.keyFeatures.includes(f));
      
      if (missingFeatures.length > 0) {
        recommendations.push({
          type: 'feature',
          title: 'Fonctionnalités que vous utilisez souvent',
          description: `Vous pourriez être intéressé par: ${missingFeatures.slice(0, 2).join(', ')}`,
          confidence: 0.5,
          reasoning: 'Basé sur vos fonctionnalités les plus utilisées',
          impact: 'low'
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private getSuggestedFrameworks(analysis: SemanticAnalysis, prefs: UserPreferences): string[] {
    const suggestions: string[] = [];

    // Si l'utilisateur n'a pas spécifié de framework, utiliser ses favoris
    if (analysis.techPreferences.length === 0) {
      // Frameworks populaires par domaine
      const domainDefaults: Record<string, string[]> = {
        saas: ['nextjs', 'react', 'tailwindcss'],
        ecommerce: ['nextjs', 'react', 'tailwindcss', 'stripe'],
        blog: ['nextjs', 'react', 'tailwindcss', 'contentful'],
        portfolio: ['nextjs', 'react', 'tailwindcss', 'framer-motion']
      };

      const defaults = domainDefaults[analysis.domain] || ['react', 'tailwindcss'];
      
      // Mixer avec les préférences utilisateur
      for (const fav of prefs.favoriteFrameworks) {
        if (!suggestions.includes(fav)) {
          suggestions.push(fav);
        }
      }

      // Ajouter des défauts si pas assez de suggestions
      for (const def of defaults) {
        if (suggestions.length < 3 && !suggestions.includes(def)) {
          suggestions.push(def);
        }
      }
    }

    return suggestions.slice(0, 3);
  }

  private saveSession(session: UserSession): void {
    const sessionPath = path.join(this.sessionsDir, `${session.id}.json`);
    
    try {
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la session ${session.id}:`, error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      favoriteFrameworks: [],
      favoriteStyles: ['tailwindcss'],
      complexityPreference: 'medium',
      domainExpertise: {},
      frequentFeatures: {},
      qualityThreshold: 70,
      generationSpeed: 'balanced'
    };
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  getAllSessions(): string[] {
    try {
      return fs.readdirSync(this.sessionsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  deleteSession(sessionId: string): boolean {
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
    
    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        
        if (this.currentSession?.id === sessionId) {
          this.currentSession = null;
        }
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}