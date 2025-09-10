import { Logger } from '../utils/logger.js';
import { TimestampManager } from '../utils/timestamp.js';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  step?: string;
  sessionId: string;
  userPrompt?: string;
  appFolder?: string;
  attempt?: number;
  maxAttempts?: number;
  duration?: number;
  additionalInfo?: Record<string, any>;
}

export interface ErrorAnalysis {
  type: ErrorType;
  severity: ErrorSeverity;
  isRetryable: boolean;
  suggestedDelay: number;
  suggestedAction: string;
  userMessage: string;
  technicalDetails: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export class ErrorHandler {
  private static logger = new Logger();
  
  private static defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      ErrorType.API_ERROR,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.RATE_LIMIT_ERROR
    ]
  };
  
  /**
   * Analyser une erreur et déterminer la stratégie de gestion
   */
  static analyzeError(error: any, context: ErrorContext): ErrorAnalysis {
    const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
    const errorStack = error?.stack || '';
    
    // Détection du type d'erreur
    const errorType = this.detectErrorType(errorMessage, error);
    
    // Analyse de la sévérité
    const severity = this.assessSeverity(errorType, context);
    
    // Déterminer si l'erreur est retryable
    const isRetryable = this.isErrorRetryable(errorType, context);
    
    // Calculer le délai suggéré
    const suggestedDelay = this.calculateRetryDelay(context.attempt || 0, this.defaultRetryConfig);
    
    // Générer les messages et actions
    const analysis = {
      type: errorType,
      severity,
      isRetryable,
      suggestedDelay,
      suggestedAction: this.getSuggestedAction(errorType, context),
      userMessage: this.generateUserMessage(errorType, context),
      technicalDetails: `${errorMessage}\n\nStack: ${errorStack}`
    };
    
    this.logger.warn('🔍 Analyse d\'erreur effectuée', {
      step: context.step,
      errorType: analysis.type,
      severity: analysis.severity,
      isRetryable: analysis.isRetryable,
      attempt: `${context.attempt || 0}/${context.maxAttempts || 3}`
    });
    
    return analysis;
  }
  
  /**
   * Détecter le type d'erreur basé sur le message et l'objet
   */
  private static detectErrorType(message: string, error: any): ErrorType {
    const lowerMessage = message.toLowerCase();
    
    // Erreurs de validation
    if (lowerMessage.includes('validation') || 
        lowerMessage.includes('invalid input') ||
        lowerMessage.includes('caractères') ||
        lowerMessage.includes('requis')) {
      return ErrorType.VALIDATION_ERROR;
    }
    
    // Erreurs de rate limiting
    if (lowerMessage.includes('rate limit') || 
        lowerMessage.includes('too many requests') ||
        lowerMessage.includes('quota') ||
        error?.status === 429) {
      return ErrorType.RATE_LIMIT_ERROR;
    }
    
    // Erreurs API
    if (lowerMessage.includes('api') || 
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('forbidden') ||
        error?.status >= 400) {
      return ErrorType.API_ERROR;
    }
    
    // Erreurs de timeout
    if (lowerMessage.includes('timeout') || 
        lowerMessage.includes('timed out') ||
        error?.code === 'ETIMEDOUT') {
      return ErrorType.TIMEOUT_ERROR;
    }
    
    // Erreurs réseau
    if (lowerMessage.includes('network') || 
        lowerMessage.includes('connection') ||
        lowerMessage.includes('enotfound') ||
        error?.code === 'ECONNRESET') {
      return ErrorType.NETWORK_ERROR;
    }
    
    // Erreurs de parsing
    if (lowerMessage.includes('parse') || 
        lowerMessage.includes('json') ||
        lowerMessage.includes('yaml') ||
        lowerMessage.includes('syntax')) {
      return ErrorType.PARSING_ERROR;
    }
    
    // Erreurs de système de fichiers
    if (lowerMessage.includes('file') || 
        lowerMessage.includes('directory') ||
        lowerMessage.includes('enoent') ||
        error?.code?.startsWith('E')) {
      return ErrorType.FILE_SYSTEM_ERROR;
    }
    
    // Erreurs de quota
    if (lowerMessage.includes('quota exceeded') || 
        lowerMessage.includes('limit exceeded')) {
      return ErrorType.QUOTA_EXCEEDED;
    }
    
    return ErrorType.UNKNOWN_ERROR;
  }
  
  /**
   * Évaluer la sévérité de l'erreur
   */
  private static assessSeverity(errorType: ErrorType, context: ErrorContext): ErrorSeverity {
    // Erreurs critiques qui arrêtent le workflow
    if (errorType === ErrorType.QUOTA_EXCEEDED || 
        (errorType === ErrorType.API_ERROR && (context.attempt || 0) >= (context.maxAttempts || 3))) {
      return ErrorSeverity.CRITICAL;
    }
    
    // Erreurs graves mais récupérables
    if (errorType === ErrorType.API_ERROR || 
        errorType === ErrorType.PARSING_ERROR ||
        errorType === ErrorType.FILE_SYSTEM_ERROR) {
      return ErrorSeverity.HIGH;
    }
    
    // Erreurs moyennes, souvent temporaires
    if (errorType === ErrorType.TIMEOUT_ERROR || 
        errorType === ErrorType.NETWORK_ERROR ||
        errorType === ErrorType.RATE_LIMIT_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Erreurs mineures
    return ErrorSeverity.LOW;
  }
  
  /**
   * Déterminer si l'erreur peut être retryée
   */
  private static isErrorRetryable(errorType: ErrorType, context: ErrorContext): boolean {
    // Ne pas retry si on a atteint le maximum
    if ((context.attempt || 0) >= (context.maxAttempts || 3)) {
      return false;
    }
    
    // Erreurs non-retryables
    const nonRetryableErrors = [
      ErrorType.VALIDATION_ERROR,
      ErrorType.QUOTA_EXCEEDED
    ];
    
    if (nonRetryableErrors.includes(errorType)) {
      return false;
    }
    
    return this.defaultRetryConfig.retryableErrors.includes(errorType);
  }
  
  /**
   * Calculer le délai de retry avec backoff exponentiel
   */
  private static calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }
  
  /**
   * Obtenir l'action suggérée pour l'erreur
   */
  private static getSuggestedAction(errorType: ErrorType, context: ErrorContext): string {
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
        return 'Vérifier et corriger les paramètres d\'entrée';
      
      case ErrorType.API_ERROR:
        return 'Vérifier la configuration API et les permissions';
      
      case ErrorType.RATE_LIMIT_ERROR:
        return `Attendre ${Math.ceil(this.calculateRetryDelay(context.attempt || 0, this.defaultRetryConfig) / 1000)}s avant de réessayer`;
      
      case ErrorType.TIMEOUT_ERROR:
        return 'Augmenter le timeout ou réessayer avec une requête plus simple';
      
      case ErrorType.NETWORK_ERROR:
        return 'Vérifier la connexion internet et réessayer';
      
      case ErrorType.PARSING_ERROR:
        return 'Vérifier le format des données de réponse';
      
      case ErrorType.FILE_SYSTEM_ERROR:
        return 'Vérifier les permissions et l\'espace disque disponible';
      
      case ErrorType.QUOTA_EXCEEDED:
        return 'Attendre la réinitialisation du quota ou utiliser une autre clé API';
      
      default:
        return 'Analyser les logs pour plus de détails';
    }
  }
  
  /**
   * Générer un message utilisateur convivial
   */
  private static generateUserMessage(errorType: ErrorType, context: ErrorContext): string {
    const stepName = (context.step || 'unknown').replace(/_/g, ' ');
    
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
        return `Erreur de validation lors de l'étape "${stepName}". Veuillez vérifier vos paramètres.`;
      
      case ErrorType.API_ERROR:
        return `Problème de communication avec l'API lors de l'étape "${stepName}". Nous réessayons automatiquement.`;
      
      case ErrorType.RATE_LIMIT_ERROR:
        return `Limite de requêtes atteinte. Pause automatique avant de continuer l'étape "${stepName}".`;
      
      case ErrorType.TIMEOUT_ERROR:
        return `L'étape "${stepName}" prend plus de temps que prévu. Nous réessayons avec des paramètres optimisés.`;
      
      case ErrorType.NETWORK_ERROR:
        return `Problème de connexion réseau lors de l'étape "${stepName}". Tentative de reconnexion en cours.`;
      
      case ErrorType.PARSING_ERROR:
        return `Erreur de traitement des données lors de l'étape "${stepName}". Nous réessayons avec des paramètres différents.`;
      
      case ErrorType.FILE_SYSTEM_ERROR:
        return `Problème de création des fichiers lors de l'étape "${stepName}". Vérification des permissions en cours.`;
      
      case ErrorType.QUOTA_EXCEEDED:
        return 'Quota API dépassé. Veuillez réessayer plus tard ou contacter le support.';
      
      default:
        return `Erreur inattendue lors de l'étape "${stepName}". Nous analysons le problème.`;
    }
  }
  
  /**
   * Gérer une erreur de génération avec stratégie de retry
   */
  static async handleGenerationError(
    error: any, 
    context: ErrorContext,
    retryConfig?: Partial<RetryConfig>
  ): Promise<{
    shouldRetry: boolean;
    delay: number;
    analysis: ErrorAnalysis;
    recoveryAction?: () => Promise<void>;
  }> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    const analysis = this.analyzeError(error, context);
    
    // Logger l'erreur avec tous les détails
    this.logger.error('💥 Erreur de génération détectée', {
      step: context.step,
      sessionId: context.sessionId,
      errorType: analysis.type,
      severity: analysis.severity,
      attempt: `${context.attempt || 0}/${context.maxAttempts || 3}`,
      duration: `${context.duration || 0}ms`,
      message: error?.message || 'Message d\'erreur non disponible',
      timestamp: TimestampManager.getLogTimestamp(),
      ...context.additionalInfo
    });
    
    // Déterminer si nous devons retry
    const shouldRetry = analysis.isRetryable && 
                       (context.attempt || 0) < config.maxAttempts &&
                       config.retryableErrors.includes(analysis.type);
    
    // Actions de récupération spécifiques
    let recoveryAction: (() => Promise<void>) | undefined;
    
    if (analysis.type === ErrorType.RATE_LIMIT_ERROR) {
      recoveryAction = async () => {
        this.logger.info('⏸️ Pause forcée pour rate limiting', { 
          delay: `${analysis.suggestedDelay}ms` 
        });
        await new Promise(resolve => setTimeout(resolve, analysis.suggestedDelay));
      };
    } else if (analysis.type === ErrorType.FILE_SYSTEM_ERROR) {
      recoveryAction = async () => {
        this.logger.info('🔧 Tentative de récupération système de fichiers');
        // Actions de nettoyage ou création de répertoires si nécessaire
      };
    }
    
    // Logger la décision
    if (shouldRetry) {
      this.logger.warn('🔄 Retry prévu', {
        step: context.step,
        nextAttempt: (context.attempt || 0) + 1,
        maxAttempts: config.maxAttempts,
        delay: `${analysis.suggestedDelay}ms`,
        reason: analysis.suggestedAction
      });
    } else {
      this.logger.error('🛑 Abandon de l\'étape', {
        step: context.step,
        reason: analysis.type === ErrorType.VALIDATION_ERROR ? 'Non retryable' : 'Max attempts reached',
        finalAttempt: context.attempt || 0
      });
    }
    
    return {
      shouldRetry,
      delay: analysis.suggestedDelay,
      analysis,
      recoveryAction
    };
  }
  
  /**
   * Créer un rapport d'erreur détaillé
   */
  static generateErrorReport(
    error: any,
    context: ErrorContext,
    analysis: ErrorAnalysis
  ): string {
    return `# Rapport d'Erreur - ${TimestampManager.getReadableTimestamp()}

## Informations Générales
- **Session ID**: ${context.sessionId}
- **Étape**: ${context.step || 'unknown'}
- **Tentative**: ${context.attempt || 0}/${context.maxAttempts || 3}
- **Durée**: ${context.duration || 0}ms

## Analyse de l'Erreur
- **Type**: ${analysis.type}
- **Sévérité**: ${analysis.severity}
- **Retryable**: ${analysis.isRetryable ? 'Oui' : 'Non'}
- **Action suggérée**: ${analysis.suggestedAction}

## Message Utilisateur
${analysis.userMessage}

## Détails Techniques
\`\`\`
${analysis.technicalDetails}
\`\`\`

## Contexte Additionnel
${context.additionalInfo ? JSON.stringify(context.additionalInfo, null, 2) : 'Aucun'}

---
*Généré automatiquement par ErrorHandler*
`;
  }
  
  /**
   * Nettoyer les erreurs en cascade
   */
  static async handleCascadingErrors(
    errors: Array<{ error: any; context: ErrorContext }>,
    onProgress?: (step: string, status: string) => void
  ): Promise<void> {
    this.logger.warn('⚡ Gestion des erreurs en cascade', { 
      errorsCount: errors.length 
    });
    
    // Grouper les erreurs par type
    const errorGroups = new Map<ErrorType, typeof errors>();
    
    for (const { error, context } of errors) {
      const analysis = this.analyzeError(error, context);
      const existing = errorGroups.get(analysis.type) || [];
      existing.push({ error, context });
      errorGroups.set(analysis.type, existing);
    }
    
    // Traiter chaque groupe d'erreurs
    for (const [errorType, errorList] of errorGroups) {
      onProgress?.(errorType, 'cleaning');
      
      this.logger.info(`🧹 Nettoyage des erreurs ${errorType}`, { 
        count: errorList.length 
      });
      
      // Actions spécifiques selon le type d'erreur
      switch (errorType) {
        case ErrorType.FILE_SYSTEM_ERROR:
          // Nettoyer les fichiers temporaires ou corrompus
          break;
        case ErrorType.RATE_LIMIT_ERROR:
          // Attendre que les limites se réinitialisent
          await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
          break;
      }
      
      onProgress?.(errorType, 'completed');
    }
    
    this.logger.info('✅ Nettoyage des erreurs terminé');
  }
}