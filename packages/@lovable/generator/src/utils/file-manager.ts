import fs from 'fs-extra';
import path from 'path';
import { TimestampManager, generateTimestamp, isOlderThanDays, formatDuration } from './timestamp.js';

export class FileManager {
  // Instance methods
  async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await this.ensureDirectory(dir);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  async fileExists(filePath: string): Promise<boolean> {
    return await fs.pathExists(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    if (await this.fileExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    if (!(await this.fileExists(dirPath))) {
      return [];
    }
    return await fs.readdir(dirPath);
  }

  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const destDir = path.dirname(destPath);
    await this.ensureDirectory(destDir);
    await fs.copy(sourcePath, destPath);
  }

  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    const destDir = path.dirname(destPath);
    await this.ensureDirectory(destDir);
    await fs.move(sourcePath, destPath);
  }

  // Static methods as requested
  static createAppFolder(appName: string): string {
    const folderName = TimestampManager.getFolderName(appName);
    const fullPath = path.join('./generated-apps', folderName);
    
    // Créer le dossier de façon synchrone pour pouvoir retourner le chemin
    fs.ensureDirSync(fullPath);
    
    return fullPath;
  }

  static async saveFile(appPath: string, filePath: string, content: string): Promise<void> {
    const fullPath = path.join(appPath, filePath);
    const dir = path.dirname(fullPath);
    
    await fs.ensureDir(dir);
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  static async archiveOldGenerations(daysOld: number): Promise<{
    archived: string[];
    deleted: string[];
    totalSize: number;
  }> {
    const generatedAppsDir = './generated-apps';
    const archived: string[] = [];
    const deleted: string[] = [];
    let totalSize = 0;
    
    if (!(await fs.pathExists(generatedAppsDir))) {
      return { archived, deleted, totalSize };
    }

    const items = await fs.readdir(generatedAppsDir);
    
    for (const item of items) {
      if (item === '.gitkeep') continue;
      
      const itemPath = path.join(generatedAppsDir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        const timestamp = TimestampManager.parseTimestampFromPath(item);
        
        if (timestamp) {
          const ageInDays = Math.floor((Date.now() - timestamp.valueOf()) / (1000 * 60 * 60 * 24));
          
          if (ageInDays > daysOld) {
            // Calculer la taille avant suppression
            const dirSize = await FileManager.getDirectorySizeStatic(itemPath);
            totalSize += dirSize;
            
            // Pour l'instant on supprime directement, mais on pourrait archiver
            await fs.remove(itemPath);
            deleted.push(itemPath);
          }
        }
      }
    }
    
    return { archived, deleted, totalSize };
  }

  static async getGenerationStats(): Promise<{
    totalGenerations: number;
    totalSize: string;
    oldestGeneration: string | null;
    newestGeneration: string | null;
    averageSize: string;
    byDay: Record<string, number>;
  }> {
    const generatedAppsDir = './generated-apps';
    const stats = {
      totalGenerations: 0,
      totalSize: '0 Bytes',
      oldestGeneration: null as string | null,
      newestGeneration: null as string | null,
      averageSize: '0 Bytes',
      byDay: {} as Record<string, number>
    };
    
    if (!(await fs.pathExists(generatedAppsDir))) {
      return stats;
    }

    const items = await fs.readdir(generatedAppsDir);
    const generations: Array<{name: string, timestamp: Date, size: number}> = [];
    let totalSizeBytes = 0;
    
    for (const item of items) {
      if (item === '.gitkeep') continue;
      
      const itemPath = path.join(generatedAppsDir, item);
      const itemStats = await fs.stat(itemPath);
      
      if (itemStats.isDirectory()) {
        const timestamp = TimestampManager.parseTimestampFromPath(item);
        
        if (timestamp) {
          const dirSize = await FileManager.getDirectorySizeStatic(itemPath);
          totalSizeBytes += dirSize;
          
          generations.push({
            name: item,
            timestamp: timestamp.toDate(),
            size: dirSize
          });
          
          // Compter par jour
          const dayKey = timestamp.format('YYYY-MM-DD');
          stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;
        }
      }
    }
    
    stats.totalGenerations = generations.length;
    stats.totalSize = FileManager.formatFileSizeStatic(totalSizeBytes);
    
    if (generations.length > 0) {
      generations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      stats.oldestGeneration = generations[0].name;
      stats.newestGeneration = generations[generations.length - 1].name;
      
      const averageSize = totalSizeBytes / generations.length;
      stats.averageSize = FileManager.formatFileSizeStatic(averageSize);
    }
    
    return stats;
  }

  // Méthodes utilitaires statiques
  private static async getDirectorySizeStatic(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    if (!(await fs.pathExists(dirPath))) {
      return totalSize;
    }

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await FileManager.getDirectorySizeStatic(itemPath);
      }
    }
    
    return totalSize;
  }

  private static formatFileSizeStatic(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Méthodes existantes
  async cleanupOldGenerations(generatedAppsDir: string, maxDays: number): Promise<string[]> {
    const deleted: string[] = [];
    
    if (!(await this.fileExists(generatedAppsDir))) {
      return deleted;
    }

    const items = await this.listDirectory(generatedAppsDir);
    
    for (const item of items) {
      if (item === '.gitkeep') continue;
      
      const itemPath = path.join(generatedAppsDir, item);
      const stats = await this.getFileStats(itemPath);
      
      if (stats?.isDirectory()) {
        const timestamp = TimestampManager.parseTimestampFromPath(item);
        
        if (timestamp) {
          const ageInDays = Math.floor((Date.now() - timestamp.valueOf()) / (1000 * 60 * 60 * 24));
          
          if (ageInDays > maxDays) {
            await fs.remove(itemPath);
            deleted.push(itemPath);
          }
        }
      }
    }
    
    return deleted;
  }

  async cleanupOldLogs(logsDir: string, maxDays: number): Promise<string[]> {
    const deleted: string[] = [];
    const generationsDir = path.join(logsDir, 'generations');
    
    if (!(await this.fileExists(generationsDir))) {
      return deleted;
    }

    const logFiles = await this.listDirectory(generationsDir);
    
    for (const logFile of logFiles) {
      if (logFile === '.gitkeep' || logFile === 'latest.log') continue;
      
      const logPath = path.join(generationsDir, logFile);
      const stats = await this.getFileStats(logPath);
      
      if (stats?.isFile()) {
        const timestampMatch = logFile.match(/^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})/);
        
        if (timestampMatch) {
          const timestamp = TimestampManager.parseTimestampFromPath(timestampMatch[1]);
          if (timestamp) {
            const ageInDays = Math.floor((Date.now() - timestamp.valueOf()) / (1000 * 60 * 60 * 24));
            
            if (ageInDays > maxDays) {
              await this.deleteFile(logPath);
              deleted.push(logPath);
            }
          }
        }
      }
    }
    
    return deleted;
  }

  async createBackup(sourceDir: string, backupDir: string): Promise<string> {
    const backupName = `backup-${generateTimestamp()}`;
    const backupPath = path.join(backupDir, backupName);
    
    await this.ensureDirectory(backupDir);
    await fs.copy(sourceDir, backupPath);
    
    return backupPath;
  }

  async getDirectorySize(dirPath: string): Promise<number> {
    return FileManager.getDirectorySizeStatic(dirPath);
  }

  formatFileSize(bytes: number): string {
    return FileManager.formatFileSizeStatic(bytes);
  }

  async savePromptHistory(userPrompt: string, architecture: any, result: any): Promise<string> {
    const timestamp = generateTimestamp();
    const historyFile = path.join('./prompts/history', `${timestamp}.json`);
    
    const historyData = {
      timestamp: timestamp,
      userPrompt: userPrompt,
      architecture: architecture,
      result: result,
      metadata: {
        version: '1.0',
        generatedBy: 'app-generator-workflow'
      }
    };
    
    await this.writeFile(historyFile, JSON.stringify(historyData, null, 2));
    return historyFile;
  }
}