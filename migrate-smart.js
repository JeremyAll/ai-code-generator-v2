import fs from 'fs-extra';
import path from 'path';

async function migrateSmartly() {
  console.log('🔍 Analyse de web-interface/...');
  
  // Vérifie si web-interface a du contenu utile
  let keepWebInterface = false;
  if (await fs.pathExists('web-interface')) {
    const files = await fs.readdir('web-interface');
    const hasUI = files.some(f => 
      f.includes('.html') || 
      f.includes('.jsx') || 
      f.includes('.tsx') ||
      f === 'package.json'
    );
    
    if (hasUI) {
      console.log('✅ web-interface contient une UI → Conservation dans apps/web-legacy/');
      await fs.ensureDir('apps/web-legacy');
      await fs.move('web-interface', 'apps/web-legacy', { overwrite: true });
      keepWebInterface = true;
    } else {
      console.log('❌ web-interface vide → Suppression');
    }
  }
  
  // Migration du reste
  console.log('📦 Migration du code source...');
  
  // Créer la structure
  await fs.ensureDir('packages/@lovable/generator/src');
  await fs.ensureDir('packages/@lovable/generator/tests');
  await fs.ensureDir('packages/@lovable/generator/scripts');
  
  // Déplacer /src
  if (await fs.pathExists('src')) {
    console.log('📁 Migration src/ → packages/@lovable/generator/src/');
    await fs.move('src', 'packages/@lovable/generator/src', { overwrite: true });
  }
  
  // Déplacer les tests individuels
  const testFiles = (await fs.readdir('.')).filter(f => f.startsWith('test-') && f.endsWith('.js'));
  if (testFiles.length > 0) {
    console.log(`📁 Migration ${testFiles.length} fichiers de test → packages/@lovable/generator/tests/`);
    for (const file of testFiles) {
      await fs.move(file, `packages/@lovable/generator/tests/${file}`, { overwrite: true });
    }
  }
  
  // Déplacer dossier /tests ou /test
  if (await fs.pathExists('tests')) {
    console.log('📁 Migration tests/ → packages/@lovable/generator/tests/');
    const testDir = await fs.readdir('tests');
    for (const file of testDir) {
      await fs.move(`tests/${file}`, `packages/@lovable/generator/tests/${file}`, { overwrite: true });
    }
    await fs.remove('tests');
  } else if (await fs.pathExists('test')) {
    console.log('📁 Migration test/ → packages/@lovable/generator/tests/');
    const testDir = await fs.readdir('test');
    for (const file of testDir) {
      await fs.move(`test/${file}`, `packages/@lovable/generator/tests/${file}`, { overwrite: true });
    }
    await fs.remove('test');
  }
  
  // Déplacer scripts
  if (await fs.pathExists('scripts')) {
    console.log('📁 Migration scripts/ → packages/@lovable/generator/scripts/');
    await fs.move('scripts', 'packages/@lovable/generator/scripts', { overwrite: true });
  }
  
  // Copier les ressources (ne pas déplacer pour éviter de casser)
  if (await fs.pathExists('prompts')) {
    console.log('📁 Copie prompts/ → packages/@lovable/generator/prompts/');
    await fs.copy('prompts', 'packages/@lovable/generator/prompts');
  }
  if (await fs.pathExists('templates')) {
    console.log('📁 Copie templates/ → packages/@lovable/generator/templates/');
    await fs.copy('templates', 'packages/@lovable/generator/templates');
  }
  
  // Créer package.json pour le générateur
  console.log('📄 Création du package.json pour @lovable/generator');
  const rootPkg = await fs.readJson('package.json');
  await fs.writeJson('packages/@lovable/generator/package.json', {
    name: '@lovable/generator',
    version: '1.0.0',
    description: 'Générateur d\'applications IA Lovable',
    type: 'module',
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      test: 'node tests/test-complete-workflow.js',
      dev: 'nodemon src/index.js'
    },
    dependencies: rootPkg.dependencies || {},
    devDependencies: rootPkg.devDependencies || {},
    keywords: ['ai', 'generator', 'lovable', 'react', 'nextjs'],
    author: 'Lovable Team',
    license: 'MIT'
  }, { spaces: 2 });
  
  // Nettoyer les dossiers temporaires SAUF web-interface si elle a été préservée
  console.log('🧹 Nettoyage des dossiers temporaires...');
  const toDelete = [
    'cache', 
    'dist', 
    'generated-apps', 
    'logs', 
    'sessions',
    'metrics',
    '.turbo'
  ];
  if (!keepWebInterface) {
    toDelete.push('web-interface');
  }
  
  for (const dir of toDelete) {
    if (await fs.pathExists(dir)) {
      console.log(`🗑️  Suppression ${dir}/`);
      await fs.remove(dir);
    }
  }
  
  // Nettoyer les fichiers de test à la racine (maintenant dans packages)
  const rootTestFiles = [
    'test_output.log',
    'audit-pre-phase5.js',
    'jest.config.cjs'
  ];
  
  for (const file of rootTestFiles) {
    if (await fs.pathExists(file)) {
      console.log(`🗑️  Suppression ${file}`);
      await fs.remove(file);
    }
  }
  
  console.log(`
✅ Migration intelligente terminée !

📊 RÉSULTAT:
${keepWebInterface ? '📁 web-interface → apps/web-legacy/ (UI Next.js préservée)' : '❌ web-interface supprimée (vide)'}
📁 src → packages/@lovable/generator/src/
📁 tests → packages/@lovable/generator/tests/ (${testFiles.length} fichiers)
📁 scripts → packages/@lovable/generator/scripts/
📁 prompts → packages/@lovable/generator/prompts/ (copiés)
📁 templates → packages/@lovable/generator/templates/ (copiés)

🎯 PROCHAINE ÉTAPE: 
   cd packages/@lovable/generator && npm install
  `);
}

migrateSmartly().catch(console.error);