/**
 * PHASE 6.3 - INTELLIGENCE CONTEXTUELLE
 * Personnalisateur de templates adaptatif
 */

import { SemanticAnalysis } from './semantic-analyzer.js';
import { UserSession, ContextualRecommendation } from './context-manager.js';

export interface PersonalizationRule {
  condition: (analysis: SemanticAnalysis, session: UserSession) => boolean;
  priority: number;
  modifications: TemplateModification[];
}

export interface TemplateModification {
  type: 'add_component' | 'remove_component' | 'modify_style' | 'add_feature' | 'change_architecture';
  target: string;
  value: any;
  reason: string;
}

export interface PersonalizedTemplate {
  baseTemplate: string;
  modifications: TemplateModification[];
  confidence: number;
  reasoning: string[];
}

export class TemplatePersonalizer {
  private personalizationRules: PersonalizationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Règles basées sur l'expertise utilisateur
    this.personalizationRules.push({
      condition: (analysis, session) => {
        const expertise = session.preferences.domainExpertise[analysis.domain] || 0;
        return expertise > 0.7 && analysis.complexity !== 'enterprise';
      },
      priority: 8,
      modifications: [
        {
          type: 'add_feature',
          target: 'advanced_features',
          value: ['error_boundaries', 'performance_monitoring', 'seo_optimization'],
          reason: 'Expertise élevée détectée - ajout de fonctionnalités avancées'
        },
        {
          type: 'change_architecture',
          target: 'structure',
          value: 'enterprise_patterns',
          reason: 'Utilisateur expérimenté - architecture plus sophistiquée'
        }
      ]
    });

    // Règles basées sur l'historique d'échecs
    this.personalizationRules.push({
      condition: (analysis, session) => {
        const recentFailures = session.history
          .slice(-3)
          .filter(h => !h.result.success).length;
        return recentFailures >= 2;
      },
      priority: 10,
      modifications: [
        {
          type: 'change_architecture',
          target: 'complexity',
          value: 'simplified',
          reason: 'Échecs récents - simplification de l\'architecture'
        },
        {
          type: 'remove_component',
          target: 'optional_features',
          value: ['advanced_animations', 'complex_state_management'],
          reason: 'Réduction de complexité pour éviter les erreurs'
        }
      ]
    });

    // Règles basées sur les préférences techniques
    this.personalizationRules.push({
      condition: (analysis, session) => {
        return session.preferences.favoriteFrameworks.includes('nextjs') && 
               analysis.techPreferences.length === 0;
      },
      priority: 6,
      modifications: [
        {
          type: 'add_component',
          target: 'nextjs_features',
          value: ['app_router', 'server_components', 'image_optimization'],
          reason: 'Préférence Next.js détectée - ajout de fonctionnalités spécifiques'
        }
      ]
    });

    // Règles basées sur la vitesse de génération préférée
    this.personalizationRules.push({
      condition: (analysis, session) => {
        return session.preferences.generationSpeed === 'fast';
      },
      priority: 5,
      modifications: [
        {
          type: 'remove_component',
          target: 'optional_optimizations',
          value: ['detailed_comments', 'extensive_testing', 'complex_animations'],
          reason: 'Mode génération rapide - suppression d\'optimisations optionnelles'
        }
      ]
    });

    // Règles basées sur le domaine d'application
    this.personalizationRules.push({
      condition: (analysis, session) => {
        return analysis.domain === 'saas' && analysis.keyFeatures.includes('analytics');
      },
      priority: 7,
      modifications: [
        {
          type: 'add_component',
          target: 'saas_analytics',
          value: ['real_time_charts', 'dashboard_widgets', 'export_functionality'],
          reason: 'SaaS avec analytics - ajout de composants de visualisation avancés'
        }
      ]
    });

    // Règles basées sur la cible d'audience
    this.personalizationRules.push({
      condition: (analysis, session) => {
        return analysis.targetAudience === 'enterprise' && analysis.complexity !== 'simple';
      },
      priority: 8,
      modifications: [
        {
          type: 'add_feature',
          target: 'enterprise_features',
          value: ['audit_logs', 'rbac', 'api_rate_limiting', 'multi_tenancy'],
          reason: 'Audience entreprise - ajout de fonctionnalités professionnelles'
        },
        {
          type: 'modify_style',
          target: 'design_system',
          value: 'professional_theme',
          reason: 'Thème professionnel pour audience entreprise'
        }
      ]
    });

    // Règles basées sur les fonctionnalités fréquentes
    this.personalizationRules.push({
      condition: (analysis, session) => {
        const frequentFeatures = Object.entries(session.preferences.frequentFeatures)
          .filter(([, count]) => count >= 3)
          .map(([feature]) => feature);
        
        return frequentFeatures.length > 0 && 
               !analysis.keyFeatures.some(f => frequentFeatures.includes(f));
      },
      priority: 4,
      modifications: [
        {
          type: 'add_feature',
          target: 'frequent_features',
          value: [], // Sera rempli dynamiquement
          reason: 'Ajout de fonctionnalités fréquemment utilisées'
        }
      ]
    });

    // Règles basées sur la qualité attendue
    this.personalizationRules.push({
      condition: (analysis, session) => {
        return session.preferences.qualityThreshold > 85;
      },
      priority: 6,
      modifications: [
        {
          type: 'add_feature',
          target: 'quality_features',
          value: ['typescript_strict', 'eslint_strict', 'comprehensive_tests', 'accessibility_compliance'],
          reason: 'Seuil de qualité élevé - ajout de fonctionnalités qualité'
        }
      ]
    });
  }

  personalizeTemplate(
    baseTemplate: string, 
    analysis: SemanticAnalysis, 
    session: UserSession | null,
    recommendations: ContextualRecommendation[] = []
  ): PersonalizedTemplate {
    
    if (!session) {
      return {
        baseTemplate,
        modifications: [],
        confidence: 1.0,
        reasoning: ['Aucune session utilisateur - template de base utilisé']
      };
    }

    const applicableRules = this.personalizationRules
      .filter(rule => rule.condition(analysis, session))
      .sort((a, b) => b.priority - a.priority);

    const modifications: TemplateModification[] = [];
    const reasoning: string[] = [];

    // Appliquer les règles de personnalisation
    for (const rule of applicableRules) {
      for (const modification of rule.modifications) {
        // Logique spéciale pour les fonctionnalités fréquentes
        if (modification.target === 'frequent_features') {
          const frequentFeatures = Object.entries(session.preferences.frequentFeatures)
            .filter(([, count]) => count >= 3)
            .map(([feature]) => feature)
            .slice(0, 2); // Limite à 2 fonctionnalités

          if (frequentFeatures.length > 0) {
            modification.value = frequentFeatures;
            modifications.push(modification);
            reasoning.push(modification.reason + ': ' + frequentFeatures.join(', '));
          }
        } else {
          modifications.push(modification);
          reasoning.push(modification.reason);
        }
      }
    }

    // Intégrer les recommandations contextuelles
    for (const recommendation of recommendations) {
      if (recommendation.confidence > 0.6) {
        modifications.push({
          type: this.getModificationTypeFromRecommendation(recommendation.type),
          target: recommendation.type,
          value: recommendation.title,
          reason: recommendation.description
        });
        reasoning.push(`Recommandation: ${recommendation.title} (confiance: ${Math.round(recommendation.confidence * 100)}%)`);
      }
    }

    // Calculer la confiance globale
    const confidence = this.calculateConfidence(modifications, session, analysis);

    return {
      baseTemplate,
      modifications,
      confidence,
      reasoning
    };
  }

  private getModificationTypeFromRecommendation(type: string): TemplateModification['type'] {
    const mapping: Record<string, TemplateModification['type']> = {
      'tech': 'add_component',
      'feature': 'add_feature',
      'architecture': 'change_architecture',
      'optimization': 'modify_style'
    };

    return mapping[type] || 'add_feature';
  }

  private calculateConfidence(
    modifications: TemplateModification[], 
    session: UserSession, 
    analysis: SemanticAnalysis
  ): number {
    let confidence = 0.8; // Base confidence

    // Facteur basé sur l'historique de l'utilisateur
    const successRate = this.calculateSuccessRate(session);
    confidence *= (0.5 + successRate * 0.5);

    // Facteur basé sur l'expertise du domaine
    const domainExpertise = session.preferences.domainExpertise[analysis.domain] || 0;
    confidence *= (0.7 + domainExpertise * 0.3);

    // Facteur basé sur le nombre de modifications (moins de modifications = plus de confiance)
    const modificationPenalty = Math.min(modifications.length * 0.05, 0.2);
    confidence -= modificationPenalty;

    return Math.max(Math.min(confidence, 0.95), 0.3);
  }

  private calculateSuccessRate(session: UserSession): number {
    if (session.history.length === 0) return 0.7; // Défaut pour nouveaux utilisateurs

    const successes = session.history.filter(h => h.result.success).length;
    return successes / session.history.length;
  }

  // Méthode pour appliquer les modifications au template
  applyModifications(template: string, modifications: TemplateModification[]): string {
    let modifiedTemplate = template;

    for (const modification of modifications) {
      modifiedTemplate = this.applyModification(modifiedTemplate, modification);
    }

    return modifiedTemplate;
  }

  private applyModification(template: string, modification: TemplateModification): string {
    // Cette méthode devrait être étendue pour manipuler réellement les templates
    // Pour l'instant, on ajoute des commentaires informatifs
    
    const commentPrefix = `// PERSONNALISATION: ${modification.reason}\n`;
    
    switch (modification.type) {
      case 'add_component':
        if (Array.isArray(modification.value)) {
          const components = modification.value.map(comp => `  // + ${comp}`).join('\n');
          return template + '\n' + commentPrefix + '// Composants ajoutés:\n' + components + '\n';
        }
        break;
        
      case 'add_feature':
        if (Array.isArray(modification.value)) {
          const features = modification.value.map(feat => `  // + ${feat}`).join('\n');
          return template + '\n' + commentPrefix + '// Fonctionnalités ajoutées:\n' + features + '\n';
        }
        break;
        
      case 'change_architecture':
        return template + '\n' + commentPrefix + `// Architecture modifiée: ${modification.value}\n`;
        
      case 'modify_style':
        return template + '\n' + commentPrefix + `// Style modifié: ${modification.value}\n`;
        
      case 'remove_component':
        if (Array.isArray(modification.value)) {
          const components = modification.value.map(comp => `  // - ${comp}`).join('\n');
          return template + '\n' + commentPrefix + '// Composants supprimés:\n' + components + '\n';
        }
        break;
    }
    
    return template;
  }

  // Méthode pour obtenir un résumé des personnalisations
  getPersonalizationSummary(personalizedTemplate: PersonalizedTemplate): string {
    const summary = [
      `Personnalisation appliquée avec ${Math.round(personalizedTemplate.confidence * 100)}% de confiance`,
      '',
      'Modifications appliquées:',
      ...personalizedTemplate.modifications.map(mod => `- ${mod.reason}`),
      '',
      'Raisonnement:',
      ...personalizedTemplate.reasoning.map(reason => `- ${reason}`)
    ];

    return summary.join('\n');
  }
}