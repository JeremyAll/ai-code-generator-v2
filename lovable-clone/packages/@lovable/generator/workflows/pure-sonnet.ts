import { Logger } from '../utils/logger.js';
import { FileManager } from '../utils/file-manager.js';
import { ApiConfig } from '../config/api-config.js';
import { PromptManager } from '../prompts/prompt-manager.js';
import { TimestampManager } from '../utils/timestamp.js';
import { ErrorHandler } from './error-handler.js';
import { AnthropicService } from '../services/anthropic-service.js';
import { YamlParser } from '../utils/yaml-parser.js';
import { intelligenceSystem, TemplatePersonalizer } from '../intelligence/index.js';
import path from 'path';
import fs from 'fs';

export class PureSonnetWorkflow {
  private logger: Logger;
  private config: ApiConfig;
  private promptManager: PromptManager;
  private anthropicService: AnthropicService;
  private templatePersonalizer: TemplatePersonalizer;
  private sessionId: string;
  private appFolder: string = '';
  private startTime: number;
  
  constructor() {
    this.logger = new Logger();
    this.config = ApiConfig.getInstance();
    this.promptManager = new PromptManager();
    this.anthropicService = new AnthropicService();
    this.templatePersonalizer = new TemplatePersonalizer();
    this.sessionId = TimestampManager.getTimestamp();
    this.startTime = Date.now();
    this.logger.log('INFO', `Session démarrée: ${this.sessionId}`);
  }
  
  async generate(userPrompt: string) {
    try {
      // 1. Validation de l'input
      this.validateInput(userPrompt);
      this.logger.startGeneration(userPrompt);
      
      // 2. PHASE 6 - INTELLIGENCE CONTEXTUELLE
      this.logger.log('INFO', '🧠 Phase 6: Analyse intelligente du contexte...');
      const intelligentAnalysis = await intelligenceSystem.analyzeWithContext(
        userPrompt, 
        this.sessionId
      );
      
      this.logger.log('INFO', `✅ Analyse sémantique: ${intelligentAnalysis.analysis.intent} (${intelligentAnalysis.analysis.domain})`);
      this.logger.log('INFO', `🎯 Confiance template: ${Math.round(intelligentAnalysis.personalizedTemplate.confidence * 100)}%`);
      this.logger.log('INFO', `💡 Recommandations: ${intelligentAnalysis.recommendations.length}`);
      
      // 3. Créer dossier app horodaté
      const appName = this.extractAppName(userPrompt);
      this.appFolder = FileManager.createAppFolder(appName);
      this.logger.log('INFO', `Dossier application créé: ${this.appFolder}`);
      
      // 4. Étape 1: Analyse et Architecture (enrichie par l'IA)
      this.logger.log('INFO', '=== ÉTAPE 1: ANALYSE ET ARCHITECTURE ===');
      const { architecture, response } = await this.runStep1(userPrompt, intelligentAnalysis);
      this.logger.log('INFO', 'Architecture générée avec succès');
      
      // 5. Étape 2: Développement de l'application
      this.logger.log('INFO', '=== ÉTAPE 2: DÉVELOPPEMENT ===');
      const appFiles = await this.runStep2(architecture, userPrompt, response);
      this.logger.log('INFO', `${appFiles.size} fichiers générés`);
      
      // 6. Sauvegarde des fichiers
      this.logger.log('INFO', '=== SAUVEGARDE DES FICHIERS ===');
      await this.saveGeneratedApp(appFiles);
      
      // 7. Validation de la génération
      this.logger.log('INFO', '=== VALIDATION ===');
      const validation = await this.validateGeneration();
      
      // 8. Génération du rapport final
      this.logger.log('INFO', '=== RAPPORT FINAL ===');
      const report = this.generateReport(validation, intelligentAnalysis);
      
      const totalTime = Date.now() - this.startTime;
      
      // 9. PHASE 6 - MISE À JOUR DU CONTEXTE UTILISATEUR
      this.logger.log('INFO', '📊 Mise à jour contexte utilisateur...');
      intelligenceSystem.updateWithResult(
        this.sessionId,
        userPrompt,
        intelligentAnalysis.analysis,
        { 
          success: true, 
          report, 
          duration: totalTime,
          files: appFiles.size 
        }
      );
      
      this.logger.endGeneration(true, this.appFolder);
      this.logger.log('INFO', `Génération terminée en ${totalTime}ms`);
      
      return { 
        success: true, 
        path: this.appFolder,
        report,
        duration: totalTime,
        intelligence: {
          analysis: intelligentAnalysis.analysis,
          recommendations: intelligentAnalysis.recommendations,
          personalizationSummary: this.templatePersonalizer.getPersonalizationSummary(intelligentAnalysis.personalizedTemplate)
        }
      };
      
    } catch (error) {
      const totalTime = Date.now() - this.startTime;
      this.logger.log('ERROR', `Génération échouée après ${totalTime}ms`, error);
      
      const handledError = await ErrorHandler.handleGenerationError(error, {
        sessionId: this.sessionId,
        userPrompt,
        appFolder: this.appFolder,
        duration: totalTime
      });
      
      this.logger.endGeneration(false, this.appFolder);
      
      return { 
        success: false, 
        error: handledError,
        duration: totalTime
      };
    }
  }
  
  private async runStep1(prompt: string, intelligentAnalysis?: any) {
    this.logger.logStep('STEP_1', { status: 'started' });
    
    try {
      // Générer le prompt d'architecture
      const architecturePrompt = this.promptManager.getArchitecturePrompt(prompt);
      this.logger.debug('Prompt d\'architecture généré');
      
      // Appel API Anthropic pour l'architecture
      const response = await this.anthropicService.generateArchitecture(architecturePrompt);
      this.logger.debug(`Réponse API reçue: ${response.length} caractères`);
      
      
      // Parser la réponse YAML
      const { parseArchitectureResponse } = await import('../prompts/step1-architect.js');
      const architecture = parseArchitectureResponse(response);
      this.logger.debug('Architecture parsée avec succès');
      
      // Sauvegarder l'architecture
      const archPath = path.join(this.appFolder, 'architecture.yaml');
      fs.writeFileSync(archPath, response);
      this.logger.log('INFO', `Architecture sauvegardée: ${archPath}`);
      
      this.logger.logStep('STEP_1', { status: 'completed', files: 1 });
      return { architecture, response };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.logStep('STEP_1', { status: 'failed', error: errorMessage });
      throw new Error(`Échec étape 1 (Architecture): ${errorMessage}`);
    }
  }
  
  private async runStep2(architecture: any, userPrompt: string, archResponse?: string) {
    this.logger.logStep('STEP_2', { status: 'started' });
    
    try {
      // NOUVELLE APPROCHE : Génération en 3 sous-étapes
      this.logger.log('INFO', '🚀 Génération en 3 sous-étapes...');
      
      // Appel de la nouvelle méthode generateAppInSteps
      const files = await this.anthropicService.generateAppInSteps(architecture, archResponse);
      this.logger.debug(`${files.size} fichiers générés via approche 3-étapes`);
      
      // Valider la structure des fichiers
      this.validateFileStructure(files, architecture);
      
      this.logger.logStep('STEP_2', { status: 'completed', files: files.size });
      return files;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.logStep('STEP_2', { status: 'failed', error: errorMessage });
      throw new Error(`Échec étape 2 (Développement): ${errorMessage}`);
    }
  }
  
  private async saveGeneratedApp(files: Map<string, string>) {
    let savedFiles = 0;
    let errors = 0;
    
    for (const [filePath, content] of files) {
      try {
        const fullPath = path.join(this.appFolder, filePath);
        
        // Créer les dossiers parents si nécessaire
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          this.logger.debug(`Dossier créé: ${dir}`);
        }
        
        // Sauvegarder le fichier
        fs.writeFileSync(fullPath, content, 'utf-8');
        this.logger.debug(`Fichier sauvegardé: ${filePath} (${content.length} caractères)`);
        savedFiles++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.log('ERROR', `Erreur sauvegarde ${filePath}`, errorMessage);
        errors++;
      }
    }
    
    this.logger.log('INFO', `Sauvegarde terminée: ${savedFiles} fichiers sauvegardés, ${errors} erreurs`);
    
    if (errors > 0) {
      throw new Error(`Erreurs lors de la sauvegarde: ${errors} fichier(s) non sauvegardé(s)`);
    }
  }
  
  private async validateGeneration() {
    const validation = {
      requiredFiles: [] as Array<{file: string, status: string}>,
      syntaxErrors: [] as Array<{file: string, error: string}>,
      warnings: [] as string[],
      score: 0
    };
    
    try {
      // Vérifier les fichiers requis
      const requiredFiles = ['package.json', 'README.md'];
      for (const file of requiredFiles) {
        const filePath = path.join(this.appFolder, file);
        if (fs.existsSync(filePath)) {
          validation.requiredFiles.push({ file, status: 'present' });
          this.logger.debug(`✓ Fichier requis présent: ${file}`);
        } else {
          validation.requiredFiles.push({ file, status: 'missing' });
          this.logger.log('WARN', `✗ Fichier requis manquant: ${file}`);
        }
      }
      
      // Vérification syntaxique basique des fichiers JSON
      const jsonFiles = this.getFilesByExtension('.json');
      for (const jsonFile of jsonFiles) {
        try {
          const content = fs.readFileSync(path.join(this.appFolder, jsonFile), 'utf-8');
          JSON.parse(content);
          this.logger.debug(`✓ JSON valide: ${jsonFile}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          validation.syntaxErrors.push({ file: jsonFile, error: errorMessage });
          this.logger.log('ERROR', `✗ JSON invalide: ${jsonFile}`, error);
        }
      }
      
      // Calculer le score de validation
      const requiredPresent = validation.requiredFiles.filter(f => f.status === 'present').length;
      const totalRequired = validation.requiredFiles.length;
      const syntaxOk = jsonFiles.length - validation.syntaxErrors.length;
      
      validation.score = Math.round(((requiredPresent / totalRequired) + (syntaxOk / Math.max(jsonFiles.length, 1))) * 50);
      
      this.logger.log('INFO', `Validation terminée - Score: ${validation.score}/100`);
      
      return validation;
      
    } catch (error) {
      this.logger.log('ERROR', 'Erreur lors de la validation', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      validation.warnings.push(`Erreur de validation: ${errorMessage}`);
      return validation;
    }
  }
  
  private generateReport(validation: any, intelligentAnalysis?: any) {
    const totalTime = Date.now() - this.startTime;
    const files = this.getAllFiles();
    
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      duration: totalTime,
      files: files.length,
      validation,
      summary: {
        success: validation.score >= 70,
        filesGenerated: files.length,
        requiredFilesPresent: validation.requiredFiles.filter((f: {file: string, status: string}) => f.status === 'present').length,
        syntaxErrors: validation.syntaxErrors.length
      }
    };
    
    // Créer le rapport markdown
    const markdownReport = this.createMarkdownReport(report);
    
    // Sauvegarder le rapport
    const reportPath = path.join(this.appFolder, 'GENERATION_REPORT.md');
    fs.writeFileSync(reportPath, markdownReport);
    
    const jsonReportPath = path.join(this.appFolder, 'generation-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    
    this.logger.log('INFO', `Rapport sauvegardé: ${reportPath}`);
    
    return report;
  }
  
  private validateInput(prompt: string) {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Le prompt utilisateur ne peut pas être vide');
    }
    
    if (prompt.length < 10) {
      throw new Error('Le prompt utilisateur est trop court (minimum 10 caractères)');
    }
    
    if (prompt.length > 10000) {
      throw new Error('Le prompt utilisateur est trop long (maximum 10000 caractères)');
    }
  }
  
  private extractAppName(prompt: string): string {
    // Essayer d'extraire un nom d'app du prompt
    const patterns = [
      /(?:create|build|make|generate)\s+(?:a|an)?\s*([a-zA-Z][a-zA-Z0-9\s-]{2,30})\s+(?:app|application)/i,
      /(?:app|application)\s+(?:called|named)?\s*["']?([a-zA-Z][a-zA-Z0-9\s-]{2,30})["']?/i,
      /^([a-zA-Z][a-zA-Z0-9\s-]{2,30}):/i
    ];
    
    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        return match[1].trim().toLowerCase().replace(/\s+/g, '-');
      }
    }
    
    // Nom par défaut
    return `app-${TimestampManager.getTimestamp()}`;
  }
  
  private parseGeneratedFiles(response: string): Map<string, string> {
    const files = new Map<string, string>();
    
    // Parser la réponse qui contient les fichiers
    // Format attendu: ```filename\ncontent\n```
    const fileBlocks = response.match(/```([^\n]+)\n([\s\S]*?)```/g);
    
    if (!fileBlocks) {
      throw new Error('Aucun fichier trouvé dans la réponse API');
    }
    
    for (const block of fileBlocks) {
      const match = block.match(/```([^\n]+)\n([\s\S]*?)```/);
      if (match) {
        const filename = match[1].trim();
        const content = match[2];
        
        if (filename && content) {
          files.set(filename, content);
        }
      }
    }
    
    if (files.size === 0) {
      throw new Error('Aucun fichier valide parsé depuis la réponse API');
    }
    
    return files;
  }
  
  private validateFileStructure(files: Map<string, string>, architecture: any) {
    // Vérifications basiques de la structure
    if (!files.has('package.json')) {
      this.logger.log('WARN', 'package.json manquant');
    }
    
    if (!files.has('README.md')) {
      this.logger.log('WARN', 'README.md manquant');
    }
    
    // Vérifier la cohérence avec l'architecture si disponible
    if (architecture && architecture.files) {
      for (const expectedFile of architecture.files) {
        if (!files.has(expectedFile)) {
          this.logger.log('WARN', `Fichier attendu manquant: ${expectedFile}`);
        }
      }
    }
  }
  
  private getFilesByExtension(extension: string): string[] {
    const files: string[] = [];
    
    function scanDirectory(dir: string, baseDir: string) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath, baseDir);
        } else if (path.extname(item) === extension) {
          files.push(relativePath.replace(/\\/g, '/'));
        }
      }
    }
    
    if (fs.existsSync(this.appFolder)) {
      scanDirectory(this.appFolder, this.appFolder);
    }
    
    return files;
  }
  
  private getAllFiles(): string[] {
    const files: string[] = [];
    
    function scanDirectory(dir: string, baseDir: string) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath, baseDir);
        } else {
          files.push(relativePath.replace(/\\/g, '/'));
        }
      }
    }
    
    if (fs.existsSync(this.appFolder)) {
      scanDirectory(this.appFolder, this.appFolder);
    }
    
    return files;
  }
  
  private createMarkdownReport(report: any): string {
    return `# Rapport de Génération d'Application

## Informations Générales
- **Session ID**: ${report.sessionId}
- **Timestamp**: ${report.timestamp}
- **Durée**: ${report.duration}ms
- **Statut**: ${report.summary.success ? '✅ Succès' : '❌ Échec'}

## Statistiques
- **Fichiers générés**: ${report.files}
- **Fichiers requis présents**: ${report.summary.requiredFilesPresent}
- **Erreurs de syntaxe**: ${report.summary.syntaxErrors}
- **Score de validation**: ${report.validation.score}/100

## Validation Détaillée

### Fichiers Requis
${report.validation.requiredFiles.map((f: {file: string, status: string}) => `- ${f.file}: ${f.status === 'present' ? '✅' : '❌'}`).join('\n')}

### Erreurs de Syntaxe
${report.validation.syntaxErrors.length === 0 ? 'Aucune erreur de syntaxe détectée.' : report.validation.syntaxErrors.map((e: {file: string, error: string}) => `- ${e.file}: ${e.error}`).join('\n')}

### Avertissements
${report.validation.warnings.length === 0 ? 'Aucun avertissement.' : report.validation.warnings.map((w: string) => `- ${w}`).join('\n')}

---
*Rapport généré automatiquement*`;
  }
}