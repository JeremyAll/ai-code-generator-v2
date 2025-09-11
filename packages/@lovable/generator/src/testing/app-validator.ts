/**
 * PHASE 7.1 - TESTS AUTOMATISÉS
 * Validateur automatique d'applications générées
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ValidationResult {
  appPath: string;
  timestamp: Date;
  overallScore: number;
  details: {
    structure: StructureValidation;
    compilation: CompilationValidation;
    quality: QualityValidation;
    functionality: FunctionalityValidation;
    performance: PerformanceValidation;
    accessibility: AccessibilityValidation;
  };
  duration: number;
  suggestions: string[];
}

export interface StructureValidation {
  score: number;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    critical: boolean;
  }>;
}

export interface CompilationValidation {
  score: number;
  typescript: boolean;
  eslint: { passed: boolean; issues: number };
  build: { success: boolean; output: string };
}

export interface QualityValidation {
  score: number;
  codeQuality: number;
  maintainability: number;
  complexity: number;
  coverage: number;
}

export interface FunctionalityValidation {
  score: number;
  components: Array<{
    name: string;
    exists: boolean;
    functional: boolean;
    props: boolean;
  }>;
  pages: Array<{
    name: string;
    exists: boolean;
    routable: boolean;
    functional: boolean;
  }>;
}

export interface PerformanceValidation {
  score: number;
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
}

export interface AccessibilityValidation {
  score: number;
  violations: Array<{
    rule: string;
    severity: 'error' | 'warning' | 'info';
    count: number;
  }>;
  passedRules: string[];
}

export class AppValidator {
  private validationStartTime: number = 0;

  async validateApp(appPath: string): Promise<ValidationResult> {
    this.validationStartTime = Date.now();

    console.log(`🧪 Validation de l'application: ${appPath}`);

    const result: ValidationResult = {
      appPath,
      timestamp: new Date(),
      overallScore: 0,
      details: {
        structure: await this.validateStructure(appPath),
        compilation: await this.validateCompilation(appPath),
        quality: await this.validateQuality(appPath),
        functionality: await this.validateFunctionality(appPath),
        performance: await this.validatePerformance(appPath),
        accessibility: await this.validateAccessibility(appPath)
      },
      duration: 0,
      suggestions: []
    };

    // Calculer le score global et les suggestions
    result.overallScore = this.calculateOverallScore(result.details);
    result.suggestions = this.generateSuggestions(result.details);
    result.duration = Date.now() - this.validationStartTime;

    return result;
  }

  private async validateStructure(appPath: string): Promise<StructureValidation> {
    const checks = [
      {
        name: 'package.json exists',
        critical: true,
        check: () => fs.existsSync(path.join(appPath, 'package.json'))
      },
      {
        name: 'Next.js app directory',
        critical: true,
        check: () => fs.existsSync(path.join(appPath, 'app'))
      },
      {
        name: 'TypeScript config',
        critical: false,
        check: () => fs.existsSync(path.join(appPath, 'tsconfig.json'))
      },
      {
        name: 'Tailwind config',
        critical: false,
        check: () => fs.existsSync(path.join(appPath, 'tailwind.config.js'))
      },
      {
        name: 'Components directory',
        critical: false,
        check: () => fs.existsSync(path.join(appPath, 'components'))
      },
      {
        name: 'Layout file',
        critical: true,
        check: () => fs.existsSync(path.join(appPath, 'app', 'layout.tsx'))
      },
      {
        name: 'Main page',
        critical: true,
        check: () => fs.existsSync(path.join(appPath, 'app', 'page.tsx'))
      },
      {
        name: 'Global styles',
        critical: false,
        check: () => fs.existsSync(path.join(appPath, 'app', 'globals.css'))
      }
    ];

    const results = checks.map(check => ({
      name: check.name,
      passed: check.check(),
      message: check.check() ? '✅ Validé' : '❌ Manquant',
      critical: check.critical
    }));

    const passed = results.filter(r => r.passed).length;
    const critical = results.filter(r => r.critical && !r.passed).length;
    
    // Score: 100 si tout passe, pénalité sévère pour les critiques
    let score = Math.round((passed / checks.length) * 100);
    if (critical > 0) {
      score = Math.max(score - (critical * 30), 0);
    }

    return {
      score,
      checks: results
    };
  }

  private async validateCompilation(appPath: string): Promise<CompilationValidation> {
    let typescript = false;
    let eslint = { passed: false, issues: 0 };
    let build = { success: false, output: '' };

    try {
      // Vérifier TypeScript
      const tscPath = path.join(appPath, 'tsconfig.json');
      if (fs.existsSync(tscPath)) {
        try {
          await execAsync('npx tsc --noEmit', { cwd: appPath, timeout: 30000 });
          typescript = true;
        } catch (error: any) {
          typescript = false;
          console.log(`⚠️ TypeScript errors in ${appPath}:`, error.stdout || error.message);
        }
      }

      // Vérifier ESLint (si configuré)
      const eslintPath = path.join(appPath, '.eslintrc.json');
      if (fs.existsSync(eslintPath)) {
        try {
          const { stdout } = await execAsync('npx eslint . --format json', { 
            cwd: appPath, 
            timeout: 30000 
          });
          const eslintResults = JSON.parse(stdout);
          const totalIssues = eslintResults.reduce((sum: number, file: any) => 
            sum + file.messages.length, 0
          );
          eslint = { passed: totalIssues === 0, issues: totalIssues };
        } catch (error: any) {
          // ESLint peut retourner un code d'erreur même avec des warnings
          try {
            const eslintResults = JSON.parse(error.stdout || '[]');
            const totalIssues = eslintResults.reduce((sum: number, file: any) => 
              sum + file.messages.length, 0
            );
            eslint = { passed: totalIssues === 0, issues: totalIssues };
          } catch {
            eslint = { passed: false, issues: -1 };
          }
        }
      }

      // Vérifier build Next.js
      try {
        const { stdout, stderr } = await execAsync('npm run build', { 
          cwd: appPath, 
          timeout: 120000 
        });
        build = { 
          success: true, 
          output: stdout + (stderr ? `\nWarnings: ${stderr}` : '')
        };
      } catch (error: any) {
        build = { 
          success: false, 
          output: error.stdout + '\nErrors: ' + error.stderr 
        };
      }

    } catch (error) {
      console.error('Erreur validation compilation:', error);
    }

    // Calculer score compilation
    let score = 0;
    if (typescript) score += 30;
    if (eslint.passed) score += 30;
    else if (eslint.issues >= 0 && eslint.issues <= 5) score += 15; // Peu d'issues
    if (build.success) score += 40;

    return {
      score: Math.min(score, 100),
      typescript,
      eslint,
      build
    };
  }

  private async validateQuality(appPath: string): Promise<QualityValidation> {
    // Analyse statique de qualité de code
    let codeQuality = 70; // Score de base
    let maintainability = 70;
    let complexity = 70;
    let coverage = 0;

    try {
      // Analyser la structure des fichiers
      const files = this.getAllFiles(appPath, ['.tsx', '.ts', '.jsx', '.js']);
      
      // Métriques de qualité
      let totalLines = 0;
      let totalFunctions = 0;
      let longFunctions = 0;
      let duplicatedCode = 0;

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const lines = content.split('\n');
          totalLines += lines.length;

          // Compter les fonctions
          const functions = content.match(/(function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|\w+\s*\([^)]*\)\s*{)/g) || [];
          totalFunctions += functions.length;

          // Détecter fonctions longues (>50 lignes)
          const functionBodies = content.match(/{\s*[^}]{200,}}/g) || [];
          longFunctions += functionBodies.length;

          // Détection basique de code dupliqué (lignes similaires)
          const uniqueLines = new Set(lines.filter(line => line.trim().length > 10));
          duplicatedCode += lines.length - uniqueLines.size;

        } catch (error) {
          // Ignorer les erreurs de fichiers individuels
        }
      }

      // Calculer les scores
      codeQuality = Math.max(100 - (longFunctions / Math.max(totalFunctions, 1)) * 50, 30);
      maintainability = Math.max(100 - (duplicatedCode / Math.max(totalLines, 1)) * 100, 30);
      complexity = Math.max(100 - (totalLines / files.length / 100), 30);

    } catch (error) {
      console.warn('Erreur analyse qualité:', error);
    }

    return {
      score: Math.round((codeQuality + maintainability + complexity + coverage) / 4),
      codeQuality: Math.round(codeQuality),
      maintainability: Math.round(maintainability),
      complexity: Math.round(complexity),
      coverage
    };
  }

  private async validateFunctionality(appPath: string): Promise<FunctionalityValidation> {
    const components: Array<{
      name: string;
      exists: boolean;
      functional: boolean;
      props: boolean;
    }> = [];

    const pages: Array<{
      name: string;
      exists: boolean;
      routable: boolean;
      functional: boolean;
    }> = [];

    try {
      // Valider components
      const componentsDir = path.join(appPath, 'components');
      if (fs.existsSync(componentsDir)) {
        const componentFiles = this.getAllFiles(componentsDir, ['.tsx', '.jsx']);
        
        for (const file of componentFiles) {
          const name = path.basename(file, path.extname(file));
          const content = fs.readFileSync(file, 'utf-8');
          
          components.push({
            name,
            exists: true,
            functional: content.includes('export') && (content.includes('function') || content.includes('=>')),
            props: content.includes('props') || content.includes('interface') || content.includes('type')
          });
        }
      }

      // Valider pages
      const appDir = path.join(appPath, 'app');
      if (fs.existsSync(appDir)) {
        const pageFiles = this.getAllFiles(appDir, ['page.tsx', 'page.jsx']);
        
        for (const file of pageFiles) {
          const relativePath = path.relative(appDir, path.dirname(file));
          const name = relativePath === '' ? 'home' : relativePath.replace(/\\/g, '/');
          const content = fs.readFileSync(file, 'utf-8');
          
          pages.push({
            name,
            exists: true,
            routable: true,
            functional: content.includes('export default') && content.length > 100
          });
        }
      }

    } catch (error) {
      console.warn('Erreur validation fonctionnalité:', error);
    }

    // Calculer score fonctionnalité
    const componentScore = components.length > 0 ? 
      components.filter(c => c.functional && c.props).length / components.length * 50 : 0;
    const pageScore = pages.length > 0 ? 
      pages.filter(p => p.functional).length / pages.length * 50 : 0;

    return {
      score: Math.round(componentScore + pageScore),
      components,
      pages
    };
  }

  private async validatePerformance(appPath: string): Promise<PerformanceValidation> {
    let bundleSize = 0;
    let loadTime = 0;
    let renderTime = 0;
    let memoryUsage = 0;

    try {
      // Estimer la taille du bundle
      const files = this.getAllFiles(appPath, ['.tsx', '.ts', '.jsx', '.js', '.css']);
      for (const file of files) {
        try {
          const stats = fs.statSync(file);
          bundleSize += stats.size;
        } catch {
          // Ignorer erreurs fichiers individuels
        }
      }

      // Simuler métriques de performance (à améliorer avec de vrais tests)
      loadTime = Math.min(bundleSize / 10000, 5000); // Estimation basée sur la taille
      renderTime = Math.min(files.length * 10, 2000);
      memoryUsage = Math.min(bundleSize / 1000, 50);

    } catch (error) {
      console.warn('Erreur validation performance:', error);
    }

    // Score performance (inversement proportionnel aux métriques)
    const sizeScore = Math.max(100 - bundleSize / 10000, 0);
    const loadScore = Math.max(100 - loadTime / 50, 0);
    const renderScore = Math.max(100 - renderTime / 20, 0);
    const memoryScore = Math.max(100 - memoryUsage * 2, 0);

    return {
      score: Math.round((sizeScore + loadScore + renderScore + memoryScore) / 4),
      bundleSize,
      loadTime,
      renderTime,
      memoryUsage
    };
  }

  private async validateAccessibility(appPath: string): Promise<AccessibilityValidation> {
    const violations: Array<{
      rule: string;
      severity: 'error' | 'warning' | 'info';
      count: number;
    }> = [];
    const passedRules: string[] = [];

    try {
      // Analyse basique d'accessibilité sur les fichiers TSX
      const files = this.getAllFiles(appPath, ['.tsx', '.jsx']);
      
      const rules = [
        {
          name: 'alt-text',
          pattern: /<img(?![^>]*alt=)[^>]*>/g,
          severity: 'error' as const,
          description: 'Images without alt text'
        },
        {
          name: 'button-accessibility',
          pattern: /<button[^>]*>(\s*<[^>]*>\s*)*\s*<\/button>/g,
          severity: 'warning' as const,
          description: 'Empty buttons'
        },
        {
          name: 'form-labels',
          pattern: /<input(?![^>]*(?:aria-label|aria-labelledby))[^>]*>/g,
          severity: 'warning' as const,
          description: 'Inputs without labels'
        },
        {
          name: 'heading-structure',
          pattern: /<h[1-6][^>]*>/g,
          severity: 'info' as const,
          description: 'Heading structure'
        }
      ];

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          
          for (const rule of rules) {
            const matches = content.match(rule.pattern) || [];
            if (matches.length > 0) {
              const existing = violations.find(v => v.rule === rule.name);
              if (existing) {
                existing.count += matches.length;
              } else {
                violations.push({
                  rule: rule.name,
                  severity: rule.severity,
                  count: matches.length
                });
              }
            } else {
              if (!passedRules.includes(rule.name)) {
                passedRules.push(rule.name);
              }
            }
          }
        } catch {
          // Ignorer erreurs fichiers individuels
        }
      }

    } catch (error) {
      console.warn('Erreur validation accessibilité:', error);
    }

    // Calculer score accessibilité
    const totalViolations = violations.reduce((sum, v) => sum + v.count, 0);
    const errorViolations = violations.filter(v => v.severity === 'error').reduce((sum, v) => sum + v.count, 0);
    
    let score = 100;
    score -= errorViolations * 20; // Erreurs sont sévères
    score -= (totalViolations - errorViolations) * 5; // Warnings moins sévères
    
    return {
      score: Math.max(score, 0),
      violations,
      passedRules
    };
  }

  private calculateOverallScore(details: ValidationResult['details']): number {
    // Pondération des scores
    const weights = {
      structure: 0.25,    // Critique
      compilation: 0.25,  // Critique
      quality: 0.20,      // Important
      functionality: 0.15, // Important
      performance: 0.10,   // Utile
      accessibility: 0.05  // Bonus
    };

    return Math.round(
      details.structure.score * weights.structure +
      details.compilation.score * weights.compilation +
      details.quality.score * weights.quality +
      details.functionality.score * weights.functionality +
      details.performance.score * weights.performance +
      details.accessibility.score * weights.accessibility
    );
  }

  private generateSuggestions(details: ValidationResult['details']): string[] {
    const suggestions: string[] = [];

    // Suggestions structure
    if (details.structure.score < 80) {
      suggestions.push('🏗️ Compléter la structure de base (package.json, tsconfig, etc.)');
    }

    // Suggestions compilation
    if (!details.compilation.typescript) {
      suggestions.push('📝 Corriger les erreurs TypeScript pour une meilleure qualité');
    }
    if (details.compilation.eslint.issues > 5) {
      suggestions.push(`🔍 Réduire les problèmes ESLint (${details.compilation.eslint.issues} détectés)`);
    }
    if (!details.compilation.build.success) {
      suggestions.push('🔨 Corriger les erreurs de build pour déploiement');
    }

    // Suggestions qualité
    if (details.quality.codeQuality < 70) {
      suggestions.push('📊 Améliorer la qualité du code (fonctions plus courtes, moins de complexité)');
    }
    if (details.quality.maintainability < 70) {
      suggestions.push('🔄 Réduire la duplication de code pour maintainabilité');
    }

    // Suggestions fonctionnalité
    if (details.functionality.score < 70) {
      suggestions.push('⚙️ Améliorer les composants (props, export, fonctionnalités)');
    }

    // Suggestions performance
    if (details.performance.bundleSize > 500000) { // 500KB
      suggestions.push('⚡ Optimiser la taille du bundle (code splitting, lazy loading)');
    }

    // Suggestions accessibilité
    if (details.accessibility.score < 80) {
      suggestions.push('♿ Améliorer l\'accessibilité (alt text, labels, structure)');
    }

    return suggestions;
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (stat.isFile()) {
          const hasValidExtension = extensions.some(ext => 
            fullPath.endsWith(ext) || item.endsWith(ext)
          );
          if (hasValidExtension) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs d'accès aux dossiers
    }
    
    return files;
  }
}