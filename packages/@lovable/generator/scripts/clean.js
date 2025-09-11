#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { Command } = require('commander');

const program = new Command();

program
  .name('clean')
  .description('Script de nettoyage pour maintenir le projet organisé')
  .option('-d, --days <number>', 'Supprimer générations > X jours', '7')
  .option('-s, --size <mb>', 'Supprimer si total > X MB')
  .option('--dry-run', 'Simuler sans supprimer')
  .option('--logs', 'Nettoyer aussi les anciens logs')
  .option('--temp', 'Nettoyer les fichiers temporaires')
  .option('-v, --verbose', 'Mode verbeux')
  .parse();

class ProjectCleaner {
  constructor(options = {}) {
    this.options = options;
    this.stats = {
      foldersRemoved: 0,
      filesRemoved: 0,
      spaceFreed: 0,
      errors: 0
    };
    this.baseDir = path.resolve(__dirname, '..');
  }

  log(message, force = false) {
    if (this.options.verbose || force) {
      console.log(message);
    }
  }

  async cleanOldGenerations() {
    const generatedAppsDir = path.join(this.baseDir, 'generated-apps');
    const options = this.options;
    
    this.log(`🧹 Nettoyage des générations > ${options.days} jours...`, true);
    
    if (!await fs.pathExists(generatedAppsDir)) {
      this.log('📁 Dossier generated-apps inexistant', true);
      return;
    }

    try {
      const entries = await fs.readdir(generatedAppsDir);
      const maxAge = parseInt(options.days) * 24 * 60 * 60 * 1000; // Convertir en ms
      const now = Date.now();

      for (const entry of entries) {
        const entryPath = path.join(generatedAppsDir, entry);
        const stat = await fs.stat(entryPath);

        if (stat.isDirectory()) {
          const age = now - stat.mtime.getTime();
          
          if (age > maxAge) {
            const folderSize = await this.getFolderSize(entryPath);
            
            this.log(`📂 Dossier à supprimer: ${entry} (${this.formatBytes(folderSize)}, ${Math.round(age / (24 * 60 * 60 * 1000))} jours)`);
            
            if (!options.dryRun) {
              try {
                await fs.remove(entryPath);
                this.stats.foldersRemoved++;
                this.stats.spaceFreed += folderSize;
                this.log(`✅ Supprimé: ${entry}`);
              } catch (error) {
                this.log(`❌ Erreur suppression ${entry}: ${error.message}`);
                this.stats.errors++;
              }
            } else {
              this.stats.foldersRemoved++;
              this.stats.spaceFreed += folderSize;
            }
          } else {
            this.log(`📂 Conservé: ${entry} (${Math.round(age / (24 * 60 * 60 * 1000))} jours)`);
          }
        }
      }
    } catch (error) {
      this.log(`❌ Erreur lecture dossier generated-apps: ${error.message}`, true);
      this.stats.errors++;
    }
  }

  async cleanBySize() {
    const options = this.options;
    
    if (!options.size) return;

    const maxSizeMB = parseInt(options.size);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    this.log(`📏 Vérification taille maximale: ${maxSizeMB} MB`, true);

    const generatedAppsDir = path.join(this.baseDir, 'generated-apps');
    if (!await fs.pathExists(generatedAppsDir)) return;

    const totalSize = await this.getFolderSize(generatedAppsDir);
    this.log(`📊 Taille actuelle: ${this.formatBytes(totalSize)}`);

    if (totalSize > maxSizeBytes) {
      this.log(`⚠️ Taille dépassée! Suppression des plus anciens dossiers...`, true);
      
      const entries = await fs.readdir(generatedAppsDir);
      const foldersWithAge = [];

      for (const entry of entries) {
        const entryPath = path.join(generatedAppsDir, entry);
        const stat = await fs.stat(entryPath);
        
        if (stat.isDirectory()) {
          const folderSize = await this.getFolderSize(entryPath);
          foldersWithAge.push({
            name: entry,
            path: entryPath,
            mtime: stat.mtime,
            size: folderSize
          });
        }
      }

      // Trier par date (plus anciens en premier)
      foldersWithAge.sort((a, b) => a.mtime - b.mtime);

      let currentSize = totalSize;
      
      for (const folder of foldersWithAge) {
        if (currentSize <= maxSizeBytes) break;

        this.log(`🗑️ Suppression pour taille: ${folder.name} (${this.formatBytes(folder.size)})`);
        
        if (!options.dryRun) {
          try {
            await fs.remove(folder.path);
            currentSize -= folder.size;
            this.stats.foldersRemoved++;
            this.stats.spaceFreed += folder.size;
          } catch (error) {
            this.log(`❌ Erreur suppression ${folder.name}: ${error.message}`);
            this.stats.errors++;
          }
        } else {
          currentSize -= folder.size;
          this.stats.foldersRemoved++;
          this.stats.spaceFreed += folder.size;
        }
      }
    }
  }

  async cleanLogs() {
    if (!this.options.logs) return;

    this.log('📋 Nettoyage des anciens logs...', true);
    
    const logsDir = path.join(this.baseDir, 'logs');
    if (!await fs.pathExists(logsDir)) {
      this.log('📁 Dossier logs inexistant');
      return;
    }

    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    const now = Date.now();

    try {
      const entries = await fs.readdir(logsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(logsDir, entry.name);
          const stat = await fs.stat(filePath);
          const age = now - stat.mtime.getTime();
          
          if (age > maxAge) {
            this.log(`🗑️ Log ancien: ${entry.name}`);
            
            if (!this.options.dryRun) {
              await fs.remove(filePath);
              this.stats.filesRemoved++;
              this.stats.spaceFreed += stat.size;
            } else {
              this.stats.filesRemoved++;
              this.stats.spaceFreed += stat.size;
            }
          }
        }
      }
    } catch (error) {
      this.log(`❌ Erreur nettoyage logs: ${error.message}`, true);
      this.stats.errors++;
    }
  }

  async cleanTempFiles() {
    if (!this.options.temp) return;

    this.log('🗂️ Nettoyage fichiers temporaires...', true);
    
    // Patterns de fichiers temporaires
    const tempDirs = [
      path.join(this.baseDir, 'node_modules/.cache'),
      path.join(this.baseDir, 'logs/temp'),
      path.join(this.baseDir, 'generated-apps/.tmp')
    ];

    const tempFilePatterns = ['.tmp', '.temp', '.log.tmp', '.bak'];

    // Nettoyer dossiers temporaires
    for (const tempDir of tempDirs) {
      if (await fs.pathExists(tempDir)) {
        try {
          const size = await this.getFolderSize(tempDir);
          this.log(`🗑️ Dossier temp: ${path.relative(this.baseDir, tempDir)}`);
          
          if (!this.options.dryRun) {
            await fs.remove(tempDir);
            this.stats.foldersRemoved++;
            this.stats.spaceFreed += size;
          } else {
            this.stats.foldersRemoved++;
            this.stats.spaceFreed += size;
          }
        } catch (error) {
          this.log(`❌ Erreur suppression ${tempDir}: ${error.message}`);
          this.stats.errors++;
        }
      }
    }

    // Nettoyer fichiers temporaires
    await this.cleanTempFilesByPattern(this.baseDir, tempFilePatterns);
  }

  async cleanTempFilesByPattern(dir, patterns) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        
        if (entry.isFile()) {
          const isTemp = patterns.some(pattern => entry.name.endsWith(pattern));
          
          if (isTemp) {
            try {
              const stat = await fs.stat(entryPath);
              this.log(`🗑️ Fichier temp: ${path.relative(this.baseDir, entryPath)}`);
              
              if (!this.options.dryRun) {
                await fs.remove(entryPath);
                this.stats.filesRemoved++;
                this.stats.spaceFreed += stat.size;
              } else {
                this.stats.filesRemoved++;
                this.stats.spaceFreed += stat.size;
              }
            } catch (error) {
              this.log(`❌ Erreur suppression ${entryPath}: ${error.message}`);
              this.stats.errors++;
            }
          }
        } else if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          await this.cleanTempFilesByPattern(entryPath, patterns);
        }
      }
    } catch (error) {
      this.log(`⚠️ Erreur lecture dossier ${dir}: ${error.message}`);
    }
  }

  async getFolderSize(folderPath) {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(folderPath, entry.name);
        
        if (entry.isFile()) {
          const stat = await fs.stat(entryPath);
          totalSize += stat.size;
        } else if (entry.isDirectory()) {
          totalSize += await this.getFolderSize(entryPath);
        }
      }
    } catch (error) {
      this.log(`⚠️ Erreur calcul taille ${folderPath}: ${error.message}`);
    }
    
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    const startTime = Date.now();
    
    console.log('🧹 === SCRIPT DE NETTOYAGE DÉMARRÉ ===');
    
    if (this.options.dryRun) {
      console.log('🔍 MODE SIMULATION (--dry-run)');
    }
    
    // Nettoyer par âge
    await this.cleanOldGenerations();
    
    // Nettoyer par taille
    await this.cleanBySize();
    
    // Nettoyer logs si demandé
    await this.cleanLogs();
    
    // Nettoyer fichiers temporaires si demandé
    await this.cleanTempFiles();
    
    // Statistiques finales
    const duration = Date.now() - startTime;
    
    console.log('\n✅ === NETTOYAGE TERMINÉ ===');
    console.log(`   - Durée: ${duration}ms`);
    console.log(`   - Dossiers supprimés: ${this.stats.foldersRemoved}`);
    console.log(`   - Fichiers supprimés: ${this.stats.filesRemoved}`);
    console.log(`   - Espace libéré: ${this.formatBytes(this.stats.spaceFreed)}`);
    
    if (this.stats.errors > 0) {
      console.log(`   - ⚠️ Erreurs: ${this.stats.errors}`);
    }
    
    if (this.options.dryRun) {
      console.log('   - 🔍 SIMULATION UNIQUEMENT - Aucune suppression effectuée');
    }
  }
}

// Exécution si appelé directement
async function main() {
  try {
    const options = program.opts();
    const cleaner = new ProjectCleaner(options);
    await cleaner.run();
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProjectCleaner };