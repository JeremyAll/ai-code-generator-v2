#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { Command } = require('commander');

const program = new Command();

program
  .name('stats')
  .description('Afficher les statistiques du générateur d\'applications')
  .option('-f, --format <type>', 'Format de sortie (table|json|markdown)', 'table')
  .option('-o, --output <file>', 'Sauvegarder dans un fichier')
  .option('-d, --detailed', 'Affichage détaillé')
  .option('-h, --history <days>', 'Historique sur X jours', '30')
  .option('-v, --verbose', 'Mode verbeux')
  .parse();

class ProjectStats {
  constructor(options = {}) {
    this.options = options;
    this.baseDir = path.resolve(__dirname, '..');
    this.stats = {
      totalGenerations: 0,
      totalSize: 0,
      lastGeneration: null,
      successRate: 0,
      recentApps: [],
      techStacks: {},
      errors: [],
      averageSize: 0,
      averageDuration: 0,
      dailyStats: {},
      fileTypes: {}
    };
  }

  log(message, force = false) {
    if (this.options.verbose || force) {
      console.log(message);
    }
  }

  async showStats() {
    console.log('📊 STATISTIQUES DU GÉNÉRATEUR\n');
    
    await this.collectStats();
    
    switch (this.options.format) {
      case 'json':
        await this.outputJson();
        break;
      case 'markdown':
        await this.outputMarkdown();
        break;
      default:
        await this.outputTable();
    }
    
    if (this.options.output) {
      await this.saveToFile();
    }
  }

  async collectStats() {
    this.log('🔍 Collecte des statistiques...', true);
    
    // Analyser les applications générées
    await this.analyzeGeneratedApps();
    
    // Analyser les logs
    await this.analyzeLogs();
    
    // Calculer les statistiques dérivées
    this.calculateDerivedStats();
    
    this.log('✅ Statistiques collectées', true);
  }

  async analyzeGeneratedApps() {
    const appsDir = path.join(this.baseDir, 'generated-apps');
    
    if (!await fs.pathExists(appsDir)) {
      this.log('📁 Dossier generated-apps inexistant');
      return;
    }

    const entries = await fs.readdir(appsDir);
    const historyDays = parseInt(this.options.history);
    const cutoffDate = new Date(Date.now() - (historyDays * 24 * 60 * 60 * 1000));

    for (const entry of entries) {
      const appPath = path.join(appsDir, entry);
      const stat = await fs.stat(appPath);
      
      if (stat.isDirectory()) {
        // Vérifier si dans la période d'historique
        if (stat.mtime < cutoffDate) continue;

        this.stats.totalGenerations++;
        
        const appSize = await this.getFolderSize(appPath);
        this.stats.totalSize += appSize;

        // Analyser l'application
        const appInfo = await this.analyzeApp(appPath, entry, stat);
        
        // Garder les 10 plus récentes
        if (this.stats.recentApps.length < 10) {
          this.stats.recentApps.push(appInfo);
        }

        // Statistiques par jour
        const dateKey = stat.mtime.toISOString().split('T')[0];
        if (!this.stats.dailyStats[dateKey]) {
          this.stats.dailyStats[dateKey] = { count: 0, size: 0, success: 0 };
        }
        this.stats.dailyStats[dateKey].count++;
        this.stats.dailyStats[dateKey].size += appSize;
        
        // Mettre à jour la dernière génération
        if (!this.stats.lastGeneration || stat.mtime > new Date(this.stats.lastGeneration.date)) {
          this.stats.lastGeneration = {
            name: entry,
            date: stat.mtime.toISOString(),
            size: appSize,
            path: appPath
          };
        }
      }
    }

    // Trier les apps récentes par date
    this.stats.recentApps.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  async analyzeApp(appPath, name, stat) {
    const appInfo = {
      name,
      created: stat.mtime.toISOString(),
      size: await this.getFolderSize(appPath),
      files: 0,
      techStack: [],
      framework: 'unknown',
      success: true
    };

    try {
      // Compter les fichiers
      appInfo.files = await this.countFiles(appPath);

      // Analyser package.json si présent
      const packagePath = path.join(appPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const packageData = await fs.readJson(packagePath);
        
        if (packageData.dependencies) {
          appInfo.techStack = Object.keys(packageData.dependencies);
          
          // Détecter le framework principal
          if (packageData.dependencies.react) appInfo.framework = 'React';
          else if (packageData.dependencies.vue) appInfo.framework = 'Vue';
          else if (packageData.dependencies.angular) appInfo.framework = 'Angular';
          else if (packageData.dependencies.express) appInfo.framework = 'Express';
          else if (packageData.dependencies.next) appInfo.framework = 'Next.js';
          else appInfo.framework = 'Vanilla';
        }

        // Compter les technologies
        for (const tech of appInfo.techStack) {
          this.stats.techStacks[tech] = (this.stats.techStacks[tech] || 0) + 1;
        }
      }

      // Analyser les types de fichiers
      await this.analyzeFileTypes(appPath);

      // Vérifier le rapport de génération
      const reportPath = path.join(appPath, 'generation-report.json');
      if (await fs.pathExists(reportPath)) {
        const report = await fs.readJson(reportPath);
        appInfo.success = report.summary?.success || false;
        if (!appInfo.success) {
          this.stats.errors.push({
            app: name,
            date: stat.mtime.toISOString(),
            error: 'Generation failed'
          });
        }
      }

    } catch (error) {
      this.log(`⚠️ Erreur analyse ${name}: ${error.message}`);
      appInfo.success = false;
      this.stats.errors.push({
        app: name,
        date: stat.mtime.toISOString(),
        error: error.message
      });
    }

    return appInfo;
  }

  async analyzeFileTypes(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext) {
            this.stats.fileTypes[ext] = (this.stats.fileTypes[ext] || 0) + 1;
          }
        } else if (entry.isDirectory()) {
          await this.analyzeFileTypes(path.join(dirPath, entry.name));
        }
      }
    } catch (error) {
      // Ignorer les erreurs de lecture
    }
  }

  async analyzeLogs() {
    const logsDir = path.join(this.baseDir, 'logs');
    
    if (!await fs.pathExists(logsDir)) {
      this.log('📁 Dossier logs inexistant');
      return;
    }

    try {
      const logFiles = await fs.readdir(logsDir);
      
      for (const logFile of logFiles) {
        if (logFile.endsWith('.log')) {
          const logPath = path.join(logsDir, logFile);
          await this.parseLogFile(logPath);
        }
      }
    } catch (error) {
      this.log(`⚠️ Erreur analyse logs: ${error.message}`);
    }
  }

  async parseLogFile(logPath) {
    try {
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.includes('ERROR')) {
          const dateMatch = line.match(/\[(.*?)\]/);
          if (dateMatch) {
            this.stats.errors.push({
              date: dateMatch[1],
              error: line.substring(line.indexOf('ERROR') + 6).trim(),
              source: 'log'
            });
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs de lecture de logs
    }
  }

  calculateDerivedStats() {
    // Taux de succès
    const successfulApps = this.stats.recentApps.filter(app => app.success).length;
    this.stats.successRate = this.stats.totalGenerations > 0 
      ? Math.round((successfulApps / this.stats.totalGenerations) * 100)
      : 0;

    // Taille moyenne
    this.stats.averageSize = this.stats.totalGenerations > 0
      ? Math.round(this.stats.totalSize / this.stats.totalGenerations)
      : 0;

    // Marquer les succès dans les stats quotidiennes
    for (const [date, dayStats] of Object.entries(this.stats.dailyStats)) {
      dayStats.success = Math.round((dayStats.success / dayStats.count) * 100) || 0;
    }
  }

  async outputTable() {
    const stats = this.stats;

    console.log('📊 === STATISTIQUES GÉNÉRALES ===');
    console.table({
      'Générations totales': stats.totalGenerations,
      'Taille totale': this.formatBytes(stats.totalSize),
      'Taille moyenne': this.formatBytes(stats.averageSize),
      'Taux de succès': `${stats.successRate}%`,
      'Dernière génération': stats.lastGeneration?.date?.split('T')[0] || 'Aucune',
      'Erreurs totales': stats.errors.length
    });

    if (stats.lastGeneration) {
      console.log('\n🕒 === DERNIÈRE GÉNÉRATION ===');
      console.table({
        'Nom': stats.lastGeneration.name,
        'Date': new Date(stats.lastGeneration.date).toLocaleString(),
        'Taille': this.formatBytes(stats.lastGeneration.size)
      });
    }

    if (stats.recentApps.length > 0) {
      console.log('\n📱 === APPLICATIONS RÉCENTES ===');
      const recentData = stats.recentApps.slice(0, 5).map(app => ({
        'Nom': app.name.substring(0, 30),
        'Framework': app.framework,
        'Fichiers': app.files,
        'Taille': this.formatBytes(app.size),
        'Succès': app.success ? '✅' : '❌',
        'Date': new Date(app.created).toLocaleDateString()
      }));
      console.table(recentData);
    }

    if (Object.keys(stats.techStacks).length > 0) {
      console.log('\n🛠️ === TECHNOLOGIES POPULAIRES ===');
      const topTech = Object.entries(stats.techStacks)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [tech, count]) => {
          acc[tech] = `${count} fois`;
          return acc;
        }, {});
      console.table(topTech);
    }

    if (Object.keys(stats.fileTypes).length > 0) {
      console.log('\n📄 === TYPES DE FICHIERS ===');
      const topFileTypes = Object.entries(stats.fileTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [ext, count]) => {
          acc[ext] = `${count} fichiers`;
          return acc;
        }, {});
      console.table(topFileTypes);
    }

    if (stats.errors.length > 0) {
      console.log('\n❌ === ERREURS RÉCENTES ===');
      const recentErrors = stats.errors
        .slice(-5)
        .map(error => ({
          'Date': error.date.substring(0, 19).replace('T', ' '),
          'Source': error.app || error.source || 'System',
          'Erreur': error.error.substring(0, 50) + (error.error.length > 50 ? '...' : '')
        }));
      console.table(recentErrors);
    }

    if (this.options.detailed && Object.keys(stats.dailyStats).length > 0) {
      console.log('\n📅 === STATISTIQUES QUOTIDIENNES ===');
      const dailyData = Object.entries(stats.dailyStats)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 7)
        .reduce((acc, [date, data]) => {
          acc[date] = {
            'Générations': data.count,
            'Taille': this.formatBytes(data.size),
            'Succès': `${data.success}%`
          };
          return acc;
        }, {});
      console.table(dailyData);
    }
  }

  async outputJson() {
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        totalGenerations: this.stats.totalGenerations,
        totalSize: this.stats.totalSize,
        averageSize: this.stats.averageSize,
        successRate: this.stats.successRate,
        totalErrors: this.stats.errors.length
      },
      lastGeneration: this.stats.lastGeneration,
      recentApps: this.stats.recentApps.slice(0, 10),
      techStacks: this.stats.techStacks,
      fileTypes: this.stats.fileTypes,
      dailyStats: this.stats.dailyStats,
      errors: this.stats.errors.slice(-10)
    };

    console.log(JSON.stringify(output, null, 2));
  }

  async outputMarkdown() {
    const stats = this.stats;
    
    let markdown = `# 📊 Statistiques du Générateur d'Applications

*Généré le ${new Date().toLocaleString()}*

## Résumé Général

| Métrique | Valeur |
|----------|--------|
| **Générations totales** | ${stats.totalGenerations} |
| **Taille totale** | ${this.formatBytes(stats.totalSize)} |
| **Taille moyenne** | ${this.formatBytes(stats.averageSize)} |
| **Taux de succès** | ${stats.successRate}% |
| **Erreurs totales** | ${stats.errors.length} |
| **Dernière génération** | ${stats.lastGeneration?.date?.split('T')[0] || 'Aucune'} |

`;

    if (stats.recentApps.length > 0) {
      markdown += `## 📱 Applications Récentes

| Nom | Framework | Fichiers | Taille | Succès | Date |
|-----|-----------|----------|--------|--------|------|
`;
      stats.recentApps.slice(0, 10).forEach(app => {
        markdown += `| ${app.name} | ${app.framework} | ${app.files} | ${this.formatBytes(app.size)} | ${app.success ? '✅' : '❌'} | ${new Date(app.created).toLocaleDateString()} |\n`;
      });
      markdown += '\n';
    }

    if (Object.keys(stats.techStacks).length > 0) {
      markdown += `## 🛠️ Technologies Populaires

| Technologie | Utilisations |
|-------------|--------------|
`;
      Object.entries(stats.techStacks)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([tech, count]) => {
          markdown += `| ${tech} | ${count} |\n`;
        });
      markdown += '\n';
    }

    if (stats.errors.length > 0) {
      markdown += `## ❌ Erreurs Récentes

| Date | Source | Erreur |
|------|--------|--------|
`;
      stats.errors.slice(-10).forEach(error => {
        const errorText = error.error.length > 80 ? error.error.substring(0, 80) + '...' : error.error;
        markdown += `| ${error.date.substring(0, 19)} | ${error.app || error.source || 'System'} | ${errorText} |\n`;
      });
    }

    console.log(markdown);
  }

  async saveToFile() {
    let content;
    
    switch (this.options.format) {
      case 'json':
        const jsonData = {
          timestamp: new Date().toISOString(),
          stats: this.stats
        };
        content = JSON.stringify(jsonData, null, 2);
        break;
      case 'markdown':
        // Regénérer le markdown dans une variable
        content = '# Statistiques sauvegardées\n\n' + JSON.stringify(this.stats, null, 2);
        break;
      default:
        content = `Statistiques du générateur - ${new Date().toLocaleString()}\n\n${JSON.stringify(this.stats, null, 2)}`;
    }

    await fs.writeFile(this.options.output, content);
    console.log(`\n💾 Statistiques sauvegardées: ${this.options.output}`);
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
      // Ignorer les erreurs
    }
    
    return totalSize;
  }

  async countFiles(folderPath) {
    let fileCount = 0;
    
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          fileCount++;
        } else if (entry.isDirectory()) {
          fileCount += await this.countFiles(path.join(folderPath, entry.name));
        }
      }
    } catch (error) {
      // Ignorer les erreurs
    }
    
    return fileCount;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Exécution si appelé directement
async function main() {
  try {
    const options = program.opts();
    const stats = new ProjectStats(options);
    await stats.showStats();
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProjectStats };