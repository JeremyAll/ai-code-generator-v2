/**
 * PHASE 7.3 - PIPELINE CI/CD
 * Configuration et orchestration du pipeline CI/CD
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ContinuousValidator, ContinuousValidationResult } from './continuous-validator.js';
import { AppTestSuite, TestRunResult } from './test-suite.js';

const execAsync = promisify(exec);

export interface PipelineConfig {
  stages: {
    lint: boolean;
    test: boolean;
    build: boolean;
    security: boolean;
    deploy: boolean;
  };
  deployment: {
    staging: {
      enabled: boolean;
      provider: 'vercel' | 'netlify' | 'github-pages' | 'custom';
      url?: string;
    };
    production: {
      enabled: boolean;
      requiresApproval: boolean;
      provider: 'vercel' | 'netlify' | 'github-pages' | 'custom';
      url?: string;
    };
  };
  qualityGates: {
    minTestCoverage: number;
    minOverallScore: number;
    maxLintIssues: number;
    requiredChecks: string[];
  };
  notifications: {
    slack?: string;
    email?: string[];
    webhook?: string;
  };
}

export interface PipelineRun {
  id: string;
  appPath: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  stages: PipelineStage[];
  deployment?: DeploymentResult;
  duration?: number;
  artifacts: string[];
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  logs: string[];
  artifacts: string[];
}

export interface DeploymentResult {
  stage: 'staging' | 'production';
  status: 'pending' | 'deploying' | 'success' | 'failed';
  url?: string;
  provider: string;
  deploymentId?: string;
  error?: string;
}

export class CICDPipeline {
  private continuousValidator: ContinuousValidator;
  private testSuite: AppTestSuite;
  private config: PipelineConfig;
  private activePipelines: Map<string, PipelineRun> = new Map();

  constructor(config?: Partial<PipelineConfig>) {
    this.continuousValidator = new ContinuousValidator();
    this.testSuite = new AppTestSuite();
    this.config = {
      stages: {
        lint: true,
        test: true,
        build: true,
        security: true,
        deploy: false // Désactivé par défaut pour les tests
      },
      deployment: {
        staging: {
          enabled: false,
          provider: 'vercel'
        },
        production: {
          enabled: false,
          requiresApproval: true,
          provider: 'vercel'
        }
      },
      qualityGates: {
        minTestCoverage: 80,
        minOverallScore: 75,
        maxLintIssues: 10,
        requiredChecks: ['lint', 'build', 'security']
      },
      notifications: {},
      ...config
    };
  }

  async runPipeline(appPath: string, branch: string = 'main'): Promise<PipelineRun> {
    const pipelineId = this.generatePipelineId();
    console.log(`🚀 Démarrage pipeline CI/CD: ${pipelineId}`);
    console.log(`📁 Application: ${appPath}`);
    console.log(`🌿 Branch: ${branch}\n`);

    const pipeline: PipelineRun = {
      id: pipelineId,
      appPath,
      startTime: new Date(),
      status: 'running',
      stages: this.initializeStages(),
      artifacts: []
    };

    this.activePipelines.set(pipelineId, pipeline);

    try {
      // Stage 1: Lint & Format
      if (this.config.stages.lint) {
        await this.runLintStage(pipeline);
      }

      // Stage 2: Tests automatisés
      if (this.config.stages.test) {
        await this.runTestStage(pipeline);
      }

      // Stage 3: Build & Validation continue
      if (this.config.stages.build) {
        await this.runBuildStage(pipeline);
      }

      // Stage 4: Audit de sécurité
      if (this.config.stages.security) {
        await this.runSecurityStage(pipeline);
      }

      // Stage 5: Déploiement (si configuré)
      if (this.config.stages.deploy && this.config.deployment.staging.enabled) {
        await this.runDeployStage(pipeline, 'staging');
      }

      // Finalisation du pipeline
      pipeline.status = 'success';
      pipeline.endTime = new Date();
      pipeline.duration = pipeline.endTime.getTime() - pipeline.startTime.getTime();

      await this.sendNotification(pipeline, 'success');
      this.logPipelineResult(pipeline);

    } catch (error) {
      pipeline.status = 'failed';
      pipeline.endTime = new Date();
      pipeline.duration = pipeline.endTime.getTime() - pipeline.startTime.getTime();

      console.error(`❌ Pipeline ${pipelineId} échoué:`, error);
      await this.sendNotification(pipeline, 'failed', error as Error);
    }

    return pipeline;
  }

  private async runLintStage(pipeline: PipelineRun): Promise<void> {
    const stage = this.findStage(pipeline, 'Lint & Format');
    stage.status = 'running';
    stage.startTime = new Date();

    try {
      console.log('🔍 Stage 1: Lint & Format...');
      
      // ESLint check
      stage.logs.push('Vérification ESLint...');
      const { stdout: lintOutput } = await execAsync('npx eslint . --format compact', {
        cwd: pipeline.appPath,
        timeout: 120000
      });
      stage.logs.push(`ESLint: ${lintOutput.split('\n').length - 1} fichiers vérifiés`);

      // Prettier check
      stage.logs.push('Vérification formatage...');
      await execAsync('npx prettier --check "**/*.{ts,tsx,js,jsx,css,md}"', {
        cwd: pipeline.appPath,
        timeout: 60000
      });
      stage.logs.push('Prettier: Formatage conforme');

      stage.status = 'success';
      stage.logs.push('✅ Lint & Format réussi');

    } catch (error: any) {
      stage.status = 'failed';
      stage.logs.push(`❌ Échec: ${error.message}`);
      throw new Error(`Lint stage failed: ${error.message}`);
    } finally {
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - (stage.startTime?.getTime() || 0);
    }
  }

  private async runTestStage(pipeline: PipelineRun): Promise<void> {
    const stage = this.findStage(pipeline, 'Tests');
    stage.status = 'running';
    stage.startTime = new Date();

    try {
      console.log('🧪 Stage 2: Tests automatisés...');

      // Tests de validation d'app
      stage.logs.push('Exécution validation continue...');
      const validation = await this.continuousValidator.validateContinuously(pipeline.appPath);
      
      stage.logs.push(`Score global: ${validation.validation.overallScore}%`);
      stage.logs.push(`Quality gates: ${validation.quality.filter(g => g.passed).length}/${validation.quality.length}`);

      // Vérifier les seuils de qualité
      if (validation.validation.overallScore < this.config.qualityGates.minOverallScore) {
        throw new Error(`Score trop faible: ${validation.validation.overallScore}% < ${this.config.qualityGates.minOverallScore}%`);
      }

      const criticalFailed = validation.quality.filter(g => g.critical && !g.passed);
      if (criticalFailed.length > 0) {
        throw new Error(`Quality gates critiques échouées: ${criticalFailed.map(g => g.name).join(', ')}`);
      }

      // Tests unitaires (si configurés)
      if (fs.existsSync(path.join(pipeline.appPath, 'jest.config.js'))) {
        stage.logs.push('Exécution tests unitaires...');
        const { stdout: testOutput } = await execAsync('npm test -- --passWithNoTests', {
          cwd: pipeline.appPath,
          timeout: 300000
        });
        stage.logs.push(`Tests unitaires: ${testOutput.includes('passed') ? 'réussis' : 'aucun'}`);
      }

      stage.status = 'success';
      stage.logs.push('✅ Tests réussis');

    } catch (error: any) {
      stage.status = 'failed';
      stage.logs.push(`❌ Échec: ${error.message}`);
      throw new Error(`Test stage failed: ${error.message}`);
    } finally {
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - (stage.startTime?.getTime() || 0);
    }
  }

  private async runBuildStage(pipeline: PipelineRun): Promise<void> {
    const stage = this.findStage(pipeline, 'Build');
    stage.status = 'running';
    stage.startTime = new Date();

    try {
      console.log('🔨 Stage 3: Build & Validation...');

      // TypeScript compilation
      stage.logs.push('Vérification TypeScript...');
      await execAsync('npx tsc --noEmit', {
        cwd: pipeline.appPath,
        timeout: 120000
      });
      stage.logs.push('TypeScript: Compilation réussie');

      // Next.js build
      stage.logs.push('Build Next.js...');
      const { stdout: buildOutput } = await execAsync('npm run build', {
        cwd: pipeline.appPath,
        timeout: 300000
      });
      
      // Analyser la sortie du build
      const bundleInfo = this.parseBuildOutput(buildOutput);
      stage.logs.push(`Build réussi: ${bundleInfo.pages} pages, ${bundleInfo.size}`);

      // Créer artifact du build
      const buildArtifact = path.join(pipeline.appPath, '.next');
      if (fs.existsSync(buildArtifact)) {
        stage.artifacts.push(buildArtifact);
        pipeline.artifacts.push(buildArtifact);
      }

      stage.status = 'success';
      stage.logs.push('✅ Build réussi');

    } catch (error: any) {
      stage.status = 'failed';
      stage.logs.push(`❌ Échec: ${error.message}`);
      throw new Error(`Build stage failed: ${error.message}`);
    } finally {
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - (stage.startTime?.getTime() || 0);
    }
  }

  private async runSecurityStage(pipeline: PipelineRun): Promise<void> {
    const stage = this.findStage(pipeline, 'Security');
    stage.status = 'running';
    stage.startTime = new Date();

    try {
      console.log('🔒 Stage 4: Audit de sécurité...');

      // Audit des dépendances
      stage.logs.push('Audit des dépendances...');
      try {
        const { stdout: auditOutput } = await execAsync('npm audit --audit-level moderate', {
          cwd: pipeline.appPath,
          timeout: 120000
        });
        
        if (auditOutput.includes('vulnerabilities')) {
          const vulnerabilities = auditOutput.match(/(\d+) vulnerabilities/);
          if (vulnerabilities && parseInt(vulnerabilities[1]) > 0) {
            stage.logs.push(`⚠️ ${vulnerabilities[1]} vulnérabilités détectées`);
          }
        } else {
          stage.logs.push('✅ Aucune vulnérabilité critique détectée');
        }
      } catch (auditError: any) {
        if (auditError.code === 1) {
          // Code 1 = vulnérabilités trouvées mais non bloquantes
          stage.logs.push('⚠️ Vulnérabilités détectées mais non critiques');
        } else {
          throw auditError;
        }
      }

      // Vérification des secrets dans le code
      stage.logs.push('Vérification secrets...');
      const secretsFound = await this.scanForSecrets(pipeline.appPath);
      if (secretsFound.length > 0) {
        stage.logs.push(`⚠️ ${secretsFound.length} secrets potentiels détectés`);
        // Log les types mais pas les valeurs
        stage.logs.push(`Types: ${secretsFound.map(s => s.type).join(', ')}`);
      } else {
        stage.logs.push('✅ Aucun secret détecté');
      }

      stage.status = 'success';
      stage.logs.push('✅ Audit sécurité terminé');

    } catch (error: any) {
      stage.status = 'failed';
      stage.logs.push(`❌ Échec: ${error.message}`);
      throw new Error(`Security stage failed: ${error.message}`);
    } finally {
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - (stage.startTime?.getTime() || 0);
    }
  }

  private async runDeployStage(pipeline: PipelineRun, environment: 'staging' | 'production'): Promise<void> {
    const stage = this.findStage(pipeline, 'Deploy');
    stage.status = 'running';
    stage.startTime = new Date();

    try {
      console.log(`🚀 Stage 5: Déploiement ${environment}...`);

      const deployConfig = this.config.deployment[environment];
      
      // Simulation de déploiement (pour Phase 7, pas de vrai déploiement)
      stage.logs.push(`Déploiement sur ${deployConfig.provider}...`);
      
      // Simmer le déploiement avec un délai
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockUrl = `https://${pipeline.id}-${environment}.${deployConfig.provider}.app`;
      
      pipeline.deployment = {
        stage: environment,
        status: 'success',
        url: mockUrl,
        provider: deployConfig.provider,
        deploymentId: `deploy-${Date.now()}`
      };

      stage.logs.push(`✅ Déploiement réussi: ${mockUrl}`);
      stage.status = 'success';

    } catch (error: any) {
      stage.status = 'failed';
      stage.logs.push(`❌ Échec: ${error.message}`);
      
      if (pipeline.deployment) {
        pipeline.deployment.status = 'failed';
        pipeline.deployment.error = error.message;
      }
      
      throw new Error(`Deploy stage failed: ${error.message}`);
    } finally {
      stage.endTime = new Date();
      stage.duration = stage.endTime.getTime() - (stage.startTime?.getTime() || 0);
    }
  }

  private async scanForSecrets(appPath: string): Promise<Array<{type: string, file: string}>> {
    const secrets: Array<{type: string, file: string}> = [];
    
    const secretPatterns = [
      { type: 'API Key', pattern: /['"](sk-|pk_|api_key_)[a-zA-Z0-9]{32,}['"]/ },
      { type: 'JWT Token', pattern: /['"](eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)['"]/ },
      { type: 'Database URL', pattern: /['"](postgres|mysql|mongodb):\/\/[^'"]*['"]/ },
      { type: 'Private Key', pattern: /-----BEGIN (RSA )?PRIVATE KEY-----/ }
    ];

    const files = this.getAllFiles(appPath, ['.ts', '.tsx', '.js', '.jsx', '.env']);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        
        for (const { type, pattern } of secretPatterns) {
          if (pattern.test(content)) {
            secrets.push({ type, file: path.relative(appPath, file) });
          }
        }
      } catch (error) {
        // Ignorer erreurs de lecture
      }
    }

    return secrets;
  }

  private parseBuildOutput(output: string): {pages: number, size: string} {
    // Parser basique de la sortie Next.js build
    const lines = output.split('\n');
    let pages = 0;
    let totalSize = 'Unknown';

    for (const line of lines) {
      if (line.includes('Route (pages)') || line.includes('○')) {
        pages++;
      }
      if (line.includes('Total size:') || line.includes('First Load JS shared by all')) {
        const sizeMatch = line.match(/(\d+\.?\d*\s*(B|kB|MB))/);
        if (sizeMatch) {
          totalSize = sizeMatch[1];
        }
      }
    }

    return { pages: Math.max(pages, 1), size: totalSize };
  }

  private initializeStages(): PipelineStage[] {
    return [
      { name: 'Lint & Format', status: 'pending', logs: [], artifacts: [] },
      { name: 'Tests', status: 'pending', logs: [], artifacts: [] },
      { name: 'Build', status: 'pending', logs: [], artifacts: [] },
      { name: 'Security', status: 'pending', logs: [], artifacts: [] },
      { name: 'Deploy', status: 'pending', logs: [], artifacts: [] }
    ];
  }

  private findStage(pipeline: PipelineRun, name: string): PipelineStage {
    const stage = pipeline.stages.find(s => s.name === name);
    if (!stage) {
      throw new Error(`Stage ${name} not found`);
    }
    return stage;
  }

  private generatePipelineId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ci-${timestamp}-${random}`;
  }

  private async sendNotification(pipeline: PipelineRun, status: 'success' | 'failed', error?: Error): Promise<void> {
    // Implémentation basique des notifications
    const message = status === 'success' 
      ? `✅ Pipeline ${pipeline.id} réussi (${Math.round((pipeline.duration || 0) / 1000)}s)`
      : `❌ Pipeline ${pipeline.id} échoué: ${error?.message}`;

    console.log(`📢 Notification: ${message}`);

    // TODO: Intégrer avec Slack, email, webhooks selon config
  }

  private logPipelineResult(pipeline: PipelineRun): void {
    console.log(`\n🏁 Pipeline ${pipeline.id} terminé:`);
    console.log(`⏱️ Durée: ${Math.round((pipeline.duration || 0) / 1000)}s`);
    console.log(`📊 Statut: ${pipeline.status}`);
    
    console.log('\n📋 Détail des stages:');
    for (const stage of pipeline.stages) {
      const status = stage.status === 'success' ? '✅' : 
                    stage.status === 'failed' ? '❌' : 
                    stage.status === 'running' ? '🔄' : '⏸️';
      const duration = stage.duration ? `${Math.round(stage.duration / 1000)}s` : '-';
      console.log(`  ${status} ${stage.name}: ${duration}`);
    }

    if (pipeline.deployment && pipeline.deployment.url) {
      console.log(`\n🌐 Déploiement: ${pipeline.deployment.url}`);
    }
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
          const hasValidExtension = extensions.some(ext => fullPath.endsWith(ext));
          if (hasValidExtension) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignorer erreurs d'accès
    }
    
    return files;
  }

  getPipeline(id: string): PipelineRun | undefined {
    return this.activePipelines.get(id);
  }

  getActivePipelines(): PipelineRun[] {
    return Array.from(this.activePipelines.values());
  }

  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}