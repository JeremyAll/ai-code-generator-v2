import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

const workflow = new PureSonnetWorkflow();

console.log('🧪 TEST PHASE 1+2 - Génération app avec navigation...');

const config = {
  userPrompt: "Application e-commerce sneakers streetwear avec pages produits et panier",
  complexity: "simple", 
  forceConfirm: true
};

try {
  const result = await workflow.generate(config.userPrompt);
  console.log('✅ App générée:', result.path);
  
  // Tests automatiques
  const checks = [
    { file: 'postcss.config.js', contains: 'module.exports = {' },
    { file: 'app/layout.tsx', contains: 'import { Metadata }' },
    { file: 'app/layout.tsx', contains: '<nav' },
    { file: 'app/page.tsx', contains: 'import Link' },
    { file: 'app/globals.css', contains: '@tailwind base' }
  ];
  
  console.log('\n🔍 Vérifications automatiques:');
  for (const check of checks) {
    const filePath = path.join(result.path, check.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const ok = content.includes(check.contains);
      console.log(`${ok ? '✅' : '❌'} ${check.file}: ${check.contains}`);
    } else {
      console.log(`❌ ${check.file}: MANQUANT`);
    }
  }
  
  console.log('\n🚀 Maintenant teste avec: npm run dev');
} catch (error) {
  console.error('❌ Erreur génération:', error.message);
}