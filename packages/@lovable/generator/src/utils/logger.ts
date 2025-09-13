import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { TimestampManager, generateFullTimestamp, formatDuration } from './timestamp.js';

export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogOptions {
  level: LogLevel;
  logToFile: boolean;
  logToConsole: boolean;
  logDir: string;
}

export interface GenerationSession {
  sessionId: string;
  startTime: Date;
  prompt: string;
  appName?: string;
  appPath?: string;
  steps: GenerationStep[];
}

export interface GenerationStep {
  stepName: string;
  startTime: Date;
  endTime?: Date;
  success?: boolean;
  details: any;
}

export class Logger {
  private options: LogOptions;
  private sessionId: string;
  private logFile: string;
  private currentGeneration: GenerationSession | null = null;

  constructor(options?: Partial<LogOptions>) {
    this.options = {
      level: LogLevel.INFO,
      logToFile: true,
      logToConsole: true,
      logDir: './logs/generations',
      ...options
    };

    this.sessionId = TimestampManager.getSessionId();
    this.logFile = path.join(this.options.logDir, `${this.sessionId}-session.log`);
    
    if (this.options.logToFile) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    fs.ensureDirSync(this.options.logDir);
    fs.ensureDirSync('./logs/errors');
    fs.ensureDirSync('./prompts/history');
  }

  private formatMessage(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): string {
    const timestamp = TimestampManager.getLogTimestamp();
    const sessionInfo = `[${this.sessionId}]`;
    const dataStr = data ? ` | ${JSON.stringify(data, null, 0)}` : '';
    return `${timestamp} [${level}] ${sessionInfo} ${message}${dataStr}`;
  }

  private writeToFile(message: string, isError: boolean = false): void {
    if (!this.options.logToFile) return;

    const logFile = isError 
      ? path.join('./logs/errors', 'errors.log')
      : this.logFile;

    fs.appendFileSync(logFile, message + '\n');

    // Also write to latest.log for easy tailing
    if (!isError) {
      const latestFile = path.join(this.options.logDir, 'latest.log');
      fs.appendFileSync(latestFile, message + '\n');
    }
  }

  private writeToConsole(message: string, level: LogLevel): void {
    if (!this.options.logToConsole) return;

    switch (level) {
      case LogLevel.ERROR:
        console.error(chalk.red(message));
        break;
      case LogLevel.WARN:
        console.warn(chalk.yellow(message));
        break;
      case LogLevel.INFO:
        console.log(chalk.blue(message));
        break;
      case LogLevel.DEBUG:
        console.log(chalk.gray(message));
        break;
    }
  }

  log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any): void {
    const logLevel = level === 'ERROR' ? LogLevel.ERROR : 
                    level === 'WARN' ? LogLevel.WARN : 
                    level === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO;
    
    if (logLevel > this.options.level) return;

    const formattedMessage = this.formatMessage(level, message, data);
    
    this.writeToConsole(formattedMessage, logLevel);
    this.writeToFile(formattedMessage, level === 'ERROR');
  }

  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }

  startGeneration(prompt: string, appName?: string): void {
    this.currentGeneration = {
      sessionId: this.sessionId,
      startTime: new Date(),
      prompt,
      appName,
      steps: []
    };

    const readableTime = TimestampManager.getReadableTimestamp();
    
    this.log('INFO', '🚀 GÉNÉRATION DÉMARRÉE', {
      appName: appName || 'unnamed-app',
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      timestamp: readableTime
    });

    // Log au début du fichier de session
    const header = `
=== SESSION DE GÉNÉRATION ===
Session ID: ${this.sessionId}
Démarré le: ${readableTime}
App: ${appName || 'unnamed-app'}
Prompt: ${prompt}
===============================
`;
    this.writeToFile(header);
  }

  endGeneration(success: boolean, appPath?: string, error?: string): void {
    if (!this.currentGeneration) return;

    this.currentGeneration.appPath = appPath;
    const duration = Date.now() - this.currentGeneration.startTime.getTime();
    const formattedDuration = formatDuration(duration);

    if (success) {
      this.log('INFO', '✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS', {
        appPath,
        duration: formattedDuration,
        stepsCompleted: this.currentGeneration.steps.length
      });
    } else {
      this.log('ERROR', '❌ GÉNÉRATION ÉCHOUÉE', {
        error,
        duration: formattedDuration,
        stepsCompleted: this.currentGeneration.steps.length
      });
    }

    // Sauvegarder la session complète
    this.saveGenerationSummary(success, error);
    this.currentGeneration = null;
  }

  logStep(step: string, details: any): void {
    if (!this.currentGeneration) return;

    const stepData: GenerationStep = {
      stepName: step,
      startTime: new Date(),
      details
    };

    this.currentGeneration.steps.push(stepData);

    this.log('INFO', `📝 ÉTAPE: ${step}`, {
      step,
      details: typeof details === 'object' ? JSON.stringify(details, null, 0) : details
    });
  }

  completeStep(stepName: string, success: boolean, result?: any): void {
    if (!this.currentGeneration) return;

    const step = this.currentGeneration.steps.find(s => s.stepName === stepName && !s.endTime);
    if (step) {
      step.endTime = new Date();
      step.success = success;
      
      const duration = step.endTime.getTime() - step.startTime.getTime();
      
      this.log('INFO', `${success ? '✅' : '❌'} ÉTAPE ${success ? 'TERMINÉE' : 'ÉCHOUÉE'}: ${stepName}`, {
        duration: formatDuration(duration),
        result: result ? JSON.stringify(result, null, 0) : undefined
      });
    }
  }

  async savePromptHistory(prompt: string, response: string): Promise<void> {
    const timestamp = TimestampManager.getTimestamp();
    const historyFile = path.join('./prompts/history', `${timestamp}-prompt.json`);
    
    const historyData = {
      sessionId: this.sessionId,
      timestamp: TimestampManager.getLogTimestamp(),
      readableTime: TimestampManager.getReadableTimestamp(),
      userPrompt: prompt,
      aiResponse: response,
      metadata: {
        version: '1.0',
        generatedBy: 'app-generator-workflow',
        logFile: this.logFile
      }
    };
    
    await fs.writeFile(historyFile, JSON.stringify(historyData, null, 2));
    this.log('INFO', '💾 Historique des prompts sauvegardé', { historyFile });
  }

  private saveGenerationSummary(success: boolean, error?: string): void {
    if (!this.currentGeneration) return;

    const summary = {
      ...this.currentGeneration,
      endTime: new Date(),
      success,
      error,
      totalDuration: Date.now() - this.currentGeneration.startTime.getTime(),
      readableStartTime: TimestampManager.getReadableTimestamp(),
      stepsCount: this.currentGeneration.steps.length,
      stepsDetails: this.currentGeneration.steps.map(step => ({
        ...step,
        duration: step.endTime ? step.endTime.getTime() - step.startTime.getTime() : null
      }))
    };

    const summaryFile = path.join(this.options.logDir, `${this.sessionId}-summary.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  }

  startTimer(label: string): () => void {
    const startTime = Date.now();
    this.info(`⏱️ Timer démarré: ${label}`);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`⏱️ Timer terminé: ${label} (${formatDuration(duration)})`);
    };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCurrentGeneration(): GenerationSession | null {
    return this.currentGeneration;
  }
}