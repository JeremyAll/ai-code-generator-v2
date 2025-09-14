const fs = require('fs-extra');
const path = require('path');

async function migrateSmartly() {
  console.log('🔍 ANALYSE DE WEB-INTERFACE...');
  
  // Vérifie si web-interface a du contenu utile
  let keepWebInterface = false;
  const webInterfacePath = 'app-generator/web-interface';
  
  if (await fs.pathExists(webInterfacePath)) {
    const files = await fs.readdir(webInterfacePath);
    const hasUI = files.some(f => 
      f.includes('.html') || 
      f.includes('.jsx') || 
      f.includes('.tsx') ||
      f === 'package.json' ||
      f === 'app' ||
      f === 'components'
    );
    
    if (hasUI) {
      console.log('✅ web-interface contient une UI Next.js → Conservation dans apps/web-legacy/');
      await fs.ensureDir('lovable-clone/apps/web-legacy');
      await fs.move(webInterfacePath, 'lovable-clone/apps/web-legacy', { overwrite: true });
      keepWebInterface = true;
    }
  }
  
  console.log('📦 MIGRATION DU CODE SOURCE...');
  
  // Créer la structure cible
  const generatorPath = 'lovable-clone/packages/@lovable/generator';
  await fs.ensureDir(`${generatorPath}/src`);
  await fs.ensureDir(`${generatorPath}/tests`);
  await fs.ensureDir(`${generatorPath}/scripts`);
  await fs.ensureDir(`${generatorPath}/working`);
  
  // Supprimer l'ancien src s'il existe
  if (await fs.pathExists(`${generatorPath}/src`)) {
    await fs.remove(`${generatorPath}/src`);
  }
  
  console.log('📁 Déplacement de /src vers packages/@lovable/generator/src/...');
  // Déplacer /src
  if (await fs.pathExists('app-generator/src')) {
    await fs.move('app-generator/src', `${generatorPath}/src`, { overwrite: true });
    console.log('✅ /src migré');
  }
  
  console.log('📝 Déplacement des tests...');
  // Déplacer les tests
  const appGenFiles = await fs.readdir('app-generator');
  const testFiles = appGenFiles.filter(f => f.startsWith('test-') && f.endsWith('.js'));
  
  for (const file of testFiles) {
    console.log(`   → Migration de ${file}...`);
    await fs.move(`app-generator/${file}`, `${generatorPath}/tests/${file}`, { overwrite: true });
  }
  console.log(`✅ ${testFiles.length} fichiers de test migrés`);
  
  console.log('🔧 Déplacement de /scripts...');
  // Déplacer scripts
  if (await fs.pathExists('app-generator/scripts')) {
    await fs.move('app-generator/scripts', `${generatorPath}/scripts`, { overwrite: true });
    console.log('✅ Scripts migrés');
  }
  
  console.log('📚 Copie des ressources...');
  // Copier les ressources (ne pas déplacer pour garder l'original)
  if (await fs.pathExists('app-generator/prompts')) {
    await fs.copy('app-generator/prompts', `${generatorPath}/prompts`);
    console.log('✅ Prompts copiés');
  }
  if (await fs.pathExists('app-generator/templates')) {
    await fs.copy('app-generator/templates', `${generatorPath}/templates`);
    console.log('✅ Templates copiés');
  }
  
  console.log('📦 Création du package.json pour @lovable/generator...');
  // Lire le package.json original
  const originalPkg = await fs.readJson('app-generator/package.json');
  
  // Créer le nouveau package.json pour le générateur
  const generatorPackage = {
    name: '@lovable/generator',
    version: '1.0.0',
    type: 'module',
    description: 'AI-powered application generation workflow - Core Engine',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    bin: {
      'lovable-gen': './dist/cli.js',
      'appgen': './dist/cli.js'
    },
    scripts: {
      build: 'tsc',
      start: 'node dist/cli.js',
      dev: 'node dist/cli.js',
      cli: 'node dist/cli.js',
      generate: 'node dist/cli.js generate',
      'clean:old': 'node scripts/clean.js --days=7',
      'clean:all': 'rm -rf working/generated-apps/* working/logs/generations/*',
      backup: 'node scripts/backup.js',
      logs: 'tail -f working/logs/generations/latest.log',
      'logs:errors': 'tail -f working/logs/errors/errors.log',
      reset: 'node scripts/reset.js',
      clean: 'rm -rf dist',
      'type-check': 'tsc --noEmit',
      lint: 'eslint src --ext .ts,.tsx',
      'lint:fix': 'eslint src --ext .ts,.tsx --fix',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage'
    },
    keywords: originalPkg.keywords || ['ai', 'app-generation', 'workflow', 'automation'],
    author: originalPkg.author || '',
    license: originalPkg.license || 'MIT',
    dependencies: originalPkg.dependencies || {},
    devDependencies: {
      '@lovable/tsconfig': 'workspace:*',
      ...originalPkg.devDependencies
    },
    files: [
      'dist',
      'templates',
      'prompts',
      'scripts',
      'README.md'
    ],
    engines: originalPkg.engines || {
      'node': '>=16.0.0'
    }
  };
  
  await fs.writeJson(`${generatorPath}/package.json`, generatorPackage, { spaces: 2 });
  console.log('✅ package.json créé');
  
  // Copier la configuration
  if (await fs.pathExists('app-generator/jest.config.cjs')) {
    await fs.copy('app-generator/jest.config.cjs', `${generatorPath}/jest.config.cjs`);
    console.log('✅ jest.config.cjs copié');
  }
  
  // Créer les dossiers de travail
  const workingDirs = ['generated-apps', 'logs', 'cache', 'sessions'];
  for (const dir of workingDirs) {
    await fs.ensureDir(`${generatorPath}/working/${dir}`);
  }
  console.log('✅ Dossiers de travail créés');
  
  console.log('🗑️  NETTOYAGE...');
  // Nettoyer les dossiers temporaires de l'original (SAUF web-interface si préservée)
  const originalPath = 'app-generator';
  const toDelete = ['cache', 'dist', 'generated-apps', 'logs', 'sessions', 'test', 'tests', 'metrics'];
  if (!keepWebInterface) {
    toDelete.push('web-interface');
  }
  
  for (const dir of toDelete) {
    if (await fs.pathExists(`${originalPath}/${dir}`)) {
      console.log(`   → Suppression de ${originalPath}/${dir}...`);
      await fs.remove(`${originalPath}/${dir}`);
    }
  }
  
  console.log(`
🎉 MIGRATION INTELLIGENTE TERMINÉE !

📊 RÉSULTATS :
${keepWebInterface ? '📁 web-interface → lovable-clone/apps/web-legacy/ (préservée)' : '❌ web-interface supprimée (vide)'}
📁 src → lovable-clone/packages/@lovable/generator/src/ (${await countFiles(`${generatorPath}/src`)} fichiers)
📝 ${testFiles.length} tests → lovable-clone/packages/@lovable/generator/tests/
🔧 scripts → lovable-clone/packages/@lovable/generator/scripts/
📚 prompts & templates → copiés dans le package

🚀 PROCHAINES ÉTAPES :
1. cd lovable-clone
2. pnpm install
3. pnpm --filter @lovable/generator build
4. pnpm --filter @lovable/generator generate --help

✅ Votre générateur est maintenant intégré dans l'architecture moderne !
  `);
}

async function countFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    let count = 0;
    for (const file of files) {
      const stat = await fs.stat(path.join(dir, file));
      if (stat.isFile()) count++;
      else if (stat.isDirectory()) count += await countFiles(path.join(dir, file));
    }
    return count;
  } catch {
    return 0;
  }
}

// Exécution
migrateSmartly().catch(error => {
  console.error('❌ ERREUR DURANT LA MIGRATION:', error);
  process.exit(1);
});