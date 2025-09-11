#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { PureSonnetWorkflow } from './workflows/pure-sonnet.ts';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface PromptConfig {
  complexity?: string;
  framework?: string;
  animations?: boolean;
  darkMode?: boolean;
}

const program = new Command();
const version = '1.0.0';

program
  .name('appgen')
  .description('Générateur d\'applications IA')
  .version(version);

// Commande generate
program
  .command('generate')
  .alias('gen')
  .description('Générer une nouvelle application')
  .option('-p, --prompt <string>', 'Prompt direct')
  .option('-i, --interactive', 'Mode interactif')
  .action(async (options) => {
    console.log(chalk.blue.bold(`
╔═══════════════════════════════════╗
║     APP GENERATOR v${version}      ║
║   Powered by Claude Sonnet 4      ║
╚═══════════════════════════════════╝
    `));
    
    let userPrompt;
    let promptConfig: PromptConfig = {};
    
    if (options.interactive || !options.prompt) {
      console.log(chalk.cyan('📝 Configuration de votre application...\n'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'prompt',
          message: chalk.yellow('Décrivez votre application:'),
          validate: (input) => {
            if (input.length < 10) {
              return 'Le prompt doit faire au moins 10 caractères';
            }
            if (input.length > 5000) {
              return 'Le prompt est trop long (max 5000 caractères)';
            }
            return true;
          }
        },
        {
          type: 'list',
          name: 'complexity',
          message: chalk.yellow('Complexité souhaitée:'),
          choices: [
            { name: '🟢 Simple (5-10 pages)', value: 'simple' },
            { name: '🟡 Moyenne (10-20 pages)', value: 'medium' },
            { name: '🔴 Complexe (20+ pages)', value: 'complex' }
          ]
        },
        {
          type: 'list',
          name: 'framework',
          message: chalk.yellow('Framework préféré:'),
          choices: [
            { name: 'React + TypeScript', value: 'react-ts' },
            { name: 'Next.js', value: 'nextjs' },
            { name: 'Vue.js', value: 'vue' },
            { name: 'Svelte', value: 'svelte' },
            { name: 'Laisser l\'IA choisir', value: 'auto' }
          ]
        },
        {
          type: 'confirm',
          name: 'animations',
          message: chalk.yellow('Inclure animations premium?'),
          default: true
        },
        {
          type: 'confirm',
          name: 'darkMode',
          message: chalk.yellow('Support du mode sombre?'),
          default: true
        }
      ]);
      
      userPrompt = answers.prompt;
      promptConfig = answers;
    } else {
      userPrompt = options.prompt;
    }
    
    console.log(chalk.cyan('\n🚀 Démarrage de la génération...\n'));
    
    const spinner = ora({
      text: 'Initialisation du workflow...',
      spinner: 'dots12'
    }).start();
    
    try {
      const workflow = new PureSonnetWorkflow();
      
      // Enrichir le prompt avec la configuration
      if (Object.keys(promptConfig).length > 0) {
        const enrichedPrompt = `${userPrompt}\n\nConfiguration:\n- Complexité: ${promptConfig.complexity}\n- Framework: ${promptConfig.framework}\n- Animations: ${promptConfig.animations ? 'Oui' : 'Non'}\n- Mode sombre: ${promptConfig.darkMode ? 'Oui' : 'Non'}`;
        userPrompt = enrichedPrompt;
      }
      
      spinner.text = 'Génération de l\'architecture...';
      
      const result = await workflow.generate(userPrompt);
      
      if (result.success) {
        spinner.succeed(chalk.green('✅ Application générée avec succès!'));
        
        console.log(chalk.cyan(`
📊 RÉSULTATS:
📁 Chemin: ${result.path}
⏱️  Durée: ${result.duration}ms
📄 Score: ${result.report?.validation.score || 0}/100
        `));
        
        // Afficher résumé
        if (result.report?.summary) {
          const summary = result.report.summary;
          console.log(chalk.green(`
✅ RÉSUMÉ:
📦 Fichiers générés: ${summary.filesGenerated}
✔️  Fichiers requis: ${summary.requiredFilesPresent}
❌ Erreurs syntaxe: ${summary.syntaxErrors}
          `));
        }
        
        // Proposer actions suivantes
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: chalk.yellow('Que souhaitez-vous faire?'),
            choices: [
              { name: '📝 Ouvrir dans VS Code', value: 'vscode' },
              { name: '📋 Voir le rapport détaillé', value: 'report' },
              { name: '📊 Afficher les statistiques', value: 'stats' },
              { name: '🔄 Générer une autre app', value: 'generate' },
              { name: '🚪 Quitter', value: 'exit' }
            ]
          }
        ]);
        
        await handleAction(action, result.path);
        
      } else {
        spinner.fail(chalk.red('❌ Erreur lors de la génération'));
        const errorMessage = result.error instanceof Error ? result.error.message : 'Erreur inconnue';
        console.error(chalk.red(`Erreur: ${errorMessage}`));
        
        if (result.error && typeof result.error === 'object' && 'details' in result.error) {
          console.log(chalk.yellow('\n📝 Détails:'));
          console.log((result.error as any).details);
        }
      }
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Erreur critique'));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Erreur: ${errorMessage}`));
      console.log(chalk.yellow('\n🔧 Suggestions:'));
      console.log('- Vérifiez votre connexion internet');
      console.log('- Vérifiez votre clé API Anthropic');
      console.log('- Réessayez avec un prompt plus court');
    }
  });

// Commande clean
program
  .command('clean')
  .description('Nettoyer les anciennes générations')
  .option('-d, --days <number>', 'Jours à conserver', '7')
  .option('--dry-run', 'Simuler sans supprimer')
  .action(async (options) => {
    console.log(chalk.blue('🧹 Nettoyage des anciennes générations...'));
    
    try {
      const scriptPath = path.join(__dirname, '../scripts/clean.js');
      const args = ['--days', options.days];
      
      if (options.dryRun) {
        args.push('--dry-run');
      }
      
      const child = spawn('node', [scriptPath, ...args], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Nettoyage terminé'));
        } else {
          console.log(chalk.red('❌ Erreur lors du nettoyage'));
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Erreur: ${errorMessage}`));
    }
  });

// Commande stats
program
  .command('stats')
  .description('Afficher les statistiques')
  .action(async () => {
    console.log(chalk.blue('📊 Chargement des statistiques...'));
    
    try {
      const scriptPath = path.join(__dirname, '../scripts/stats.js');
      
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.red('❌ Erreur lors du chargement des statistiques'));
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Erreur: ${errorMessage}`));
    }
  });

// Commande logs
program
  .command('logs')
  .description('Voir les logs')
  .option('-f, --follow', 'Suivre en temps réel')
  .option('-n, --lines <number>', 'Nombre de lignes', '50')
  .action(async (options) => {
    const logsDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logsDir)) {
      console.log(chalk.yellow('⚠️  Aucun log trouvé'));
      return;
    }
    
    try {
      const logFiles = fs.readdirSync(logsDir)
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse();
      
      if (logFiles.length === 0) {
        console.log(chalk.yellow('⚠️  Aucun fichier de log trouvé'));
        return;
      }
      
      const latestLog = path.join(logsDir, logFiles[0]);
      
      console.log(chalk.cyan(`📋 Logs depuis: ${logFiles[0]}\n`));
      
      if (options.follow) {
        // Mode follow avec tail -f
        const child = spawn('tail', ['-f', latestLog], {
          stdio: 'inherit'
        });
        
        process.on('SIGINT', () => {
          child.kill();
          process.exit(0);
        });
        
      } else {
        // Affichage normal
        const content = fs.readFileSync(latestLog, 'utf-8');
        const lines = content.split('\n');
        const displayLines = lines.slice(-parseInt(options.lines));
        
        displayLines.forEach(line => {
          if (line.includes('ERROR')) {
            console.log(chalk.red(line));
          } else if (line.includes('WARN')) {
            console.log(chalk.yellow(line));
          } else if (line.includes('INFO')) {
            console.log(chalk.green(line));
          } else {
            console.log(line);
          }
        });
      }
      
    } catch (error) {
      console.error(chalk.red(`Erreur lecture logs: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });

// Commande backup
program
  .command('backup')
  .description('Créer une sauvegarde')
  .action(async () => {
    console.log(chalk.blue('📦 Création de la sauvegarde...'));
    
    try {
      const scriptPath = path.join(__dirname, '../scripts/backup.js');
      
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Sauvegarde créée'));
        } else {
          console.log(chalk.red('❌ Erreur lors de la sauvegarde'));
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Erreur: ${errorMessage}`));
    }
  });

async function handleAction(action: string, appPath?: string) {
  switch (action) {
    case 'vscode':
      if (appPath && fs.existsSync(appPath)) {
        console.log(chalk.cyan('📝 Ouverture dans VS Code...'));
        spawn('code', [appPath], { detached: true });
      } else {
        console.log(chalk.red('❌ Chemin d\'application non trouvé'));
      }
      break;
      
    case 'report':
      if (appPath) {
        const reportPath = path.join(appPath, 'GENERATION_REPORT.md');
        if (fs.existsSync(reportPath)) {
          const report = fs.readFileSync(reportPath, 'utf-8');
          console.log(chalk.cyan('\n📋 RAPPORT DÉTAILLÉ:\n'));
          console.log(report);
        } else {
          console.log(chalk.yellow('⚠️  Rapport non trouvé'));
        }
      }
      break;
      
    case 'stats':
      await program.parseAsync(['node', 'cli.js', 'stats']);
      break;
      
    case 'generate':
      await program.parseAsync(['node', 'cli.js', 'generate', '--interactive']);
      break;
      
    case 'exit':
      console.log(chalk.green('👋 Au revoir!'));
      process.exit(0);
      break;
  }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Erreur inattendue:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Promesse rejetée:'), reason);
  process.exit(1);
});

// Si aucune commande n'est fournie, afficher l'aide
if (process.argv.length === 2) {
  program.help();
}

program.parse();