#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

function generateTimestamp() {
  const now = new Date();
  return now.getFullYear() + '-' + 
         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
         String(now.getDate()).padStart(2, '0') + '_' + 
         String(now.getHours()).padStart(2, '0') + '-' + 
         String(now.getMinutes()).padStart(2, '0') + '-' + 
         String(now.getSeconds()).padStart(2, '0');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    output: './backups',
    include: ['generated-apps', 'logs', 'prompts'],
    exclude: ['.gitkeep'],
    compress: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--include':
        options.include = args[++i].split(',');
        break;
      case '--exclude':
        options.exclude = args[++i].split(',');
        break;
      case '--compress':
      case '-c':
        options.compress = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node backup.js [options]

Options:
  --output, -o <path>     Backup output directory (default: ./backups)
  --include <dirs>        Comma-separated directories to include (default: generated-apps,logs,prompts)
  --exclude <files>       Comma-separated files/patterns to exclude (default: .gitkeep)
  --compress, -c          Compress backup (requires tar)
  --verbose, -v           Show detailed output
  --help, -h              Show this help message

Examples:
  node backup.js                                    # Basic backup
  node backup.js --output ./my-backups             # Custom output directory
  node backup.js --include generated-apps,logs     # Only backup specific directories
  node backup.js --compress --verbose              # Compressed backup with verbose output
        `);
        process.exit(0);
    }
  }

  return options;
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

async function copyWithExclusions(srcDir, destDir, exclude, verbose) {
  if (!(await fs.pathExists(srcDir))) {
    if (verbose) console.log(chalk.yellow(`Source directory not found: ${srcDir}`));
    return 0;
  }

  await fs.ensureDir(destDir);
  const items = await fs.readdir(srcDir);
  let copiedSize = 0;
  
  for (const item of items) {
    if (exclude.includes(item)) {
      if (verbose) console.log(chalk.gray(`Excluding: ${item}`));
      continue;
    }
    
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    
    const stats = await fs.stat(srcPath);
    
    if (stats.isDirectory()) {
      copiedSize += await copyWithExclusions(srcPath, destPath, exclude, verbose);
    } else {
      await fs.copy(srcPath, destPath);
      copiedSize += stats.size;
      if (verbose) console.log(chalk.green(`Copied: ${srcPath} -> ${destPath}`));
    }
  }
  
  return copiedSize;
}

async function createBackupManifest(backupDir, options) {
  const manifest = {
    timestamp: generateTimestamp(),
    created_at: new Date().toISOString(),
    backup_type: 'app-generator-workflow',
    version: '1.0',
    options: {
      included_directories: options.include,
      excluded_patterns: options.exclude,
      compressed: options.compress
    },
    contents: []
  };

  for (const dir of options.include) {
    const dirPath = path.join(backupDir, dir);
    if (await fs.pathExists(dirPath)) {
      const size = await getDirectorySize(dirPath);
      manifest.contents.push({
        directory: dir,
        size_bytes: size,
        size_formatted: formatFileSize(size)
      });
    }
  }

  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

async function compressBackup(backupDir, verbose) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  const tarFile = `${backupDir}.tar.gz`;
  const command = `tar -czf "${tarFile}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`;
  
  try {
    if (verbose) console.log(chalk.blue(`Compressing: ${command}`));
    await execAsync(command);
    
    // Remove original directory after successful compression
    await fs.remove(backupDir);
    
    return tarFile;
  } catch (error) {
    console.error(chalk.red('Compression failed:'), error.message);
    return backupDir;
  }
}

async function main() {
  try {
    const options = parseArgs();
    const timestamp = generateTimestamp();
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(options.output, backupName);
    
    console.log(chalk.blue(`📦 Creating backup: ${backupName}`));
    if (options.verbose) {
      console.log(chalk.gray(`Output: ${backupPath}`));
      console.log(chalk.gray(`Including: ${options.include.join(', ')}`));
      console.log(chalk.gray(`Excluding: ${options.exclude.join(', ')}\n`));
    }
    
    await fs.ensureDir(options.output);
    await fs.ensureDir(backupPath);
    
    let totalSize = 0;
    const startTime = Date.now();
    
    // Copy each included directory
    for (const dir of options.include) {
      console.log(chalk.blue(`Backing up ${dir}...`));
      const srcPath = `./${dir}`;
      const destPath = path.join(backupPath, dir);
      
      const copiedSize = await copyWithExclusions(srcPath, destPath, options.exclude, options.verbose);
      totalSize += copiedSize;
      
      console.log(chalk.green(`✓ ${dir} (${formatFileSize(copiedSize)})`));
    }
    
    // Create backup manifest
    console.log(chalk.blue('Creating backup manifest...'));
    const manifestPath = await createBackupManifest(backupPath, options);
    if (options.verbose) console.log(chalk.green(`✓ Manifest created: ${manifestPath}`));
    
    const duration = Date.now() - startTime;
    let finalPath = backupPath;
    
    // Compress if requested
    if (options.compress) {
      console.log(chalk.blue('Compressing backup...'));
      finalPath = await compressBackup(backupPath, options.verbose);
      const compressedSize = await fs.stat(finalPath).then(stats => stats.size);
      const compressionRatio = ((totalSize - compressedSize) / totalSize * 100).toFixed(1);
      console.log(chalk.green(`✓ Compressed (${compressionRatio}% reduction)`));
    }
    
    console.log(chalk.green(`\n✅ Backup completed in ${(duration / 1000).toFixed(1)}s`));
    console.log(chalk.white(`📁 Location: ${finalPath}`));
    console.log(chalk.white(`💾 Total size: ${formatFileSize(totalSize)}`));
    
    if (options.verbose) {
      const backupSize = await fs.stat(finalPath).then(stats => stats.size);
      console.log(chalk.gray(`📦 Final backup size: ${formatFileSize(backupSize)}`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Backup failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}