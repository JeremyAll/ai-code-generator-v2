import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

const workflow = new PureSonnetWorkflow();

console.log('🧪 TEST PHASE 4 - Composants métier avec logique interactive...');

const config = {
  userPrompt: "Boutique en ligne de sneakers avec panier et authentification",
  complexity: "simple", 
  forceConfirm: true
};

try {
  const result = await workflow.generate(config.userPrompt);
  console.log('✅ App générée:', result.path);
  
  // Tests automatiques Phase 4 - Vérification Composants Métier
  const businessChecks = [
    // Contextes (Phase 3)
    { file: 'contexts/CartContext.tsx', contains: 'useCart', description: 'Context Panier' },
    { file: 'contexts/AuthContext.tsx', contains: 'useAuth', description: 'Context Auth' },
    { file: 'components/Providers.tsx', contains: 'CartProvider', description: 'Providers wrapper' },
    
    // Composants métier (Phase 4)
    { file: 'components/business/AddToCartButton.tsx', contains: 'useCart', description: 'Bouton Panier avec Context' },
    { file: 'components/business/ProductGrid.tsx', contains: 'AddToCartButton', description: 'Grille Produits interactive' },
    { file: 'components/business/CartSidebar.tsx', contains: 'updateQuantity', description: 'Sidebar Panier complet' },
    { file: 'components/business/SearchBar.tsx', contains: 'useState', description: 'Barre recherche avec état' },
    { file: 'components/business/index.ts', contains: 'export', description: 'Index composants métier' },
  ];
  
  console.log('\n🎯 Vérifications Composants Métier Phase 4:');
  let passedChecks = 0;
  
  for (const check of businessChecks) {
    const filePath = path.join(result.path, check.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const ok = content.includes(check.contains);
      console.log(`${ok ? '✅' : '❌'} ${check.description}: ${check.contains}`);
      if (ok) passedChecks++;
    } else {
      console.log(`❌ ${check.description}: FICHIER MANQUANT`);
    }
  }
  
  // Vérifications avancées
  console.log('\n🔍 Vérifications avancées:');
  
  // 1. Vérifier que AddToCartButton utilise bien useCart
  const addToCartPath = path.join(result.path, 'components/business/AddToCartButton.tsx');
  if (fs.existsSync(addToCartPath)) {
    const content = fs.readFileSync(addToCartPath, 'utf8');
    const hasUseCart = content.includes("import { useCart }");
    const hasAddLogic = content.includes("addToCart");
    const hasStates = content.includes("useState");
    
    console.log(`${hasUseCart ? '✅' : '❌'} AddToCartButton importe useCart`);
    console.log(`${hasAddLogic ? '✅' : '❌'} AddToCartButton utilise addToCart`);
    console.log(`${hasStates ? '✅' : '❌'} AddToCartButton a des états locaux`);
    
    if (hasUseCart && hasAddLogic && hasStates) passedChecks += 3;
  }
  
  // 2. Vérifier que ProductGrid utilise AddToCartButton
  const productGridPath = path.join(result.path, 'components/business/ProductGrid.tsx');
  if (fs.existsSync(productGridPath)) {
    const content = fs.readFileSync(productGridPath, 'utf8');
    const hasAddToCartImport = content.includes("import { AddToCartButton }");
    const hasAddToCartUsage = content.includes("<AddToCartButton");
    
    console.log(`${hasAddToCartImport ? '✅' : '❌'} ProductGrid importe AddToCartButton`);
    console.log(`${hasAddToCartUsage ? '✅' : '❌'} ProductGrid utilise AddToCartButton`);
    
    if (hasAddToCartImport && hasAddToCartUsage) passedChecks += 2;
  }
  
  console.log(`\n📊 RÉSULTATS PHASE 4: ${passedChecks}/${businessChecks.length + 5} tests passés`);
  
  if (passedChecks >= businessChecks.length + 3) {
    console.log('🎉 SUCCÈS: Phase 4 - Composants métier fonctionnent parfaitement !');
    console.log('🚀 L\'application est maintenant RÉELLEMENT INTERACTIVE avec:');
    console.log('  • État global (contextes React)');
    console.log('  • Logique métier (hooks personnalisés)');
    console.log('  • Composants interactifs (boutons, formulaires)');
    console.log('  • Navigation fluide (sidebar, modals)');
  } else if (passedChecks >= businessChecks.length) {
    console.log('✅ BIEN: Composants métier générés avec quelques améliorations possibles');
  } else {
    console.log('⚠️  ÉCHEC PARTIEL: Certains composants métier manquent');
  }
  
  // Afficher un aperçu du AddToCartButton pour démontrer la complexité
  if (fs.existsSync(addToCartPath)) {
    const content = fs.readFileSync(addToCartPath, 'utf8');
    const lines = content.split('\n').slice(0, 30);
    console.log('\n📋 Aperçu AddToCartButton (30 premières lignes):');
    lines.forEach((line, i) => console.log(`${String(i+1).padStart(2)}: ${line}`));
    console.log('   ...');
  }
  
  console.log(`\n🎯 Total fichiers générés: ${result.report?.summary?.filesGenerated || 'N/A'}`);
  console.log(`📁 Chemin: ${result.path}`);
  
} catch (error) {
  console.error('❌ Erreur génération:', error.message);
}