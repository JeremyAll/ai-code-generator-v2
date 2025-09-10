import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 TEST INTÉGRATION PHASE 5 - Génération SaaS...');

const workflow = new PureSonnetWorkflow();

// Test avec un prompt SaaS simple pour déclencher les templates Phase 5
const testPrompt = "Créer une application SaaS de dashboard analytics avec des métriques temps réel";

try {
  console.log('🚀 Lancement génération avec templates Phase 5...');
  
  const result = await workflow.generate(testPrompt);
  
  if (result.success) {
    console.log('✅ Génération réussie !');
    console.log(`📁 App générée dans: ${result.path}`);
    console.log(`⏱️  Durée: ${result.duration}ms`);
    console.log(`📊 Score validation: ${result.report?.validation?.score}/100`);
    
    // Vérifier les fichiers Phase 5 spécifiques
    
    const phase5Files = [
      'contexts/DashboardContext.tsx',
      'contexts/AnalyticsContext.tsx',
      'components/business/MetricsCard.tsx',
      'components/business/AnalyticsChart.tsx'
    ];
    
    let phase5FilesFound = 0;
    console.log('\n🔍 Vérification fichiers Phase 5:');
    
    for (const file of phase5Files) {
      const filePath = path.join(result.path, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - Présent`);
        phase5FilesFound++;
      } else {
        console.log(`❌ ${file} - Manquant`);
      }
    }
    
    const phase5Score = Math.round((phase5FilesFound / phase5Files.length) * 100);
    console.log(`\n📊 Score Phase 5: ${phase5FilesFound}/${phase5Files.length} fichiers (${phase5Score}%)`);
    
    if (phase5Score >= 75) {
      console.log('🎉 SUCCÈS - Phase 5 intégrée avec succès dans le workflow !');
    } else {
      console.log('⚠️  Phase 5 partiellement intégrée - Vérifier domaine détecté');
    }
    
  } else {
    console.log('❌ Génération échouée');
    console.error(result.error);
  }
  
} catch (error) {
  console.error('❌ Erreur test intégration:', error.message);
}