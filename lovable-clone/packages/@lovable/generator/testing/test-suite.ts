/**
 * PHASE 7.1 - TESTS AUTOMATISÉS
 * Suite de tests complète pour applications générées
 */

import fs from 'fs';
import path from 'path';
import { AppValidator, ValidationResult } from './app-validator.js';

export interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  type: 'domain' | 'complexity' | 'features' | 'regression';
  prompt: string;
  expectedDomain: string;
  expectedFeatures: string[];
  minScore: number;
  timeout: number;
}

export interface TestResult {
  testCase: TestCase;
  success: boolean;
  validation: ValidationResult | null;
  error: string | null;
  duration: number;
  matchedExpectations: {
    domain: boolean;
    features: boolean;
    score: boolean;
  };
}

export interface TestRunResult {
  suite: TestSuite;
  startTime: Date;
  endTime: Date;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageScore: number;
    averageDuration: number;
  };
}

export class AppTestSuite {
  private validator: AppValidator;
  private testSuites: TestSuite[] = [];

  constructor() {
    this.validator = new AppValidator();
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    // Suite 1: Tests par domaine
    this.testSuites.push({
      name: 'Domain Coverage',
      description: 'Tests de couverture par domaine d\'application',
      tests: [
        {
          name: 'SaaS Dashboard Simple',
          type: 'domain',
          prompt: 'Créer un dashboard SaaS simple avec métriques utilisateurs',
          expectedDomain: 'saas',
          expectedFeatures: ['dashboard', 'metrics', 'authentication'],
          minScore: 75,
          timeout: 180000
        },
        {
          name: 'E-commerce Boutique',
          type: 'domain',
          prompt: 'Boutique e-commerce avec panier et paiements',
          expectedDomain: 'ecommerce',
          expectedFeatures: ['shopping_cart', 'payment', 'products'],
          minScore: 75,
          timeout: 180000
        },
        {
          name: 'Blog Personnel',
          type: 'domain',
          prompt: 'Blog personnel avec articles et commentaires',
          expectedDomain: 'blog',
          expectedFeatures: ['articles', 'comments', 'seo'],
          minScore: 70,
          timeout: 150000
        },
        {
          name: 'Portfolio Créatif',
          type: 'domain',
          prompt: 'Portfolio créatif avec galerie et contact',
          expectedDomain: 'portfolio',
          expectedFeatures: ['gallery', 'contact', 'showcase'],
          minScore: 70,
          timeout: 150000
        }
      ]
    });

    // Suite 2: Tests de complexité
    this.testSuites.push({
      name: 'Complexity Levels',
      description: 'Tests des différents niveaux de complexité',
      tests: [
        {
          name: 'Application Simple',
          type: 'complexity',
          prompt: 'Application simple de todo list basique',
          expectedDomain: 'app',
          expectedFeatures: ['basic_crud'],
          minScore: 80,
          timeout: 120000
        },
        {
          name: 'Application Medium',
          type: 'complexity',
          prompt: 'Application de gestion de projet avec équipes et tâches',
          expectedDomain: 'saas',
          expectedFeatures: ['teams', 'tasks', 'dashboard'],
          minScore: 75,
          timeout: 180000
        },
        {
          name: 'Application Complexe',
          type: 'complexity',
          prompt: 'Plateforme e-learning avec cours, quiz, certification et analytics',
          expectedDomain: 'saas',
          expectedFeatures: ['courses', 'quizzes', 'analytics', 'certification'],
          minScore: 65,
          timeout: 300000
        }
      ]
    });

    // Suite 3: Tests de fonctionnalités spécifiques
    this.testSuites.push({
      name: 'Feature Coverage',
      description: 'Tests de fonctionnalités spécifiques',
      tests: [
        {
          name: 'Authentication & Authorization',
          type: 'features',
          prompt: 'Application avec système d\'authentification complet et rôles',
          expectedDomain: 'saas',
          expectedFeatures: ['authentication', 'authorization', 'roles'],
          minScore: 70,
          timeout: 180000
        },
        {
          name: 'Real-time Features',
          type: 'features',
          prompt: 'Chat application avec messages temps réel et notifications',
          expectedDomain: 'saas',
          expectedFeatures: ['real_time', 'chat', 'notifications'],
          minScore: 65,
          timeout: 180000
        },
        {
          name: 'Data Visualization',
          type: 'features',
          prompt: 'Dashboard analytics avec graphiques et export de données',
          expectedDomain: 'saas',
          expectedFeatures: ['charts', 'analytics', 'export'],
          minScore: 70,
          timeout: 180000
        }
      ]
    });

    // Suite 4: Tests de régression
    this.testSuites.push({
      name: 'Regression Tests',
      description: 'Tests de régression des fonctionnalités existantes',
      tests: [
        {
          name: 'Phase 5 Templates',
          type: 'regression',
          prompt: 'Application SaaS analytics avec tous les composants Phase 5',
          expectedDomain: 'saas',
          expectedFeatures: ['DashboardContext', 'AnalyticsContext', 'MetricsCard'],
          minScore: 85,
          timeout: 180000
        },
        {
          name: 'Phase 6 Intelligence',
          type: 'regression',
          prompt: 'Dashboard pour utilisateur expérimenté avec fonctionnalités avancées',
          expectedDomain: 'saas',
          expectedFeatures: ['advanced_features', 'intelligence'],
          minScore: 80,
          timeout: 180000
        }
      ]
    });
  }

  async runSuite(suiteName: string): Promise<TestRunResult> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Suite de test introuvable: ${suiteName}`);
    }

    console.log(`\n🧪 Exécution suite: ${suite.name}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`🔢 Nombre de tests: ${suite.tests.length}\n`);

    const startTime = new Date();
    const results: TestResult[] = [];

    for (const [index, testCase] of suite.tests.entries()) {
      console.log(`\n[${index + 1}/${suite.tests.length}] 🧪 ${testCase.name}`);
      console.log(`📝 Prompt: "${testCase.prompt.substring(0, 60)}..."`);
      
      const result = await this.runSingleTest(testCase);
      results.push(result);
      
      const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
      const score = result.validation?.overallScore || 0;
      console.log(`${status} - Score: ${score}% (${Math.round(result.duration)}ms)`);
      
      if (!result.success && result.error) {
        console.log(`   ⚠️ Erreur: ${result.error.substring(0, 100)}...`);
      }
    }

    const endTime = new Date();
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const averageScore = results.reduce((sum, r) => sum + (r.validation?.overallScore || 0), 0) / results.length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    const summary = {
      total: results.length,
      passed,
      failed,
      averageScore: Math.round(averageScore),
      averageDuration: Math.round(averageDuration)
    };

    console.log(`\n📊 RÉSULTATS SUITE "${suite.name}":`);
    console.log(`✅ Succès: ${passed}/${results.length} (${Math.round(passed / results.length * 100)}%)`);
    console.log(`📈 Score moyen: ${summary.averageScore}%`);
    console.log(`⏱️ Temps moyen: ${Math.round(summary.averageDuration / 1000)}s`);

    return {
      suite,
      startTime,
      endTime,
      results,
      summary
    };
  }

  async runAllSuites(): Promise<TestRunResult[]> {
    console.log('🚀 EXÉCUTION COMPLÈTE DES TESTS PHASE 7');
    console.log('=====================================\n');

    const allResults: TestRunResult[] = [];

    for (const suite of this.testSuites) {
      try {
        const result = await this.runSuite(suite.name);
        allResults.push(result);
      } catch (error) {
        console.error(`❌ Erreur suite ${suite.name}:`, error);
      }
    }

    // Résumé global
    console.log('\n🎯 RÉSUMÉ GLOBAL PHASE 7:');
    console.log('========================');

    let totalTests = 0;
    let totalPassed = 0;
    let totalScore = 0;

    for (const result of allResults) {
      totalTests += result.summary.total;
      totalPassed += result.summary.passed;
      totalScore += result.summary.averageScore * result.summary.total;
      
      console.log(`📋 ${result.suite.name}: ${result.summary.passed}/${result.summary.total} (${result.summary.averageScore}%)`);
    }

    const globalSuccessRate = Math.round(totalPassed / totalTests * 100);
    const globalAverageScore = Math.round(totalScore / totalTests);

    console.log(`\n🎉 RÉSULTAT FINAL:`);
    console.log(`✅ Taux de succès: ${totalPassed}/${totalTests} (${globalSuccessRate}%)`);
    console.log(`📊 Score moyen: ${globalAverageScore}%`);

    // Verdict Phase 7.1
    if (globalSuccessRate >= 90 && globalAverageScore >= 80) {
      console.log(`🏆 PHASE 7.1 VALIDÉE - Système de tests opérationnel !`);
    } else if (globalSuccessRate >= 75 && globalAverageScore >= 70) {
      console.log(`✅ PHASE 7.1 FONCTIONNELLE - Améliorations recommandées`);
    } else {
      console.log(`⚠️ PHASE 7.1 PARTIELLE - Corrections nécessaires`);
    }

    return allResults;
  }

  private async runSingleTest(testCase: TestCase): Promise<TestResult> {
    const testStart = Date.now();
    
    try {
      // Pour ce test, on simule la génération avec une app existante
      // Dans la vraie implémentation, on appellerait le workflow de génération
      const testAppPath = await this.findOrCreateTestApp(testCase);
      
      if (!testAppPath) {
        return {
          testCase,
          success: false,
          validation: null,
          error: 'Aucune application de test disponible',
          duration: Date.now() - testStart,
          matchedExpectations: { domain: false, features: false, score: false }
        };
      }

      // Valider l'application
      const validation = await this.validator.validateApp(testAppPath);
      
      // Vérifier les attentes
      const matchedExpectations = {
        domain: this.checkDomainMatch(validation, testCase.expectedDomain),
        features: this.checkFeaturesMatch(validation, testCase.expectedFeatures),
        score: validation.overallScore >= testCase.minScore
      };

      const success = matchedExpectations.domain && 
                     matchedExpectations.features && 
                     matchedExpectations.score;

      return {
        testCase,
        success,
        validation,
        error: null,
        duration: Date.now() - testStart,
        matchedExpectations
      };

    } catch (error) {
      return {
        testCase,
        success: false,
        validation: null,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - testStart,
        matchedExpectations: { domain: false, features: false, score: false }
      };
    }
  }

  private async findOrCreateTestApp(testCase: TestCase): Promise<string | null> {
    // Pour Phase 7.1, on utilise des applications de test existantes
    // Dans Phase 7.2, on intégrera avec le workflow de génération réel
    
    const testAppsDir = path.join(process.cwd(), 'generated-apps');
    
    if (!fs.existsSync(testAppsDir)) {
      return null;
    }

    // Chercher une app existante qui correspond au domaine
    const apps = fs.readdirSync(testAppsDir);
    const domainApps = apps.filter(app => {
      if (testCase.expectedDomain === 'saas' && app.includes('phase5-test-app')) {
        return true;
      }
      return app.toLowerCase().includes(testCase.expectedDomain.toLowerCase());
    });

    if (domainApps.length > 0) {
      return path.join(testAppsDir, domainApps[0]);
    }

    return null;
  }

  private checkDomainMatch(validation: ValidationResult, expectedDomain: string): boolean {
    // Vérification basique du domaine basée sur la structure des fichiers
    const appPath = validation.appPath;
    
    if (expectedDomain === 'saas') {
      return fs.existsSync(path.join(appPath, 'contexts')) ||
             fs.existsSync(path.join(appPath, 'components', 'business'));
    }
    
    if (expectedDomain === 'ecommerce') {
      return validation.details.functionality.components.some(c => 
        c.name.toLowerCase().includes('product') || 
        c.name.toLowerCase().includes('cart')
      );
    }
    
    if (expectedDomain === 'blog') {
      return validation.details.functionality.components.some(c => 
        c.name.toLowerCase().includes('post') || 
        c.name.toLowerCase().includes('article')
      );
    }
    
    if (expectedDomain === 'portfolio') {
      return validation.details.functionality.components.some(c => 
        c.name.toLowerCase().includes('gallery') || 
        c.name.toLowerCase().includes('project')
      );
    }

    return true; // Domaine générique accepté
  }

  private checkFeaturesMatch(validation: ValidationResult, expectedFeatures: string[]): boolean {
    if (expectedFeatures.length === 0) return true;

    // Vérification basique des features basée sur les fichiers et composants
    const appPath = validation.appPath;
    let foundFeatures = 0;

    for (const feature of expectedFeatures) {
      let found = false;

      // Vérifier dans les noms de composants
      if (validation.details.functionality.components.some(c => 
          c.name.toLowerCase().includes(feature.toLowerCase()))) {
        found = true;
      }

      // Vérifications spécifiques
      switch (feature.toLowerCase()) {
        case 'dashboardcontext':
        case 'dashboard':
          found = fs.existsSync(path.join(appPath, 'contexts', 'DashboardContext.tsx'));
          break;
        case 'analyticscontext':
        case 'analytics':
          found = fs.existsSync(path.join(appPath, 'contexts', 'AnalyticsContext.tsx'));
          break;
        case 'metricscard':
        case 'metrics':
          found = fs.existsSync(path.join(appPath, 'components', 'business', 'MetricsCard.tsx'));
          break;
        case 'authentication':
        case 'auth':
          found = validation.details.functionality.components.some(c => 
            c.name.toLowerCase().includes('auth') || c.name.toLowerCase().includes('login'));
          break;
      }

      if (found) foundFeatures++;
    }

    // Au moins 60% des features attendues doivent être présentes
    return foundFeatures >= Math.ceil(expectedFeatures.length * 0.6);
  }

  getAvailableSuites(): string[] {
    return this.testSuites.map(s => s.name);
  }

  async generateTestReport(results: TestRunResult[]): Promise<string> {
    const report = [
      '# 🧪 RAPPORT DE TESTS PHASE 7.1',
      '',
      `*Généré le ${new Date().toLocaleDateString('fr-FR')}*`,
      '',
      '## 📊 Résumé Exécutif',
      ''
    ];

    let totalTests = 0;
    let totalPassed = 0;
    let totalScore = 0;

    for (const result of results) {
      totalTests += result.summary.total;
      totalPassed += result.summary.passed;
      totalScore += result.summary.averageScore * result.summary.total;

      report.push(`### ${result.suite.name}`);
      report.push(`- **Tests**: ${result.summary.passed}/${result.summary.total}`);
      report.push(`- **Score moyen**: ${result.summary.averageScore}%`);
      report.push(`- **Temps moyen**: ${Math.round(result.summary.averageDuration / 1000)}s`);
      report.push('');
    }

    const globalSuccess = Math.round(totalPassed / totalTests * 100);
    const globalScore = Math.round(totalScore / totalTests);

    report.push('## 🎯 Métriques Globales');
    report.push(`- **Taux de succès**: ${globalSuccess}%`);
    report.push(`- **Score moyen**: ${globalScore}%`);
    report.push(`- **Total tests**: ${totalPassed}/${totalTests}`);
    report.push('');

    report.push('## ✅ Verdict Phase 7.1');
    if (globalSuccess >= 90 && globalScore >= 80) {
      report.push('🏆 **PHASE 7.1 VALIDÉE** - Système de tests opérationnel !');
    } else if (globalSuccess >= 75 && globalScore >= 70) {
      report.push('✅ **PHASE 7.1 FONCTIONNELLE** - Améliorations recommandées');
    } else {
      report.push('⚠️ **PHASE 7.1 PARTIELLE** - Corrections nécessaires');
    }

    return report.join('\n');
  }
}