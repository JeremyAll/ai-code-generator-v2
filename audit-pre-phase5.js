import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

console.log('🔍 AUDIT PRÉ-PHASE 5 - Vérification complète phases 1-4...\n');

async function testDomain(prompt, expectedDomain, description) {
  console.log(`📋 TEST: ${description}`);
  
  try {
    const workflow = new PureSonnetWorkflow();
    const result = await workflow.generate(prompt);
    
    if (!result.success) {
      console.log(`❌ ÉCHEC: ${description} - ${result.error?.message || 'Erreur inconnue'}`);
      return { success: false, error: result.error };
    }
    
    // Vérifications de base
    const checks = {
      'package.json': fs.existsSync(path.join(result.path, 'package.json')),
      'app/layout.tsx': fs.existsSync(path.join(result.path, 'app/layout.tsx')),
      'app/globals.css': fs.existsSync(path.join(result.path, 'app/globals.css')),
      'tailwind.config.js': fs.existsSync(path.join(result.path, 'tailwind.config.js')),
      'postcss.config.js': fs.existsSync(path.join(result.path, 'postcss.config.js')),
      'README.md': fs.existsSync(path.join(result.path, 'README.md')),
    };
    
    const basicScore = Object.values(checks).filter(Boolean).length;
    
    // Vérifications contextes si domaine supporté
    let contextScore = 0;
    let businessScore = 0;
    
    if (expectedDomain === 'ecommerce') {
      const contextChecks = {
        'contexts/CartContext.tsx': fs.existsSync(path.join(result.path, 'contexts/CartContext.tsx')),
        'contexts/AuthContext.tsx': fs.existsSync(path.join(result.path, 'contexts/AuthContext.tsx')),
        'components/Providers.tsx': fs.existsSync(path.join(result.path, 'components/Providers.tsx')),
      };
      
      const businessChecks = {
        'components/business/AddToCartButton.tsx': fs.existsSync(path.join(result.path, 'components/business/AddToCartButton.tsx')),
        'components/business/ProductGrid.tsx': fs.existsSync(path.join(result.path, 'components/business/ProductGrid.tsx')),
        'components/business/CartSidebar.tsx': fs.existsSync(path.join(result.path, 'components/business/CartSidebar.tsx')),
        'components/business/index.ts': fs.existsSync(path.join(result.path, 'components/business/index.ts')),
      };
      
      contextScore = Object.values(contextChecks).filter(Boolean).length;
      businessScore = Object.values(businessChecks).filter(Boolean).length;
    }
    
    const totalScore = basicScore + contextScore + businessScore;
    const maxScore = 6 + (expectedDomain === 'ecommerce' ? 7 : 0);
    
    console.log(`✅ SUCCÈS: ${description}`);
    console.log(`   📊 Score: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%)`);
    console.log(`   📁 Fichiers: ${result.report?.summary?.filesGenerated || 'N/A'}`);
    console.log(`   ⏱️  Durée: ${Math.round(result.duration/1000)}s`);
    
    return { 
      success: true, 
      score: totalScore, 
      maxScore, 
      files: result.report?.summary?.filesGenerated || 0,
      duration: result.duration 
    };
    
  } catch (error) {
    console.log(`❌ ERREUR: ${description} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAudit() {
  console.log('🚀 Démarrage audit multi-domaines...\n');
  
  const tests = [
    {
      prompt: "Boutique e-commerce de sneakers avec panier",
      expectedDomain: "ecommerce", 
      description: "E-commerce (domaine principal)"
    },
    {
      prompt: "Site vitrine pour agence de design avec portfolio",
      expectedDomain: "portfolio",
      description: "Portfolio/Vitrine (domaine secondaire)"
    },
    {
      prompt: "Dashboard SaaS analytics avec métriques",
      expectedDomain: "saas",
      description: "SaaS (domaine tertiaire)"
    }
  ];
  
  const results = [];
  let totalErrors = 0;
  
  for (const test of tests) {
    const result = await testDomain(test.prompt, test.expectedDomain, test.description);
    results.push({ ...test, result });
    
    if (!result.success) {
      totalErrors++;
    }
    
    console.log(''); // Ligne vide entre tests
    
    // Délai entre tests pour éviter le rate limiting
    if (tests.indexOf(test) < tests.length - 1) {
      console.log('⏱️  Pause 10s avant test suivant...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Rapport final
  console.log('=' .repeat(60));
  console.log('📊 RAPPORT FINAL AUDIT PRÉ-PHASE 5');
  console.log('=' .repeat(60));
  
  results.forEach((test, i) => {
    const status = test.result.success ? '✅' : '❌';
    const score = test.result.success ? 
      `${test.result.score}/${test.result.maxScore} (${Math.round(test.result.score/test.result.maxScore*100)}%)` : 
      'ÉCHEC';
    
    console.log(`${i+1}. ${status} ${test.description}: ${score}`);
    
    if (test.result.success) {
      console.log(`   📁 ${test.result.files} fichiers | ⏱️ ${Math.round(test.result.duration/1000)}s`);
    } else {
      console.log(`   ❌ ${test.result.error}`);
    }
  });
  
  console.log(`\n📈 RÉSULTATS GLOBAUX:`);
  console.log(`   ✅ Tests réussis: ${results.filter(r => r.result.success).length}/${results.length}`);
  console.log(`   ❌ Tests échoués: ${totalErrors}/${results.length}`);
  
  const avgScore = results
    .filter(r => r.result.success)
    .reduce((acc, r) => acc + (r.result.score / r.result.maxScore), 0) / results.filter(r => r.result.success).length;
  
  if (results.filter(r => r.result.success).length > 0) {
    console.log(`   📊 Score moyen: ${Math.round(avgScore * 100)}%`);
  }
  
  // Verdict final
  console.log(`\n🎯 VERDICT:`);
  if (totalErrors === 0) {
    console.log('🎉 PARFAIT: Toutes les phases fonctionnent. Prêt pour Phase 5 !');
  } else if (totalErrors <= 1) {
    console.log('✅ BIEN: Phases stables avec quelques points à surveiller');
  } else {
    console.log('⚠️  ATTENTION: Régressions détectées. Investigation nécessaire avant Phase 5');
  }
  
  return totalErrors === 0;
}

// Exécution
runAudit()
  .then(success => {
    if (success) {
      console.log('\n🚀 AUDIT RÉUSSI - Phase 5 peut démarrer !');
      process.exit(0);
    } else {
      console.log('\n⚠️  AUDIT ÉCHOUÉ - Corrections nécessaires');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur audit:', error.message);
    process.exit(1);
  });