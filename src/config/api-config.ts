import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';
import { TimestampManager } from '../utils/timestamp.js';

dotenv.config();

export interface ConfigValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ModelConfig {
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface GenerationSettings {
  maxGenerationTime: number;
  retryAttempts: number;
  retryDelay: number;
  maxGenerationsPerDay: number;
  autoCleanup: boolean;
  keepGenerationsDays: number;
}

export class ApiConfig {
  private static instance: ApiConfig;
  private logger: Logger;
  private isValid: boolean = false;
  private validationErrors: ConfigValidationError[] = [];

  private constructor() {
    this.logger = new Logger();
    this.validateConfig();
  }

  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }

  validateConfig(): void {
    this.validationErrors = [];
    
    try {
      // Validation des variables critiques
      this.validateApiKey();
      this.validateModel();
      this.validateTokens();
      this.validateTemperature();
      this.validateGenerationSettings();
      this.validateLogging();

      this.isValid = this.validationErrors.filter(e => e.severity === 'error').length === 0;

      if (this.isValid) {
        this.logger.info('🔧 Configuration API validée avec succès', {
          model: this.getModelConfig().model,
          maxTokens: this.getModelConfig().max_tokens,
          temperature: this.getModelConfig().temperature,
          retryAttempts: this.getGenerationSettings().retryAttempts,
          timestamp: TimestampManager.getReadableTimestamp()
        });
      } else {
        const errors = this.validationErrors.filter(e => e.severity === 'error');
        this.logger.error('❌ Erreurs de configuration détectées', {
          errorCount: errors.length,
          errors: errors.map(e => `${e.field}: ${e.message}`)
        });
      }

      // Logger les avertissements
      const warnings = this.validationErrors.filter(e => e.severity === 'warning');
      if (warnings.length > 0) {
        this.logger.warn('⚠️ Avertissements de configuration', {
          warningCount: warnings.length,
          warnings: warnings.map(w => `${w.field}: ${w.message}`)
        });
      }

    } catch (error) {
      this.logger.error('💥 Échec de la validation de configuration', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.isValid = false;
    }
  }

  private validateApiKey(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      this.validationErrors.push({
        field: 'ANTHROPIC_API_KEY',
        message: 'Clé API Anthropic requise',
        severity: 'error'
      });
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      this.validationErrors.push({
        field: 'ANTHROPIC_API_KEY',
        message: 'Format de clé API invalide (doit commencer par sk-ant-)',
        severity: 'error'
      });
    }

    if (apiKey.length < 20) {
      this.validationErrors.push({
        field: 'ANTHROPIC_API_KEY',
        message: 'Clé API trop courte',
        severity: 'warning'
      });
    }
  }

  private validateModel(): void {
    const model = process.env.ANTHROPIC_MODEL;
    
    if (!model) {
      this.validationErrors.push({
        field: 'ANTHROPIC_MODEL',
        message: 'Modèle Anthropic non spécifié, utilisation par défaut',
        severity: 'warning'
      });
      return;
    }

    if (!model.includes('claude')) {
      this.validationErrors.push({
        field: 'ANTHROPIC_MODEL',
        message: 'Modèle non-Claude détecté',
        severity: 'warning'
      });
    }
  }

  private validateTokens(): void {
    const maxTokens = parseInt(process.env.MAX_TOKENS || '0');
    
    if (isNaN(maxTokens) || maxTokens <= 0) {
      this.validationErrors.push({
        field: 'MAX_TOKENS',
        message: 'MAX_TOKENS doit être un nombre positif',
        severity: 'error'
      });
      return;
    }

    if (maxTokens > 200000) {
      this.validationErrors.push({
        field: 'MAX_TOKENS',
        message: 'MAX_TOKENS très élevé, coûts importants possibles',
        severity: 'warning'
      });
    }
  }

  private validateTemperature(): void {
    const temperature = parseFloat(process.env.TEMPERATURE || 'NaN');
    
    if (isNaN(temperature)) {
      this.validationErrors.push({
        field: 'TEMPERATURE',
        message: 'TEMPERATURE doit être un nombre décimal',
        severity: 'error'
      });
      return;
    }

    if (temperature < 0 || temperature > 1) {
      this.validationErrors.push({
        field: 'TEMPERATURE',
        message: 'TEMPERATURE doit être entre 0 et 1',
        severity: 'error'
      });
    }
  }

  private validateGenerationSettings(): void {
    const maxTime = parseInt(process.env.MAX_GENERATION_TIME || '0');
    if (maxTime > 0 && maxTime < 30000) {
      this.validationErrors.push({
        field: 'MAX_GENERATION_TIME',
        message: 'Temps de génération très court (< 30s)',
        severity: 'warning'
      });
    }

    const retryAttempts = parseInt(process.env.RETRY_ATTEMPTS || '0');
    if (retryAttempts > 10) {
      this.validationErrors.push({
        field: 'RETRY_ATTEMPTS',
        message: 'Nombre de tentatives très élevé',
        severity: 'warning'
      });
    }
  }

  private validateLogging(): void {
    const logLevel = process.env.LOG_LEVEL?.toLowerCase();
    const validLevels = ['debug', 'info', 'warn', 'error'];
    
    if (logLevel && !validLevels.includes(logLevel)) {
      this.validationErrors.push({
        field: 'LOG_LEVEL',
        message: `LOG_LEVEL invalide. Valeurs possibles: ${validLevels.join(', ')}`,
        severity: 'warning'
      });
    }
  }

  getApiKey(): string {
    if (!this.isValid) {
      throw new Error('Configuration invalide. Impossible de récupérer la clé API.');
    }
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Clé API Anthropic non configurée');
    }
    
    return apiKey;
  }

  getModelConfig(): ModelConfig {
    return {
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: parseInt(process.env.MAX_TOKENS || '12000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7')
    };
  }

  getGenerationSettings(): GenerationSettings {
    return {
      maxGenerationTime: parseInt(process.env.MAX_GENERATION_TIME || '180000'),
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.RETRY_DELAY || '5000'),
      maxGenerationsPerDay: parseInt(process.env.MAX_GENERATIONS_PER_DAY || '50'),
      autoCleanup: process.env.AUTO_CLEANUP?.toLowerCase() === 'true',
      keepGenerationsDays: parseInt(process.env.KEEP_GENERATIONS_DAYS || '7')
    };
  }

  async testConnection(): Promise<{
    success: boolean;
    latency?: number;
    model?: string;
    error?: string;
  }> {
    if (!this.isValid) {
      return {
        success: false,
        error: 'Configuration invalide'
      };
    }

    const startTime = Date.now();
    this.logger.info('🔌 Test de connexion API en cours...');

    try {
      // Simulation du test API (à remplacer par vraie implémentation)
      // const response = await fetch('https://api.anthropic.com/v1/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'x-api-key': this.getApiKey()
      //   },
      //   body: JSON.stringify({
      //     model: this.getModelConfig().model,
      //     max_tokens: 10,
      //     messages: [{ role: 'user', content: 'test' }]
      //   })
      // });

      // Pour l'instant, simulation réussie
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const latency = Date.now() - startTime;
      const result = {
        success: true,
        latency,
        model: this.getModelConfig().model
      };

      this.logger.info('✅ Connexion API réussie', {
        latency: `${latency}ms`,
        model: result.model
      });

      return result;

    } catch (error) {
      const latency = Date.now() - startTime;
      const result = {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.logger.error('❌ Échec de connexion API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: `${latency}ms`
      });

      return result;
    }
  }

  isConfigValid(): boolean {
    return this.isValid;
  }

  getValidationErrors(): ConfigValidationError[] {
    return [...this.validationErrors];
  }

  // Méthodes utilitaires
  getMaskedApiKey(): string {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (apiKey.length <= 10) return '***';
    return apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
  }

  getUnsplashConfig() {
    return {
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      perPage: parseInt(process.env.UNSPLASH_PER_PAGE || '30'),
      quality: process.env.UNSPLASH_QUALITY || 'regular'
    };
  }

  getConfigSummary(): object {
    return {
      model: this.getModelConfig().model,
      maxTokens: this.getModelConfig().max_tokens,
      temperature: this.getModelConfig().temperature,
      apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
      maskedApiKey: this.getMaskedApiKey(),
      isValid: this.isValid,
      errorCount: this.validationErrors.filter(e => e.severity === 'error').length,
      warningCount: this.validationErrors.filter(e => e.severity === 'warning').length,
      validatedAt: TimestampManager.getReadableTimestamp()
    };
  }
}