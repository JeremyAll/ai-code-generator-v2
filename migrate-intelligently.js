import fs from 'fs-extra';
import path from 'path';

async function migrateIntelligently() {
  console.log('🧠 Migration intelligente - Préservation du code existant\n');
  
  // 1. Backup complet dans _backup
  console.log('📦 Sauvegarde complète du code...');
  await fs.ensureDir('_backup');
  
  const criticalFolders = [
    'src',           // TOUT le code source
    'prompts',       // Prompts existants
    'templates',     // Templates existants
    'scripts',       // Scripts utilitaires
    'web-interface', // Interface existante
    'test-*.js'      // Tests existants
  ];
  
  for (const item of criticalFolders) {
    if (item.includes('*')) {
      const files = (await fs.readdir('.')).filter(f => f.startsWith('test-'));
      for (const file of files) {
        if (await fs.pathExists(file)) {
          await fs.copy(file, `_backup/${file}`);
        }
      }
    } else if (await fs.pathExists(item)) {
      await fs.copy(item, `_backup/${item}`);
      console.log(`  ✅ ${item}/ sauvegardé`);
    }
  }
  
  // Sauvegarder fichiers config importants
  const configFiles = ['package.json', '.env', '.env.example', 'tsconfig.json'];
  for (const file of configFiles) {
    if (await fs.pathExists(file)) {
      await fs.copy(file, `_backup/${file}`);
    }
  }
  
  // 2. Créer structure monorepo SANS supprimer
  console.log('\n📁 Création structure monorepo...');
  
  const structure = [
    'apps/web',
    'apps/api',
    'apps/sandbox-service',
    'apps/realtime',
    'apps/web-legacy',  // Pour web-interface
    'packages/@lovable/generator',  // Code principal ICI
    'packages/@lovable/ai-agents',
    'packages/@lovable/database',
    'packages/@lovable/ui',
    'packages/@lovable/editor',
    'packages/@lovable/sandbox',
    'packages/@lovable/templates',
    'packages/@lovable/analytics',
    'packages/@lovable/tsconfig',
    'templates/saas',
    'templates/landing',
    'templates/dashboard',
    'templates/ecommerce',
    'templates/blog',
    'infrastructure/docker',
    'infrastructure/k8s',
    'infrastructure/terraform'
  ];
  
  for (const dir of structure) {
    await fs.ensureDir(dir);
  }
  
  // 3. Migration intelligente du code
  console.log('\n🚀 Migration du code vers les bons emplacements...');
  
  const GENERATOR_DEST = 'packages/@lovable/generator';
  
  // Migrer src complet (workflows, prompts, services, utils)
  if (await fs.pathExists('_backup/src')) {
    await fs.copy('_backup/src', `${GENERATOR_DEST}/src`);
    console.log('  ✅ src/ → packages/@lovable/generator/src/');
  }
  
  // Migrer prompts additionnels
  if (await fs.pathExists('_backup/prompts')) {
    await fs.copy('_backup/prompts', `${GENERATOR_DEST}/prompts`);
    console.log('  ✅ prompts/ → packages/@lovable/generator/prompts/');
  }
  
  // Migrer templates
  if (await fs.pathExists('_backup/templates')) {
    await fs.copy('_backup/templates', `${GENERATOR_DEST}/templates`);
    console.log('  ✅ templates/ → packages/@lovable/generator/templates/');
  }
  
  // Migrer scripts
  if (await fs.pathExists('_backup/scripts')) {
    await fs.copy('_backup/scripts', `${GENERATOR_DEST}/scripts`);
    console.log('  ✅ scripts/ → packages/@lovable/generator/scripts/');
  }
  
  // Migrer tests
  await fs.ensureDir(`${GENERATOR_DEST}/tests`);
  const testFiles = (await fs.readdir('_backup')).filter(f => f.startsWith('test-'));
  for (const test of testFiles) {
    if (await fs.pathExists(`_backup/${test}`)) {
      await fs.copy(`_backup/${test}`, `${GENERATOR_DEST}/tests/${test}`);
    }
  }
  if (testFiles.length > 0) {
    console.log(`  ✅ ${testFiles.length} tests → packages/@lovable/generator/tests/`);
  }
  
  // Migrer web-interface
  if (await fs.pathExists('_backup/web-interface')) {
    await fs.copy('_backup/web-interface', 'apps/web-legacy');
    console.log('  ✅ web-interface/ → apps/web-legacy/');
  }
  
  // 4. Créer les fichiers de config monorepo
  console.log('\n⚙️ Configuration monorepo...');
  
  // Récupérer l'ancien package.json pour les dépendances
  const oldPkg = await fs.readJson('_backup/package.json');
  
  // package.json racine
  await fs.writeJson('package.json', {
    name: 'lovable-clone',
    private: true,
    workspaces: ["apps/*", "packages/*"],
    scripts: {
      dev: "turbo run dev",
      build: "turbo run build",
      test: "turbo run test",
      generate: "pnpm --filter @lovable/generator generate",
      "workflow:test": "pnpm --filter @lovable/generator test:workflow"
    },
    devDependencies: {
      "turbo": "latest",
      "typescript": "^5.0.0"
    },
    packageManager: "pnpm@9.0.0"
  }, { spaces: 2 });
  
  // package.json pour @lovable/generator avec TOUTES les dépendances
  await fs.writeJson(`${GENERATOR_DEST}/package.json`, {
    name: '@lovable/generator',
    version: '1.0.0',
    type: 'module',
    main: 'src/index.js',
    scripts: {
      generate: 'node src/cli.js generate',
      dev: 'node src/workflows/pure-sonnet.js',
      "test:workflow": 'node tests/test-workflow-critical.js',
      clean: 'node scripts/clean.js'
    },
    dependencies: oldPkg.dependencies || {},
    devDependencies: oldPkg.devDependencies || {}
  }, { spaces: 2 });
  
  // Autres fichiers de config
  await fs.writeJson('turbo.json', {
    "$schema": "https://turbo.build/schema.json",
    pipeline: {
      build: { dependsOn: ["^build"], outputs: ["dist/**", ".next/**"] },
      dev: { cache: false, persistent: true },
      test: { dependsOn: ["build"] }
    }
  }, { spaces: 2 });
  
  await fs.writeFile('pnpm-workspace.yaml', 'packages:\n  - "apps/*"\n  - "packages/*"');
  
  // Copier .env
  if (await fs.pathExists('_backup/.env')) {
    await fs.copy('_backup/.env', '.env');
  }
  
  // 5. Nettoyer les anciens dossiers (mais garder _backup pour sécurité)
  console.log('\n🧹 Nettoyage...');
  const toRemove = ['src', 'prompts', 'templates', 'scripts', 'web-interface'];
  for (const dir of toRemove) {
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
  }
  
  // Supprimer les test-*.js de la racine
  for (const test of testFiles) {
    if (await fs.pathExists(test)) {
      await fs.remove(test);
    }
  }
  
  console.log('\n✅ MIGRATION INTELLIGENTE COMPLÈTE !');
  console.log('\n📊 Résumé :');
  console.log('  • Code source préservé → packages/@lovable/generator/');
  console.log('  • Workflows intacts → pure-sonnet.ts gardé');
  console.log('  • Prompts conservés → step1-architect, step2-developer');
  console.log('  • Web interface → apps/web-legacy/');
  console.log('  • Backup complet → _backup/ (à supprimer après vérification)');
  
  console.log('\n🚀 Prochaines commandes :');
  console.log('1. npm install -g pnpm');
  console.log('2. pnpm install');
  console.log('3. pnpm generate (pour tester)');
  console.log('4. rm -rf _backup (après vérification)');
}

migrateIntelligently().catch(console.error);