import { AnthropicService } from './dist/services/anthropic-service.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 TEST PostCSS Fix - Test générationStep2_1...');

const service = new AnthropicService();

// Test en générant juste les fichiers de base (Step 2.1)
const result = await service.generateStep2_1_BaseFiles('TestApp', 'e-commerce');

if (result.has('postcss.config.js')) {
  const content = result.get('postcss.config.js');
  console.log('📝 PostCSS config généré:');
  console.log(content);
  
  if (content.includes('module.exports = {')) {
    console.log('✅ SUCCÈS: Syntaxe module.exports correcte');
  } else if (content.includes('exports = {')) {
    console.log('❌ ÉCHEC: Syntaxe exports incorrecte détectée');
  } else {
    console.log('⚠️ Syntaxe non reconnue');
  }
} else {
  console.log('❌ postcss.config.js non généré');
}