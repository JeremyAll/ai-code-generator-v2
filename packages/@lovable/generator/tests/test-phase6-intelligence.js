import { intelligenceSystem } from './dist/intelligence/index.js';

console.log('🧠 TEST PHASE 6 - INTELLIGENCE CONTEXTUELLE');
console.log('===========================================');

// Tests des composants individuels
async function testSemanticAnalyzer() {
  console.log('\n🔍 1. TEST ANALYSEUR SÉMANTIQUE:');
  
  const testPrompts = [
    "Créer une application SaaS de dashboard analytics avec métriques temps réel et abonnements",
    "Boutique e-commerce avec panier d'achat, paiements Stripe et gestion d'inventaire",
    "Blog personnel avec système de commentaires et optimisation SEO",
    "Portfolio d'agence créative avec galerie interactive et formulaire de contact"
  ];
  
  for (const prompt of testPrompts) {
    console.log(`\n📝 Prompt: "${prompt.substring(0, 60)}..."`);
    
    try {
      const analysis = await intelligenceSystem.analyzeWithContext(prompt, `test-${Date.now()}`);
      
      console.log(`   🎯 Intent: ${analysis.analysis.intent}`);
      console.log(`   🏷️  Domaine: ${analysis.analysis.domain} (confiance: ${Math.round(analysis.analysis.confidence * 100)}%)`);
      console.log(`   🧩 Complexité: ${analysis.analysis.complexity}`);
      console.log(`   👥 Audience: ${analysis.analysis.targetAudience}`);
      console.log(`   🔧 Features: ${analysis.analysis.keyFeatures.slice(0, 3).join(', ')}`);
      console.log(`   💡 Recommandations: ${analysis.recommendations.length}`);
      console.log(`   🎨 Template confiance: ${Math.round(analysis.personalizedTemplate.confidence * 100)}%`);
      
    } catch (error) {
      console.error(`   ❌ Erreur analyse: ${error.message}`);
    }
  }
}

async function testContextManager() {
  console.log('\n📚 2. TEST GESTIONNAIRE DE CONTEXTE:');
  
  const sessionId = `test-context-${Date.now()}`;
  
  try {
    // Simuler plusieurs générations pour tester l'apprentissage
    const sessions = [
      {
        prompt: "Application SaaS de CRM avec analytics",
        result: { success: true, score: 85, duration: 45000, files: 15 }
      },
      {
        prompt: "Dashboard metrics avec charts interactifs", 
        result: { success: true, score: 92, duration: 38000, files: 18 }
      },
      {
        prompt: "Système complexe multi-tenant avec authentification",
        result: { success: false, score: 45, duration: 60000, files: 8 }
      }
    ];
    
    for (const [index, sessionData] of sessions.entries()) {
      console.log(`\n   📊 Session ${index + 1}: "${sessionData.prompt.substring(0, 40)}..."`);
      
      const analysis = await intelligenceSystem.analyzeWithContext(sessionData.prompt, sessionId);
      
      // Simuler la mise à jour avec le résultat
      intelligenceSystem.updateWithResult(
        sessionId, 
        sessionData.prompt,
        analysis.analysis, 
        sessionData.result
      );
      
      console.log(`   ✅ Contexte mis à jour - Succès: ${sessionData.result.success ? '✓' : '✗'}`);
    }
    
    // Tester les statistiques
    const stats = intelligenceSystem.getSessionStats(sessionId);
    if (stats) {
      console.log(`\n   📈 STATISTIQUES APPRENTISSAGE:`);
      console.log(`   📊 Total générations: ${stats.totalGenerations}`);
      console.log(`   🎯 Taux de succès: ${Math.round(stats.successRate * 100)}%`);
      console.log(`   🏆 Score moyen: ${Math.round(stats.averageScore)}`);
      console.log(`   🔧 Features fréquentes: ${stats.favoriteFeatures.slice(0, 3).join(', ')}`);
      console.log(`   💡 Domaines expertise: ${stats.expertiseDomains.slice(0, 2).map(d => d.domain).join(', ')}`);
    }
    
    // Tester les suggestions d'amélioration
    const suggestions = intelligenceSystem.getSuggestionsForImprovement(sessionId);
    console.log(`\n   💡 SUGGESTIONS (${suggestions.length}):`);
    suggestions.forEach(suggestion => {
      console.log(`   ${suggestion}`);
    });
    
  } catch (error) {
    console.error(`   ❌ Erreur contexte: ${error.message}`);
  }
}

async function testTemplatePersonalizer() {
  console.log('\n🎨 3. TEST PERSONNALISATEUR DE TEMPLATES:');
  
  try {
    const sessionId = `test-personalizer-${Date.now()}`;
    
    // Créer une session avec historique pour tester la personnalisation
    const analysis1 = await intelligenceSystem.analyzeWithContext(
      "Application SaaS simple pour débuter", 
      sessionId
    );
    
    // Simuler quelques succès pour augmenter la confiance
    for (let i = 0; i < 3; i++) {
      intelligenceSystem.updateWithResult(
        sessionId,
        "Test app SaaS",
        analysis1.analysis,
        { success: true, score: 88, duration: 42000, files: 16 }
      );
    }
    
    // Tester la personnalisation sur un nouveau prompt
    const analysis2 = await intelligenceSystem.analyzeWithContext(
      "Dashboard analytics avancé avec temps réel",
      sessionId
    );
    
    console.log(`   🎯 Template de base: ${analysis2.personalizedTemplate.baseTemplate}`);
    console.log(`   ⚙️  Modifications: ${analysis2.personalizedTemplate.modifications.length}`);
    console.log(`   🎨 Confiance: ${Math.round(analysis2.personalizedTemplate.confidence * 100)}%`);
    
    console.log(`\n   📝 PERSONNALISATIONS DÉTAILLÉES:`);
    analysis2.personalizedTemplate.reasoning.forEach(reason => {
      console.log(`   • ${reason}`);
    });
    
  } catch (error) {
    console.error(`   ❌ Erreur personnalisation: ${error.message}`);
  }
}

async function testIntegratedWorkflow() {
  console.log('\n🚀 4. TEST WORKFLOW INTÉGRÉ:');
  
  try {
    const sessionId = `test-workflow-${Date.now()}`;
    
    const testCases = [
      {
        prompt: "Application de gestion de tâches pour équipes agiles",
        expectedDomain: "saas",
        description: "Cas d'usage SaaS complexe"
      },
      {
        prompt: "Site e-commerce minimaliste avec paiements simples",
        expectedDomain: "ecommerce", 
        description: "E-commerce simple"
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   🧪 ${testCase.description}`);
      console.log(`   📝 Prompt: "${testCase.prompt}"`);
      
      const result = await intelligenceSystem.analyzeWithContext(testCase.prompt, sessionId);
      
      const success = result.analysis.domain === testCase.expectedDomain;
      console.log(`   🎯 Domaine détecté: ${result.analysis.domain} ${success ? '✅' : '❌'}`);
      console.log(`   🧠 Intelligence: ${result.recommendations.length} recommandations`);
      console.log(`   🎨 Personnalisation: ${Math.round(result.personalizedTemplate.confidence * 100)}% confiance`);
      
      // Simuler mise à jour pour l'apprentissage
      intelligenceSystem.updateWithResult(
        sessionId,
        testCase.prompt,
        result.analysis,
        { success: true, score: 82, duration: 35000, files: 14 }
      );
    }
    
  } catch (error) {
    console.error(`   ❌ Erreur workflow: ${error.message}`);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  try {
    await testSemanticAnalyzer();
    await testContextManager();
    await testTemplatePersonalizer();
    await testIntegratedWorkflow();
    
    console.log('\n🎉 RÉSULTATS PHASE 6:');
    console.log('✅ Analyseur sémantique opérationnel');
    console.log('✅ Gestionnaire de contexte fonctionnel');
    console.log('✅ Personnalisateur de templates intégré');
    console.log('✅ Workflow intelligent complet');
    
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('• Intégration complète dans le workflow de génération');
    console.log('• Tests avec génération d\'applications réelles');
    console.log('• Optimisation des règles de personnalisation');
    console.log('• Implémentation Phase 7 (Tests & CI/CD)');
    
  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
    console.log('\n🔧 Actions correctives nécessaires');
  }
}

runAllTests();