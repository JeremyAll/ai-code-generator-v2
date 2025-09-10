import { Logger } from '../utils/logger.js';
import { FileManager } from '../utils/file-manager.js';
import { ApiConfig } from '../config/api-config.js';
import { PromptManager } from '../prompts/prompt-manager.js';
import { UnsplashService } from '../services/unsplash-service.js';
import { ImageEnhancer } from '../prompts/image-enhancer.js';
import { TimestampManager } from '../utils/timestamp.js';
import { RateLimiter } from '../config/rate-limiter.js';
import { AppArchitecture } from './types.js';
import { componentInjector } from '../services/component-injector.js';
import fs from 'fs-extra';
import path from 'path';

export interface WorkflowConfig {
  maxRetries: number;
  stepTimeout: number;
  enableImageGeneration: boolean;
  enableValidation: boolean;
  saveIntermediate: boolean;
  minImagesPerPage: number;
}

export interface WorkflowResult {
  success: boolean;
  appPath?: string;
  architecture?: AppArchitecture;
  files?: Map<string, string>;
  metadata?: {
    duration: number;
    tokensUsed: number;
    imagesCount: number;
    filesCount: number;
  };
  error?: string;
}

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  startTime?: number;
  endTime?: number;
  duration?: number;
  result?: any;
  error?: string;
  retryCount?: number;
}

export class WorkflowManager {
  private logger: Logger;
  private config: ApiConfig;
  private promptManager: PromptManager;
  private unsplashService?: UnsplashService;
  private imageEnhancer: ImageEnhancer;
  private rateLimiter: RateLimiter;
  
  private sessionId: string;
  private workflowConfig: WorkflowConfig;
  private steps: Map<string, WorkflowStep>;
  
  constructor(config?: Partial<WorkflowConfig>) {
    this.logger = new Logger();
    this.config = ApiConfig.getInstance();
    this.promptManager = new PromptManager();
    this.imageEnhancer = new ImageEnhancer();
    this.rateLimiter = new RateLimiter();
    
    this.sessionId = TimestampManager.getTimestamp();
    this.workflowConfig = {
      maxRetries: 3,
      stepTimeout: 120000, // 2 minutes
      enableImageGeneration: true, // TOUJOURS activé
      enableValidation: true,
      saveIntermediate: true,
      minImagesPerPage: 3,
      ...config
    };
    
    this.steps = new Map();
    this.initializeSteps();
    
    // Initialiser Unsplash si configuré
    try {
      const unsplashConfig = this.config.getUnsplashConfig();
      if (unsplashConfig.accessKey) {
        this.unsplashService = new UnsplashService(unsplashConfig.accessKey);
      }
    } catch (error) {
      this.logger.warn('⚠️ Unsplash non configuré, images désactivées', { error: error instanceof Error ? error.message : 'Unknown error' });
      // IMAGES FORCÉES - Ne plus désactiver
      this.logger.warn('⚠️ Unsplash non configuré, mais images requises');
    }
    
    this.logger.info('🚀 WorkflowManager initialisé', {
      sessionId: this.sessionId,
      config: this.workflowConfig
    });
  }
  
  /**
   * Initialiser les étapes du workflow
   */
  private initializeSteps(): void {
    const stepNames = [
      'validation',
      'rate_limit_check',
      'architecture_generation',
      'image_collection',
      'code_generation',
      'image_enhancement',
      'file_creation',
      'validation_final',
      'report_generation'
    ];
    
    stepNames.forEach(name => {
      this.steps.set(name, {
        name,
        status: 'pending',
        retryCount: 0
      });
    });
  }
  
  /**
   * Exécuter une étape avec retry et timeout
   */
  private async executeStep<T>(
    stepName: string,
    operation: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    const step = this.steps.get(stepName)!;
    const maxRetries = this.workflowConfig.maxRetries;
    const stepTimeout = timeout || this.workflowConfig.stepTimeout;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      step.status = attempt === 1 ? 'running' : 'retrying';
      step.startTime = Date.now();
      step.retryCount = attempt - 1;
      
      this.logger.info(`🔄 Exécution étape: ${stepName}`, {
        attempt: `${attempt}/${maxRetries}`,
        timeout: `${stepTimeout}ms`
      });
      
      try {
        // Exécuter l'opération avec timeout
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), stepTimeout)
          )
        ]);
        
        step.endTime = Date.now();
        step.duration = step.endTime - step.startTime!;
        step.status = 'completed';
        step.result = result;
        
        this.logger.info(`✅ Étape terminée: ${stepName}`, {
          duration: `${step.duration}ms`,
          attempt
        });
        
        return result;
        
      } catch (error) {
        step.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt === maxRetries) {
          step.status = 'failed';
          step.endTime = Date.now();
          step.duration = step.endTime - step.startTime!;
          
          this.logger.error(`❌ Échec définitif étape: ${stepName}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts: maxRetries,
            totalDuration: `${step.duration}ms`
          });
          
          throw error;
        } else {
          this.logger.warn(`⚠️ Échec étape: ${stepName}, retry ${attempt + 1}/${maxRetries}`, {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Délai avant retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Impossible d'exécuter l'étape ${stepName} après ${maxRetries} tentatives`);
  }
  
  /**
   * Workflow principal de génération
   */
  async generateApplication(
    userPrompt: string,
    projectName?: string
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    let appPath: string = '';
    let architecture: AppArchitecture | undefined;
    let files: Map<string, string> = new Map();
    let imagesCount = 0;
    
    try {
      this.logger.startGeneration(userPrompt);
      
      // 1. Validation de l'input
      await this.executeStep('validation', async () => {
        this.validateInput(userPrompt, projectName);
      });
      
      // 2. Vérification rate limiting
      await this.executeStep('rate_limit_check', async () => {
        if (!(await this.rateLimiter.canMakeRequest())) {
          throw new Error('Rate limit atteint. Réessayez plus tard.');
        }
      });
      
      // 3. Génération de l'architecture
      architecture = await this.executeStep('architecture_generation', async () => {
        const prompt = this.promptManager.prepareStep1Prompt(
          userPrompt, 
          projectName || this.extractProjectName(userPrompt)
        );
        
        const response = await this.callAnthropicAPI(prompt);
        await this.rateLimiter.recordRequest(response.usage?.outputTokens || 0, 0, true, 'claude-3-sonnet');
        
        const parsedArchitecture = this.promptManager.parseStep1Response(response.content);
        
        // Sauvegarder l'architecture si demandé
        if (this.workflowConfig.saveIntermediate) {
          appPath = FileManager.createAppFolder(parsedArchitecture.projectName);
          await this.saveArchitectureFile(appPath, parsedArchitecture);
        }
        
        return parsedArchitecture;
      });
      
      // 4. Collecte d'images (si activée)
      let images: any[] = [];
      if (this.workflowConfig.enableImageGeneration && this.unsplashService) {
        images = await this.executeStep('image_collection', async () => {
          const result = await this.unsplashService!.getImagesForDomain(
            architecture!.domain || 'general', 
            Math.max(10, this.workflowConfig.minImagesPerPage)
          );
          imagesCount = result.images.length;
          return result.images;
        });
      }
      
      // 5. Génération du code
      const rawCode = await this.executeStep('code_generation', async () => {
        const prompt = this.promptManager.prepareStep2Prompt(userPrompt, architecture!);
        const response = await this.callAnthropicAPI(prompt);
        await this.rateLimiter.recordRequest(response.usage?.outputTokens || 0, 0, true, 'claude-3-sonnet');
        
        const { files: generatedFiles } = this.promptManager.parseStep2Response(response.content);
        return generatedFiles;
      });
      
      // 6. Amélioration des images (si disponibles)
      if (images.length > 0) {
        files = await this.executeStep('image_enhancement', async () => {
          const enhancedFiles = new Map<string, string>();
          
          for (const [filePath, content] of rawCode) {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || filePath.endsWith('.html')) {
              const enhancedContent = this.imageEnhancer.enhancePromptWithImages(
                content,
                images,
                architecture!.domain || 'general'
              );
              enhancedFiles.set(filePath, enhancedContent);
            } else {
              enhancedFiles.set(filePath, content);
            }
          }
          
          return enhancedFiles;
        });
      } else {
        files = rawCode;
      }
      
      // 7. Création des fichiers
      await this.executeStep('file_creation', async () => {
        if (!appPath) {
          appPath = FileManager.createAppFolder(architecture!.projectName);
        }
        
        await this.saveGeneratedFiles(appPath, files);
      });
      
      // 8. Validation finale (si activée)
      if (this.workflowConfig.enableValidation) {
        await this.executeStep('validation_final', async () => {
          await this.validateGeneratedApp(appPath, files);
        });
      }
      
      // 9. Génération du rapport
      await this.executeStep('report_generation', async () => {
        await this.generateReport(appPath, {
          userPrompt,
          architecture: architecture!,
          files,
          images,
          duration: Date.now() - startTime
        });
      });
      
      const duration = Date.now() - startTime;
      
      // 🛡️ VALIDATION POST-GÉNÉRATION
      await this.executeStep('post_generation_validation', async () => {
        return this.validateAndFixGeneration(appPath, files);
      });

      this.logger.endGeneration(true, appPath);
      
      return {
        success: true,
        appPath,
        architecture,
        files,
        metadata: {
          duration,
          tokensUsed: this.estimateTokensUsed(userPrompt, files),
          imagesCount,
          filesCount: files.size
        }
      };
      
    } catch (error) {
      this.logger.endGeneration(false, appPath);
      this.logger.error('❌ Échec du workflow de génération', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: this.sessionId,
        duration: Date.now() - startTime
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: Date.now() - startTime,
          tokensUsed: 0,
          imagesCount,
          filesCount: files.size
        }
      };
    }
  }
  
  /**
   * Valider l'input utilisateur
   */
  private validateInput(userPrompt: string, projectName?: string): void {
    if (!userPrompt || userPrompt.trim().length < 10) {
      throw new Error('Le prompt utilisateur doit contenir au moins 10 caractères');
    }
    
    if (userPrompt.length > 2000) {
      throw new Error('Le prompt utilisateur ne peut pas dépasser 2000 caractères');
    }
    
    if (projectName && projectName.length > 50) {
      throw new Error('Le nom du projet ne peut pas dépasser 50 caractères');
    }
    
    // Vérifier les mots-clés dangereux
    const dangerousKeywords = ['hack', 'virus', 'malware', 'exploit'];
    const lowerPrompt = userPrompt.toLowerCase();
    
    for (const keyword of dangerousKeywords) {
      if (lowerPrompt.includes(keyword)) {
        throw new Error(`Contenu potentiellement dangereux détecté: ${keyword}`);
      }
    }
  }
  
  /**
   * Extraire un nom de projet du prompt
   */
  private extractProjectName(prompt: string): string {
    const words = prompt.split(' ').slice(0, 3);
    const projectName = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '');
    
    return projectName || 'GeneratedApp';
  }
  
  /**
   * Appeler l'API Anthropic (simulation pour l'instant)
   */
  private async callAnthropicAPI(prompt: string): Promise<{content: string, usage?: {outputTokens?: number}}> {
    // TODO: Implémenter l'appel réel à l'API Anthropic
    // Pour l'instant, simulation avec délai
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (prompt.includes('ÉTAPE 1')) {
      return {
        content: `
metadata:
  name: ${this.extractProjectName(prompt)}
  domain: saas_productivity
  scope: full_app
  platform: web
  users: Professionnels et équipes
  problem_solved: Gestion de projets et productivité
  value_proposition: Outil tout-en-un pour la gestion de projets
  complexity: medium

pages_structure:
  public:
    - path: /
      name: Landing Page
      purpose: Page d'accueil avec présentation
      priority: high
    - path: /dashboard
      name: Dashboard
      purpose: Vue d'ensemble des projets
      priority: high
    - path: /projects
      name: Projects
      purpose: Gestion des projets
      priority: high

interactions:
  - type: realtime
    elements: [notifications, live_updates]
    wow_factor: Synchronisation temps réel

data_schema:
  entities:
    - name: Project
      fields: [id, name, description, status, created_at]
      sample_count: 5

design_spec:
  mood: professional
  primary: "#3B82F6"
  secondary: "#10B981"
  accent: "#F59E0B"
      `,
        usage: { outputTokens: 150 }
      };
    } else {
      return {
        content: `
\`\`\`tsx
// pages/index.tsx
import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-center py-20">
        Welcome to Generated App
      </h1>
    </div>
  );
}
\`\`\`

\`\`\`json
{
  "name": "generated-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0"
  }
}
\`\`\`
      `,
        usage: { outputTokens: 120 }
      };
    }
  }
  
  /**
   * Sauvegarder le fichier d'architecture
   */
  private async saveArchitectureFile(appPath: string, architecture: AppArchitecture): Promise<void> {
    const architectureFile = path.join(appPath, 'architecture.json');
    await fs.writeFile(architectureFile, JSON.stringify(architecture, null, 2));
    
    this.logger.info('📋 Architecture sauvegardée', { file: architectureFile });
  }
  
  /**
   * Sauvegarder les fichiers générés
   */
  private async saveGeneratedFiles(appPath: string, files: Map<string, string>): Promise<void> {
    let savedCount = 0;
    
    for (const [filePath, content] of files) {
      const fullPath = path.join(appPath, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
      savedCount++;
      
      this.logger.debug(`📄 Fichier créé: ${filePath}`);
    }
    
    this.logger.info('💾 Fichiers sauvegardés', {
      count: savedCount,
      appPath
    });
    
    // Injecter les composants animés après la sauvegarde des fichiers
    try {
      this.logger.info('🎨 Injection des composants animés...');
      const enhanceResult = await componentInjector.enhanceProject(appPath);
      
      this.logger.info('✨ Composants animés injectés avec succès', {
        componentsInjected: enhanceResult.componentsInjected,
        cssInjected: enhanceResult.cssInjected,
        importsFixed: enhanceResult.importsFixed,
        pagesEnhanced: enhanceResult.pagesEnhanced
      });
    } catch (error) {
      this.logger.warn('⚠️ Erreur lors de l\'injection des composants animés', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Valider l'application générée
   */
  private async validateGeneratedApp(appPath: string, files: Map<string, string>): Promise<void> {
    const requiredFiles = ['package.json'];
    const missingFiles: string[] = [];
    
    for (const required of requiredFiles) {
      if (!files.has(required) && !(await fs.pathExists(path.join(appPath, required)))) {
        missingFiles.push(required);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(`Fichiers requis manquants: ${missingFiles.join(', ')}`);
    }
    
    // Validation de la syntaxe des fichiers React/TypeScript
    for (const [filePath, content] of files) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        if (!this.validateTypeScriptSyntax(content)) {
          this.logger.warn(`⚠️ Syntaxe suspecte dans: ${filePath}`);
        }
      }
    }
    
    this.logger.info('✅ Validation terminée', { appPath });
  }
  
  /**
   * Validation basique de la syntaxe TypeScript
   */
  private validateTypeScriptSyntax(content: string): boolean {
    // Vérifications basiques
    const hasBalancedBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
    const hasBalancedParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
    
    return hasBalancedBraces && hasBalancedParens;
  }
  
  /**
   * Générer un rapport de génération
   */
  private async generateReport(appPath: string, data: any): Promise<void> {
    const reportContent = `# Rapport de Génération

## Informations Générales
- **Date**: ${TimestampManager.getReadableTimestamp()}
- **Session ID**: ${this.sessionId}
- **Durée**: ${data.duration}ms
- **Application**: ${data.architecture.projectName}

## Prompt Utilisateur
\`\`\`
${data.userPrompt}
\`\`\`

## Architecture Générée
- **Domaine**: ${data.architecture.domain}
- **Scope**: ${data.architecture.scope}
- **Pages**: ${data.architecture.fileStructure?.length || 'N/A'}
- **Technologies**: ${data.architecture.techStack?.join(', ') || 'N/A'}

## Fichiers Générés
${Array.from(data.files.keys()).map(file => `- ${file}`).join('\n')}

## Images
- **Nombre d'images**: ${data.images?.length || 0}
- **Source**: Unsplash API

## Statistiques
- **Étapes**: ${Array.from(this.steps.values()).map(s => `${s.name}: ${s.status}`).join(', ')}

---
*Généré par AI App Generator - Pure Sonnet Workflow*
`;

    const reportPath = path.join(appPath, 'GENERATION_REPORT.md');
    await fs.writeFile(reportPath, reportContent);
    
    this.logger.info('📊 Rapport généré', { reportPath });
  }
  
  /**
   * Estimer le nombre de tokens utilisés
   */
  private estimateTokensUsed(prompt: string, files: Map<string, string>): number {
    let totalChars = prompt.length;
    
    for (const content of files.values()) {
      totalChars += content.length;
    }
    
    return Math.ceil(totalChars / 4); // Approximation: 1 token ≈ 4 caractères
  }
  
  /**
   * Obtenir le statut du workflow
   */
  getWorkflowStatus(): {
    sessionId: string;
    steps: Array<{
      name: string;
      status: string;
      duration?: number;
      error?: string;
    }>;
    totalDuration: number;
  } {
    const stepsList = Array.from(this.steps.values()).map(step => ({
      name: step.name,
      status: step.status,
      duration: step.duration,
      error: step.error
    }));
    
    const totalDuration = stepsList.reduce((sum, step) => sum + (step.duration || 0), 0);
    
    return {
      sessionId: this.sessionId,
      steps: stepsList,
      totalDuration
    };
  }
  
  /**
   * 🛡️ VALIDATION ET CORRECTION POST-GÉNÉRATION
   */
  private async validateAndFixGeneration(appPath: string, files: Map<string, string>): Promise<void> {
    this.logger.info('🛡️ Validation post-génération démarrée', { appPath });
    
    const fixes: string[] = [];
    
    // 1. Vérifier et corriger tsconfig.json
    const tsconfigPath = path.join(appPath, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      const tsconfigContent = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
      await fs.writeFile(tsconfigPath, tsconfigContent);
      fixes.push('✅ tsconfig.json créé');
    }
    
    // 2. Vérifier globals.css et layout.tsx
    const globalsPath = path.join(appPath, 'app', 'globals.css');
    const layoutPath = path.join(appPath, 'app', 'layout.tsx');
    
    if (fs.existsSync(globalsPath) && fs.existsSync(layoutPath)) {
      const layoutContent = await fs.readFile(layoutPath, 'utf-8');
      if (!layoutContent.includes("import './globals.css'")) {
        const fixedLayout = layoutContent.replace(
          /import.*from 'next\/font\/google'/,
          `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'`
        );
        await fs.writeFile(layoutPath, fixedLayout);
        fixes.push('✅ Import globals.css corrigé');
      }
    }
    
    // 3. Vérifier et corriger les composants avec "use client"
    for (const [filePath, content] of files) {
      if (filePath.includes('components') && filePath.endsWith('.tsx')) {
        if (content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) {
          if (!content.includes('"use client"')) {
            const fixedContent = `"use client"\n${content}`;
            files.set(filePath, fixedContent);
            const fullPath = path.join(appPath, filePath);
            await fs.writeFile(fullPath, fixedContent);
            fixes.push(`✅ "use client" ajouté: ${filePath}`);
          }
        }
      }
    }
    
    // 4. Vérifier les images Unsplash
    let hasImages = false;
    for (const content of files.values()) {
      if (content.includes('unsplash.com') || content.includes('images.unsplash')) {
        hasImages = true;
        break;
      }
    }
    
    if (!hasImages) {
      this.logger.warn('⚠️ Aucune image Unsplash détectée dans les fichiers générés');
    } else {
      fixes.push('✅ Images Unsplash présentes');
    }
    
    this.logger.info('🛡️ Validation terminée', { 
      fixes: fixes.length, 
      details: fixes 
    });
  }

  /**
   * Nettoyer les ressources
   */
  cleanup(): void {
    this.unsplashService?.clearCache();
    this.logger.info('🧹 Nettoyage du workflow terminé');
  }
}