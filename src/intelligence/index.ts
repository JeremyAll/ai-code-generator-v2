/**
 * PHASE 6 - INTELLIGENCE CONTEXTUELLE
 * Point d'entrée pour le système d'intelligence contextuelle
 */

export { SemanticAnalyzer, type SemanticAnalysis } from './semantic-analyzer.js';
export { 
  ContextManager, 
  type UserSession, 
  type UserPreferences, 
  type GenerationHistory,
  type ContextualRecommendation 
} from './context-manager.js';
export { 
  TemplatePersonalizer, 
  type PersonalizationRule,
  type TemplateModification,
  type PersonalizedTemplate 
} from './template-personalizer.js';

import { SemanticAnalyzer, SemanticAnalysis } from './semantic-analyzer.js';
import { ContextManager, UserSession, ContextualRecommendation } from './context-manager.js';
import { TemplatePersonalizer, PersonalizedTemplate } from './template-personalizer.js';

/**
 * Système d'Intelligence Contextuelle intégré
 * Combine analyse sémantique, gestion de contexte et personnalisation
 */
export class IntelligenceSystem {
  private semanticAnalyzer: SemanticAnalyzer;
  private contextManager: ContextManager;
  private templatePersonalizer: TemplatePersonalizer;

  constructor() {
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.contextManager = new ContextManager();
    this.templatePersonalizer = new TemplatePersonalizer();
  }

  /**
   * Analyse complète d'un prompt avec intelligence contextuelle
   */
  async analyzeWithContext(
    prompt: string, 
    sessionId: string
  ): Promise<{
    analysis: SemanticAnalysis;
    session: UserSession;
    recommendations: ContextualRecommendation[];
    personalizedTemplate: PersonalizedTemplate;
  }> {
    // 1. Analyse sémantique du prompt
    const analysis = this.semanticAnalyzer.analyze(prompt);

    // 2. Gestion de la session utilisateur
    let session = this.contextManager.loadSession(sessionId);
    if (!session) {
      session = this.contextManager.createSession(sessionId);
    }

    // 3. Génération de recommandations contextuelles
    const recommendations = this.contextManager.generateRecommendations(analysis);

    // 4. Personnalisation du template
    const personalizedTemplate = this.templatePersonalizer.personalizeTemplate(
      this.getBaseTemplate(analysis.domain),
      analysis,
      session,
      recommendations
    );

    return {
      analysis,
      session,
      recommendations,
      personalizedTemplate
    };
  }

  /**
   * Mise à jour post-génération avec feedback
   */
  updateWithResult(
    sessionId: string, 
    prompt: string,
    analysis: SemanticAnalysis, 
    result: any
  ): void {
    const session = this.contextManager.loadSession(sessionId);
    if (!session) return;

    // Ajouter le prompt à l'historique
    if (session.history.length > 0) {
      const lastEntry = session.history[session.history.length - 1];
      lastEntry.prompt = prompt;
    }

    this.contextManager.updateSession(analysis, result);
  }

  /**
   * Obtenir les statistiques d'usage pour une session
   */
  getSessionStats(sessionId: string): {
    totalGenerations: number;
    successRate: number;
    favoriteFeatures: string[];
    expertiseDomains: Array<{ domain: string; level: number }>;
    averageScore: number;
  } | null {
    const session = this.contextManager.loadSession(sessionId);
    if (!session) return null;

    const totalGenerations = session.history.length;
    const successes = session.history.filter(h => h.result.success).length;
    const successRate = totalGenerations > 0 ? successes / totalGenerations : 0;

    const favoriteFeatures = Object.entries(session.preferences.frequentFeatures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature);

    const expertiseDomains = Object.entries(session.preferences.domainExpertise)
      .map(([domain, level]) => ({ domain, level }))
      .sort((a, b) => b.level - a.level);

    const scores = session.history
      .filter(h => h.result.score !== undefined)
      .map(h => h.result.score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      totalGenerations,
      successRate,
      favoriteFeatures,
      expertiseDomains,
      averageScore
    };
  }

  /**
   * Obtenir des suggestions d'amélioration pour l'utilisateur
   */
  getSuggestionsForImprovement(sessionId: string): string[] {
    const session = this.contextManager.loadSession(sessionId);
    if (!session) return [];

    const suggestions: string[] = [];
    const stats = this.getSessionStats(sessionId);
    if (!stats) return suggestions;

    // Suggestions basées sur le taux de succès
    if (stats.successRate < 0.7) {
      suggestions.push("💡 Essayez des prompts plus spécifiques et détaillés pour améliorer le taux de succès");
    }

    // Suggestions basées sur le score moyen
    if (stats.averageScore < 80) {
      suggestions.push("🎯 Définissez clairement les fonctionnalités essentielles pour obtenir de meilleurs scores");
    }

    // Suggestions basées sur l'expertise
    const lowExpertiseDomains = stats.expertiseDomains.filter(d => d.level < 0.3);
    if (lowExpertiseDomains.length > 0) {
      suggestions.push(`📚 Explorez davantage les domaines: ${lowExpertiseDomains.map(d => d.domain).join(', ')} pour développer votre expertise`);
    }

    // Suggestions basées sur la diversité
    if (stats.favoriteFeatures.length < 3) {
      suggestions.push("🔀 Expérimentez avec différents types de fonctionnalités pour enrichir vos applications");
    }

    return suggestions;
  }

  /**
   * Réinitialiser une session utilisateur
   */
  resetSession(sessionId: string): boolean {
    return this.contextManager.deleteSession(sessionId);
  }

  /**
   * Exporter les données d'une session
   */
  exportSession(sessionId: string): UserSession | null {
    return this.contextManager.loadSession(sessionId);
  }

  /**
   * Obtenir la liste de toutes les sessions
   */
  getAllSessions(): string[] {
    return this.contextManager.getAllSessions();
  }

  private getBaseTemplate(domain: string): string {
    // Cette méthode devrait retourner le template de base approprié
    // Pour l'instant, on retourne un placeholder
    const templates: Record<string, string> = {
      'saas': 'saas_base_template',
      'ecommerce': 'ecommerce_base_template',
      'blog': 'blog_base_template',
      'portfolio': 'portfolio_base_template'
    };

    return templates[domain] || 'default_template';
  }
}

// Instance singleton pour utilisation globale
export const intelligenceSystem = new IntelligenceSystem();