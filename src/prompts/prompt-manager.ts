import { Logger } from '../utils/logger.js';
import { FileManager } from '../utils/file-manager.js';
import { TimestampManager } from '../utils/timestamp.js';
import { architectPrompt, parseArchitectureResponse } from './step1-architect.js';
import { developerPrompt, parseCodeResponse, extractProjectMetadata } from './step2-developer.js';
import { AppArchitecture } from '../workflows/types.js';
import fs from 'fs-extra';
import path from 'path';
import * as YAML from 'yaml';

export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    length: number;
    complexity: number;
    tokenEstimate: number;
  };
}

export interface PromptHistoryEntry {
  sessionId: string;
  step: number;
  timestamp: string;
  userInput?: string;
  architecture?: AppArchitecture;
  prompt: string;
  response: string;
  success: boolean;
  duration: number;
  metadata: {
    version: string;
    model: string;
    tokens?: {
      input: number;
      output: number;
    };
  };
}

export class PromptManager {
  private logger: Logger;
  private fileManager: FileManager;
  private historyDir: string;

  constructor() {
    this.logger = new Logger();
    this.fileManager = new FileManager();
    this.historyDir = './prompts/history';
    this.ensureHistoryDirectory();
  }

  private ensureHistoryDirectory(): void {
    fs.ensureDirSync(this.historyDir);
    fs.ensureDirSync(path.join(this.historyDir, 'step1'));
    fs.ensureDirSync(path.join(this.historyDir, 'step2'));
  }

  /**
   * Préparer le prompt de l'étape 1 (Architecte)
   */
  prepareStep1Prompt(userInput: string, projectName: string = 'Generated App'): string {
    this.logger.info('📝 Préparation du prompt Étape 1 (Architecte)', {
      userInputLength: userInput.length,
      projectName,
      timestamp: TimestampManager.getReadableTimestamp()
    });

    try {
      const prompt = architectPrompt(userInput, projectName);
      
      // Validation du prompt
      const validation = this.validatePrompt(prompt);
      if (!validation.isValid) {
        this.logger.warn('⚠️ Prompt Step 1 présente des avertissements', {
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      this.logger.info('✅ Prompt Step 1 préparé', {
        promptLength: prompt.length,
        tokenEstimate: validation.stats.tokenEstimate,
        complexity: validation.stats.complexity
      });

      return prompt;

    } catch (error) {
      this.logger.error('❌ Erreur préparation prompt Step 1', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userInput: userInput.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  /**
   * Préparer le prompt de l'étape 2 (Développeur)
   */
  prepareStep2Prompt(userInput: string, architecture: AppArchitecture): string {
    this.logger.info('📝 Préparation du prompt Étape 2 (Développeur)', {
      architectureName: architecture.projectName,
      techStackCount: architecture.techStack.length,
      fileStructureCount: architecture.fileStructure.length,
      timestamp: TimestampManager.getReadableTimestamp()
    });

    try {
      const prompt = developerPrompt(userInput, architecture);
      
      // Validation du prompt
      const validation = this.validatePrompt(prompt);
      if (!validation.isValid) {
        this.logger.warn('⚠️ Prompt Step 2 présente des avertissements', {
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      this.logger.info('✅ Prompt Step 2 préparé', {
        promptLength: prompt.length,
        tokenEstimate: validation.stats.tokenEstimate,
        architectureComplexity: architecture.fileStructure.length
      });

      return prompt;

    } catch (error) {
      this.logger.error('❌ Erreur préparation prompt Step 2', {
        error: error instanceof Error ? error.message : 'Unknown error',
        architectureName: architecture.projectName
      });
      throw error;
    }
  }

  /**
   * Valider un prompt avant envoi
   */
  validatePrompt(prompt: string): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation basique
    if (prompt.length < 100) {
      errors.push('Prompt trop court (< 100 caractères)');
    }

    if (prompt.length > 50000) {
      warnings.push('Prompt très long (> 50k caractères), coûts élevés possibles');
    }

    // Validation du contenu
    if (!prompt.includes('ÉTAPE')) {
      warnings.push('Format de prompt non standard détecté');
    }

    if (!prompt.includes('yaml') && !prompt.includes('tsx')) {
      warnings.push('Format de réponse attendu non spécifié');
    }

    // Calcul de la complexité
    const complexity = this.calculatePromptComplexity(prompt);
    
    // Estimation approximative des tokens (1 token ≈ 4 caractères)
    const tokenEstimate = Math.ceil(prompt.length / 4);

    if (tokenEstimate > 8000) {
      warnings.push(`Estimation tokens élevée: ${tokenEstimate}`);
    }

    const result: PromptValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        length: prompt.length,
        complexity,
        tokenEstimate
      }
    };

    return result;
  }

  /**
   * Calculer la complexité d'un prompt
   */
  private calculatePromptComplexity(prompt: string): number {
    let complexity = 0;

    // Facteurs de complexité
    complexity += (prompt.match(/```/g) || []).length * 2; // Blocs de code
    complexity += (prompt.match(/\[.*?\]/g) || []).length; // Placeholders
    complexity += (prompt.match(/\n\s*-/g) || []).length; // Listes
    complexity += (prompt.match(/#{1,3}/g) || []).length; // Headers
    complexity += Math.floor(prompt.length / 1000); // Longueur générale

    return Math.min(complexity, 100); // Cap à 100
  }

  /**
   * Sauvegarder l'historique des prompts
   */
  async savePromptHistory(
    step: number,
    prompt: string,
    response: string,
    userInput?: string,
    architecture?: AppArchitecture,
    success: boolean = true,
    duration: number = 0,
    metadata: any = {}
  ): Promise<string> {
    const timestamp = TimestampManager.getTimestamp();
    const sessionId = this.logger.getSessionId();

    const historyEntry: PromptHistoryEntry = {
      sessionId,
      step,
      timestamp: TimestampManager.getLogTimestamp(),
      userInput,
      architecture,
      prompt,
      response,
      success,
      duration,
      metadata: {
        version: '1.0',
        model: 'claude-sonnet-4-20250514',
        ...metadata
      }
    };

    const filename = `${timestamp}-step${step}-${success ? 'success' : 'failed'}.json`;
    const filepath = path.join(this.historyDir, `step${step}`, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(historyEntry, null, 2));
      
      this.logger.info(`💾 Historique Step ${step} sauvegardé`, {
        filepath,
        success,
        duration: `${duration}ms`,
        promptLength: prompt.length,
        responseLength: response.length
      });

      return filepath;

    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde historique', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filepath,
        step
      });
      throw error;
    }
  }

  /**
   * Récupérer l'historique des prompts
   */
  async getPromptHistory(step?: number, limit: number = 10): Promise<PromptHistoryEntry[]> {
    try {
      const history: PromptHistoryEntry[] = [];
      const searchDirs = step ? [`step${step}`] : ['step1', 'step2'];

      for (const dir of searchDirs) {
        const dirPath = path.join(this.historyDir, dir);
        
        if (await fs.pathExists(dirPath)) {
          const files = await fs.readdir(dirPath);
          
          for (const file of files.slice(-limit)) {
            if (file.endsWith('.json')) {
              const filePath = path.join(dirPath, file);
              const content = await fs.readFile(filePath, 'utf-8');
              const entry = JSON.parse(content) as PromptHistoryEntry;
              history.push(entry);
            }
          }
        }
      }

      // Trier par timestamp descendant
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return history.slice(0, limit);

    } catch (error) {
      this.logger.error('❌ Erreur récupération historique', { error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  }

  /**
   * Parser la réponse de l'étape 1 (Architecture)
   */
  parseStep1Response(response: string): AppArchitecture {
    try {
      this.logger.info('🔧 Parsing réponse Step 1 (Architecture)');
      
      const architecture = parseArchitectureResponse(response);
      
      this.logger.info('✅ Architecture parsée avec succès', {
        projectName: architecture.projectName,
        techStackCount: architecture.techStack.length,
        fileStructureCount: architecture.fileStructure.length,
        dependenciesCount: Object.keys(architecture.dependencies).length
      });

      return architecture;

    } catch (error) {
      this.logger.error('❌ Erreur parsing architecture', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Parser la réponse de l'étape 2 (Code)
   */
  parseStep2Response(response: string): {
    files: Map<string, string>;
    metadata: any;
  } {
    try {
      this.logger.info('💻 Parsing réponse Step 2 (Code)');
      
      const files = parseCodeResponse(response);
      const metadata = extractProjectMetadata(response);
      
      this.logger.info('✅ Code parsé avec succès', {
        filesCount: files.size,
        dependenciesCount: Object.keys(metadata.dependencies || {}).length,
        scriptsCount: Object.keys(metadata.scripts || {}).length
      });

      return { files, metadata };

    } catch (error) {
      this.logger.error('❌ Erreur parsing code', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Nettoyer l'historique ancien
   */
  async cleanupHistory(maxDays: number = 30): Promise<{
    deleted: string[];
    kept: string[];
  }> {
    this.logger.info(`🧹 Nettoyage historique (> ${maxDays} jours)`);

    const deleted: string[] = [];
    const kept: string[] = [];

    try {
      for (const stepDir of ['step1', 'step2']) {
        const dirPath = path.join(this.historyDir, stepDir);
        
        if (await fs.pathExists(dirPath)) {
          const files = await fs.readdir(dirPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(dirPath, file);
              const stats = await fs.stat(filePath);
              const ageInDays = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
              
              if (ageInDays > maxDays) {
                await fs.remove(filePath);
                deleted.push(filePath);
              } else {
                kept.push(filePath);
              }
            }
          }
        }
      }

      this.logger.info('✅ Nettoyage historique terminé', {
        deleted: deleted.length,
        kept: kept.length
      });

      return { deleted, kept };

    } catch (error) {
      this.logger.error('❌ Erreur nettoyage historique', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { deleted: [], kept: [] };
    }
  }

  /**
   * Statistiques de l'historique
   */
  async getHistoryStats(): Promise<{
    totalPrompts: number;
    successRate: number;
    averageDuration: number;
    byStep: Record<string, number>;
    recentActivity: Array<{date: string, count: number}>;
  }> {
    try {
      const history = await this.getPromptHistory(undefined, 100);
      
      const stats = {
        totalPrompts: history.length,
        successRate: history.filter(h => h.success).length / history.length * 100,
        averageDuration: history.reduce((sum, h) => sum + h.duration, 0) / history.length,
        byStep: {
          step1: history.filter(h => h.step === 1).length,
          step2: history.filter(h => h.step === 2).length
        },
        recentActivity: [] as Array<{date: string, count: number}>
      };

      // Activité par jour (7 derniers jours)
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = history.filter(h => h.timestamp.startsWith(dateStr)).length;
        stats.recentActivity.push({ date: dateStr, count });
      }

      return stats;

    } catch (error) {
      this.logger.error('❌ Erreur calcul statistiques historique', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        totalPrompts: 0,
        successRate: 0,
        averageDuration: 0,
        byStep: { step1: 0, step2: 0 },
        recentActivity: []
      };
    }
  }

  /**
   * Méthodes publiques pour compatibilité avec PureSonnetWorkflow
   */
  getArchitecturePrompt(userInput: string): string {
    return this.prepareStep1Prompt(userInput);
  }

  getDevelopmentPrompt(userInput: string, architecture: any): string {
    const yamlString = typeof architecture === 'string' 
      ? architecture 
      : YAML.stringify(architecture);
    return this.prepareStep2Prompt(userInput, architecture);
  }
}