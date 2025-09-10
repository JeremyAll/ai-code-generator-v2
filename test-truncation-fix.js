import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

const workflow = new PureSonnetWorkflow();

console.log('🧪 TEST CORRECTIFS - Détection de troncature améliorée...');

const config = {
  userPrompt: "Site vitrine pour une agence de design avec portfolio",
  complexity: "simple", 
  forceConfirm: true
};

try {
  const result = await workflow.generate(config.userPrompt);
  console.log('✅ App générée:', result.path);
  
  // Analyser les logs pour compter les fallbacks
  const logFiles = fs.readdirSync('./logs').filter(f => f.endsWith('.log'));
  const latestLog = path.join('./logs', logFiles.sort().reverse()[0]);
  const logContent = fs.readFileSync(latestLog, 'utf8');
  
  // Compter les warnings de troncature
  const truncationWarnings = (logContent.match(/⚠️ Code tronqué détecté/g) || []).length;
  const fallbackGenerations = (logContent.match(/Génération fallback pour/g) || []).length;
  
  console.log('\n📊 ANALYSE DES FALLBACKS:');
  console.log(`❌ Codes détectés comme tronqués: ${truncationWarnings}`);
  console.log(`🔄 Fallbacks générés: ${fallbackGenerations}`);
  
  // Vérifier la qualité des fichiers générés
  const checks = [
    { file: 'app/globals.css', shouldNotBe: 'fallback', description: 'CSS original' },
    { file: 'tailwind.config.js', shouldNotBe: 'fallback', description: 'Tailwind config original' },
    { file: 'app/page.tsx', shouldNotBe: 'fallback', description: 'Homepage originale' }
  ];
  
  let originalFiles = 0;
  for (const check of checks) {
    const filePath = path.join(result.path, check.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const isOriginal = !content.includes('/* Fallback') && content.length > 200;
      console.log(`${isOriginal ? '✅' : '❌'} ${check.description}: ${isOriginal ? 'ORIGINAL' : 'FALLBACK'}`);
      if (isOriginal) originalFiles++;
    }
  }
  
  console.log(`\n🎯 RÉSULTAT: ${originalFiles}/${checks.length} fichiers utilisent le code original`);
  console.log(`📉 Réduction des fallbacks: ${truncationWarnings < 2 ? 'SUCCÈS' : 'ÉCHEC'}`);
  
  if (truncationWarnings === 0) {
    console.log('🎉 PARFAIT: Aucune détection de troncature !');
  } else if (truncationWarnings < 3) {
    console.log('✅ BIEN: Détections de troncature réduites');
  } else {
    console.log('⚠️  AMÉLIORATION NÉCESSAIRE: Encore trop de détections');
  }
  
} catch (error) {
  console.error('❌ Erreur génération:', error.message);
}