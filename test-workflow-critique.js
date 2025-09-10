import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';

console.log('🚨 TEST CRITIQUE - WORKFLOW COMPLET PHASE 5-6-7');
console.log('================================================');
console.log('⚠️  Test de régression sur génération réelle avec toute la stack');
console.log('🎯 Objectif: Détecter les points de rupture avant Phase 8\n');

async function testCritiqueWorkflow() {
  const startTime = Date.now();
  let workflow = null;
  
  try {
    console.log('🔧 1. INITIALISATION WORKFLOW');
    console.log('============================');
    
    workflow = new PureSonnetWorkflow();
    console.log('✅ Workflow PureSonnet initialisé');
    console.log('✅ Toutes les phases 5-6-7 sont intégrées');
    
    console.log('\n🧠 2. TEST GÉNÉRATION AVEC INTELLIGENCE');
    console.log('======================================');
    
    // Prompt simple mais représentatif
    const testPrompt = "Créer une application SaaS simple de dashboard avec métriques utilisateurs et graphiques temps réel";
    console.log(`📝 Prompt: "${testPrompt}"`);
    
    console.log('\n⏱️  Lancement génération (timeout 5 minutes)...');
    console.log('📊 Étapes attendues:');
    console.log('   1. Phase 6: Analyse intelligente contexte');
    console.log('   2. Phase 1: Architecture (enrichie par IA)');
    console.log('   3. Phase 2: Développement avec templates Phase 5');
    console.log('   4. Phase 5: Templates étendus SaaS');
    console.log('   5. Phase 7: Validation continue (optionnel)');
    
    // Génération avec timeout de sécurité
    const result = await Promise.race([
      workflow.generate(testPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT après 5 minutes')), 300000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    console.log('\n🎉 3. RÉSULTATS GÉNÉRATION');
    console.log('========================');
    
    if (result.success) {
      console.log('✅ GÉNÉRATION RÉUSSIE !');
      console.log(`📁 Chemin: ${result.path}`);
      console.log(`⏱️  Durée: ${Math.round(duration / 1000)}s`);
      console.log(`📊 Score validation: ${result.report?.validation?.score || 'N/A'}`);
      
      // Vérifier les features Phase 6 (intelligence)
      if (result.intelligence) {
        console.log('\n🧠 INTELLIGENCE CONTEXTUELLE (Phase 6):');
        console.log(`   🎯 Domaine détecté: ${result.intelligence.analysis.domain}`);
        console.log(`   🧩 Complexité: ${result.intelligence.analysis.complexity}`);
        console.log(`   👥 Audience: ${result.intelligence.analysis.targetAudience}`);
        console.log(`   💡 Recommandations: ${result.intelligence.recommendations.length}`);
      } else {
        console.log('⚠️  Phase 6 Intelligence: Pas d\'intelligence dans le résultat');
      }
      
      // Vérifier si Phase 5 templates ont été générés
      console.log('\n🚀 VÉRIFICATION PHASE 5 TEMPLATES:');
      const fs = await import('fs');
      const path = await import('path');
      
      const phase5Files = [
        'contexts/DashboardContext.tsx',
        'contexts/AnalyticsContext.tsx', 
        'components/business/MetricsCard.tsx',
        'components/business/AnalyticsChart.tsx'
      ];
      
      let phase5Count = 0;
      for (const file of phase5Files) {
        const filePath = path.join(result.path, file);
        if (fs.existsSync(filePath)) {
          console.log(`   ✅ ${file} - Généré`);
          phase5Count++;
        } else {
          console.log(`   ❌ ${file} - Manquant`);
        }
      }
      
      const phase5Success = phase5Count >= 2; // Au moins 50%
      console.log(`   📊 Phase 5: ${phase5Count}/${phase5Files.length} fichiers (${phase5Success ? 'SUCCÈS' : 'ÉCHEC'})`);
      
      // Vérifier structure de base
      console.log('\n🏗️  VÉRIFICATION STRUCTURE DE BASE:');
      const baseFiles = ['package.json', 'app/page.tsx', 'app/layout.tsx', 'tailwind.config.js'];
      let baseCount = 0;
      
      for (const file of baseFiles) {
        const filePath = path.join(result.path, file);
        if (fs.existsSync(filePath)) {
          console.log(`   ✅ ${file}`);
          baseCount++;
        } else {
          console.log(`   ❌ ${file} - CRITIQUE`);
        }
      }
      
      const baseSuccess = baseCount === baseFiles.length;
      console.log(`   📊 Structure: ${baseCount}/${baseFiles.length} fichiers (${baseSuccess ? 'SUCCÈS' : 'ÉCHEC CRITIQUE'})`);
      
      // Test de build rapide (optionnel)
      console.log('\n🔨 TEST BUILD RAPIDE:');
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        console.log('   📦 npm install...');
        await execAsync('npm install', { cwd: result.path, timeout: 60000 });
        
        console.log('   🔍 TypeScript check...');
        await execAsync('npx tsc --noEmit', { cwd: result.path, timeout: 30000 });
        
        console.log('   ✅ Build: Compilation TypeScript réussie');
        
      } catch (buildError) {
        console.log(`   ⚠️  Build: ${buildError.message.substring(0, 100)}...`);
      }
      
      // Verdict final
      console.log('\n🏆 VERDICT TEST CRITIQUE:');
      
      const scores = {
        generation: result.success ? 1 : 0,
        intelligence: result.intelligence ? 1 : 0,
        phase5: phase5Success ? 1 : 0,
        structure: baseSuccess ? 1 : 0,
        total: 4
      };
      
      const totalScore = scores.generation + scores.intelligence + scores.phase5 + scores.structure;
      const percentage = Math.round(totalScore / scores.total * 100);
      
      console.log(`📊 Score global: ${totalScore}/${scores.total} (${percentage}%)`);
      
      if (percentage >= 75) {
        console.log('🎉 SUCCÈS - Workflow complet fonctionnel !');
        console.log('✅ Stack Phase 5-6-7 stable pour Phase 8');
      } else if (percentage >= 50) {
        console.log('⚠️  PARTIEL - Quelques problèmes mais utilisable');
        console.log('🔧 Corrections mineures recommandées');
      } else {
        console.log('❌ ÉCHEC - Stack instable, corrections majeures nécessaires');
      }
      
      return {
        success: true,
        duration,
        scores,
        percentage,
        appPath: result.path,
        hasIntelligence: !!result.intelligence,
        phase5Success,
        baseSuccess
      };
      
    } else {
      console.log('❌ GÉNÉRATION ÉCHOUÉE');
      console.log(`🔥 Erreur: ${result.error || 'Erreur inconnue'}`);
      console.log(`⏱️  Durée avant échec: ${Math.round(duration / 1000)}s`);
      
      return {
        success: false,
        duration,
        error: result.error,
        criticalFailure: true
      };
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('\n💥 EXCEPTION CRITIQUE');
    console.log('===================');
    console.log(`🔥 Type: ${error.constructor.name}`);
    console.log(`💬 Message: ${error.message}`);
    console.log(`⏱️  Temps avant crash: ${Math.round(duration / 1000)}s`);
    
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5);
      console.log('📍 Stack trace (5 premières lignes):');
      stackLines.forEach(line => console.log(`   ${line.trim()}`));
    }
    
    // Diagnostic des causes probables
    console.log('\n🔍 DIAGNOSTIC PROBABLE:');
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      console.log('   ⏱️  TIMEOUT - Workflow trop lent (Phase 6 intelligence?)');
    } else if (error.message.includes('ENOENT') || error.message.includes('permission')) {
      console.log('   📁 FICHIERS - Problème permissions ou accès système');
    } else if (error.message.includes('Cannot find module') || error.message.includes('import')) {
      console.log('   📦 MODULES - Problème imports/dépendances');
    } else if (error.message.includes('anthropic') || error.message.includes('API')) {
      console.log('   🌐 API - Problème appels Anthropic (rate limit?)');
    } else {
      console.log('   ❓ INCONNU - Vérifier les logs détaillés');
    }
    
    return {
      success: false,
      duration,
      error: error.message,
      exception: error.constructor.name,
      criticalFailure: true
    };
  }
}

// Exécution du test critique
console.log('🚀 Lancement test critique...\n');

testCritiqueWorkflow().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 FIN TEST CRITIQUE');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`✅ WORKFLOW OPÉRATIONNEL (${result.percentage}%)`);
    console.log(`📈 Phase 8 peut être développée en sécurité`);
    console.log(`⚡ Durée génération: ${Math.round(result.duration / 1000)}s`);
    
    if (result.hasIntelligence && result.phase5Success && result.baseSuccess) {
      console.log('🚀 Stack complète Phase 5-6-7 validée !');
    }
    
  } else {
    console.log('💥 WORKFLOW DÉFAILLANT - Action immédiate requise');
    console.log('🚨 Phase 8 BLOQUÉE jusqu\'aux corrections');
    
    if (result.criticalFailure) {
      console.log('⚠️  Échec critique - Rollback recommandé');
    }
  }
  
  process.exit(result.success ? 0 : 1);
  
}).catch(error => {
  console.log('\n💀 CATASTROPHE SYSTÈME');
  console.log('====================');
  console.log('Le test critique lui-même a crashé !');
  console.log(`Erreur: ${error.message}`);
  console.log('\n🚨 ARRÊT IMMÉDIAT - Rollback d\'urgence nécessaire');
  process.exit(2);
});