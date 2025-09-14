#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    force: false,
    backup: true,
    verbose: false,
    resetLogs: true,
    resetApps: true,
    resetPrompts: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--no-backup':
        options.backup = false;
        break;
      case '--no-logs':
        options.resetLogs = false;
        break;
      case '--no-apps':
        options.resetApps = false;
        break;
      case '--reset-prompts':
        options.resetPrompts = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node reset.js [options]

Options:
  --force, -f            Skip confirmation prompt
  --no-backup           Don't create backup before reset
  --no-logs             Don't reset log files
  --no-apps             Don't reset generated applications
  --reset-prompts       Also reset prompt history
  --verbose, -v         Show detailed output
  --help, -h            Show this help message

Examples:
  node reset.js                     # Interactive reset with backup
  node reset.js --force             # Force reset without confirmation
  node reset.js --no-backup --force # Quick reset without backup
  node reset.js --reset-prompts -v  # Reset everything including prompts
        `);
        process.exit(0);
    }
  }

  return options;
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getDirectorySize(dirPath) {
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
      totalSize += await getDirectorySize(itemPath);
    }
  }
  
  return totalSize;
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

async function countDirectoryContents(dirPath) {
  if (!(await fs.pathExists(dirPath))) {
    return 0;
  }

  const items = await fs.readdir(dirPath);
  return items.filter(item => item !== '.gitkeep').length;
}

async function createPreResetBackup(verbose) {
  console.log(chalk.blue('Creating pre-reset backup...'));
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const backup = spawn('node', ['scripts/backup.js'], { stdio: 'inherit' });
    
    backup.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Backup process exited with code ${code}`));
      }
    });
    
    backup.on('error', reject);
  });
}

async function resetDirectory(dirPath, keepGitkeep = true, verbose = false) {
  if (!(await fs.pathExists(dirPath))) {
    if (verbose) console.log(chalk.yellow(`Directory not found: ${dirPath}`));
    return { deleted: 0, size: 0 };
  }

  const items = await fs.readdir(dirPath);
  let deletedCount = 0;
  let deletedSize = 0;

  for (const item of items) {
    if (keepGitkeep && item === '.gitkeep') continue;
    
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);
    
    if (stats.isFile()) {
      deletedSize += stats.size;
    } else if (stats.isDirectory()) {
      deletedSize += await getDirectorySize(itemPath);
    }
    
    await fs.remove(itemPath);
    deletedCount++;
    
    if (verbose) {
      console.log(chalk.red(`Deleted: ${itemPath}`));
    }
  }

  return { deleted: deletedCount, size: deletedSize };
}

async function main() {
  try {
    const options = parseArgs();
    
    console.log(chalk.red('🗑️  Reset App Generator Workspace'));
    console.log(chalk.yellow('⚠️  This will permanently delete generated content!\n'));
    
    // Show what will be reset
    const toReset = [];
    if (options.resetApps) toReset.push('Generated applications');
    if (options.resetLogs) toReset.push('Log files');
    if (options.resetPrompts) toReset.push('Prompt history');
    
    console.log(chalk.white('Will reset:'));
    toReset.forEach(item => console.log(chalk.gray(`  - ${item}`)));
    
    if (options.backup) {
      console.log(chalk.blue('\n📦 Backup will be created before reset'));
    } else {
      console.log(chalk.red('\n⚠️  No backup will be created'));
    }
    
    // Show current workspace status
    const appsDir = './generated-apps';
    const logsDir = './logs';
    const promptsDir = './prompts/history';
    
    const appsCount = await countDirectoryContents(appsDir);
    const logsCount = await countDirectoryContents(path.join(logsDir, 'generations'));
    const promptsCount = await countDirectoryContents(promptsDir);
    
    const appsSize = await getDirectorySize(appsDir);
    const logsSize = await getDirectorySize(logsDir);
    const promptsSize = await getDirectorySize(promptsDir);
    const totalSize = appsSize + logsSize + promptsSize;
    
    console.log(chalk.white('\nCurrent workspace:'));
    console.log(chalk.gray(`  📁 Generated apps: ${appsCount} items (${formatFileSize(appsSize)})`));
    console.log(chalk.gray(`  📄 Log files: ${logsCount} items (${formatFileSize(logsSize)})`));
    console.log(chalk.gray(`  📝 Prompt history: ${promptsCount} items (${formatFileSize(promptsSize)})`));
    console.log(chalk.gray(`  💾 Total size: ${formatFileSize(totalSize)}`));
    
    // Confirmation
    if (!options.force) {
      console.log();
      const answer = await askQuestion(chalk.red('Are you sure you want to continue? (yes/no): '));
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log(chalk.green('Reset cancelled.'));
        process.exit(0);
      }
    }
    
    console.log();
    const startTime = Date.now();
    
    // Create backup if requested
    if (options.backup && totalSize > 0) {
      try {
        await createPreResetBackup(options.verbose);
        console.log(chalk.green('✓ Backup created\n'));
      } catch (error) {
        console.error(chalk.red('❌ Backup failed:'), error.message);
        
        if (!options.force) {
          const continueAnswer = await askQuestion(chalk.yellow('Continue without backup? (yes/no): '));
          if (continueAnswer.toLowerCase() !== 'yes' && continueAnswer.toLowerCase() !== 'y') {
            console.log(chalk.green('Reset cancelled.'));
            process.exit(0);
          }
        }
      }
    }
    
    let totalDeleted = 0;
    let totalDeletedSize = 0;
    
    // Reset generated applications
    if (options.resetApps) {
      console.log(chalk.blue('Resetting generated applications...'));
      const result = await resetDirectory(appsDir, true, options.verbose);
      totalDeleted += result.deleted;
      totalDeletedSize += result.size;
      console.log(chalk.green(`✓ Deleted ${result.deleted} applications (${formatFileSize(result.size)})`));
    }
    
    // Reset logs
    if (options.resetLogs) {
      console.log(chalk.blue('Resetting log files...'));
      const generationsResult = await resetDirectory(path.join(logsDir, 'generations'), true, options.verbose);
      const errorsResult = await resetDirectory(path.join(logsDir, 'errors'), true, options.verbose);
      
      const logsDeleted = generationsResult.deleted + errorsResult.deleted;
      const logsSize = generationsResult.size + errorsResult.size;
      
      totalDeleted += logsDeleted;
      totalDeletedSize += logsSize;
      console.log(chalk.green(`✓ Deleted ${logsDeleted} log files (${formatFileSize(logsSize)})`));
    }
    
    // Reset prompt history
    if (options.resetPrompts) {
      console.log(chalk.blue('Resetting prompt history...'));
      const result = await resetDirectory(promptsDir, true, options.verbose);
      totalDeleted += result.deleted;
      totalDeletedSize += result.size;
      console.log(chalk.green(`✓ Deleted ${result.deleted} prompt history files (${formatFileSize(result.size)})`));
    }
    
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`\n✅ Reset completed in ${(duration / 1000).toFixed(1)}s`));
    console.log(chalk.white(`🗑️  Total items deleted: ${totalDeleted}`));
    console.log(chalk.white(`💾 Space freed: ${formatFileSize(totalDeletedSize)}`));
    console.log(chalk.gray('\nWorkspace is now clean and ready for new generations.'));
    
  } catch (error) {
    console.error(chalk.red('❌ Reset failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}