/**
 * PHASE 7.2 - VALIDATION CONTINUE
 * Système de validation continue pour chaque génération
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppValidator, ValidationResult } from './app-validator.js';

const execAsync = promisify(exec);

export interface ContinuousValidationConfig {
  enabledChecks: {
    linting: boolean;
    typecheck: boolean;
    build: boolean;
    security: boolean;
    accessibility: boolean;
    performance: boolean;
  };
  thresholds: {
    minOverallScore: number;
    minCompilationScore: number;
    minQualityScore: number;
    maxBuildTime: number;
    maxLintIssues: number;
  };
  autoFix: {
    enableAutoFix: boolean;
    fixableIssues: string[];
    maxFixAttempts: number;
  };
}

export interface ContinuousValidationResult {
  appPath: string;
  timestamp: Date;
  passed: boolean;
  validation: ValidationResult;
  fixes: AutoFixResult[];
  quality: QualityGate[];
  duration: number;
  nextSteps: string[];
}

export interface AutoFixResult {
  type: 'lint' | 'format' | 'typecheck' | 'security';
  description: string;
  applied: boolean;
  beforeScore: number;
  afterScore: number;
  error?: string;
}

export interface QualityGate {
  name: string;
  passed: boolean;
  score: number;
  threshold: number;
  critical: boolean;
  message: string;
}

export class ContinuousValidator {
  private validator: AppValidator;
  private config: ContinuousValidationConfig;

  constructor(config?: Partial<ContinuousValidationConfig>) {
    this.validator = new AppValidator();
    this.config = {
      enabledChecks: {
        linting: true,
        typecheck: true,
        build: true,
        security: true,
        accessibility: true,
        performance: true
      },
      thresholds: {
        minOverallScore: 75,
        minCompilationScore: 80,
        minQualityScore: 70,
        maxBuildTime: 120000, // 2 minutes
        maxLintIssues: 10
      },
      autoFix: {
        enableAutoFix: true,
        fixableIssues: ['lint', 'format', 'imports'],
        maxFixAttempts: 3
      },
      ...config
    };
  }

  async validateContinuously(appPath: string): Promise<ContinuousValidationResult> {
    console.log(`🔄 Validation continue: ${appPath}`);
    const startTime = Date.now();

    // 1. Validation initiale
    const initialValidation = await this.validator.validateApp(appPath);
    
    // 2. Application de corrections automatiques si activées
    const fixes: AutoFixResult[] = [];
    let currentValidation = initialValidation;

    if (this.config.autoFix.enableAutoFix) {
      console.log('🔧 Application de corrections automatiques...');
      const autoFixes = await this.applyAutoFixes(appPath, currentValidation);
      fixes.push(...autoFixes);

      // Re-validation après corrections
      if (autoFixes.length > 0) {
        currentValidation = await this.validator.validateApp(appPath);
      }
    }

    // 3. Vérification des quality gates
    const qualityGates = this.checkQualityGates(currentValidation);

    // 4. Détermination du passage/échec
    const passed = qualityGates.filter(gate => gate.critical).every(gate => gate.passed);

    // 5. Génération des prochaines étapes
    const nextSteps = this.generateNextSteps(currentValidation, qualityGates);

    const result: ContinuousValidationResult = {
      appPath,
      timestamp: new Date(),
      passed,
      validation: currentValidation,
      fixes,
      quality: qualityGates,
      duration: Date.now() - startTime,
      nextSteps
    };

    // Log du résultat
    this.logValidationResult(result);

    return result;
  }

  private async applyAutoFixes(appPath: string, validation: ValidationResult): Promise<AutoFixResult[]> {
    const fixes: AutoFixResult[] = [];

    try {
      // Auto-fix 1: ESLint --fix
      if (this.config.enabledChecks.linting && validation.details.compilation.eslint.issues > 0) {
        const lintFix = await this.applyLintFix(appPath, validation.details.compilation.eslint.issues);
        if (lintFix) fixes.push(lintFix);
      }

      // Auto-fix 2: Prettier formatting
      const formatFix = await this.applyFormatFix(appPath);
      if (formatFix) fixes.push(formatFix);

      // Auto-fix 3: Import organization
      const importFix = await this.applyImportFix(appPath);
      if (importFix) fixes.push(importFix);

      // Auto-fix 4: TypeScript common fixes
      if (!validation.details.compilation.typescript) {
        const typeFix = await this.applyTypescriptFix(appPath);
        if (typeFix) fixes.push(typeFix);
      }

    } catch (error) {
      console.warn('Erreur lors des corrections automatiques:', error);
    }

    return fixes;
  }

  private async applyLintFix(appPath: string, issuesBefore: number): Promise<AutoFixResult | null> {
    try {
      console.log('  🔍 Application corrections ESLint...');
      
      await execAsync('npx eslint . --fix --quiet', {
        cwd: appPath,
        timeout: 60000
      });

      // Vérifier le résultat
      const { stdout } = await execAsync('npx eslint . --format json', {
        cwd: appPath,
        timeout: 30000
      });

      const results = JSON.parse(stdout);
      const issuesAfter = results.reduce((sum: number, file: any) => 
        sum + file.messages.length, 0
      );

      const fixed = Math.max(0, issuesBefore - issuesAfter);

      return {
        type: 'lint',
        description: `ESLint: ${fixed} problèmes corrigés`,
        applied: fixed > 0,
        beforeScore: issuesBefore,
        afterScore: issuesAfter
      };

    } catch (error: any) {
      return {
        type: 'lint',
        description: 'Échec correction ESLint',
        applied: false,
        beforeScore: issuesBefore,
        afterScore: issuesBefore,
        error: error.message
      };
    }
  }

  private async applyFormatFix(appPath: string): Promise<AutoFixResult | null> {
    try {
      console.log('  ✨ Application formatage Prettier...');
      
      await execAsync('npx prettier --write "**/*.{ts,tsx,js,jsx,css,md}"', {
        cwd: appPath,
        timeout: 60000
      });

      return {
        type: 'format',
        description: 'Formatage Prettier appliqué',
        applied: true,
        beforeScore: 0,
        afterScore: 100
      };

    } catch (error: any) {
      return {
        type: 'format',
        description: 'Échec formatage Prettier',
        applied: false,
        beforeScore: 0,
        afterScore: 0,
        error: error.message
      };
    }
  }

  private async applyImportFix(appPath: string): Promise<AutoFixResult | null> {
    try {
      console.log('  📦 Organisation des imports...');
      
      // Utiliser organize-imports-cli si disponible
      await execAsync('npx organize-imports-cli tsconfig.json', {
        cwd: appPath,
        timeout: 60000
      });

      return {
        type: 'lint',
        description: 'Imports organisés automatiquement',
        applied: true,
        beforeScore: 0,
        afterScore: 100
      };

    } catch (error: any) {
      // Pas critique si l'outil n'est pas disponible
      return null;
    }
  }

  private async applyTypescriptFix(appPath: string): Promise<AutoFixResult | null> {
    try {
      console.log('  📝 Corrections TypeScript basiques...');
      
      // Corrections TypeScript communes via regex
      const fixes = await this.applyCommonTypescriptFixes(appPath);

      return {
        type: 'typecheck',
        description: `TypeScript: ${fixes} corrections appliquées`,
        applied: fixes > 0,
        beforeScore: 0,
        afterScore: fixes > 0 ? 80 : 0
      };

    } catch (error: any) {
      return {
        type: 'typecheck',
        description: 'Échec corrections TypeScript',
        applied: false,
        beforeScore: 0,
        afterScore: 0,
        error: error.message
      };
    }
  }

  private async applyCommonTypescriptFixes(appPath: string): Promise<number> {
    let totalFixes = 0;

    const files = this.getAllTsFiles(appPath);

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf-8');
        let modified = false;

        // Fix 1: Ajouter types React pour les props
        if (content.includes('export default function') && !content.includes('React')) {
          content = `import React from 'react';\n${content}`;
          modified = true;
        }

        // Fix 2: Ajouter types pour les events
        content = content.replace(
          /\(\s*e\s*\)\s*=>/g,
          '(e: React.MouseEvent) =>'
        );

        // Fix 3: Typer les useState
        content = content.replace(
          /const \[(\w+), set\w+\] = useState\(\[\]\);/g,
          'const [$1, set$1] = useState<any[]>([]);'
        );

        if (modified || content !== fs.readFileSync(file, 'utf-8')) {
          fs.writeFileSync(file, content);
          totalFixes++;
        }

      } catch (error) {
        // Ignorer les erreurs sur fichiers individuels
      }
    }

    return totalFixes;
  }

  private checkQualityGates(validation: ValidationResult): QualityGate[] {
    const gates: QualityGate[] = [];

    // Quality Gate 1: Score global minimum
    gates.push({
      name: 'Score Global',
      passed: validation.overallScore >= this.config.thresholds.minOverallScore,
      score: validation.overallScore,
      threshold: this.config.thresholds.minOverallScore,
      critical: true,
      message: `Score: ${validation.overallScore}% (min: ${this.config.thresholds.minOverallScore}%)`
    });

    // Quality Gate 2: Compilation réussie
    gates.push({
      name: 'Compilation',
      passed: validation.details.compilation.score >= this.config.thresholds.minCompilationScore,
      score: validation.details.compilation.score,
      threshold: this.config.thresholds.minCompilationScore,
      critical: true,
      message: validation.details.compilation.build.success ? 
        'Build réussi' : 'Échec build - bloquant'
    });

    // Quality Gate 3: Qualité de code
    gates.push({
      name: 'Qualité Code',
      passed: validation.details.quality.score >= this.config.thresholds.minQualityScore,
      score: validation.details.quality.score,
      threshold: this.config.thresholds.minQualityScore,
      critical: false,
      message: `Maintainabilité: ${validation.details.quality.maintainability}%`
    });

    // Quality Gate 4: Linting acceptable
    const lintIssues = validation.details.compilation.eslint.issues;
    gates.push({
      name: 'Linting',
      passed: lintIssues <= this.config.thresholds.maxLintIssues,
      score: Math.max(0, 100 - lintIssues * 5),
      threshold: this.config.thresholds.maxLintIssues,
      critical: false,
      message: `${lintIssues} problèmes détectés (max: ${this.config.thresholds.maxLintIssues})`
    });

    // Quality Gate 5: Performance acceptable
    gates.push({
      name: 'Performance',
      passed: validation.details.performance.score >= 60,
      score: validation.details.performance.score,
      threshold: 60,
      critical: false,
      message: `Bundle: ${Math.round(validation.details.performance.bundleSize / 1000)}KB`
    });

    // Quality Gate 6: Accessibilité basique
    gates.push({
      name: 'Accessibilité',
      passed: validation.details.accessibility.score >= 70,
      score: validation.details.accessibility.score,
      threshold: 70,
      critical: false,
      message: `${validation.details.accessibility.violations.length} violations détectées`
    });

    return gates;
  }

  private generateNextSteps(validation: ValidationResult, gates: QualityGate[]): string[] {
    const steps: string[] = [];

    // Étapes basées sur les quality gates échouées
    const failedCritical = gates.filter(g => g.critical && !g.passed);
    const failedOptional = gates.filter(g => !g.critical && !g.passed);

    if (failedCritical.length > 0) {
      steps.push('🚨 ACTIONS CRITIQUES:');
      for (const gate of failedCritical) {
        steps.push(`   • ${gate.name}: ${gate.message}`);
      }
    }

    if (failedOptional.length > 0) {
      steps.push('💡 AMÉLIORATIONS RECOMMANDÉES:');
      for (const gate of failedOptional) {
        steps.push(`   • ${gate.name}: ${gate.message}`);
      }
    }

    // Suggestions spécifiques
    if (!validation.details.compilation.build.success) {
      steps.push('🔨 Corriger les erreurs de build avant déploiement');
    }

    if (validation.details.quality.score < 70) {
      steps.push('📊 Refactoriser le code pour améliorer la maintenabilité');
    }

    if (validation.details.performance.bundleSize > 500000) {
      steps.push('⚡ Optimiser la taille du bundle (lazy loading, code splitting)');
    }

    if (validation.details.accessibility.violations.length > 0) {
      steps.push('♿ Corriger les problèmes d\'accessibilité détectés');
    }

    if (steps.length === 0) {
      steps.push('✅ Application prête pour déploiement !');
    }

    return steps;
  }

  private logValidationResult(result: ContinuousValidationResult): void {
    const status = result.passed ? '✅ VALIDÉ' : '❌ ÉCHEC';
    const duration = Math.round(result.duration / 1000);
    
    console.log(`\n${status} - Validation continue (${duration}s)`);
    console.log(`📊 Score: ${result.validation.overallScore}%`);
    
    if (result.fixes.length > 0) {
      console.log(`🔧 Corrections: ${result.fixes.filter(f => f.applied).length}/${result.fixes.length}`);
    }

    const criticalFailed = result.quality.filter(g => g.critical && !g.passed);
    if (criticalFailed.length > 0) {
      console.log(`🚨 Quality gates critiques échouées: ${criticalFailed.length}`);
    }

    const optionalFailed = result.quality.filter(g => !g.critical && !g.passed);
    if (optionalFailed.length > 0) {
      console.log(`⚠️ Quality gates optionnelles échouées: ${optionalFailed.length}`);
    }
  }

  private getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllTsFiles(fullPath));
        } else if (stat.isFile() && /\.(ts|tsx)$/.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorer les erreurs d'accès aux dossiers
    }
    
    return files;
  }

  updateConfig(newConfig: Partial<ContinuousValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ContinuousValidationConfig {
    return { ...this.config };
  }
}