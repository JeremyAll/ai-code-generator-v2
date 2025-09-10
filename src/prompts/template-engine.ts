import { Logger } from '../utils/logger.js';
import { TimestampManager } from '../utils/timestamp.js';
import fs from 'fs-extra';
import path from 'path';

export interface TemplateVariable {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface TemplateContext {
  variables: Record<string, any>;
  functions: Record<string, Function>;
  conditionals: Record<string, boolean>;
}

export interface TemplateConfig {
  name: string;
  version: string;
  description: string;
  variables: TemplateVariable[];
  template: string;
  metadata: {
    author: string;
    created: string;
    updated: string;
    tags: string[];
  };
}

export class TemplateEngine {
  private logger: Logger;
  private templateCache: Map<string, TemplateConfig> = new Map();
  private functionRegistry: Map<string, Function> = new Map();

  constructor() {
    this.logger = new Logger();
    this.registerBuiltInFunctions();
  }

  /**
   * Enregistrer les fonctions built-in pour les templates
   */
  private registerBuiltInFunctions(): void {
    // Formatage
    this.registerFunction('capitalize', (str: string) => 
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    );

    this.registerFunction('upper', (str: string) => str.toUpperCase());
    this.registerFunction('lower', (str: string) => str.toLowerCase());
    
    this.registerFunction('truncate', (str: string, length: number = 100) => 
      str.length > length ? str.substring(0, length) + '...' : str
    );

    // Arrays
    this.registerFunction('join', (arr: any[], separator: string = ', ') => 
      Array.isArray(arr) ? arr.join(separator) : ''
    );

    this.registerFunction('count', (arr: any[]) => 
      Array.isArray(arr) ? arr.length : 0
    );

    this.registerFunction('first', (arr: any[], n: number = 1) => 
      Array.isArray(arr) ? arr.slice(0, n) : []
    );

    // Conditionnels
    this.registerFunction('ifEmpty', (value: any, fallback: any) => 
      (!value || (Array.isArray(value) && value.length === 0)) ? fallback : value
    );

    this.registerFunction('ifSet', (value: any, ifTrue: any, ifFalse: any = '') => 
      value ? ifTrue : ifFalse
    );

    // Domaine spécifique
    this.registerFunction('detectDomain', (userInput: string) => {
      const input = userInput.toLowerCase();
      
      if (input.includes('ecommerce') || input.includes('store') || input.includes('shop')) return 'ecommerce_b2c';
      if (input.includes('dashboard') || input.includes('analytics')) return 'saas_analytics';
      if (input.includes('fintech') || input.includes('payment') || input.includes('banking')) return 'fintech_banking';
      if (input.includes('education') || input.includes('learning') || input.includes('course')) return 'edtech_school';
      if (input.includes('landing') || input.includes('marketing')) return 'marketing_landing';
      if (input.includes('chat') || input.includes('messaging')) return 'saas_communication';
      
      return 'saas_productivity'; // Default
    });

    this.registerFunction('detectScope', (userInput: string) => {
      const input = userInput.toLowerCase();
      
      if (input.includes('landing') || input.includes('marketing')) return 'landing';
      if (input.includes('dashboard') || input.includes('admin')) return 'dashboard';
      if (input.includes('platform') || input.includes('marketplace')) return 'platform';
      
      return 'full_app'; // Default
    });

    // Timestamps
    this.registerFunction('timestamp', () => TimestampManager.getReadableTimestamp());
    this.registerFunction('isoTimestamp', () => TimestampManager.getLogTimestamp());
  }

  /**
   * Enregistrer une fonction personnalisée
   */
  registerFunction(name: string, fn: Function): void {
    this.functionRegistry.set(name, fn);
    this.logger.debug(`Fonction template enregistrée: ${name}`);
  }

  /**
   * Charger un template depuis un fichier
   */
  async loadTemplate(templatePath: string): Promise<TemplateConfig> {
    try {
      const fullPath = path.resolve(templatePath);
      
      if (this.templateCache.has(fullPath)) {
        this.logger.debug(`Template chargé depuis cache: ${templatePath}`);
        return this.templateCache.get(fullPath)!;
      }

      const templateData = await fs.readFile(fullPath, 'utf-8');
      const template: TemplateConfig = JSON.parse(templateData);

      // Validation
      this.validateTemplate(template);

      // Mise en cache
      this.templateCache.set(fullPath, template);

      this.logger.info('📄 Template chargé avec succès', {
        name: template.name,
        version: template.version,
        variablesCount: template.variables.length
      });

      return template;

    } catch (error) {
      this.logger.error('❌ Erreur chargement template', {
        templatePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Impossible de charger le template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sauvegarder un template
   */
  async saveTemplate(templateConfig: TemplateConfig, templatePath: string): Promise<void> {
    try {
      // Mise à jour metadata
      templateConfig.metadata.updated = TimestampManager.getLogTimestamp();

      // Validation
      this.validateTemplate(templateConfig);

      const fullPath = path.resolve(templatePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, JSON.stringify(templateConfig, null, 2));

      // Mise en cache
      this.templateCache.set(fullPath, templateConfig);

      this.logger.info('💾 Template sauvegardé', {
        name: templateConfig.name,
        path: templatePath
      });

    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde template', {
        templatePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Valider un template
   */
  private validateTemplate(template: TemplateConfig): void {
    const errors: string[] = [];

    if (!template.name) errors.push('Nom du template manquant');
    if (!template.template) errors.push('Contenu du template manquant');
    if (!template.version) errors.push('Version du template manquante');
    if (!Array.isArray(template.variables)) errors.push('Variables du template invalides');

    // Validation des variables
    template.variables.forEach((variable, index) => {
      if (!variable.name) errors.push(`Variable ${index}: nom manquant`);
      if (!variable.type) errors.push(`Variable ${variable.name}: type manquant`);
      if (variable.required && variable.defaultValue === undefined) {
        // OK - variable requise sans valeur par défaut
      }
    });

    if (errors.length > 0) {
      throw new Error(`Template invalide: ${errors.join(', ')}`);
    }
  }

  /**
   * Renderiser un template avec des variables
   */
  render(template: string, context: TemplateContext): string {
    try {
      let rendered = template;

      // 1. Substitution des variables simples {{variable}}
      rendered = this.substituteVariables(rendered, context.variables);

      // 2. Évaluation des fonctions {{function(args)}}
      rendered = this.evaluateFunctions(rendered, context.variables);

      // 3. Conditionnels {{#if condition}} ... {{/if}}
      rendered = this.processConditionals(rendered, context);

      // 4. Boucles {{#each array}} ... {{/each}}
      rendered = this.processLoops(rendered, context.variables);

      // 5. Nettoyage final
      rendered = this.cleanupTemplate(rendered);

      return rendered;

    } catch (error) {
      this.logger.error('❌ Erreur rendu template', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error(`Erreur rendu template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Substitution des variables {{variable}}
   */
  private substituteVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      
      // Support des propriétés imbriquées (ex: user.name)
      const value = this.getNestedProperty(variables, trimmedName);
      
      if (value !== undefined && value !== null) {
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
      
      // Garder le placeholder si variable non trouvée
      this.logger.warn(`Variable non trouvée: ${trimmedName}`);
      return match;
    });
  }

  /**
   * Évaluation des fonctions {{function(args)}}
   */
  private evaluateFunctions(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{([^}]+\([^}]*\))\}\}/g, (match, expression) => {
      try {
        const result = this.evaluateExpression(expression.trim(), variables);
        return typeof result === 'object' ? JSON.stringify(result) : String(result);
      } catch (error) {
        this.logger.warn(`Erreur évaluation fonction: ${expression}`, { error: error instanceof Error ? error.message : 'Unknown error' });
        return match;
      }
    });
  }

  /**
   * Évaluer une expression de fonction
   */
  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    // Parse function call: functionName(arg1, arg2, ...)
    const functionMatch = expression.match(/^(\w+)\((.*)\)$/);
    if (!functionMatch) {
      throw new Error(`Expression invalide: ${expression}`);
    }

    const [, functionName, argsString] = functionMatch;
    
    if (!this.functionRegistry.has(functionName)) {
      throw new Error(`Fonction inconnue: ${functionName}`);
    }

    // Parse arguments
    const args = this.parseArguments(argsString, variables);
    const fn = this.functionRegistry.get(functionName)!;

    return fn(...args);
  }

  /**
   * Parser les arguments d'une fonction
   */
  private parseArguments(argsString: string, variables: Record<string, any>): any[] {
    if (!argsString.trim()) return [];

    const args: any[] = [];
    const argParts = argsString.split(',');

    for (let arg of argParts) {
      arg = arg.trim();

      // String literal
      if (arg.startsWith('"') && arg.endsWith('"')) {
        args.push(arg.slice(1, -1));
      }
      // Number
      else if (!isNaN(Number(arg))) {
        args.push(Number(arg));
      }
      // Boolean
      else if (arg === 'true' || arg === 'false') {
        args.push(arg === 'true');
      }
      // Variable
      else {
        const value = this.getNestedProperty(variables, arg);
        args.push(value);
      }
    }

    return args;
  }

  /**
   * Traiter les conditionnels {{#if condition}} ... {{/if}}
   */
  private processConditionals(template: string, context: TemplateContext): string {
    return template.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, 
      (match, condition, content) => {
        try {
          const conditionResult = this.evaluateCondition(condition.trim(), context);
          return conditionResult ? content : '';
        } catch (error) {
          this.logger.warn(`Erreur évaluation condition: ${condition}`, { error: error instanceof Error ? error.message : 'Unknown error' });
          return '';
        }
      }
    );
  }

  /**
   * Évaluer une condition
   */
  private evaluateCondition(condition: string, context: TemplateContext): boolean {
    // Support des conditions simples
    if (context.conditionals && context.conditionals[condition] !== undefined) {
      return context.conditionals[condition];
    }

    // Évaluer la variable directement
    const value = this.getNestedProperty(context.variables, condition);
    return Boolean(value);
  }

  /**
   * Traiter les boucles {{#each array}} ... {{/each}}
   */
  private processLoops(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, 
      (match, arrayName, content) => {
        try {
          const array = this.getNestedProperty(variables, arrayName.trim());
          
          if (!Array.isArray(array)) {
            this.logger.warn(`Variable n'est pas un tableau: ${arrayName}`);
            return '';
          }

          return array.map((item, index) => {
            return content
              .replace(/\{\{this\}\}/g, String(item))
              .replace(/\{\{@index\}\}/g, String(index));
          }).join('');

        } catch (error) {
          this.logger.warn(`Erreur traitement boucle: ${arrayName}`, { error: error instanceof Error ? error.message : 'Unknown error' });
          return '';
        }
      }
    );
  }

  /**
   * Obtenir une propriété imbriquée (ex: user.profile.name)
   */
  private getNestedProperty(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Nettoyage final du template
   */
  private cleanupTemplate(template: string): string {
    // Supprimer les lignes vides multiples
    return template
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Créer un contexte de template
   */
  createContext(variables: Record<string, any> = {}, conditionals: Record<string, boolean> = {}): TemplateContext {
    return {
      variables: {
        ...variables,
        // Variables système
        timestamp: TimestampManager.getReadableTimestamp(),
        isoTimestamp: TimestampManager.getLogTimestamp(),
        sessionId: this.logger.getSessionId()
      },
      functions: Object.fromEntries(this.functionRegistry.entries()),
      conditionals
    };
  }

  /**
   * Valider les variables requises
   */
  validateRequiredVariables(template: TemplateConfig, context: TemplateContext): string[] {
    const missingVariables: string[] = [];

    template.variables
      .filter(variable => variable.required)
      .forEach(variable => {
        const value = this.getNestedProperty(context.variables, variable.name);
        if (value === undefined || value === null) {
          missingVariables.push(variable.name);
        }
      });

    return missingVariables;
  }

  /**
   * Obtenir les statistiques d'utilisation des templates
   */
  getTemplateStats(): {
    cachedTemplates: number;
    registeredFunctions: number;
    cacheSize: string;
  } {
    const cacheSize = JSON.stringify(Array.from(this.templateCache.values())).length;
    
    return {
      cachedTemplates: this.templateCache.size,
      registeredFunctions: this.functionRegistry.size,
      cacheSize: `${Math.round(cacheSize / 1024)} KB`
    };
  }

  /**
   * Vider le cache des templates
   */
  clearCache(): void {
    const previousSize = this.templateCache.size;
    this.templateCache.clear();
    
    this.logger.info('🗑️ Cache templates vidé', {
      templatesRemoved: previousSize
    });
  }
}