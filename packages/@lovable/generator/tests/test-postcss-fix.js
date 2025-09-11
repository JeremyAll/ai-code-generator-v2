import { PureSonnetWorkflow } from './dist/workflows/pure-sonnet.js';
import fs from 'fs';
import path from 'path';

const workflow = new PureSonnetWorkflow();

const config = {
  userPrompt: "test app e-commerce sneakers avec PostCSS fix",
  complexity: "simple",
  forceConfirm: true
};

console.log('🧪 TEST PostCSS Fix - Génération app...');

try {
  const result = await workflow.run(config);
  console.log('✅ App générée:', result.outputDir);
  
  // Vérifier le postcss.config.js généré
  
  const postcssPath = path.join(result.outputDir, 'postcss.config.js');
  if (fs.existsSync(postcssPath)) {
    const content = fs.readFileSync(postcssPath, 'utf8');
    console.log('📝 PostCSS config généré:');
    console.log(content);
    
    if (content.includes('module.exports = {')) {
      console.log('✅ SUCCÈS: Syntaxe module.exports correcte');
    } else if (content.includes('exports = {')) {
      console.log('❌ ÉCHEC: Syntaxe exports incorrecte détectée');
    }
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
}