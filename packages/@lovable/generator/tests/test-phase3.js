import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

const workflow = new PureSonnetWorkflow();

console.log('🧪 TEST PHASE 3 - State Management avec app e-commerce...');

const config = {
  userPrompt: "Application e-commerce sneakers avec panier et authentification",
  complexity: "simple", 
  forceConfirm: true
};

try {
  const result = await workflow.generate(config.userPrompt);
  console.log('✅ App générée:', result.path);
  
  // Tests automatiques Phase 3 - Vérification State Management
  const checks = [
    { file: 'contexts/CartContext.tsx', contains: 'CartProvider' },
    { file: 'contexts/AuthContext.tsx', contains: 'AuthProvider' },
    { file: 'components/Providers.tsx', contains: 'CartProvider' },
    { file: 'components/Providers.tsx', contains: 'AuthProvider' },
    { file: 'app/layout.tsx', contains: 'import { Providers }' },
    { file: 'app/layout.tsx', contains: '<Providers>' }
  ];
  
  console.log('\n🔍 Vérifications State Management Phase 3:');
  let passedChecks = 0;
  
  for (const check of checks) {
    const filePath = path.join(result.path, check.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const ok = content.includes(check.contains);
      console.log(`${ok ? '✅' : '❌'} ${check.file}: ${check.contains}`);
      if (ok) passedChecks++;
    } else {
      console.log(`❌ ${check.file}: FICHIER MANQUANT`);
    }
  }
  
  console.log(`\n📊 RÉSULTATS PHASE 3: ${passedChecks}/${checks.length} tests passés`);
  
  if (passedChecks >= 4) {
    console.log('🎉 SUCCÈS: State Management Phase 3 fonctionne !');
  } else {
    console.log('⚠️  ÉCHEC PARTIEL: Quelques problèmes détectés');
  }
  
  // Afficher le contenu des contextes pour vérification
  const cartContextPath = path.join(result.path, 'contexts/CartContext.tsx');
  if (fs.existsSync(cartContextPath)) {
    console.log('\n📋 Aperçu CartContext (50 premières lignes):');
    const cartContent = fs.readFileSync(cartContextPath, 'utf8');
    const lines = cartContent.split('\n').slice(0, 50);
    console.log(lines.join('\n'));
  }
  
  console.log('\n🚀 Vous pouvez maintenant tester avec: npm run dev');
  console.log(`📁 Chemin: ${result.path}`);
  
} catch (error) {
  console.error('❌ Erreur génération:', error.message);
}